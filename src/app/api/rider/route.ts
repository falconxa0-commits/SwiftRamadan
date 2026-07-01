import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

/**
 * GET /api/rider?email=xxx
 */
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'rider') return NextResponse.json({ error: 'Rider access required' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const email = auth.email || searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Look up rider's User record
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        riderOnline: true,
        vehicleType: true,
        plateNumber: true,
        area: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Rider not found' },
        { status: 404 }
      );
    }

    const riderName = user.name;

    const orders = await db.order.findMany({
      where: {
        OR: [
          { riderName },
          { status: { in: ['Confirmed', 'Ready', 'In Transit'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse items JSON for each order
    const parsed = orders.map((o) => {
      let items: Array<{ name: string; qty: number; price: number }> = [];
      try {
        items = JSON.parse(o.items);
      } catch {
        items = [];
      }
      return { ...o, items };
    });

    const activeDeliveries = parsed.filter(
      (o) => o.status === 'In Transit' && o.riderName === riderName
    );
    const availableDeliveries = parsed.filter(
      (o) => o.status === 'Ready' && !o.riderName
    );
    const recentDeliveries = parsed.filter(
      (o) => o.status === 'Delivered' && o.riderName === riderName
    );

    // Earnings: 15% of order total per delivered order
    const EARNINGS_RATE = 0.15;

    // Today's date string for comparison
    const todayStr = new Date().toDateString();

    const todaysDelivered = recentDeliveries.filter(
      (o) => new Date(o.createdAt).toDateString() === todayStr
    );
    const completedToday = todaysDelivered.length;
    const earningsToday = Math.round(
      todaysDelivered.reduce((sum, o) => sum + o.total * EARNINGS_RATE, 0)
    );
    const totalEarnings = Math.round(
      recentDeliveries.reduce((sum, o) => sum + o.total * EARNINGS_RATE, 0)
    );

    // Weekly earnings: last 7 days of delivered orders (incl. today)
    const weeklyEarnings: Array<{ day: string; amount: number }> = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dayStart = d;
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayTotal = recentDeliveries
        .filter((o) => {
          const c = new Date(o.createdAt);
          return c >= dayStart && c <= dayEnd;
        })
        .reduce((sum, o) => sum + o.total * EARNINGS_RATE, 0);
      weeklyEarnings.push({
        day: dayLabels[d.getDay()],
        amount: Math.round(dayTotal),
      });
    }

    // Default rating (no Review aggregation yet)
    const rating = 4.8;

    return NextResponse.json({
      success: true,
      riderName,
      online: user.riderOnline,
      rating,
      completedToday,
      earningsToday,
      totalEarnings,
      activeDeliveries,
      availableDeliveries,
      recentDeliveries,
      weeklyEarnings,
      vehicleType: user.vehicleType || 'Motorcycle',
      area: user.area || 'Lagos Island',
    });
  } catch (error) {
    console.error('Rider API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/rider' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rider data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rider
 * Toggle online status
 */
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'rider') return NextResponse.json({ error: 'Rider access required' }, { status: 403 });

  try {
    const body = await request.json();
    const email = auth.email || body.email;
    const { online } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { email },
      data: { riderOnline: Boolean(online) },
      select: { id: true, name: true, riderOnline: true },
    });

    return NextResponse.json({
      success: true,
      message: `You are now ${online ? 'online' : 'offline'}.`,
      data: updated,
    });
  } catch (error) {
    console.error('Rider API POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/rider' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to update rider state' },
      { status: 500 }
    );
  }
}
