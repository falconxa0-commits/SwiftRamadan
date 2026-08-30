import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

const EARNINGS_RATE = 0.15; // Rider earns 15% of order total

// GET /api/rider/payout — Get rider earnings summary + available balance
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'rider') return NextResponse.json({ error: 'Rider access required' }, { status: 403 });

  try {
    // MIGRATED (Phase 10): inline `db.user.findUnique({ where: { id: auth.userId } })`
    // replaced with `usersService.getUserById(auth.userId)`. The service
    // returns a `PublicUser` (typed as `unknown` fields — we coerce the
    // ones we read: id, name, riderBankName, riderAccountNumber). All four
    // are included in `publicUserFields`'s base projection.
    const user = await usersService.getUserById(auth.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Rider not found' },
        { status: 404 },
      );
    }

    const userId = String(user.id);
    const riderName = String(user.name);
    const riderBankName = user.riderBankName ? String(user.riderBankName) : null;
    const riderAccountNumber = user.riderAccountNumber ? String(user.riderAccountNumber) : null;

    // Get all delivered orders for this rider
    const deliveredOrders = await db.order.findMany({
      where: {
        riderName,
        status: 'Delivered',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total earnings
    const totalEarnings = Math.round(
      deliveredOrders.reduce((sum, o) => sum + o.total * EARNINGS_RATE, 0)
    );

    // Today's earnings
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysEarnings = Math.round(
      deliveredOrders
        .filter((o) => new Date(o.createdAt) >= startOfToday)
        .reduce((sum, o) => sum + o.total * EARNINGS_RATE, 0)
    );

    // Subtract previous payouts
    const previousPayouts = await db.payment.findMany({
      where: {
        userId,
        type: 'payout',
        status: { in: ['pending', 'success'] },
      },
    });
    const totalWithdrawn = previousPayouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

    // Recent payout history
    const recentPayouts = await db.payment.findMany({
      where: {
        userId,
        type: 'payout',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Weekly earnings breakdown
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyEarnings: Array<{ day: string; amount: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayTotal = deliveredOrders
        .filter((o) => {
          const c = new Date(o.createdAt);
          return c >= d && c <= dayEnd;
        })
        .reduce((sum, o) => sum + o.total * EARNINGS_RATE, 0);
      weeklyEarnings.push({
        day: dayLabels[d.getDay()],
        amount: Math.round(dayTotal),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        riderName,
        totalEarnings,
        todaysEarnings,
        totalWithdrawn,
        availableBalance,
        deliveredOrdersCount: deliveredOrders.length,
        recentPayouts,
        weeklyEarnings,
        bankDetails: {
          bankName: riderBankName,
          accountNumber: riderAccountNumber
            ? riderAccountNumber.slice(-4).padStart(riderAccountNumber.length, '*')
            : null,
        },
        hasBankDetails: !!(riderBankName && riderAccountNumber),
      },
    });
  } catch (error) {
    console.error('[api/rider/payout] GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/rider/payout' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rider earnings' },
      { status: 500 },
    );
  }
}

// POST /api/rider/payout — Request rider payout
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'rider') return NextResponse.json({ error: 'Rider access required' }, { status: 403 });

  try {
    const body = await request.json();
    const { amount } = body;

    // MIGRATED (Phase 10): inline `db.user.findUnique({ where: { id: auth.userId } })`
    // replaced with `usersService.getUserById(auth.userId)`. Same coercion
    // pattern as the GET handler above.
    const user = await usersService.getUserById(auth.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Rider not found' },
        { status: 404 },
      );
    }

    const userId = String(user.id);
    const riderName = String(user.name);
    const riderBankName = user.riderBankName ? String(user.riderBankName) : null;
    const riderAccountNumber = user.riderAccountNumber ? String(user.riderAccountNumber) : null;

    // Check rider has bank details
    if (!riderAccountNumber || !riderBankName) {
      return NextResponse.json(
        { success: false, message: 'Bank account details not configured. Please add your bank name and account number in settings.' },
        { status: 400 },
      );
    }

    // Calculate total earnings
    const deliveredOrders = await db.order.findMany({
      where: {
        riderName,
        status: 'Delivered',
      },
    });

    const totalEarnings = Math.round(
      deliveredOrders.reduce((sum, o) => sum + o.total * EARNINGS_RATE, 0)
    );

    // Subtract previous payouts
    const previousPayouts = await db.payment.findMany({
      where: {
        userId,
        type: 'payout',
        status: { in: ['pending', 'success'] },
      },
    });
    const totalWithdrawn = previousPayouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

    // Validate amount
    const requestedAmount = amount ? Number(amount) : availableBalance;
    if (requestedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'No available balance for withdrawal', data: { availableBalance, totalEarnings, totalWithdrawn } },
        { status: 400 },
      );
    }
    if (requestedAmount > availableBalance) {
      return NextResponse.json(
        { success: false, message: `Requested amount exceeds available balance of ₦${availableBalance.toLocaleString()}`, data: { availableBalance, totalEarnings, totalWithdrawn } },
        { status: 400 },
      );
    }

    // Create payout record
    const reference = `RPO-${userId.slice(-6)}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const isDev = !process.env.PAYSTACK_SECRET_KEY;

    const payout = await db.payment.create({
      data: {
        userId,
        amount: requestedAmount,
        method: 'transfer',
        status: isDev ? 'success' : 'pending',
        reference,
        provider: 'paystack',
        type: 'payout',
      },
    });

    // If Paystack is configured, the payout would be initiated via their Transfer API
    // For now, mark as pending when Paystack is configured
    const transferStatus = isDev ? 'success' : 'pending';

    return NextResponse.json({
      success: true,
      message: isDev
        ? 'Payout processed successfully (demo mode)'
        : 'Payout request submitted. Payment will arrive in 24 hours.',
      data: {
        payoutId: payout.id,
        amount: requestedAmount,
        reference,
        status: transferStatus,
        availableBalance: availableBalance - requestedAmount,
        totalEarnings,
        totalWithdrawn: totalWithdrawn + requestedAmount,
        bankName: riderBankName,
        accountNumber: riderAccountNumber.slice(-4).padStart(riderAccountNumber.length, '*'),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[api/rider/payout] POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/rider/payout' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to process rider payout' },
      { status: 500 },
    );
  }
}
