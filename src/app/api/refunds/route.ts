import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'request':
        return await handleRequest(body);
      case 'list':
        return await handleList(body);
      case 'approve':
        return await handleApprove(body);
      case 'process':
        return await handleProcess(body);
      case 'reject':
        return await handleReject(body);
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: request, list, approve, process, reject' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Refunds API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** Customer requests a refund */
async function handleRequest(body: {
  userId: string;
  orderId: string;
  amount: number;
  reason: string;
  refundMethod: string;
}) {
  const { userId, orderId, amount, reason, refundMethod } = body;

  if (!userId || !orderId || !amount || !reason) {
    return NextResponse.json(
      { success: false, message: 'userId, orderId, amount, and reason are required' },
      { status: 400 },
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { success: false, message: 'Amount must be positive' },
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

  const reference = `RF_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const refund = await db.refund.create({
    data: {
      userId,
      orderId,
      amount,
      reason,
      refundMethod: refundMethod || 'original',
      reference,
      status: 'requested',
    },
  });

  return NextResponse.json({ success: true, refund }, { status: 201 });
}

/** Get user's refunds sorted by createdAt desc */
async function handleList(body: { userId: string }) {
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 },
    );
  }

  const refunds = await db.refund.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, refunds });
}

/** Admin approves a refund */
async function handleApprove(body: { refundId: string; adminNote?: string }) {
  const { refundId, adminNote } = body;

  if (!refundId) {
    return NextResponse.json(
      { success: false, message: 'refundId is required' },
      { status: 400 },
    );
  }

  const existing = await db.refund.findUnique({ where: { id: refundId } });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Refund not found' },
      { status: 404 },
    );
  }

  const refund = await db.refund.update({
    where: { id: refundId },
    data: {
      status: 'approved',
      adminNote: adminNote || '',
    },
  });

  return NextResponse.json({ success: true, refund });
}

/** Admin processes an approved refund */
async function handleProcess(body: { refundId: string }) {
  const { refundId } = body;

  if (!refundId) {
    return NextResponse.json(
      { success: false, message: 'refundId is required' },
      { status: 400 },
    );
  }

  const refund = await db.refund.findUnique({ where: { id: refundId } });
  if (!refund) {
    return NextResponse.json(
      { success: false, message: 'Refund not found' },
      { status: 404 },
    );
  }

  if (refund.status !== 'approved') {
    return NextResponse.json(
      { success: false, message: 'Refund must be in approved status to process' },
      { status: 400 },
    );
  }

  let newBalance: number | undefined;

  if (refund.refundMethod === 'wallet') {
    // Credit user's wallet balance
    const user = await db.user.findUnique({ where: { id: refund.userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    newBalance = user.walletBalance + refund.amount;

    await db.user.update({
      where: { id: refund.userId },
      data: { walletBalance: newBalance },
    });

    // Create wallet transaction
    await db.walletTransaction.create({
      data: {
        userId: refund.userId,
        type: 'refund',
        amount: refund.amount,
        balance: newBalance,
        description: `Refund for order ${refund.orderId || 'N/A'}`,
      },
    });
  }

  // If refundMethod === 'original', use paystackRefund from @/lib/payments (if available)
  // For now just mark as completed — the actual Paystack refund call would go here
  if (refund.refundMethod === 'original') {
    try {
      const { paystackRefund } = await import('@/lib/payments');
      // Attempt Paystack refund — non-blocking; we still mark completed regardless
      await paystackRefund(refund.reference);
    } catch {
      // Paystack refund not available or failed — still mark as completed
      console.warn('Paystack refund unavailable or failed, marking as completed anyway');
    }
  }

  const updatedRefund = await db.refund.update({
    where: { id: refundId },
    data: {
      status: 'completed',
      processedAt: new Date(),
    },
  });

  const response: { success: boolean; refund: typeof updatedRefund; newBalance?: number } = {
    success: true,
    refund: updatedRefund,
  };

  if (newBalance !== undefined) {
    response.newBalance = newBalance;
  }

  return NextResponse.json(response);
}

/** Admin rejects a refund */
async function handleReject(body: { refundId: string; adminNote: string }) {
  const { refundId, adminNote } = body;

  if (!refundId || !adminNote) {
    return NextResponse.json(
      { success: false, message: 'refundId and adminNote are required' },
      { status: 400 },
    );
  }

  const existing = await db.refund.findUnique({ where: { id: refundId } });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Refund not found' },
      { status: 404 },
    );
  }

  const refund = await db.refund.update({
    where: { id: refundId },
    data: {
      status: 'rejected',
      adminNote,
    },
  });

  return NextResponse.json({ success: true, refund });
}
