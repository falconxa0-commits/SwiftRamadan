import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, cartItemSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as usersService from '@/services/users/users.service';

// Returns true if the user exists (or userId is null/undefined). Returns false
// if a userId was provided but no matching User record was found — which would
// otherwise cause a Prisma foreign-key violation on `db.cartItem.create()`.
//
// MIGRATED (Phase 10): inline `db.user.findUnique({ where: { id: userId }, select: { id: true } })`
// replaced with `usersService.getUserById(userId)`; same null-check semantics.
async function assertUserExists(userId: string | undefined): Promise<boolean> {
  if (!userId) return true;
  const u = await usersService.getUserById(userId);
  return !!u;
}

// GET /api/cart?sessionId=... — Get cart items (uses auth.userId, not query param userId)
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';
    // Always use authenticated user's userId
    const userId = auth.userId;

    const cartItems = await db.cartItem.findMany({
      where: { userId },
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

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

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
    const { productId, name, price, image, quantity, sessionId: bodySessionId } = v.data;
    // Always use authenticated user's userId
    const userId = auth.userId;
    const sessionId = bodySessionId;

    // FK guard: verify the referenced user exists before writing the cart item,
    // otherwise Prisma throws a foreign-key violation → 500.
    if (userId && !(await assertUserExists(userId))) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 400 }
      );
    }

    // Coerce productId to string for DB storage
    const productIdStr = String(productId);

    // Check for existing item by productId + user
    const existing = await db.cartItem.findFirst({
      where: {
        productId: productIdStr,
        userId,
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
          productId: productIdStr,
          name,
          price,
          image: image || '',
          quantity,
          sessionId,
          userId,
        },
      });
    }

    const cartItems = await db.cartItem.findMany({
      where: { userId },
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

// DELETE /api/cart?id=...&sessionId=... — Remove item or clear cart (uses auth.userId)
export async function DELETE(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sessionId = searchParams.get('sessionId') || 'default';
    // Always use authenticated user's userId
    const userId = auth.userId;

    if (id) {
      // Delete specific item by its database id
      await db.cartItem.delete({ where: { id } });
    } else {
      // Clear all items for this user
      await db.cartItem.deleteMany({
        where: { userId },
      });
    }

    const cartItems = await db.cartItem.findMany({
      where: { userId },
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
