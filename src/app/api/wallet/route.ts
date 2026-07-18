import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initiatePayment, verifyPayment, koboToNaira } from '@/lib/payments';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** Format kobo amount to naira string e.g. "₦1,250.00" */
function formatNaira(kobo: number): string {
  const naira = koboToNaira(kobo);
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// POST /api/wallet
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 },
      );
    }

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
        walletBalance: formatNaira(user.walletBalance),
      });
    }

    // ── topup ──────────────────────────────────────────────────────────────
    if (action === 'topup') {
      const { amount } = body as { action: string; userId: string; amount: number };

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
        callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payments/callback`,
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
      const { reference } = body as { action: string; userId: string; reference: string };

      if (!reference) {
        return NextResponse.json(
          { success: false, message: 'reference is required' },
          { status: 400 },
        );
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, walletBalance: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 },
        );
      }

      const verification = await verifyPayment('paystack', reference);

      if (!verification.verified) {
        return NextResponse.json(
          { success: false, message: 'Payment verification failed', gatewayResponse: verification.gatewayResponse },
          { status: 400 },
        );
      }

      // Verified amount is in kobo (returned by Paystack)
      const verifiedAmountKobo = verification.amount ?? 0;

      if (verifiedAmountKobo <= 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid verified amount' },
          { status: 400 },
        );
      }

      // Update user wallet balance
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: verifiedAmountKobo } },
      });

      // Create wallet transaction record
      const transaction = await db.walletTransaction.create({
        data: {
          userId,
          type: 'topup',
          amount: verifiedAmountKobo,
          balance: updatedUser.walletBalance,
          description: `Wallet top-up via Paystack`,
          reference,
        },
      });

      return NextResponse.json({
        success: true,
        newBalance: updatedUser.walletBalance,
        transaction,
      });
    }

    // ── pay ────────────────────────────────────────────────────────────────
    if (action === 'pay') {
      const { orderId, amount } = body as {
        action: string;
        userId: string;
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

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, walletBalance: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 },
        );
      }

      // Check sufficient balance
      if (user.walletBalance < amount) {
        return NextResponse.json(
          {
            success: false,
            message: 'Insufficient wallet balance',
            balance: user.walletBalance,
            required: amount,
            shortfall: amount - user.walletBalance,
          },
          { status: 400 },
        );
      }

      // Deduct from wallet
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      // Create wallet transaction record
      const transaction = await db.walletTransaction.create({
        data: {
          userId,
          type: 'payment',
          amount: -amount, // negative for debit
          balance: updatedUser.walletBalance,
          description: `Payment for order ${orderId}`,
        },
      });

      return NextResponse.json({
        success: true,
        newBalance: updatedUser.walletBalance,
        transaction,
      });
    }

    // Unknown action
    return NextResponse.json(
      { success: false, message: `Unknown action: ${action}. Valid actions: balance, topup, confirm, pay` },
      { status: 400 },
    );
  } catch (error) {
    console.error('[Wallet API] POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
