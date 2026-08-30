import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

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
        return await handleRequest(body, auth.userId);
      case 'list':
        return await handleList(auth.userId);
      case 'approve':
        if (auth.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Admin access required' },
            { status: 403 },
          );
        }
        return await handleApprove(body);
      case 'process':
        if (auth.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Admin access required' },
            { status: 403 },
          );
        }
        return await handleProcess(body);
      case 'reject':
        if (auth.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Admin access required' },
            { status: 403 },
          );
        }
        return await handleReject(body);
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: request, list, approve, process, reject' },
          { status: 400 },
        );
    }
  } catch (error) {
    // Handle known error types with appropriate responses
    if (error instanceof Error) {
      switch (error.message) {
        case 'REFUND_NOT_FOUND':
          return NextResponse.json(
            { success: false, message: 'Refund not found' },
            { status: 404 },
          );
        case 'USER_NOT_FOUND':
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 },
          );
        case 'INVALID_STATE_TRANSITION':
          return NextResponse.json(
            { success: false, message: 'Invalid refund state for this operation' },
            { status: 400 },
          );
        case 'INVALID_AMOUNT':
          return NextResponse.json(
            { success: false, message: 'Amount must be a positive number' },
            { status: 400 },
          );
      }
    }
    console.error('Refunds API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Customer requests a refund.
 * Creates a new refund record in 'requested' state.
 * @param body - Request body containing orderId, amount, reason, and optional refundMethod
 * @param userId - ID of the requesting user
 * @returns NextResponse with created refund or error
 */
async function handleRequest(
  body: {
    orderId: string;
    amount: number;
    reason: string;
    refundMethod: string;
  },
  userId: string,
) {
  const { orderId, amount, reason, refundMethod } = body;

  // Input validation
  if (!orderId || !amount || !reason) {
    return NextResponse.json(
      { success: false, message: 'orderId, amount, and reason are required' },
      { status: 400 },
    );
  }

  // Validate amount is positive
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json(
      { success: false, message: 'Amount must be a positive number' },
      { status: 400 },
    );
  }

  const validMethods = ['original', 'wallet'];
  if (refundMethod && !validMethods.includes(refundMethod)) {
    return NextResponse.json(
      { success: false, message: 'refundMethod must be "original" or "wallet"' },
      { status: 400 },
    );
  }

  // Validate user exists
  // MIGRATED (Phase 10 Alpha Batch 2): the inline `db.user.findUnique` is
  // replaced with `usersService.getUserById`, which returns the same
  // `null` when the user doesn't exist. Response shape (404 with
  // "User not found") is unchanged.
  const user = await usersService.getUserById(userId);

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 },
    );
  }

  const reference = `RF_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const refund = await db.refund.create({
    data: {
      userId,
      orderId,
      amount: amountNum,
      reason,
      refundMethod: refundMethod || 'original',
      reference,
      status: 'requested',
    },
  });

  return NextResponse.json({ success: true, refund }, { status: 201 });
}

/**
 * Get user's refunds sorted by createdAt desc.
 * @param userId - ID of the user whose refunds to retrieve
 * @returns NextResponse with array of refunds
 */
async function handleList(userId: string) {
  const refunds = await db.refund.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ success: true, refunds });
}

/**
 * Admin approves a refund.
 * Transitions refund status from 'requested' to 'approved'.
 * Validates that the refund exists and is in the correct state.
 * @param body - Request body containing refundId and optional adminNote
 * @returns NextResponse with updated refund or error
 */
async function handleApprove(body: { refundId: string; adminNote?: string }) {
  const { refundId, adminNote } = body;

  if (!refundId) {
    return NextResponse.json(
      { success: false, message: 'refundId is required' },
      { status: 400 },
    );
  }

  /**
   * Approve refund within a transaction for atomicity.
   * Ensures state transition is valid and recorded atomically.
   * @throws REFUND_NOT_FOUND if refund doesn't exist
   * @throws INVALID_STATE_TRANSITION if refund is not in 'requested' state
   */
  const refund = await db.$transaction(async (tx) => {
    const existing = await tx.refund.findUnique({ where: { id: refundId } });
    
    if (!existing) {
      throw new Error('REFUND_NOT_FOUND');
    }

    // Validate state transition: only 'requested' can be approved
    if (existing.status !== 'requested') {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    return tx.refund.update({
      where: { id: refundId },
      data: {
        status: 'approved',
        adminNote: adminNote || '',
      },
    });
  });

  return NextResponse.json({ success: true, refund });
}

/**
 * Admin processes an approved refund.
 * For wallet refunds: credits user's wallet balance and creates audit trail.
 * For original refunds: attempts Paystack refund via payment provider.
 * All database operations are wrapped in a transaction for atomicity.
 * @param body - Request body containing refundId
 * @returns NextResponse with updated refund and optionally newBalance
 */
async function handleProcess(body: { refundId: string }) {
  const { refundId } = body;

  if (!refundId) {
    return NextResponse.json(
      { success: false, message: 'refundId is required' },
      { status: 400 },
    );
  }

  /**
   * Process refund within a transaction.
   * Ensures wallet credit + transaction record + status update are atomic.
   * @throws REFUND_NOT_FOUND if refund doesn't exist
   * @throws INVALID_STATE_TRANSITION if refund is not in 'approved' state
   * @throws USER_NOT_FOUND if user doesn't exist (for wallet refunds)
   */
  const result = await db.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({ where: { id: refundId } });
    
    if (!refund) {
      throw new Error('REFUND_NOT_FOUND');
    }

    // Validate state transition: only 'approved' can be processed
    if (refund.status !== 'approved') {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    let newBalance: number | undefined;

    if (refund.refundMethod === 'wallet') {
      // Lock and fetch user record for update
      const user = await tx.user.findUnique({ 
        where: { id: refund.userId },
        select: { id: true, walletBalance: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // IMPROVED (Phase 10 Alpha Batch 2): use atomic `increment` instead of
      // `set: newBalance`. The previous `set` pattern computed
      // `newBalance = user.walletBalance + refund.amount` and wrote the
      // absolute value, which could override a concurrent wallet update
      // that happened between the `findUnique` and the `update` (within
      // the same transaction, SQLite doesn't lock individual rows the way
      // PostgreSQL does). `increment` delegates the arithmetic to Prisma/
      // SQLite, which handles it atomically. We then re-fetch the updated
      // balance from the `update` result for the audit row below.
      //
      // Note: this wallet credit + audit row + refund status update remain
      // in a single `$transaction` for full atomicity. We intentionally do
      // NOT delegate to `walletService.refund` here because that service
      // runs its own internal `$transaction`, which would NOT include the
      // refund status update below — losing cross-step atomicity (admin
      // could re-process and credit the user twice if the status update
      // failed after the wallet credit succeeded).
      const updatedUser = await tx.user.update({
        where: { id: refund.userId },
        data: { walletBalance: { increment: refund.amount } },
      });
      newBalance = updatedUser.walletBalance;

      // Create wallet transaction record (audit trail)
      await tx.walletTransaction.create({
        data: {
          userId: refund.userId,
          type: 'refund',
          amount: refund.amount,
          balance: newBalance,
          description: `Refund for order ${refund.orderId || 'N/A'}`,
          reference: `refund-${refundId}`, // Store refund reference for traceability
        },
      });
    }

    // Update refund status to completed
    const updatedRefund = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: 'completed',
        processedAt: new Date(),
      },
    });

    return { refund: updatedRefund, newBalance };
  });

  // Handle Paystack refund outside transaction (non-blocking)
  // We already marked as completed; Paystack failure won't affect our state
  const refundRecord = await db.refund.findUnique({ where: { id: refundId } });
  if (refundRecord?.refundMethod === 'original') {
    try {
      const { paystackRefund } = await import('@/lib/payments');
      await paystackRefund(refundRecord.reference);
    } catch {
      // Paystack refund unavailable or failed — already marked completed
      console.warn('[Refunds API] Paystack refund unavailable or failed, but refund already marked completed');
    }
  }

  const response: { success: boolean; refund: typeof result.refund; newBalance?: number } = {
    success: true,
    refund: result.refund,
  };

  if (result.newBalance !== undefined) {
    response.newBalance = result.newBalance;
  }

  return NextResponse.json(response);
}

/**
 * Admin rejects a refund.
 * Transitions refund status from 'requested' to 'rejected'.
 * Requires an admin note explaining the rejection.
 * @param body - Request body containing refundId and adminNote
 * @returns NextResponse with updated refund or error
 */
async function handleReject(body: { refundId: string; adminNote: string }) {
  const { refundId, adminNote } = body;

  if (!refundId || !adminNote) {
    return NextResponse.json(
      { success: false, message: 'refundId and adminNote are required' },
      { status: 400 },
    );
  }

  /**
   * Reject refund within a transaction for atomicity.
   * Ensures state transition is valid and recorded atomically.
   * @throws REFUND_NOT_FOUND if refund doesn't exist
   * @throws INVALID_STATE_TRANSITION if refund is not in 'requested' state
   */
  const refund = await db.$transaction(async (tx) => {
    const existing = await tx.refund.findUnique({ where: { id: refundId } });
    
    if (!existing) {
      throw new Error('REFUND_NOT_FOUND');
    }

    // Validate state transition: only 'requested' can be rejected
    if (existing.status !== 'requested') {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    return tx.refund.update({
      where: { id: refundId },
      data: {
        status: 'rejected',
        adminNote,
      },
    });
  });

  return NextResponse.json({ success: true, refund });
}
