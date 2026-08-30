import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPayment,
  type PaymentProvider,
} from '@/lib/payments';
import {
  verifyWebhookSignature,
  isTransactionProcessed,
  markTransactionProcessed,
  type WebhookProvider,
} from '@/lib/payment-webhook';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import * as paymentsService from '@/services/payments/payments.service';

export const runtime = 'nodejs';

/** Allowed tolerance between expected and verified amount (in kobo). Handles float rounding. */
const AMOUNT_TOLERANCE_KOBO = 100; // ₦1.00 tolerance

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/callback — Payment gateway redirect (Paystack/Flutterwave)
// Called when the customer's browser is redirected back after payment.
// This route NEVER trusts URL parameters alone — it always verifies with
// the provider's API before marking a payment as successful.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference') || searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');

    if (!reference) {
      return NextResponse.redirect(new URL('/?payment=error', request.url));
    }

    // Find the payment by reference
    const payment = await db.payment.findUnique({ where: { reference } });

    if (!payment) {
      return NextResponse.redirect(new URL('/?payment=not_found', request.url));
    }

    // Idempotency: if already successfully processed, just redirect to success
    if (payment.status === 'success') {
      return NextResponse.redirect(new URL('/?payment=success', request.url));
    }

    // Verify with the provider — NEVER trust URL parameters
    const provider = payment.provider as PaymentProvider;
    const result = await verifyPayment(provider, reference, transactionId || undefined);

    if (!result.verified) {
      // Provider did not confirm — mark as failed
      await db.payment.update({
        where: { reference },
        data: { status: 'failed' },
      });
      return NextResponse.redirect(new URL('/?payment=failed', request.url));
    }

    // ── Amount verification ──
    if (result.amount !== undefined && payment.amount > 0) {
      const diff = Math.abs(result.amount - payment.amount);
      if (diff > AMOUNT_TOLERANCE_KOBO) {
        console.error(
          `[Payment] Amount mismatch for ${reference}: expected=${payment.amount} kobo, verified=${result.amount} kobo`,
        );
        await db.payment.update({
          where: { reference },
          data: { status: 'failed', verifiedAmount: result.amount },
        });
        return NextResponse.redirect(new URL('/?payment=error', request.url));
      }
    }

    // ── Currency verification ──
    if (result.currency && result.currency !== 'NGN' && payment.providerCurrency !== result.currency) {
      console.error(
        `[Payment] Currency mismatch for ${reference}: expected=NGN, got=${result.currency}`,
      );
      await db.payment.update({
        where: { reference },
        data: { status: 'failed' },
      });
      return NextResponse.redirect(new URL('/?payment=error', request.url));
    }

    // ── Update payment + order atomically ──
    await db.$transaction(async (tx) => {
      // Re-check status inside transaction for idempotency (prevents race condition)
      const current = await tx.payment.findUnique({
        where: { reference },
        select: { status: true },
      });
      if (!current || current.status === 'success') return;

      await tx.payment.update({
        where: { reference },
        data: {
          status: 'success',
          verifiedAmount: result.amount ?? payment.amount,
          providerTransactionId: result.providerTransactionId,
          providerCurrency: result.currency || 'NGN',
        },
      });

      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'Confirmed', progress: 10 },
        });
      }
    });

    return NextResponse.redirect(new URL('/?payment=success', request.url));
  } catch (error) {
    console.error('[Payment] Callback GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/payments/callback' },
    });
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/callback — Webhook handler (Paystack/Flutterwave/Monnify)
//
// Security chain:
//   1. Verify webhook signature (mandatory — reject if missing/invalid)
//   2. Parse event
//   3. Find payment by reference (reject if unknown)
//   4. Idempotency check (skip if already processed)
//   5. Re-verify with provider API (defense in depth)
//   6. Verify amount matches
//   7. Verify currency
//   8. Update payment + order atomically in a transaction
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.text();

    // ── Step 1: Verify webhook signature (MANDATORY) ──
    // Uses Web Crypto API (edge-compatible) for HMAC verification.
    // Rejects any webhook without a valid signature — an unverified webhook
    // is indistinguishable from a forgery.

    const sigResult = await verifyWebhookSignature(body, request.headers);

    if (!sigResult.provider) {
      console.warn('[Payment] Webhook rejected — no recognized signature header:', sigResult.error);
      return NextResponse.json({ error: 'Unauthorized', reason: sigResult.error }, { status: 401 });
    }

    if (!sigResult.valid) {
      console.warn(`[Payment] Webhook rejected — invalid ${sigResult.provider} signature`);
      return NextResponse.json({ error: 'Invalid signature', provider: sigResult.provider }, { status: 401 });
    }

    const webhookProvider = sigResult.provider as WebhookProvider;

    // ── Step 2: Parse event ──

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      console.warn('[Payment] Webhook rejected — malformed JSON');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const event = payload.event as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;

    // ── Step 3: Process charge.success events ──

    // Only process successful charge events — ignore all others
    const isPaystackSuccess = event === 'charge.success';
    const isFlutterwaveSuccess = event === 'charge.completed' && (data?.status === 'successful');
    const isMonnifySuccess = event === 'SUCCESSFUL_TRANSACTION';

    if (!isPaystackSuccess && !isFlutterwaveSuccess && !isMonnifySuccess) {
      // Not a successful charge — acknowledge but don't process
      return NextResponse.json({ received: true });
    }

    // Extract reference from provider-specific payload
    const reference = (data?.reference || data?.tx_ref || data?.paymentReference) as string | undefined;
    if (!reference) {
      console.warn('[Payment] Webhook rejected — no reference in payload');
      return NextResponse.json({ received: true });
    }

    // ── Step 4: Idempotency check (replay attack prevention) ──
    // Two-tier check: in-memory cache + database query

    if (await isTransactionProcessed(reference)) {
      console.log(`[Payment] Webhook — duplicate transaction reference: ${reference}`);
      return NextResponse.json(
        { received: true, reason: 'Already processed' },
        { status: 409 } // Conflict — indicates duplicate
      );
    }

    // Find the payment by reference
    const payment = await db.payment.findUnique({ where: { reference } });

    if (!payment) {
      // Unknown reference — acknowledge to prevent retries, but don't process
      console.warn(`[Payment] Webhook — unknown reference: ${reference}`);
      return NextResponse.json({ received: true });
    }

    // ── Step 5: Re-verify with provider API (defense in depth) ──
    // Never trust webhook data alone — always confirm with the provider.

    const transactionId = (data?.id || data?.transaction_id) as string | undefined;
    const providerResult = await verifyPayment(
      payment.provider as PaymentProvider,
      reference,
      transactionId?.toString(),
    );

    if (!providerResult.verified) {
      console.warn(`[Payment] Webhook — provider verification failed for ${reference}`);
      return NextResponse.json({ received: true });
    }

    // ── Step 6: Verify amount ──

    if (providerResult.amount !== undefined && payment.amount > 0) {
      const diff = Math.abs(providerResult.amount - payment.amount);
      if (diff > AMOUNT_TOLERANCE_KOBO) {
        console.error(
          `[Payment] Amount mismatch for ${reference}: expected=${payment.amount} kobo, verified=${providerResult.amount} kobo`,
        );
        // Do NOT mark as success — log the discrepancy and acknowledge
        return NextResponse.json({ received: true });
      }
    }

    // ── Step 7: Verify currency ──

    if (providerResult.currency && providerResult.currency !== 'NGN' && payment.providerCurrency !== providerResult.currency) {
      console.error(
        `[Payment] Currency mismatch for ${reference}: expected=NGN, got=${providerResult.currency}`,
      );
      return NextResponse.json({ received: true });
    }

    // ── Step 8: Update payment + order atomically in DB transaction ──
    // MIGRATED (Phase 10): the inline `db.$transaction` (idempotency re-check
    // → payment.update → order.update) is delegated to
    // `paymentsService.processWebhook`, which performs the same atomic
    // steps inside its own `$transaction`. We pass `amount: undefined`
    // because we've already done the tolerance check above (the service
    // would otherwise repeat it). Currency was verified above; the service
    // stores it on the Payment row.
    const providerTxId = providerResult.providerTransactionId || '';

    const webhookResult = await paymentsService.processWebhook(
      reference,
      'success',
      undefined, // amount — already validated inline above
      providerResult.currency || 'NGN',
      providerTxId,
    );

    if (webhookResult.updated) {
      // Mark as processed in cache (after successful DB transaction)
      await markTransactionProcessed(reference, providerTxId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Payment] Webhook POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/payments/callback', method: 'POST' },
    });
    // Return 500 to trigger provider retry (something unexpected went wrong)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
