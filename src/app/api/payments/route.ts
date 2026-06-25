import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/** Resolve email-or-id to real User.id; returns null if not found. */
async function resolveUserId(raw: string | null | undefined): Promise<string | null> {
  if (!raw || raw === 'guest') return null;
  const byId = await db.user.findUnique({ where: { id: raw } });
  if (byId) return byId.id;
  const byEmail = await db.user.findUnique({ where: { email: raw } });
  return byEmail?.id ?? null;
}

/** Generate a unique-ish payment reference. */
function generateReference(): string {
  return `SWR-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// GET /api/payments?userId=xxx  or  /api/payments?orderId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const payments = await db.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ payments });
    }

    const userId = await resolveUserId(rawUserId);
    if (!userId) {
      return NextResponse.json({ payments: [] });
    }

    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Payments API GET error:', error);
    return NextResponse.json(
      { payments: [], message: 'Failed to fetch payments' },
      { status: 500 },
    );
  }
}

// POST /api/payments { orderId?, userId?, amount, method, reference? }
// Simulates a successful payment. If orderId provided, also updates Order.status to "Confirmed"
// and Order.progress to 10.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId: rawUserId, amount, method, reference } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'A positive amount is required' },
        { status: 400 },
      );
    }

    const validMethods = ['card', 'transfer', 'cash', 'bnpl'];
    const finalMethod = validMethods.includes(method) ? method : 'card';

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

    // Optionally link to user
    const userId = await resolveUserId(rawUserId);

    // Ensure reference is unique (if collision, append random suffix and retry once)
    const existing = await db.payment.findUnique({ where: { reference: finalReference } });
    if (existing) {
      finalReference = `${finalReference}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }

    const payment = await db.payment.create({
      data: {
        orderId: validOrderId,
        userId,
        amount: Number(amount),
        method: finalMethod,
        status: 'success',
        reference: finalReference,
        provider: finalMethod === 'card' ? 'paystack' : finalMethod === 'transfer' ? 'monnify' : 'swift-pay',
      },
    });

    // If linked to an order, mark it as Confirmed with progress 10 (no-op if already past that)
    if (validOrderId) {
      const order = await db.order.findUnique({ where: { id: validOrderId } });
      if (order && (order.status === 'Preparing' || order.progress < 10)) {
        await db.order.update({
          where: { id: validOrderId },
          data: { status: 'Confirmed', progress: 10 },
        });
      }
    }

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    console.error('Payments API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payment' },
      { status: 500 },
    );
  }
}
