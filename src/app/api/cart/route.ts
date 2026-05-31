import { NextRequest, NextResponse } from 'next/server';

// In-memory cart storage (per session would use DB in production)
let cartItems: Array<{
  id: number;
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}> = [];

export async function GET() {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = total >= 5000 ? 0 : 500;
  return NextResponse.json({
    items: cartItems,
    subtotal: total,
    deliveryFee,
    total: total + deliveryFee,
    count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, price, image, quantity = 1 } = body;

    if (!id || !name || !price) {
      return NextResponse.json(
        { error: 'id, name, and price are required' },
        { status: 400 }
      );
    }

    const existing = cartItems.find(item => item.id === id);
    if (existing) {
      existing.quantity += quantity || 1;
    } else {
      cartItems.push({
        id,
        productId: id,
        name,
        price,
        image: image || '',
        quantity: quantity || 1,
      });
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = total >= 5000 ? 0 : 500;
    return NextResponse.json({
      items: cartItems,
      subtotal: total,
      deliveryFee,
      total: total + deliveryFee,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      cartItems = cartItems.filter(item => item.id !== parseInt(id));
    } else {
      cartItems = [];
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = total >= 5000 ? 0 : 500;
    return NextResponse.json({
      items: cartItems,
      subtotal: total,
      deliveryFee,
      total: total + deliveryFee,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
