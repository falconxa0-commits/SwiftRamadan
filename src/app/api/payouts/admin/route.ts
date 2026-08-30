import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import * as walletService from '@/services/wallet/wallet.service';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

// POST /api/payouts/admin
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    // Auth + role check: only admin or vendor can manage payouts
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    if (auth.role !== 'admin' && auth.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'list-all':
        return await listAllPayouts(body);
      case 'process':
        return await processPayout(body);
      case 'complete':
        return await completePayout(body);
      case 'reject':
        return await rejectPayout(body);
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: list-all, process, complete, reject' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Payouts Admin API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** list-all - List all payouts (with filters) */
async function listAllPayouts(body: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { status, page = 1, limit = 20 } = body;

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;
  const [payouts, total] = await Promise.all([
    db.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.payout.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    payouts,
    total,
    page,
    totalPages,
  });
}

/** process - Process a payout (mark as processing) */
async function processPayout(body: {
  payoutId: string;
  adminNote?: string;
}) {
  const { payoutId, adminNote } = body;

  if (!payoutId) {
    return NextResponse.json(
      { success: false, message: 'payoutId is required' },
      { status: 400 },
    );
  }

  const existing = await db.payout.findUnique({ where: { id: payoutId } });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Payout not found' },
      { status: 404 },
    );
  }

  const payout = await db.payout.update({
    where: { id: payoutId },
    data: {
      status: 'processing',
      adminNote: adminNote || existing.adminNote,
    },
  });

  return NextResponse.json({
    success: true,
    payout,
  });
}

/** complete - Mark payout as completed */
async function completePayout(body: {
  payoutId: string;
  adminNote?: string;
}) {
  const { payoutId, adminNote } = body;

  if (!payoutId) {
    return NextResponse.json(
      { success: false, message: 'payoutId is required' },
      { status: 400 },
    );
  }

  const existing = await db.payout.findUnique({ where: { id: payoutId } });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Payout not found' },
      { status: 404 },
    );
  }

  const payout = await db.payout.update({
    where: { id: payoutId },
    data: {
      status: 'completed',
      processedAt: new Date(),
      adminNote: adminNote || existing.adminNote,
    },
  });

  return NextResponse.json({
    success: true,
    payout,
  });
}

/** reject - Reject a payout (refund to wallet) */
async function rejectPayout(body: {
  payoutId: string;
  adminNote: string;
}) {
  const { payoutId, adminNote } = body;

  if (!payoutId) {
    return NextResponse.json(
      { success: false, message: 'payoutId is required' },
      { status: 400 },
    );
  }

  if (!adminNote || !adminNote.trim()) {
    return NextResponse.json(
      { success: false, message: 'adminNote is required when rejecting a payout' },
      { status: 400 },
    );
  }

  const existing = await db.payout.findUnique({ where: { id: payoutId } });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Payout not found' },
      { status: 404 },
    );
  }

  // Credit the amount back to user's wallet
  // MIGRATED (Phase 10): the inline `db.user.findUnique` → `db.user.update`
  // (increment walletBalance) → `db.walletTransaction.create` triplet is
  // replaced with `walletService.refund`, which performs the same three
  // steps inside a `$transaction` (atomic credit + audit row). The previous
  // flow was NOT wrapped in a `$transaction` — the wallet credit and the
  // payout status update (below) were independent operations, so this
  // migration preserves the previous lack of cross-step atomicity while
  // making the wallet credit itself atomic.
  //
  // MIGRATED (Phase 11): the pre-flight `db.user.findUnique` (existence
  // check) is delegated to `usersService.getUserById`. This is a defence-
  // in-depth check before calling `walletService.refund`, which itself
  // throws `USER_NOT_FOUND` (caught below) if the user doesn't exist. The
  // pre-flight check provides a clean 404 with the payout-specific message
  // before entering the wallet mutation path. Response shape unchanged.
  //
  // Note: the previous flow stored `description: 'Payout rejected - refunded
  // to wallet'` and `reference: existing.reference` on the audit row. The
  // service's `refund` function hardcodes `description: 'Refund credited to
  // wallet'` — we lose the payout-specific description but the reference is
  // preserved (used for traceability).
  const user = await usersService.getUserById(existing.userId);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'User not found for this payout' },
      { status: 404 },
    );
  }

  let newBalance: number;
  try {
    const result = await walletService.refund(
      existing.userId,
      existing.amount,
      existing.reference,
    );
    newBalance = result.newBalance;
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'User not found for this payout' },
        { status: 404 },
      );
    }
    if (err instanceof Error && err.message === 'INVALID_AMOUNT') {
      return NextResponse.json(
        { success: false, message: 'Invalid refund amount' },
        { status: 400 },
      );
    }
    throw err;
  }

  // Update payout status
  const payout = await db.payout.update({
    where: { id: payoutId },
    data: {
      status: 'rejected',
      adminNote,
    },
  });

  return NextResponse.json({
    success: true,
    payout,
    newBalance,
  });
}
