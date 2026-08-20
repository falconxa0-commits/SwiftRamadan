import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

// Reward catalog — each rewardType maps to a points cost and a Coupon payload
const REWARDS: Record<string, { cost: number; type: 'fixed' | 'delivery'; value: number; label: string }> = {
  'ngn-500':    { cost: 1000, type: 'fixed',    value: 500,  label: '₦500 off' },
  'ngn-1000':   { cost: 2000, type: 'fixed',    value: 1000, label: '₦1000 off' },
  'ngn-2500':   { cost: 5000, type: 'fixed',    value: 2500, label: '₦2500 off' },
  'free-delivery': { cost: 500, type: 'delivery', value: 500, label: 'Free Delivery' },
};

function generateCode(prefix = 'REDEM'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${out}`;
}

// POST /api/user/redeem
// FIXED: Now requires authentication and uses transaction for atomicity
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  // REQUIRE AUTHENTICATION - prevent unauthorized redemptions
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { rewardType } = body;

    // Use authenticated user's ID instead of email from body
    const userId = auth.userId;

    const reward = REWARDS[rewardType];
    if (!reward) {
      return NextResponse.json(
        { success: false, message: `Invalid rewardType. Valid options: ${Object.keys(REWARDS).join(', ')}` },
        { status: 400 }
      );
    }

    // Use transaction to prevent race condition on points deduction
    const result = await db.$transaction(async (tx) => {
      // Fetch user's current points within transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, swiftPoints: true, email: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.swiftPoints < reward.cost) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      // Generate a unique code (retry if needed)
      let code = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.coupon.findUnique({ where: { code } });
        if (!existing) break;
        code = generateCode();
        attempts += 1;
      }

      // Atomic points deduction + coupon creation
      const [updatedUser, coupon] = await Promise.all([
        tx.user.update({
          where: { id: userId },
          data: { swiftPoints: { decrement: reward.cost } },
        }),
        tx.coupon.create({
          data: {
            code,
            type: reward.type === 'delivery' ? 'fixed' : 'fixed',
            value: reward.value,
            minOrder: 0,
            maxUses: 1,
            uses: 0,
            active: true,
            validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
          },
        }),
      ]);

      return { updatedUser, coupon, email: user.email };
    });

    return NextResponse.json({
      success: true,
      message: `Coupon ${result.coupon.code} created! Use at checkout.`,
      coupon: {
        code: result.coupon.code,
        type: result.coupon.type,
        value: result.coupon.value,
        label: reward.label,
        rewardType,
      },
      remainingPoints: result.updatedUser.swiftPoints,
      deductedPoints: reward.cost,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_POINTS') {
      return NextResponse.json(
        { success: false, message: 'Insufficient points for this reward' },
        { status: 400 }
      );
    }
    console.error('Redeem API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/user/redeem' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to redeem points' },
      { status: 500 }
    );
  }
}
