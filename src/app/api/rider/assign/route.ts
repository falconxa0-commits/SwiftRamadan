import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import { formatNaira } from '@/lib/format';
import * as ordersService from '@/services/orders/orders.service';

// Parse the JSON-encoded `items` string on an order row. Returns [] on
// malformed JSON.
function parseItems(raw: string | null | undefined): Array<{ name: string; qty: number; price: number }> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Array<{ name: string; qty: number; price: number }>;
    return [];
  } catch {
    return [];
  }
}

/**
 * GET /api/rider/assign?email=xxx
 */
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

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
      take: 50,
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
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/rider/assign' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch assigned orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rider/assign
 */
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'rider') {
    return NextResponse.json(
      { success: false, message: 'Rider access required' },
      { status: 403 }
    );
  }

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

    // MIGRATED (Phase 11): the inline `db.order.findUnique({ where: { id: orderId } })`
    // is delegated to `ordersService.getOrderById(orderId, null)`. We pass
    // `userId = null` to skip the service's own ownership check (the rider
    // is not the order's customer). The route uses `order.riderName` (still
    // present on `ParsedOrder`) for the complete-action authorisation check
    // below, and `order.items` (already parsed by the service) for the
    // decline-action response. Both shapes are unchanged from the previous
    // inline flow (which JSON-parsed the raw `items` string at point-of-use).
    const order = await ordersService.getOrderById(orderId, null);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // MIGRATED (Phase 10): the `db.order.update` for status + progress is
      // delegated to `ordersService.updateOrderStatus`. We pass `userId = null`
      // to skip the service's own ownership check (it would check
      // `order.userId === callerUserId`, which is the customer, not the
      // rider). The service does NOT accept `riderName`, so we follow up
      // with a single `db.order.update` to set riderName to the accepting
      // rider's name. The brief window between the status update and the
      // riderName update is acceptable — if the riderName update fails, the
      // order is in 'In Transit' without an assigned rider and can be
      // re-accepted by another rider.
      let updated;
      try {
        updated = await ordersService.updateOrderStatus(orderId, 'In Transit', null, 75);
      } catch (err) {
        if (err instanceof Error && err.message === 'ORDER_NOT_FOUND') {
          return NextResponse.json(
            { success: false, message: 'Order not found' },
            { status: 404 },
          );
        }
        throw err;
      }
      // Follow-up: set riderName to the accepting rider's name.
      const riderAssigned = await db.order.update({
        where: { id: orderId },
        data: { riderName: user.name },
      });
      updated = { ...updated, riderName: riderAssigned.riderName };

      return NextResponse.json({
        success: true,
        message: `Order ${orderId} accepted. Head to pickup location.`,
        order: { ...updated, items: parseItems(updated.items) },
      });
    }

    if (action === 'decline') {
      return NextResponse.json({
        success: true,
        message: `Order ${orderId} declined.`,
        // `order.items` is already parsed by `ordersService.getOrderById`
        // (returns `OrderItem[]`); no JSON.parse needed.
        order,
      });
    }

    if (action === 'complete') {
      if (order.riderName !== user.name) {
        return NextResponse.json(
          {
            success: false,
            message: 'This order is not assigned to you.',
          },
          { status: 403 }
        );
      }

      // MIGRATED (Phase 10): inline `db.order.update` for status + progress
      // delegated to `ordersService.updateOrderStatus`. No riderName change
      // here (the rider was assigned at accept-time), so no follow-up
      // needed. We pass `userId = null` to skip the service's ownership
      // check (the riderName-match check above is the correct authorisation
      // for this endpoint).
      let updated;
      try {
        updated = await ordersService.updateOrderStatus(orderId, 'Delivered', null, 100);
      } catch (err) {
        if (err instanceof Error && err.message === 'ORDER_NOT_FOUND') {
          return NextResponse.json(
            { success: false, message: 'Order not found' },
            { status: 404 },
          );
        }
        throw err;
      }

      const earnings = Math.round(updated.total * 0.15);

      return NextResponse.json({
        success: true,
        message: `Order ${orderId} delivered. You earned ${formatNaira(earnings)}.`,
        order: { ...updated, items: parseItems(updated.items) },
        earnings,
      });
    }

    return NextResponse.json(
      { success: false, message: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Rider assign POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/rider/assign' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to process rider action' },
      { status: 500 }
    );
  }
}
