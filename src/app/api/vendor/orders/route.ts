import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as ordersService from '@/services/orders/orders.service';

/* ──────────── helpers ──────────── */

async function resolveVendorId(vendorId?: string | null, vendorEmail?: string | null) {
  if (vendorId) return vendorId;
  if (vendorEmail) {
    const user = await db.user.findUnique({ where: { email: vendorEmail } });
    return user?.id ?? null;
  }
  return null;
}

function parseItems(raw: string | null | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMin = (now.getTime() - d.getTime()) / 1000 / 60;
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${Math.floor(diffMin)}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  if (diffMin < 1440 * 7) return `${Math.floor(diffMin / 1440)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ──────────── GET: orders containing vendor's products ──────────── */

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'vendor') {
    return NextResponse.json(
      { success: false, error: 'Vendor access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('vendorEmail') || searchParams.get('email');

    const resolvedId = await resolveVendorId(vendorId, vendorEmail);
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found', orders: [] },
        { status: 404 }
      );
    }

    // Verify the authenticated vendor matches the resolved vendor
    if (resolvedId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only view your own orders' },
        { status: 403 }
      );
    }

    const products = await db.product.findMany({
      where: { vendorId: resolvedId },
      select: { name: true, image: true },
    });
    const productNames = products.map((p) => p.name.toLowerCase());
    const imageByName = new Map<string, string>();
    products.forEach((p) => imageByName.set(p.name.toLowerCase(), p.image || '/images/meals/meal-jollof.png'));

    const allOrders = await db.order.findMany({ orderBy: { createdAt: 'desc' } });
    const vendorOrders = allOrders.filter((o) => {
      const items = parseItems(o.items);
      return items.some((i: { name?: string }) => i.name && productNames.includes(i.name.toLowerCase()));
    });

    const orders = vendorOrders.map((o) => {
      const items = parseItems(o.items);
      const matchImage =
        items
          .map((i: { name?: string }) => i.name && imageByName.get(i.name.toLowerCase()))
          .find(Boolean) || '/images/meals/meal-jollof.png';
      return {
        id: o.id,
        shortId: o.id.slice(-6).toUpperCase(),
        status: o.status,
        total: o.total,
        items,
        progress: o.progress,
        riderName: o.riderName,
        createdAt: o.createdAt,
        createdAtLabel: formatDate(o.createdAt),
        image: matchImage,
      };
    });

    return NextResponse.json({ success: true, orders, vendorId: resolvedId });
  } catch (error) {
    console.error('[api/vendor/orders] GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/vendor/orders' },
    });
    return NextResponse.json(
      { success: false, error: 'Server error', orders: [] },
      { status: 500 }
    );
  }
}

/* ──────────── PUT: accept | reject | ready ──────────── */

export async function PUT(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'vendor') {
    return NextResponse.json(
      { success: false, error: 'Vendor access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { orderId, action } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }
    if (!['accept', 'reject', 'ready'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be accept, reject, or ready' },
        { status: 400 }
      );
    }

    const existing = await db.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the order belongs to the authenticated vendor
    const vendorProducts = await db.product.findMany({
      where: { vendorId: auth.userId },
      select: { name: true },
    });
    const vendorProductNames = vendorProducts.map((p) => p.name.toLowerCase());
    const orderItems = parseItems(existing.items);
    const orderBelongsToVendor = orderItems.some(
      (i: { name?: string }) => i.name && vendorProductNames.includes(i.name.toLowerCase())
    );
    if (!orderBelongsToVendor) {
      return NextResponse.json(
        { success: false, error: 'You can only modify orders containing your products' },
        { status: 403 }
      );
    }

    let status: string;
    let progress: number;
    let message: string;

    if (action === 'accept') {
      status = 'Confirmed';
      progress = 15;
      message = 'Order accepted. Start preparing!';
    } else if (action === 'reject') {
      status = 'Cancelled';
      progress = 0;
      message = 'Order rejected.';
    } else {
      status = 'Ready';
      progress = 55;
      message = 'Order marked as ready for pickup.';
    }

    // MIGRATED (Phase 10): the `db.order.update` for status + progress is
    // delegated to `ordersService.updateOrderStatus`. We pass `userId = null`
    // to skip the service's own ownership check (it would check
    // `order.userId === callerUserId`, which is the customer, not the
    // vendor — irrelevant here). The vendor-specific ownership check
    // (order must contain the vendor's products) was performed inline
    // above and is the correct authorisation for this endpoint.
    let updated;
    try {
      updated = await ordersService.updateOrderStatus(orderId, status, null, progress);
    } catch (err) {
      if (err instanceof Error && err.message === 'ORDER_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        orderId: updated.id,
        status: updated.status,
        progress: updated.progress,
      },
    });
  } catch (error) {
    console.error('[api/vendor/orders] PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/vendor/orders' },
    });
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
