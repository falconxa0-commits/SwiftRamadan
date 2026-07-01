import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

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
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { email, rewardType } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const reward = REWARDS[rewardType];
    if (!reward) {
      return NextResponse.json(
        { success: false, message: `Invalid rewardType. Valid options: ${Object.keys(REWARDS).join(', ')}` },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.swiftPoints < reward.cost) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient points. You need ${reward.cost} swift points but have ${user.swiftPoints}.`,
          currentPoints: user.swiftPoints,
          requiredPoints: reward.cost,
        },
        { status: 400 }
      );
    }

    // Generate a unique code (retry if needed)
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.coupon.findUnique({ where: { code } });
      if (!existing) break;
      code = generateCode();
      attempts += 1;
    }

    // Deduct points + create coupon (transactional)
    const [updatedUser, coupon] = await db.$transaction([
      db.user.update({
        where: { email },
        data: { swiftPoints: { decrement: reward.cost } },
      }),
      db.coupon.create({
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

    return NextResponse.json({
      success: true,
      message: `Coupon ${code} created! Use at checkout.`,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        label: reward.label,
        rewardType,
      },
      remainingPoints: updatedUser.swiftPoints,
      deductedPoints: reward.cost,
    });
  } catch (error) {
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
