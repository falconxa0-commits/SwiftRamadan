import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/rider/assign?email=xxx
 * Returns all orders currently assigned to this rider (riderName matches user.name)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Rider not found' },
        { status: 404 }
      );
    }

    const orders = await db.order.findMany({
      where: { riderName: user.name },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = orders.map((o) => {
      let items: Array<{ name: string; qty: number; price: number }> = [];
      try {
        items = JSON.parse(o.items);
      } catch {
        items = [];
      }
      return { ...o, items };
    });

    return NextResponse.json({ success: true, orders: parsed });
  } catch (error) {
    console.error('Rider assign GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch assigned orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rider/assign
 * Body: { orderId, riderEmail, action }
 *   action = "accept"   → set Order.riderName = rider's name, status = "In Transit", progress = 75
 *   action = "decline"  → no-op (order stays available)
 *   action = "complete" → set Order.status = "Delivered", progress = 100
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, riderEmail, action } = body as {
      orderId: string;
      riderEmail: string;
      action: 'accept' | 'decline' | 'complete';
    };

    if (!orderId || !riderEmail || !action) {
      return NextResponse.json(
        {
          success: false,
          message: 'orderId, riderEmail, and action are required',
        },
        { status: 400 }
      );
    }

    // Look up rider's User record to get the rider's name
    const user = await db.user.findUnique({
      where: { email: riderEmail },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Rider not found' },
        { status: 404 }
      );
    }

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Assign rider + set In Transit
      const updated = await db.order.update({
        where: { id: orderId },
        data: {
          riderName: user.name,
          status: 'In Transit',
          progress: 75,
        },
      });

      let parsedItems: Array<{ name: string; qty: number; price: number }> = [];
      try {
        parsedItems = JSON.parse(updated.items);
      } catch {
        parsedItems = [];
      }

      return NextResponse.json({
        success: true,
        message: `Order ${orderId} accepted. Head to pickup location.`,
        order: { ...updated, items: parsedItems },
      });
    }

    if (action === 'decline') {
      // No-op — order stays available
      let parsedItems: Array<{ name: string; qty: number; price: number }> = [];
      try {
        parsedItems = JSON.parse(order.items);
      } catch {
        parsedItems = [];
      }

      return NextResponse.json({
        success: true,
        message: `Order ${orderId} declined.`,
        order: { ...order, items: parsedItems },
      });
    }

    if (action === 'complete') {
      // Verify this rider owns the order before completing
      if (order.riderName !== user.name) {
        return NextResponse.json(
          {
            success: false,
            message: 'This order is not assigned to you.',
          },
          { status: 403 }
        );
      }

      const updated = await db.order.update({
        where: { id: orderId },
        data: {
          status: 'Delivered',
          progress: 100,
        },
      });

      let parsedItems: Array<{ name: string; qty: number; price: number }> = [];
      try {
        parsedItems = JSON.parse(updated.items);
      } catch {
        parsedItems = [];
      }

      // Earnings: 15% of order total
      const earnings = Math.round(updated.total * 0.15);

      return NextResponse.json({
        success: true,
        message: `Order ${orderId} delivered. You earned ₦${earnings.toLocaleString()}.`,
        order: { ...updated, items: parsedItems },
        earnings,
      });
    }

    return NextResponse.json(
      { success: false, message: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Rider assign POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process rider action' },
      { status: 500 }
    );
  }
}
