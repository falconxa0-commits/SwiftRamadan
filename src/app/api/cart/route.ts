import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/cart?sessionId=...&userId=... — Get cart items
export async function GET(request: NextRequest) {
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
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart — Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, price, image, quantity = 1, sessionId = 'default', userId } = body;

    if (!id || !name || !price) {
      return NextResponse.json(
        { error: 'id, name, and price are required' },
        { status: 400 }
      );
    }

    // Check for existing item by productId + session/user
    const existing = await db.cartItem.findFirst({
      where: {
        productId: id,
        ...(userId ? { userId } : { sessionId }),
      },
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (quantity || 1) },
      });
    } else {
      await db.cartItem.create({
        data: {
          productId: id,
          name,
          price,
          image: image || '',
          quantity: quantity || 1,
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
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart?id=...&sessionId=...&userId=... — Remove item or clear cart
export async function DELETE(request: NextRequest) {
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
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
