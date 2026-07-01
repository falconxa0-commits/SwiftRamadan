import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/payments';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// GET /api/payments/callback — Payment gateway callback (Paystack/Flutterwave redirect)
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

    // CRITICAL: Always verify with the provider — NEVER trust URL parameters
    const provider = payment.provider as 'paystack' | 'monnify' | 'flutterwave' | 'swift-pay' | 'bnpl' | 'opay' | 'moniepoint';
    const result = await verifyPayment(provider, reference, transactionId || undefined);

    if (result.verified) {
      // Provider confirmed — safe to update
      await db.payment.update({
        where: { reference },
        data: { status: 'success' },
      });

      if (payment.orderId) {
        await db.order.update({
          where: { id: payment.orderId },
          data: { status: 'Confirmed', progress: 10 },
        });
      }

      return NextResponse.redirect(new URL('/?payment=success', request.url));
    }

    // Provider did not confirm — mark as failed
    await db.payment.update({
      where: { reference },
      data: { status: 'failed' },
    });

    return NextResponse.redirect(new URL('/?payment=failed', request.url));
  } catch (error) {
    console.error('Payment callback error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/payments/callback' },
    });
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}

// POST handler for webhook callbacks with signature verification
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    // Verify Paystack webhook signature
    if (signature) {
      const crypto = await import('crypto');
      const expectedSig = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(body).digest('hex');
      if (signature !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success' && data?.reference) {
      const payment = await db.payment.findUnique({ where: { reference: data.reference } });
      if (payment && payment.status !== 'success') {
        // Verify with provider before updating
        const result = await verifyPayment(
          payment.provider as 'paystack' | 'monnify' | 'flutterwave' | 'swift-pay' | 'bnpl' | 'opay' | 'moniepoint',
          data.reference,
        );

        if (result.verified) {
          await db.payment.update({
            where: { reference: data.reference },
            data: { status: 'success' },
          });
          if (payment.orderId) {
            await db.order.update({
              where: { id: payment.orderId },
              data: { status: 'Confirmed', progress: 10 },
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/payments/callback', method: 'POST' },
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
