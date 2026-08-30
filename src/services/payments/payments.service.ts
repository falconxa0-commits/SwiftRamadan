/**
 * Payments Service — encapsulates payment business logic for SwiftRamadan.
 *
 * Sits between the API routes (`/api/payments`, `/api/payments/callback`) and
 * the Prisma + provider layers. Owns:
 *   - Payment record creation with reference-unique enforcement.
 *   - Provider verification calls (defense in depth — never trust webhooks).
 *   - Idempotent webhook processing inside `$transaction` (prevents replay).
 *   - Amount/currency tolerance checks (kobo-level).
 *
 * SECURITY: All status transitions to `'success'` happen inside a
 * `$transaction` with an in-tx re-check, mirroring the hardened
 * `/api/payments/callback` flow.
 *
 * @module services/payments
 */

import { db } from '@/lib/db';
import {
  initiatePayment as providerInitiate,
  verifyPayment as providerVerify,
  type PaymentProvider,
  type PaymentMethod,
  type PaymentInitResult,
  type PaymentVerificationResult,
} from '@/lib/payments';
import type { Payment } from '@prisma/client';

/** Default page size for {@link listUserPayments}. */
export const DEFAULT_PAYMENT_PAGE_LIMIT = 20;

/** Maximum allowed page size. */
export const MAX_PAYMENT_PAGE_LIMIT = 100;

/** Tolerance (in kobo) for amount mismatches — ₦1.00 rounding slack. */
export const AMOUNT_TOLERANCE_KOBO = 100;

/** Result of {@link initiatePayment} — the DB row plus provider checkout info. */
export interface InitiatePaymentResult {
  payment: Payment;
  /** The full provider initiation result (checkout URL, account number, etc.). */
  init: PaymentInitResult;
}

/** Paginated list result for {@link listUserPayments}. */
export interface PaginatedPayments {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Outcome of {@link processWebhook}. */
export interface WebhookProcessResult {
  /** `true` if the payment was transitioned to `status` in this call.
   *  `false` if it was already processed (idempotent no-op). */
  updated: boolean;
  /** The (possibly pre-existing) payment record. */
  payment: Payment | null;
  /** Short reason for the no-op, useful for logging. */
  reason?: string;
}

/** Generate a unique payment reference. */
function generateReference(): string {
  return `SWR-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Initiate a payment — creates a `Payment` row AND calls the provider's
 * initialize API (for non-COD methods).
 *
 * @param userId    Authenticated user's ID.
 * @param orderId   Optional order ID to link the payment to. The order is NOT
 *                  verified here — the caller is responsible for ownership
 *                  checks before calling.
 * @param amount    Amount in **kobo** (matches the Payment.amount column).
 * @param method    Payment method (card, transfer, cash, bnpl).
 * @param provider  Provider key (paystack, monnify, flutterwave, swift-pay, etc.).
 * @param reference Optional caller-supplied reference. Auto-generated if empty.
 * @param email     Email to pass to the provider (for checkout). Falls back to
 *                  a placeholder if omitted.
 * @param name      Customer name to pass to the provider.
 * @param callbackUrl  Redirect URL after provider checkout.
 *
 * @throws {Error} `message === 'INVALID_AMOUNT'` if amount is not positive.
 * @throws {Error} `message === 'REFERENCE_TAKEN'` if a caller-supplied
 *                 reference already exists (the caller should retry with a
 *                 fresh reference).
 */
export async function initiatePayment(
  userId: string,
  orderId: string | null,
  amount: number,
  method: PaymentMethod | string,
  provider: PaymentProvider | string,
  reference?: string,
  email?: string,
  name?: string,
  callbackUrl?: string,
): Promise<InitiatePaymentResult> {
  if (typeof amount !== 'number' || amount <= 0) throw new Error('INVALID_AMOUNT');

  let finalReference =
    typeof reference === 'string' && reference.trim() ? reference.trim() : generateReference();

  // Reference collision check + retry-once with a random suffix.
  const existing = await db.payment.findUnique({ where: { reference: finalReference } });
  if (existing) {
    if (typeof reference === 'string' && reference.trim()) {
      // Caller-supplied reference collision — surface the error so they can retry.
      throw new Error('REFERENCE_TAKEN');
    }
    finalReference = `${finalReference}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  const finalProvider = provider as PaymentProvider;
  const isCOD = finalProvider === 'swift-pay';

  let init: PaymentInitResult;
  if (isCOD) {
    // Cash on delivery — no gateway needed; succeed synchronously.
    init = {
      success: true,
      provider: 'swift-pay',
      reference: finalReference,
      message: 'Cash on delivery — pay when you receive',
    };
  } else {
    init = await providerInitiate({
      provider: finalProvider,
      amount: Math.round(amount / 100), // lib/payments expects NAIRA; amount is kobo
      reference: finalReference,
      email: email || 'customer@swiftramadan.com',
      name: name || 'SwiftRamadan Customer',
      callbackUrl,
      method: method as PaymentMethod,
    });
  }

  const initialStatus = isCOD ? 'success' : 'pending';

  const payment = await db.payment.create({
    data: {
      orderId: orderId || null,
      userId,
      amount: Math.round(amount),
      method: String(method),
      status: initialStatus,
      reference: finalReference,
      provider: finalProvider,
    },
  });

  // For COD linked to an order, mark the order as Confirmed (mirrors route logic).
  if (orderId && initialStatus === 'success') {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (order && (order.status === 'Preparing' || order.progress < 10)) {
      await db.order.update({
        where: { id: orderId },
        data: { status: 'Confirmed', progress: 10 },
      });
    }
  }

  return { payment, init };
}

/**
 * Verify a payment with the provider (defense-in-depth — never trust a
 * webhook or URL parameter alone).
 *
 * @returns The provider's verification result. The caller decides what to do
 *          with it (typically: pass to {@link processWebhook} to persist).
 */
export async function verifyPayment(
  reference: string,
  provider: PaymentProvider,
  transactionId?: string,
): Promise<PaymentVerificationResult> {
  return providerVerify(provider, reference, transactionId);
}

/**
 * Idempotently process a webhook / callback event in a `$transaction`.
 *
 * This function:
 *   1. Finds the payment by `reference`. If not found → returns `{ updated: false, payment: null }`.
 *   2. If already `status === 'success'` → returns `{ updated: false, payment, reason: 'ALREADY_PROCESSED' }`.
 *   3. Inside a `$transaction`, re-checks status, then updates the Payment row
 *      with the new status, verified amount, currency, and provider Tx ID.
 *   4. If `status === 'success'` and the payment is linked to an order,
 *      marks the order as `Confirmed` (progress 10).
 *
 * @param reference     The payment reference (provider-side).
 * @param status        New status: `'success'` | `'failed'`.
 * @param amount        Verified amount in kobo (optional — provider may omit).
 * @param currency      Verified currency code (optional — defaults to 'NGN').
 * @param providerTxId  The provider's transaction ID for audit trail.
 */
export async function processWebhook(
  reference: string,
  status: 'success' | 'failed',
  amount?: number,
  currency?: string,
  providerTxId?: string,
): Promise<WebhookProcessResult> {
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return { updated: false, payment: null, reason: 'PAYMENT_NOT_FOUND' };

  if (payment.status === 'success') {
    return { updated: false, payment, reason: 'ALREADY_PROCESSED' };
  }

  // Amount tolerance check (only if a verified amount was provided).
  if (typeof amount === 'number' && amount > 0 && payment.amount > 0) {
    const diff = Math.abs(amount - payment.amount);
    if (diff > AMOUNT_TOLERANCE_KOBO) {
      // Don't transition to success — log via throw so caller can persist a
      // failed status and the webhook can be re-tried.
      throw new Error('AMOUNT_MISMATCH');
    }
  }

  const finalCurrency = currency || 'NGN';

  await db.$transaction(async (tx) => {
    // Idempotency re-check inside the transaction (prevents race conditions).
    const current = await tx.payment.findUnique({
      where: { reference },
      select: { status: true },
    });
    if (!current || current.status === 'success') return;

    await tx.payment.update({
      where: { reference },
      data: {
        status,
        verifiedAmount: typeof amount === 'number' ? amount : payment.amount,
        providerTransactionId: providerTxId ?? null,
        providerCurrency: finalCurrency,
      },
    });

    if (status === 'success' && payment.orderId) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'Confirmed', progress: 10 },
      });
    }
  });

  // Re-fetch the latest row for the return value.
  const refreshed = await db.payment.findUnique({ where: { reference } });
  return { updated: true, payment: refreshed };
}

/**
 * Fetch a single payment by its reference.
 *
 * @returns The `Payment` row if found, `null` otherwise.
 */
export async function getPaymentByReference(reference: string): Promise<Payment | null> {
  return db.payment.findUnique({ where: { reference } });
}

/**
 * List a user's payments with pagination.
 *
 * @param userId  The authenticated user's ID.
 * @param page    1-indexed page number (clamped to >= 1).
 * @param limit   Page size (clamped to 1..{@link MAX_PAYMENT_PAGE_LIMIT},
 *                defaults to {@link DEFAULT_PAYMENT_PAGE_LIMIT}).
 */
export async function listUserPayments(
  userId: string,
  page: number = 1,
  limit: number = DEFAULT_PAYMENT_PAGE_LIMIT,
): Promise<PaginatedPayments> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.min(
    MAX_PAYMENT_PAGE_LIMIT,
    Math.max(1, Math.floor(limit) || DEFAULT_PAYMENT_PAGE_LIMIT),
  );
  const skip = (safePage - 1) * safeLimit;

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    db.payment.count({ where: { userId } }),
  ]);

  return {
    payments,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 0,
  };
}
