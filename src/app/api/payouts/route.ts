import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import * as usersService from '@/services/users/users.service';

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
        return await requestPayout(body, auth.userId);
      case 'list':
        return await listPayouts(auth.userId);
      case 'get':
        return await getPayout(body, auth.userId);
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
async function requestPayout(
  body: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  },
  userId: string,
) {
  const { amount, bankName, accountNumber, accountName } = body;

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
    // MIGRATED (Phase 10 Alpha Batch 2): pre-check user existence with
    // `usersService.getUserById` before entering the `$transaction`. This
    // provides a clean 404 early exit (matching the previous in-transaction
    // 404 response shape) and serves as defense-in-depth against the rare
    // race where the user is deleted after the JWT was issued but before
    // this request runs. The in-transaction `tx.user.findUnique` below is
    // kept as the authoritative check (it also fetches `walletBalance` for
    // the balance check, so it can't be removed).
    //
    // Note: the main logic (balance check + decrement + audit + payout
    // create) stays inline in a single `$transaction` for full atomicity.
    // We intentionally do NOT delegate the wallet debit to
    // `walletService.debit` because that service runs its own internal
    // `$transaction`, which would NOT include the `payout.create` below —
    // losing atomicity between the wallet debit and the payout record
    // (if `payout.create` failed after `walletService.debit` succeeded,
    // the user's wallet would be debited with no corresponding payout
    // record).
    const userExists = await usersService.getUserById(userId);
    if (!userExists) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

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
async function listPayouts(userId: string) {
  const payouts = await db.payout.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    success: true,
    payouts,
  });
}

/** get - Get single payout */
async function getPayout(body: { payoutId: string }, userId: string) {
  const { payoutId } = body;

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
