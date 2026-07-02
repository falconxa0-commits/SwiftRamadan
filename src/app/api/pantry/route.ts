import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { validateInput, pantryItemSchema } from '@/lib/validation';

export const runtime = 'nodejs';

// GET /api/pantry?email=foo@bar.com
// Returns owner-scoped pantry items sorted by createdAt desc. Always 200.
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const email = request.nextUrl.searchParams.get('email') || 'guest';
  try {
    const items = await db.pantryItem.findMany({
      where: { ownerEmail: email },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/pantry' },
    });
    return NextResponse.json(
        { success: false, message: 'Failed to load pantry items' },
        { status: 500 },
      );
  }
}

// POST /api/pantry  body: { email, name, category, quantity, unit, expiresAt? }
// Creates a PantryItem. Always 200. On failure returns { item: null, error }.
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const rawBody = await request.json();
    const email = rawBody?.email || 'guest';

    const v = validateInput(pantryItemSchema, rawBody);
    if (!v.success) return v.response;

    let expiresAt: Date | null = null;
    if (v.data.expiresAt) {
      const d = new Date(v.data.expiresAt);
      if (!isNaN(d.getTime())) expiresAt = d;
    }

    const item = await db.pantryItem.create({
      data: {
        ownerEmail: email,
        name: v.data.name,
        category: v.data.category,
        quantity: String(v.data.quantity),
        unit: v.data.unit,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create pantry item';
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/pantry' },
    });
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 },
    );
  }
}

// DELETE /api/pantry?email=foo@bar.com&id=xyz
// Deletes the item only if it belongs to that owner.
export async function DELETE(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const email = request.nextUrl.searchParams.get('email') || 'guest';
  const id = request.nextUrl.searchParams.get('id') || '';
  try {
    if (id) {
      await db.pantryItem.deleteMany({ where: { id, ownerEmail: email } });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/pantry' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to delete pantry item' },
      { status: 500 },
    );
  }
}
