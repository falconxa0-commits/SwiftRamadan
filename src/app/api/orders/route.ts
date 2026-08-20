import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, orderCreateSchema, orderUpdateSchema } from '@/lib/validation';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import { assertUserExists } from '@/lib/db-helpers';

// Extended order schema that accepts optional coupon code
const orderWithCouponSchema = orderCreateSchema.extend({
  couponCode: z.string().optional(),
});

// Import z for schema extension
import { z } from 'zod';

/**
 * Result of atomic coupon redemption
 */
interface CouponRedeemResult {
  success: boolean;
  discount?: number;
  error?: string;
}

/**
 * Atomically redeem a coupon for a user.
 * This function uses a transaction to ensure:
 * 1. The coupon exists and is active
 * 2. The coupon hasn't expired
 * 3. The coupon hasn't reached max uses
 * 4. The user hasn't already used this coupon (unique constraint)
 * 5. The uses count is incremented atomically
 * 6. A redemption record is created
 */
async function redeemCouponAtomic(
  code: string,
  userId: string,
  orderTotal?: number
): Promise<CouponRedeemResult> {
  const normalizedCode = code.trim().toUpperCase();

  return db.$transaction(async (tx) => {
    // 1. Find and lock the coupon row (SQLite uses serializable transactions)
    const coupon = await tx.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return { success: false, error: 'Invalid coupon code' };
    }

    if (!coupon.active) {
      return { success: false, error: 'This coupon is no longer active' };
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return { success: false, error: 'This coupon has expired' };
    }

    if (coupon.uses >= coupon.maxUses) {
      return { success: false, error: 'This coupon has reached its usage limit' };
    }

    // 2. Check if user already redeemed this coupon (double-redemption prevention)
    const existingRedemption = await tx.couponRedemption.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId,
        },
      },
    });

    if (existingRedemption) {
      return { success: false, error: 'You have already used this coupon' };
    }

    // 3. Calculate discount
    let discount = 0;
    if (orderTotal && orderTotal > 0) {
      if (coupon.type === 'percent') {
        discount = Math.round((orderTotal * coupon.value) / 100);
      } else {
        discount = coupon.value;
      }
      // Never exceed the order total
      if (discount > orderTotal) discount = orderTotal;
    }

    // 4. Atomically increment uses count and create redemption record
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { uses: { increment: 1 } },
    });

    await tx.couponRedemption.create({
      data: {
        couponId: coupon.id,
        userId,
        discount,
      },
    });

    return { success: true, discount };
  });
}

// GET /api/orders — Get orders for the authenticated user (or all for admin)
export async function GET(request: NextRequest) {
  // Rate limit: 100 requests per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);

    // Use authenticated user's userId; admin can specify a different userId via query param
    let userId: string | null = auth.userId;

    if (auth.role === 'admin') {
      // Admin can optionally filter by a specific userId or email
      const adminUserId = searchParams.get('userId');
      const adminEmail = searchParams.get('email');
      if (adminUserId) {
        userId = adminUserId;
      } else if (adminEmail) {
        const user = await db.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
        userId = user?.id || null;
      } else {
        // Admin with no filter sees all orders
        userId = null;
      }
    }

    const orders = await db.order.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // Parse items JSON string for each order
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
    }));

    return NextResponse.json({ orders: parsedOrders });
  } catch (error) {
    console.error('Orders API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/orders' } });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders — Create a new order
export async function POST(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    // Validate payload (with optional coupon)
    const v = validateInput(orderWithCouponSchema, body);
    if (!v.success) return v.response;
    const { status, total, riderName, items, progress, couponCode } = v.data;
    // Always use authenticated user's userId
    const userId = auth.userId;

    if (!total) {
      return NextResponse.json(
        { success: false, message: 'Order total is required' },
        { status: 400 }
      );
    }

    // FK guard: verify the referenced user exists before creating the order,
    // otherwise Prisma throws a foreign-key violation → 500.
    if (userId && !(await assertUserExists(userId))) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 400 }
      );
    }

    // If a coupon code is provided, process it atomically within a transaction
    let discountApplied = 0;
    if (couponCode) {
      try {
        const result = await redeemCouponAtomic(couponCode, userId);
        if (!result.success) {
          return NextResponse.json(
            { success: false, message: result.error },
            { status: 400 }
          );
        }
        discountApplied = result.discount!;
      } catch (couponError) {
        console.error('Coupon redemption error:', couponError);
        // Continue without coupon if something goes wrong - don't block order creation
        // The atomic nature of redeemCouponAtomic ensures data integrity
      }
    }

    const finalTotal = total - discountApplied;

    const order = await db.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          status: status || 'Preparing',
          total: finalTotal,
          riderName: riderName || null,
          items: JSON.stringify(items || []),
          progress: progress || 0,
          userId: userId || null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: JSON.parse(order.items),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Orders API POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/orders' } });
    return NextResponse.json(
      { success: false, message: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders — Update an order (e.g., status, progress)
export async function PUT(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    // Validate payload
    const v = validateInput(orderUpdateSchema, body);
    if (!v.success) return v.response;
    const { id, status, progress, riderName } = v.data;

    // Verify the order belongs to the authenticated user (or user is admin)
    if (id) {
      const existingOrder = await db.order.findUnique({ where: { id } });
      if (!existingOrder) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 },
        );
      }
      if (auth.role !== 'admin' && existingOrder.userId !== auth.userId) {
        return NextResponse.json(
          { success: false, message: 'You do not have permission to update this order' },
          { status: 403 },
        );
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order id is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (riderName !== undefined) updateData.riderName = riderName;

    const order = await db.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: JSON.parse(order.items),
      },
    });
  } catch (error) {
    console.error('Orders API PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/orders' } });
    return NextResponse.json(
      { success: false, message: 'Failed to update order' },
      { status: 500 }
    );
  }
}
