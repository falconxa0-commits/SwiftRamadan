import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, cartItemSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

// Returns true if the user exists (or userId is null/undefined). Returns false
// if a userId was provided but no matching User record was found — which would
// otherwise cause a Prisma foreign-key violation on `db.cartItem.create()`.
async function assertUserExists(userId: string | undefined): Promise<boolean> {
  if (!userId) return true;
  const u = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  return !!u;
}

// GET /api/cart?sessionId=...&userId=... — Get cart items
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';
    const userId = searchParams.get('userId') || undefined;

    const cartItems = await db.cartItem.findMany({
      where: userId ? { userId } : { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = total >= 5000 ? 0 : 500;

    return NextResponse.json({
      items: cartItems,
      subtotal: total,
      deliveryFee,
      total: total + deliveryFee,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Cart API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/cart' },
    });
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart — Add item to cart
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    // Backward-compat: legacy callers sent `id` instead of `productId`. Map it
    // through so both shapes are accepted before Zod validation runs.
    if (
      body &&
      typeof body === 'object' &&
      !('productId' in body) &&
      'id' in body
    ) {
      body.productId = body.id;
    }

    // Validate payload — Zod rejects negative prices, non-integer quantities,
    // missing name, etc., with a structured 400 response.
    const v = validateInput(cartItemSchema, body);
    if (!v.success) return v.response;
    const { productId, name, price, image, quantity, sessionId, userId } = v.data;

    // FK guard: verify the referenced user exists before writing the cart item,
    // otherwise Prisma throws a foreign-key violation → 500.
    if (userId && !(await assertUserExists(userId))) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 400 }
      );
    }

    // Check for existing item by productId + session/user
    const existing = await db.cartItem.findFirst({
      where: {
        productId: typeof productId === 'number' ? productId : Number(productId),
        ...(userId ? { userId } : { sessionId }),
      },
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await db.cartItem.create({
        data: {
          productId: typeof productId === 'number' ? productId : Number(productId),
          name,
          price,
          image: image || '',
          quantity,
          sessionId,
          userId: userId || null,
        },
      });
    }

    const cartItems = await db.cartItem.findMany({
      where: userId ? { userId } : { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = total >= 5000 ? 0 : 500;

    return NextResponse.json({
      items: cartItems,
      subtotal: total,
      deliveryFee,
      total: total + deliveryFee,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Cart API POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/cart' },
    });
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart?id=...&sessionId=...&userId=... — Remove item or clear cart
export async function DELETE(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sessionId = searchParams.get('sessionId') || 'default';
    const userId = searchParams.get('userId') || undefined;

    if (id) {
      // Delete specific item by its database id
      await db.cartItem.delete({ where: { id } });
    } else {
      // Clear all items for this session/user
      await db.cartItem.deleteMany({
        where: userId ? { userId } : { sessionId },
      });
    }

    const cartItems = await db.cartItem.findMany({
      where: userId ? { userId } : { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = total >= 5000 ? 0 : 500;

    return NextResponse.json({
      items: cartItems,
      subtotal: total,
      deliveryFee,
      total: total + deliveryFee,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Cart API DELETE error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/cart' },
    });
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
