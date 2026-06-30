import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/payments';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// GET /api/payments/callback — Payment gateway callback (Paystack/Flutterwave redirect)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference') || searchParams.get('tx_ref');
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transaction_id');

    if (!reference) {
      return NextResponse.redirect(new URL('/?payment=error', request.url));
    }

    // Find the payment by reference
    const payment = await db.payment.findUnique({ where: { reference } });

    if (!payment) {
      return NextResponse.redirect(new URL('/?payment=not_found', request.url));
    }

    // If status indicates success, verify with the provider
    if (status === 'success' || status === 'successful') {
      const result = await verifyPayment(
        payment.provider as 'paystack' | 'monnify' | 'flutterwave' | 'swift-pay' | 'bnpl',
        reference,
        transactionId || undefined
      );

      if (result.verified) {
        // Update payment status
        await db.payment.update({
          where: { reference },
          data: { status: 'success' },
        });

        // Update linked order
        if (payment.orderId) {
          await db.order.update({
            where: { id: payment.orderId },
            data: { status: 'Confirmed', progress: 10 },
          });
        }

        return NextResponse.redirect(new URL('/?payment=success', request.url));
      }
    }

    // Payment failed or verification failed
    await db.payment.update({
      where: { reference },
      data: { status: 'failed' },
    });

    return NextResponse.redirect(new URL('/?payment=failed', request.url));
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}
