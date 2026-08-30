import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// Whether the coupon seed has been run this server lifetime.
// Prevents auto-seeding on every GET request — seeding should happen once.
let couponSeedDone = false;

async function ensureCouponsSeeded() {
  if (couponSeedDone) return;
  try {
    const count = await db.coupon.count();
    if (count === 0) {
      const seed = [
        { code: 'RAMADAN', type: 'percent', value: 10, minOrder: 5000, maxUses: 1000 },
        { code: 'IFTAR', type: 'percent', value: 10, minOrder: 3000, maxUses: 500 },
        { code: 'SWIFT25', type: 'percent', value: 25, minOrder: 10000, maxUses: 200 },
        { code: 'SAHUR', type: 'percent', value: 15, minOrder: 2000, maxUses: 300 },
        { code: 'LAGOS5K', type: 'fixed', value: 1000, minOrder: 5000, maxUses: 150 },
      ];
      await db.coupon.createMany({ data: seed.map(c => ({ ...c, uses: 0, active: true })) });
    }
    couponSeedDone = true;
  } catch {
    // If seeding fails (race condition with another instance), don't retry on every GET
    couponSeedDone = true;
  }
}

// Seed on module load (once per server process) rather than on every GET
ensureCouponsSeeded();

// GET /api/coupons → returns all active coupons
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    // Ensure seed has been attempted (idempotent)
    await ensureCouponsSeeded();

    const coupons = await db.coupon.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('Coupons API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/coupons' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch coupons' },
      { status: 500 },
    );
  }
}
