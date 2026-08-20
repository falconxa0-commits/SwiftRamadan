import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

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
// FIXED: Now requires authentication
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  // REQUIRE AUTHENTICATION - prevent unauthorized ratings
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const orderId = String(body.orderId || id);
    
    // Use authenticated user's ID, fallback to body userId for legacy compatibility
    // but ensure the rater is the authenticated user
    const userIdRaw = auth.userId;
    const authorName = String(body.authorName || auth.email?.split('@')[0] || 'User');
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

    // Verify the order belongs to the authenticated user (or user is admin)
    if (auth.role !== 'admin' && order.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'You can only rate your own orders' },
        { status: 403 }
      );
    }

    // Check if user already rated this order (prevent duplicate ratings)
    const existingReview = await db.review.findFirst({
      where: { orderId, userId: auth.userId },
    });
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already rated this order', review: existingReview },
        { status: 409 }
      );
    }

    // Use transaction to prevent race condition on duplicate rating check
    const review = await db.$transaction(async (tx) => {
      // Double-check within transaction
      const existing = await tx.review.findFirst({
        where: { orderId, userId: auth.userId },
      });
      if (existing) {
        throw new Error('DUPLICATE_REVIEW');
      }

      return tx.review.create({
        data: {
          orderId,
          userId: auth.userId,
          authorName,
          authorAvatar,
          rating,
          comment,
          targetType,
          targetId,
        },
      });
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'DUPLICATE_REVIEW') {
      return NextResponse.json(
        { error: 'You have already rated this order' },
        { status: 409 }
      );
    }
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
