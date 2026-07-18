import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// GET /api/wishlist → returns the authenticated user's wishlist items (newest first)
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.userId;

    const items = await db.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wishlist API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/wishlist' },
    });
    return NextResponse.json(
      { items: [], message: 'Failed to fetch wishlist' },
      { status: 500 },
    );
  }
}

// POST /api/wishlist { productId, name, price, image }
// Toggle behavior: if the item already exists, remove it; otherwise create it.
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { productId, name, price, image } = body;
    const userId = auth.userId;

    if (!productId || !name) {
      return NextResponse.json(
        { success: false, message: 'productId and name are required' },
        { status: 400 },
      );
    }

    // Check existing (toggle semantics)
    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: String(productId) } },
    });

    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({
        success: true,
        action: 'removed',
        item: existing,
      });
    }

    const item = await db.wishlistItem.create({
      data: {
        userId,
        productId: String(productId),
        name: String(name),
        price: Number(price) || 0,
        image: typeof image === 'string' ? image : '',
      },
    });

    return NextResponse.json({ success: true, action: 'added', item }, { status: 201 });
  } catch (error) {
    console.error('Wishlist API POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/wishlist' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to update wishlist' },
      { status: 500 },
    );
  }
}

// DELETE /api/wishlist?productId=xxx → removes item for authenticated user
export async function DELETE(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = auth.userId;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'productId is required' },
        { status: 400 },
      );
    }

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: String(productId) } },
    });

    if (!existing) {
      return NextResponse.json({ success: true, action: 'noop' });
    }

    await db.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, action: 'removed' });
  } catch (error) {
    console.error('Wishlist API DELETE error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/wishlist' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to remove wishlist item' },
      { status: 500 },
    );
  }
}
