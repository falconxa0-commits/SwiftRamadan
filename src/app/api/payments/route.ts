import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initiatePayment, PaymentProvider } from '@/lib/payments';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

export const runtime = 'nodejs';

/** Generate a unique-ish payment reference. */
function generateReference(): string {
  return `SWR-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

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
      if (auth.role !== 'admin') {
        const order = await db.order.findUnique({ where: { id: orderId } });
        if (!order || order.userId !== auth.userId) {
          return NextResponse.json({ payments: [] });
        }
      }
      const payments = await db.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ payments });
    }

    const userId = auth.userId;

    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
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

    // Use provided reference, ensure uniqueness by appending a suffix if needed
    let finalReference = typeof reference === 'string' && reference.trim()
      ? reference.trim()
      : generateReference();

    // Optional: link to existing order if provided
    let validOrderId: string | null = null;
    if (orderId) {
      const order = await db.order.findUnique({ where: { id: String(orderId) } });
      if (order) validOrderId = order.id;
    }

    // User is already authenticated — use auth.userId directly

    // Ensure reference is unique (if collision, append random suffix and retry once)
    const existing = await db.payment.findUnique({ where: { reference: finalReference } });
    if (existing) {
      finalReference = `${finalReference}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }

    // Initialize payment with the real gateway for non-COD methods
    let paymentInitResult: { checkoutUrl?: string; accountNumber?: string; bankName?: string } = {};
    const initialStatus = provider === 'swift-pay' ? 'success' : 'pending';

    if (provider !== 'swift-pay') {
      const result = await initiatePayment({
        provider,
        amount: Number(amount),
        reference: finalReference,
        email: auth.email || 'customer@swiftramadan.com',
        name: 'SwiftRamadan Customer',
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/api/payments/callback`,
      });

      paymentInitResult = {
        checkoutUrl: result.checkoutUrl,
        accountNumber: result.accountNumber,
        bankName: result.bankName,
      };

      if (!result.success) {
        // If real gateway fails but we're in dev mode (no keys), still allow
        const isDev = !process.env.PAYSTACK_SECRET_KEY;
        if (!isDev) {
          return NextResponse.json(
            { success: false, message: result.message || 'Payment initialization failed' },
            { status: 400 },
          );
        }
        // In dev mode with mock responses, treat as successful
      }

      // For card payments that redirect to a checkout URL, mark as pending
      // The callback will update the status to 'success' after verification
      if (provider === 'paystack' || provider === 'flutterwave') {
        // Payment is pending until the callback confirms it
      } else if (provider === 'monnify') {
        // Bank transfer — the customer needs to transfer to the provided account
      } else if (provider === 'bnpl') {
        // BNPL — checkout URL provided, pending until confirmed
      }
    }

    const payment = await db.payment.create({
      data: {
        orderId: validOrderId,
        userId,
        amount: Number(amount),
        method: finalMethod,
        status: initialStatus,
        reference: finalReference,
        provider,
      },
    });

    // If linked to an order and payment is already successful (COD), mark it as Confirmed
    if (validOrderId && initialStatus === 'success') {
      const order = await db.order.findUnique({ where: { id: validOrderId } });
      if (order && (order.status === 'Preparing' || order.progress < 10)) {
        await db.order.update({
          where: { id: validOrderId },
          data: { status: 'Confirmed', progress: 10 },
        });
      }
    }

    return NextResponse.json({
      success: true,
      payment,
      checkoutUrl: paymentInitResult.checkoutUrl,
      accountNumber: paymentInitResult.accountNumber,
      bankName: paymentInitResult.bankName,
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
