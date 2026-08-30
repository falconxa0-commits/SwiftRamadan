import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment, verifyPayment, koboToNaira } from '@/lib/payments';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { formatNaira } from '@/lib/format';
import * as walletService from '@/services/wallet/wallet.service';
import * as usersService from '@/services/users/users.service';

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
      // MIGRATED (Phase 6.1): inline `db.user.findUnique({ select: { walletBalance } })`
      // replaced with `walletService.getBalance`. Service returns the wallet
      // balance in kobo (or null if user not found), same semantics as before.
      const balance = await walletService.getBalance(userId);

      if (balance === null) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        balance,
        walletBalance: formatNairaFromKobo(balance),
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

      // MIGRATED (Phase 10 Alpha): inline `db.user.findUnique({ select: { email,
      // name } })` replaced with `usersService.getUserById(userId)`. The
      // service returns a `PublicUser` whose `email` and `name` fields are
      // projected by `publicUserFields` (matching the previous `select`
      // shape). Null semantics are preserved — `getUserById` returns `null`
      // when the user doesn't exist.
      const user = await usersService.getUserById(userId);

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
        email: String(user.email),
        name: String(user.name),
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

      // MIGRATED (Phase 10 Alpha): the wallet-credit half of this flow (lock
      // user → increment walletBalance → create WalletTransaction audit
      // row) is delegated to `walletService.topUp`, which performs the same
      // atomic steps inside its own `$transaction`. The previous inline
      // flow ran `verifyPayment` (an external HTTP call to Paystack) INSIDE
      // a `db.$transaction`, which is an anti-pattern: it held a SQLite
      // write lock for the duration of the network round-trip. The
      // migrated flow runs `verifyPayment` OUTSIDE any DB transaction,
      // then calls `walletService.topUp` for the atomic DB mutations.
      //
      // The service throws `USER_NOT_FOUND` / `INVALID_AMOUNT` — mapped to
      // HTTP responses by the existing catch block below.
      // `PAYMENT_VERIFICATION_FAILED` is checked inline here (the service
      // has no notion of payment verification — that's a payment-provider
      // concern that belongs in the route layer).
      const verification = await verifyPayment('paystack', reference);
      if (!verification.verified) {
        return NextResponse.json(
          { success: false, message: 'Payment verification failed' },
          { status: 400 },
        );
      }

      const verifiedAmountKobo = verification.amount ?? 0;
      if (verifiedAmountKobo <= 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid amount specified' },
          { status: 400 },
        );
      }

      const result = await walletService.topUp(userId, verifiedAmountKobo, reference);

      return NextResponse.json({
        success: true,
        newBalance: result.newBalance,
        transaction: result.transaction,
        gatewayResponse: verification.gatewayResponse,
      });
    }

    // ── pay ────────────────────────────────────────────────────────────────
    // MIGRATED (Phase 10): inline `db.$transaction` (lock-user → check-balance
    // → decrement → re-check-non-negative → create audit row) replaced with
    // `walletService.debit`, which performs the same atomic steps inside its
    // own `$transaction`. The service throws `USER_NOT_FOUND` /
    // `INSUFFICIENT_BALANCE` / `INVALID_AMOUNT` — mapped to HTTP responses by
    // the existing catch block below.
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

      const result = await walletService.debit(
        userId,
        amount,
        orderId,
        `Payment for order ${orderId}`,
      );

      return NextResponse.json({
        success: true,
        newBalance: result.newBalance,
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
    console.error('[Wallet API] POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
