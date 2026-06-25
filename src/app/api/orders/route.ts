import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, orderCreateSchema, orderUpdateSchema } from '@/lib/validation';

// Returns true if the user exists (or userId is null/undefined). Returns false
// if a userId was provided but no matching User record was found — which would
// otherwise cause a Prisma foreign-key violation on `db.order.create()`.
async function assertUserExists(userId: string | undefined): Promise<boolean> {
  if (!userId) return true;
  const u = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  return !!u;
}

// GET /api/orders — Get all orders, optionally filter by userId
export async function GET(request: NextRequest) {
  // Rate limit: 100 requests per minute per IP
  const rateLimited = checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders — Create a new order
export async function POST(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    // Validate payload
    const v = validateInput(orderCreateSchema, body);
    if (!v.success) return v.response;
    const { status, total, riderName, items, progress, userId } = v.data;

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
    return NextResponse.json(
      { success: false, message: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders — Update an order (e.g., status, progress)
export async function PUT(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    // Validate payload
    const v = validateInput(orderUpdateSchema, body);
    if (!v.success) return v.response;
    const { id, status, progress, riderName } = v.data;

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
    return NextResponse.json(
      { success: false, message: 'Failed to update order' },
      { status: 500 }
    );
  }
}
