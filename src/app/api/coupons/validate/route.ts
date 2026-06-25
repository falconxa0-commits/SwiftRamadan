import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// POST /api/coupons/validate { code, cartTotal }
// Validates a coupon code against the cart total and returns the discount amount
// and new total. Increments `uses` on successful validation.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Coupon code is required' },
        { status: 400 },
      );
    }

    const total = Number(cartTotal) || 0;
    if (total < 0) {
      return NextResponse.json(
        { valid: false, message: 'Invalid cart total' },
        { status: 400 },
      );
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json(
        { valid: false, message: 'Invalid or inactive coupon code' },
        { status: 200 },
      );
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'This coupon has expired' },
        { status: 200 },
      );
    }

    if (coupon.uses >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, message: 'This coupon has reached its usage limit' },
        { status: 200 },
      );
    }

    if (total < coupon.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          message: `Minimum order of ₦${coupon.minOrder.toLocaleString()} required for this coupon`,
        },
        { status: 200 },
      );
    }

    // Compute discount
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Math.round((total * coupon.value) / 100);
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
    // Never exceed the cart total
    if (discount > total) discount = total;

    const newTotal = total - discount;

    // Increment uses
    await db.coupon.update({
      where: { id: coupon.id },
      data: { uses: { increment: 1 } },
    });

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      newTotal,
      message: `Coupon applied — you saved ₦${discount.toLocaleString()}`,
    });
  } catch (error) {
    console.error('Coupons validate API error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to validate coupon' },
      { status: 500 },
    );
  }
}
