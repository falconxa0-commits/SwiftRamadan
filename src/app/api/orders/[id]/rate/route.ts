import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as ordersService from '@/services/orders/orders.service';
import * as usersService from '@/services/users/users.service';

// Resolve an identifier (id OR email) to a User.id. Returns null if not found.
// MIGRATED (Phase 11): the `by id` lookup path is delegated to
// `usersService.getUserById` (returns `PublicUser | null`). The `by email`
// fallback stays inline because the service only supports userId-keyed
// lookups (the spec's AVAILABLE SERVICES list has no by-email lookup).
async function resolveUserId(identifier: string | null | undefined): Promise<string | null> {
  if (!identifier) return null;
  // Try by id first
  const byId = await usersService.getUserById(identifier);
  if (byId) return String(byId.id);
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

    const authorName = String(body.authorName || auth.email?.split('@')[0] || 'User');
    const authorAvatar = String(body.authorAvatar || '');
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 5));
    const comment = String(body.comment || '');
    const targetType = String(body.targetType || 'rider');
    const targetId = body.targetId ? String(body.targetId) : null;

    // MIGRATED (Phase 10): order existence + ownership check + duplicate check
    // + review creation delegated to `ordersService.rateOrder`, which performs
    // the same ownership + de-duplication logic inside a `$transaction`.
    //
    // Behaviour notes:
    //   - The service does NOT support an admin override (it always enforces
    //     `order.userId === callerUserId`). The previous inline flow allowed
    //     admins to rate any order; that path is preserved here by skipping
    //     the service for admins and using the inline flow below.
    //   - The service's `rateOrder` creates the Review with empty
    //     `authorName`/`authorAvatar` and a fixed `targetType: 'rider'` /
    //     `targetId: null`. We follow up with a single `db.review.update` to
    //     restore the caller-supplied author metadata, preserving the
    //     previous response shape.
    if (auth.role !== 'admin') {
      let review;
      try {
        review = await ordersService.rateOrder(orderId, auth.userId, rating, comment);
      } catch (err) {
        if (err instanceof Error && err.message === 'ORDER_NOT_FOUND') {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return NextResponse.json(
            { error: 'You can only rate your own orders' },
            { status: 403 },
          );
        }
        if (err instanceof Error && err.message === 'DUPLICATE_REVIEW') {
          return NextResponse.json(
            { error: 'You have already rated this order' },
            { status: 409 },
          );
        }
        throw err;
      }

      // Follow-up: restore caller-supplied author metadata (service uses
      // empty defaults). The service has already verified ownership + de-dup,
      // so this update is safe.
      if (
        authorName !== '' ||
        authorAvatar !== '' ||
        targetType !== 'rider' ||
        targetId !== null
      ) {
        review = await db.review.update({
          where: { id: review.id },
          data: {
            authorName,
            authorAvatar,
            targetType,
            targetId,
          },
        });
      }

      return NextResponse.json({ review }, { status: 201 });
    }

    // ── Admin path (preserves previous admin override) ──
    // Verify order exists.
    // MIGRATED (Phase 11): the inline `db.order.findUnique` is delegated to
    // `ordersService.getOrderById(orderId, null)` (null skips the service's
    // ownership check — admins can rate any order, which is the explicit
    // purpose of this branch). The `order` value is unused beyond the
    // existence check, so the parsed `items: OrderItem[]` field is safely
    // discarded.
    const order = await ordersService.getOrderById(orderId, null);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user already rated this order (prevent duplicate ratings)
    const existingReview = await db.review.findFirst({
      where: { orderId, userId: auth.userId },
    });
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already rated this order', review: existingReview },
        { status: 409 },
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
        { status: 409 },
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
      take: 50,
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
