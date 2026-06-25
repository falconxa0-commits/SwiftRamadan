import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Resolve a userId param (which may be an email or a real cuid) to an actual User.id.
 * Returns null when no user is found.
 */
async function resolveUserId(raw: string | null): Promise<string | null> {
  if (!raw || raw === 'guest') return null;
  // First, try direct id lookup
  const byId = await db.user.findUnique({ where: { id: raw } });
  if (byId) return byId.id;
  // Then try email lookup
  const byEmail = await db.user.findUnique({ where: { email: raw } });
  return byEmail?.id ?? null;
}

// GET /api/wishlist?userId=xxx → returns the user's wishlist items (newest first)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const userId = await resolveUserId(rawUserId);

    if (!userId) {
      return NextResponse.json({ items: [] });
    }

    const items = await db.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wishlist API GET error:', error);
    return NextResponse.json(
      { items: [], message: 'Failed to fetch wishlist' },
      { status: 500 },
    );
  }
}

// POST /api/wishlist { userId, productId, name, price, image }
// Toggle behavior: if the item already exists, remove it; otherwise create it.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: rawUserId, productId, name, price, image } = body;

    if (!rawUserId || !productId || !name) {
      return NextResponse.json(
        { success: false, message: 'userId, productId and name are required' },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(rawUserId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not found — please log in to save wishlist items' },
        { status: 404 },
      );
    }

    // Check existing (toggle semantics)
    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: Number(productId) } },
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
        productId: Number(productId),
        name: String(name),
        price: Number(price) || 0,
        image: typeof image === 'string' ? image : '',
      },
    });

    return NextResponse.json({ success: true, action: 'added', item }, { status: 201 });
  } catch (error) {
    console.error('Wishlist API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update wishlist' },
      { status: 500 },
    );
  }
}

// DELETE /api/wishlist?userId=xxx&productId=xxx → removes item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!rawUserId || !productId) {
      return NextResponse.json(
        { success: false, message: 'userId and productId are required' },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(rawUserId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: Number(productId) } },
    });

    if (!existing) {
      return NextResponse.json({ success: true, action: 'noop' });
    }

    await db.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, action: 'removed' });
  } catch (error) {
    console.error('Wishlist API DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove wishlist item' },
      { status: 500 },
    );
  }
}
