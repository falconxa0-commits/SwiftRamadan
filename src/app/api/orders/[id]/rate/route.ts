import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

// Resolve an identifier (id OR email) to a User.id. Returns null if not found.
async function resolveUserId(identifier: string | null | undefined): Promise<string | null> {
  if (!identifier) return null;
  // Try by id first
  const byId = await db.user.findUnique({ where: { id: identifier }, select: { id: true } });
  if (byId) return byId.id;
  // Then by email
  const byEmail = await db.user.findUnique({ where: { email: identifier }, select: { id: true } });
  return byEmail ? byEmail.id : null;
}

// ─────────────────────────────────────────────────────────────
// POST /api/orders/[id]/rate — create a Review linked to an order
// Body: { orderId?, userId?, authorName, authorAvatar?, rating, comment?, targetType, targetId? }
//   userId may be a User.id or email.
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const orderId = String(body.orderId || id);
    const userIdRaw = body.userId ? String(body.userId) : null;
    const authorName = String(body.authorName || 'Guest');
    const authorAvatar = String(body.authorAvatar || '');
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 5));
    const comment = String(body.comment || '');
    const targetType = String(body.targetType || 'rider');
    const targetId = body.targetId ? String(body.targetId) : null;

    // Verify order exists
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Resolve userId (email or id) to a real User.id (if provided)
    const userId = userIdRaw ? await resolveUserId(userIdRaw) : null;

    const review = await db.review.create({
      data: {
        orderId,
        userId,
        authorName,
        authorAvatar,
        rating,
        comment,
        targetType,
        targetId,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error('[orders/rate] POST error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/orders/[id]/rate' },
    });
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders/[id]/rate?orderId=xxx — list reviews for an order
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId') || id;

    const reviews = await db.review.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('[orders/rate] GET error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/orders/[id]/rate' },
    });
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}
