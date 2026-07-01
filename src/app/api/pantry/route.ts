import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

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
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

// POST /api/pantry  body: { email, name, category, quantity, unit, expiresAt? }
// Creates a PantryItem. Always 200. On failure returns { item: null, error }.
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const email = body?.email || 'guest';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json(
        { item: null, error: 'Name is required' },
        { status: 200 },
      );
    }

    const rawQty = body?.quantity;
    const quantity =
      typeof rawQty === 'number'
        ? String(rawQty)
        : typeof rawQty === 'string'
          ? rawQty
          : '1';

    let expiresAt: Date | null = null;
    if (body?.expiresAt) {
      const d = new Date(body.expiresAt);
      if (!isNaN(d.getTime())) expiresAt = d;
    }

    const item = await db.pantryItem.create({
      data: {
        ownerEmail: email,
        name,
        category: typeof body?.category === 'string' ? body.category : 'other',
        quantity,
        unit: typeof body?.unit === 'string' ? body.unit : 'pcs',
        expiresAt,
      },
    });

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create pantry item';
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/pantry' },
    });
    return NextResponse.json({ item: null, error: msg }, { status: 200 });
  }
}

// DELETE /api/pantry?email=foo@bar.com&id=xyz
// Deletes the item only if it belongs to that owner. Always returns { ok: true }.
export async function DELETE(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const email = request.nextUrl.searchParams.get('email') || 'guest';
  const id = request.nextUrl.searchParams.get('id') || '';
  try {
    if (id) {
      await db.pantryItem.deleteMany({ where: { id, ownerEmail: email } });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/pantry' },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
