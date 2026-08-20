import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { validateInput, pantryItemSchema } from '@/lib/validation';
import { requireAuth } from '@/lib/session';

export const runtime = 'nodejs';

// GET /api/pantry
// Returns authenticated user's pantry items sorted by createdAt desc.
// FIXED: Now requires authentication
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  // REQUIRE AUTHENTICATION - pantry data is private
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const email = auth.email;
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

// POST /api/pantry  body: { name, category, quantity, unit, expiresAt? }
// Creates a PantryItem for the authenticated user.
// FIXED: Now requires authentication
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  // REQUIRE AUTHENTICATION - pantry modifications are private
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const rawBody = await request.json();
    
    // Use authenticated user's email
    const email = auth.email;

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
    // Don't expose internal error details to client
    console.error('[Pantry] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/pantry' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to create pantry item. Please try again.' },
      { status: 500 },
    );
  }
}

// DELETE /api/pantry?id=xyz
// Deletes the item only if it belongs to the authenticated user.
// FIXED: Now requires authentication
export async function DELETE(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  // REQUIRE AUTHENTICATION - pantry deletion is private
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const id = request.nextUrl.searchParams.get('id') || '';
  const email = auth.email;
  
  try {
    if (id) {
      // Verify ownership before deleting
      const item = await db.pantryItem.findUnique({ where: { id } });
      if (item && item.ownerEmail !== email) {
        return NextResponse.json(
          { success: false, message: 'You can only delete your own items' },
          { status: 403 }
        );
      }
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
