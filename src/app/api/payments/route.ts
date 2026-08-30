import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentProvider } from '@/lib/payments';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as paymentsService from '@/services/payments/payments.service';
import * as ordersService from '@/services/orders/orders.service';

export const runtime = 'nodejs';

// Map frontend method names to payment provider identifiers
const methodToProvider: Record<string, PaymentProvider> = {
  card: 'paystack',
  transfer: 'monnify',
  bnpl: 'bnpl',
  cash: 'swift-pay',
};

// GET /api/payments — Get payments for the authenticated user (or by orderId)
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Verify the order belongs to the user (or user is admin) before showing payments
      // MIGRATED (Phase 11): the inline `db.order.findUnique` + manual
      // `order.userId !== auth.userId` check is delegated to
      // `ordersService.getOrderById(orderId, auth.userId)`, which performs
      // the same lookup AND ownership check (returns null if the order does
      // not exist OR if the user does not own it). Admins skip this branch
      // entirely (preserved from the previous flow). The empty-list response
      // shape (`{ payments: [] }`) on ownership failure is unchanged.
      if (auth.role !== 'admin') {
        const order = await ordersService.getOrderById(orderId, auth.userId);
        if (!order) {
          return NextResponse.json({ payments: [] });
        }
      }
      const payments = await db.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ payments });
    }

    // MIGRATED (Phase 6.1): the user-scoped `db.payment.findMany` is now
    // delegated to `paymentsService.listUserPayments`. The order-scoped branch
    // above remains inline because the service only supports user-keyed
    // listings (no `orderId` filter). The service's pagination metadata
    // (`total`/`page`/`limit`/`totalPages`) is dropped here to preserve the
    // previous response shape of `{ payments }`.
    const userId = auth.userId;

    const result = await paymentsService.listUserPayments(userId, 1, 50);

    return NextResponse.json({ payments: result.payments });
  } catch (error) {
    console.error('Payments API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/payments' },
    });
    return NextResponse.json(
      { payments: [], message: 'Failed to fetch payments' },
      { status: 500 },
    );
  }
}

// POST /api/payments { orderId?, userId?, amount, method, reference? }
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { orderId, amount, method, reference } = body;
    const userId = auth.userId;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'A positive amount is required' },
        { status: 400 },
      );
    }

    const validMethods = ['card', 'transfer', 'cash', 'bnpl'];
    const finalMethod = validMethods.includes(method) ? method : 'card';
    const provider = methodToProvider[finalMethod] || 'swift-pay';

    // Optional: link to existing order if provided. The service does not
    // validate order existence or ownership — the caller is responsible for
    // that. The previous inline flow also did not check ownership, so
    // behaviour is preserved.
    // MIGRATED (Phase 11): the existence-check `db.order.findUnique` is
    // delegated to `ordersService.getOrderById(orderId, null)` (null skips
    // the service's ownership check, matching the previous inline flow
    // which only checked existence). `ParsedOrder.id` is the same field as
    // the raw Order's `id`.
    let validOrderId: string | null = null;
    if (orderId) {
      const order = await ordersService.getOrderById(String(orderId), null);
      if (order) validOrderId = order.id;
    }

    // MIGRATED (Phase 10 Alpha): inline `db.payment.findUnique` (reference
    // collision check) + `initiatePayment` (provider gateway call) +
    // `db.payment.create` + `db.order.update` (COD order confirmation)
    // replaced with `paymentsService.initiatePayment`, which performs the
    // same steps internally: reference generation/collision check, gateway
    // call (for non-COD), Payment row creation, and COD order confirmation.
    //
    // The service expects `amount` in KOBO (matching the Payment.amount
    // column). The previous inline flow passed the body's `amount` (which
    // the frontend sends in NAIRA — see CheckoutModal.tsx's `snapshotTotal`)
    // directly to both `db.payment.create` AND `lib/payments.initiatePayment`
    // (which expects naira). This was inconsistent: the gateway call was
    // correct (naira → kobo via lib's `nairaToKobo`), but the stored
    // `Payment.amount` was naira-where-kobo-was-expected, breaking the
    // amount-tolerance check in `/api/payments/callback` (Paystack returns
    // kobo; the stored naira value differed by ~100x, always exceeding the
    // ₦1.00 tolerance). The migration converts naira → kobo (`* 100`)
    // before calling the service, which fixes the stored-amount bug AND
    // preserves the gateway charge (the service divides by 100 to recover
    // naira for the gateway call).
    //
    // Behaviour changes:
    //   1. `db.payment.amount` now stores KOBO (was naira). Side-effect:
    //      the `/api/payments/callback` amount-tolerance check now passes
    //      (was always failing due to the unit mismatch — a latent bug).
    //   2. The previous flow short-circuited with a 400 BEFORE creating
    //      the Payment row when the gateway returned !success in production
    //      (dev-mode without `PAYSTACK_SECRET_KEY` allowed it through).
    //      The service creates the Payment row regardless; the route
    //      checks `init.success` afterwards and returns 400 if the gateway
    //      failed in production. The orphan Payment row (status: 'pending')
    //      is left in place — it represents a failed payment attempt and
    //      can be cleaned up by a sweep job. Minor regression from the
    //      previous behaviour but matches the service's contract.
    //   3. The previous flow silently appended a random suffix on any
    //      reference collision (caller-supplied or auto-generated). The
    //      service throws `REFERENCE_TAKEN` on a caller-supplied collision
    //      and only auto-retries on an auto-generated collision. This is
    //      more conservative — callers can retry with a fresh reference.
    //      In practice the frontend generates references with
    //      `Date.now() + Math.random()`, so collisions are vanishingly
    //      rare.
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/api/payments/callback`;
    const amountKobo = Math.round(Number(amount) * 100);

    let serviceResult;
    try {
      serviceResult = await paymentsService.initiatePayment(
        userId,
        validOrderId,
        amountKobo,
        finalMethod,
        provider,
        typeof reference === 'string' ? reference : undefined,
        auth.email || undefined,
        'SwiftRamadan Customer',
        callbackUrl,
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_AMOUNT') {
        return NextResponse.json(
          { success: false, message: 'A positive amount is required' },
          { status: 400 },
        );
      }
      if (err instanceof Error && err.message === 'REFERENCE_TAKEN') {
        return NextResponse.json(
          { success: false, message: 'Payment reference already in use — please retry with a fresh reference' },
          { status: 409 },
        );
      }
      throw err;
    }

    const { payment, init } = serviceResult;

    // Dev-mode fallback: if the gateway failed and we're in dev (no
    // PAYSTACK_SECRET_KEY), continue with the mock data. Otherwise return
    // the gateway error to the client. The Payment row has already been
    // created by the service; the orphan row (status: 'pending') is left
    // in place for traceability — it represents a failed payment attempt.
    if (!init.success) {
      const isDev = !process.env.PAYSTACK_SECRET_KEY;
      if (!isDev) {
        return NextResponse.json(
          { success: false, message: init.message || 'Payment initialization failed' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      payment,
      checkoutUrl: init.checkoutUrl,
      accountNumber: init.accountNumber,
      bankName: init.bankName,
    }, { status: 201 });
  } catch (error) {
    console.error('Payments API POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/payments' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to process payment' },
      { status: 500 },
    );
  }
}
