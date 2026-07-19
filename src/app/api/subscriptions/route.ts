import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';

// Fallback mock plans
const MOCK_PLANS = [
  {
    id: 'sahur',
    name: 'Weekly Sahur Box',
    price: 12000,
    period: 'week',
    features: [
      'Daily Sahur meal for 1 person',
      'Fresh fruits & dates included',
      'Hot beverage of your choice',
      'Delivered before 4:30 AM',
      'Swap meals any day',
      'Cancel anytime',
    ],
  },
  {
    id: 'full',
    name: 'Full Ramadan Plan',
    price: 85000,
    period: '30 days',
    features: [
      'Daily Sahur + Iftar for 1 person',
      'Premium protein options',
      'Fresh juice & Zobo daily',
      'Dates & water included',
      'Iftar-precision delivery',
      'Free cancellation in first 3 days',
      'Priority rider assignment',
      'Special Eid box included',
    ],
  },
];

export async function GET() {
  try {
    const dbBoxes = await db.subscriptionBox.findMany({
      where: { isActive: true },
    });

    if (dbBoxes.length > 0) {
      const plans = dbBoxes.map(b => ({
        id: b.id,
        name: b.name,
        price: b.price,
        period: b.frequency === 'monthly' ? '30 days' : b.frequency === 'biweekly' ? '2 weeks' : 'week',
        features: JSON.parse(b.items || '[]'),
      }));

      // Check for user subscription
      let userSubscription: string | null = null;
      try {
        const activeSub = await db.userSubscription.findFirst({
          where: { userId: 'default-user', status: 'active' },
        });
        if (activeSub) userSubscription = activeSub.boxId;
      } catch {
        // ignore
      }

      return NextResponse.json({ plans, userSubscription });
    }
  } catch {
    // Fallback to mock
  }

  return NextResponse.json({
    plans: MOCK_PLANS,
    userSubscription: null,
  });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await request.json();
    const { planId, userId = 'default-user' } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    // Try DB
    try {
      const box = await db.subscriptionBox.findUnique({ where: { id: planId } });
      if (box) {
        await db.userSubscription.upsert({
          where: { userId_boxId: { userId, boxId: planId } },
          update: { status: 'active', nextDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          create: {
            userId,
            boxId: planId,
            status: 'active',
            nextDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Subscribed to ${box.name}`,
          subscription: {
            planId,
            planName: box.name,
            price: box.price,
            period: box.frequency === 'monthly' ? '30 days' : box.frequency === 'biweekly' ? '2 weeks' : 'week',
            startDate: new Date().toISOString(),
          },
        });
      }
    } catch {
      // Fallback
    }

    // Mock fallback
    const plan = MOCK_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Subscribed to ${plan.name}`,
      subscription: {
        planId,
        planName: plan.name,
        price: plan.price,
        period: plan.period,
        startDate: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
