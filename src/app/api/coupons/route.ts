import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// GET /api/coupons → returns all active coupons
// If DB has no coupons, returns a seeded static fallback list (also upserts them
// into the DB so subsequent validations work consistently).
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    let coupons = await db.coupon.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    // Seed a default set of coupons if the DB is empty
    if (coupons.length === 0) {
      const seed = [
        { code: 'RAMADAN', type: 'percent', value: 10, minOrder: 5000, maxUses: 1000 },
        { code: 'IFTAR', type: 'percent', value: 10, minOrder: 3000, maxUses: 500 },
        { code: 'SWIFT25', type: 'percent', value: 25, minOrder: 10000, maxUses: 200 },
        { code: 'SAHUR', type: 'percent', value: 15, minOrder: 2000, maxUses: 300 },
        { code: 'LAGOS5K', type: 'fixed', value: 1000, minOrder: 5000, maxUses: 150 },
      ];

      await db.coupon.createMany({
        data: seed.map(c => ({ ...c, uses: 0, active: true })),
      });

      coupons = await db.coupon.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Coupons API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/coupons' },
    });
    return NextResponse.json(
      { coupons: [], message: 'Failed to fetch coupons' },
      { status: 500 },
    );
  }
}
