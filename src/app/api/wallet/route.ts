import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initiatePayment, verifyPayment, koboToNaira } from '@/lib/payments';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { formatNaira } from '@/lib/format';

export const runtime = 'nodejs';

/** Format kobo amount to naira string e.g. "₦1,250.00" */
function formatNairaFromKobo(kobo: number): string {
  const naira = koboToNaira(kobo);
  return formatNaira(naira);
}

// POST /api/wallet
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { action } = body;
    const userId = auth.userId;

    // ── balance ────────────────────────────────────────────────────────────
    if (action === 'balance') {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        balance: user.walletBalance,
        walletBalance: formatNairaFromKobo(user.walletBalance),
      });
    }

    // ── topup ──────────────────────────────────────────────────────────────
    if (action === 'topup') {
      const { amount } = body as { action: string; amount: number };

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { success: false, message: 'A positive amount (in naira) is required' },
          { status: 400 },
        );
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 },
        );
      }

      const reference = `WT_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const result = await initiatePayment({
        provider: 'paystack',
        amount, // in naira — initiatePayment converts to kobo internally
        reference,
        email: user.email,
        name: user.name,
        metadata: { type: 'wallet_topup', userId },
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/api/payments/callback`,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message || 'Failed to initialize top-up' },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        reference,
        checkoutUrl: result.checkoutUrl,
      });
    }

    // ── confirm ────────────────────────────────────────────────────────────
    if (action === 'confirm') {
      const { reference } = body as { action: string; reference: string };

      if (!reference) {
        return NextResponse.json(
          { success: false, message: 'reference is required' },
          { status: 400 },
        );
      }

      /**
       * Confirm wallet top-up payment within a transaction.
       * Ensures atomicity: balance update and transaction record are committed together.
       * @throws USER_NOT_FOUND if user doesn't exist
       * @throws INVALID_AMOUNT if verified amount is not positive
       */
      const result = await db.$transaction(async (tx) => {
        // Lock and fetch user record for update
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, walletBalance: true },
        });

        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        const verification = await verifyPayment('paystack', reference);

        if (!verification.verified) {
          throw new Error('PAYMENT_VERIFICATION_FAILED');
        }

        // Verified amount is in kobo (returned by Paystack)
        const verifiedAmountKobo = verification.amount ?? 0;

        if (verifiedAmountKobo <= 0) {
          throw new Error('INVALID_AMOUNT');
        }

        // Atomic increment of wallet balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: verifiedAmountKobo } },
        });

        // Create wallet transaction record (audit trail)
        const transaction = await tx.walletTransaction.create({
          data: {
            userId,
            type: 'topup',
            amount: verifiedAmountKobo,
            balance: updatedUser.walletBalance,
            description: `Wallet top-up via Paystack`,
            reference,
          },
        });

        return { updatedUser, transaction, gatewayResponse: verification.gatewayResponse };
      });

      return NextResponse.json({
        success: true,
        newBalance: result.updatedUser.walletBalance,
        transaction: result.transaction,
      });
    }

    // ── pay ────────────────────────────────────────────────────────────────
    if (action === 'pay') {
      const { orderId, amount } = body as {
        action: string;
        orderId: string;
        amount: number;
      };

      if (!orderId) {
        return NextResponse.json(
          { success: false, message: 'orderId is required' },
          { status: 400 },
        );
      }

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { success: false, message: 'A positive amount (in kobo) is required' },
          { status: 400 },
        );
      }

      /**
       * Process wallet payment within a transaction.
       * Uses atomic decrement with balance validation to prevent race conditions.
       * @throws USER_NOT_FOUND if user doesn't exist
       * @throws INSUFFICIENT_BALANCE if funds are inadequate
       */
      const result = await db.$transaction(async (tx) => {
        // Lock and fetch user record for update
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, walletBalance: true },
        });

        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        // Check sufficient balance before debit
        if (user.walletBalance < amount) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // Atomic decrement — deduct from wallet
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: amount } },
        });

        // If balance went negative, rollback (defends against concurrent payments)
        if (updatedUser.walletBalance < 0) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // Create wallet transaction record (audit trail)
        const transaction = await tx.walletTransaction.create({
          data: {
            userId,
            type: 'payment',
            amount: -amount, // negative for debit
            balance: updatedUser.walletBalance,
            description: `Payment for order ${orderId}`,
            reference: orderId, // Store orderId in reference field for traceability
          },
        });

        return { updatedUser, transaction };
      });

      return NextResponse.json({
        success: true,
        newBalance: result.updatedUser.walletBalance,
        transaction: result.transaction,
      });
    }

    // Unknown action
    return NextResponse.json(
      { success: false, message: `Unknown action: ${action}. Valid actions: balance, topup, confirm, pay` },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json(
        { success: false, message: 'Insufficient wallet balance for this transaction' },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === 'INVALID_AMOUNT') {
      return NextResponse.json(
        { success: false, message: 'Invalid amount specified' },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === 'PAYMENT_VERIFICATION_FAILED') {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed' },
        { status: 400 },
      );
    }
    console.error('[Wallet API] POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
