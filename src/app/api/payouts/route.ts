import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// POST /api/payouts
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'request':
        return await requestPayout(body);
      case 'list':
        return await listPayouts(body);
      case 'get':
        return await getPayout(body);
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: request, list, get' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Payouts API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** request - Vendor/Rider requests a payout */
async function requestPayout(body: {
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}) {
  const { userId, amount, bankName, accountNumber, accountName } = body;

  // Validate required fields
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 },
    );
  }

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { success: false, message: 'Amount must be greater than 0' },
      { status: 400 },
    );
  }

  if (!bankName || !bankName.trim()) {
    return NextResponse.json(
      { success: false, message: 'bankName is required' },
      { status: 400 },
    );
  }

  if (!accountNumber || !accountNumber.trim()) {
    return NextResponse.json(
      { success: false, message: 'accountNumber is required' },
      { status: 400 },
    );
  }

  // Use transaction with atomic decrement to prevent double-spend race condition
  try {
    const result = await db.$transaction(async (tx) => {
      // Check user exists
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.walletBalance < amount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Generate unique reference
      const reference = `PO_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Atomic decrement — deduct from wallet
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      // If balance went negative, rollback (shouldn't happen after the check above,
      // but defends against concurrent transactions that passed the check simultaneously)
      if (updatedUser.walletBalance < 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const newBalance = updatedUser.walletBalance;

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'payout',
          amount: -amount,
          balance: newBalance,
          description: `Payout to ${bankName} ****${accountNumber.slice(-4)}`,
          reference,
        },
      });

      // Create payout record
      const payout = await tx.payout.create({
        data: {
          userId,
          amount,
          status: 'pending',
          bankName,
          accountNumber,
          accountName: accountName || '',
          reference,
        },
      });

      return { payout, newBalance };
    });

    return NextResponse.json({
      success: true,
      payout: result.payout,
      newBalance: result.newBalance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json(
        { success: false, message: 'Insufficient wallet balance' },
        { status: 400 },
      );
    }
    throw error; // re-throw unexpected errors for outer catch
  }
}

/** list - Get user's payouts */
async function listPayouts(body: { userId: string }) {
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 },
    );
  }

  const payouts = await db.payout.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    payouts,
  });
}

/** get - Get single payout */
async function getPayout(body: { userId: string; payoutId: string }) {
  const { userId, payoutId } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 },
    );
  }

  if (!payoutId) {
    return NextResponse.json(
      { success: false, message: 'payoutId is required' },
      { status: 400 },
    );
  }

  const payout = await db.payout.findFirst({
    where: { id: payoutId, userId },
  });

  if (!payout) {
    return NextResponse.json(
      { success: false, message: 'Payout not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    payout,
  });
}
