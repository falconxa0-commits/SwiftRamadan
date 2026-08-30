import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

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

// GET /api/subscriptions — public, no auth required for browsing plans
export async function GET(request: NextRequest) {
  // Check for optional auth to show user's subscription status
  const auth = await requireAuth(request).catch(() => null);
  const userId = auth && !(auth instanceof NextResponse) ? auth.userId : null;

  try {
    const dbBoxes = await db.subscriptionBox.findMany({
      where: { isActive: true },
      take: 50,
    });

    if (dbBoxes.length > 0) {
      const plans = dbBoxes.map(b => ({
        id: b.id,
        name: b.name,
        price: b.price,
        period: b.frequency === 'monthly' ? '30 days' : b.frequency === 'biweekly' ? '2 weeks' : 'week',
        features: JSON.parse(b.items || '[]'),
      }));

      // Check for user subscription if authenticated
      let userSubscription: string | null = null;
      if (userId) {
        try {
          const activeSub = await db.userSubscription.findFirst({
            where: { userId, status: 'active' },
          });
          if (activeSub) userSubscription = activeSub.boxId;
        } catch {
          // ignore
        }
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

// POST /api/subscriptions — create subscription
// FIXED: Now requires authentication
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;

  // REQUIRE AUTHENTICATION - subscriptions are private
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { planId } = body;
    
    // Use authenticated user's ID
    const userId = auth.userId;

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
