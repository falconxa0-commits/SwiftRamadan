import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, orderCreateSchema, orderUpdateSchema } from '@/lib/validation';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

// Returns true if the user exists (or userId is null/undefined). Returns false
// if a userId was provided but no matching User record was found — which would
// otherwise cause a Prisma foreign-key violation on `db.order.create()`.
async function assertUserExists(userId: string | undefined): Promise<boolean> {
  if (!userId) return true;
  const u = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  return !!u;
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

    // Validate payload
    const v = validateInput(orderCreateSchema, body);
    if (!v.success) return v.response;
    const { status, total, riderName, items, progress } = v.data;
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

    const order = await db.order.create({
      data: {
        status: status || 'Preparing',
        total,
        riderName: riderName || null,
        items: JSON.stringify(items || []),
        progress: progress || 0,
        userId: userId || null,
      },
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
