import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import * as usersService from '@/services/users/users.service';

/** Resolve email-or-id to real User.id; returns null if not found.
 *
 * MIGRATED (Phase 10): the `by id` lookup path is delegated to
 * `usersService.getUserById` (returns `PublicUser | null`). The `by email`
 * fallback stays inline because the service only supports userId-keyed
 * lookups. */
async function resolveUserId(raw: string | null | undefined): Promise<string | null> {
  if (!raw || raw === 'guest') return null;
  const byId = await usersService.getUserById(raw);
  if (byId) return String(byId.id);
  const byEmail = await db.user.findUnique({ where: { email: raw }, select: { id: true } });
  return byEmail?.id ?? null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id]/reviews → reviews for a product (newest first)
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;

    const reviews = await db.review.findMany({
      where: {
        OR: [
          { productId: id },
          { targetId: id, targetType: 'product' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Parse images JSON string for each review
    const parsed = reviews.map(r => ({
      ...r,
      images: safeParseImages(r.images),
    }));

    return NextResponse.json({ reviews: parsed });
  } catch (error) {
    console.error('Product reviews GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/products/[id]/reviews' },
    });
    return NextResponse.json(
      { reviews: [], message: 'Failed to fetch reviews' },
      { status: 500 },
    );
  }
}

// POST /api/products/[id]/reviews { productId, userId?, authorName, authorAvatar, rating, comment, images? }
export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { id: routeId } = await context.params;
    const body = await request.json();
    const {
      productId: bodyProductId,
      userId: rawUserId,
      authorName,
      authorAvatar,
      rating,
      comment,
      images,
    } = body;

    // Prefer body productId, fall back to route param
    const productIdRaw = bodyProductId !== undefined ? String(bodyProductId) : routeId;

    if (!authorName || typeof authorName !== 'string') {
      return NextResponse.json(
        { success: false, message: 'authorName is required' },
        { status: 400 },
      );
    }

    const ratingNum = Math.max(1, Math.min(5, Number(rating) || 5));

    // Resolve user (optional)
    const userId = await resolveUserId(rawUserId);

    // Try to find the product by cuid (FK); if not found, leave productId null and
    // store the numeric id in targetId so GET can still filter by it.
    let productIdFK: string | null = null;
    if (productIdRaw) {
      const product = await db.product.findUnique({ where: { id: productIdRaw } });
      if (product) productIdFK = product.id;
    }

    const review = await db.review.create({
      data: {
        productId: productIdFK,
        userId,
        authorName,
        authorAvatar: typeof authorAvatar === 'string' ? authorAvatar : '',
        rating: ratingNum,
        comment: typeof comment === 'string' ? comment : '',
        images: JSON.stringify(Array.isArray(images) ? images : []),
        targetType: 'product',
        targetId: productIdRaw || null,
      },
    });

    // Update Product.rating and Product.reviewCount if we have a FK link
    if (productIdFK) {
      const allReviews = await db.review.findMany({
        where: { productId: productIdFK },
        select: { rating: true },
      });
      const count = allReviews.length;
      const avg = count > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;
      await db.product.update({
        where: { id: productIdFK },
        data: {
          rating: Math.round(avg * 10) / 10,
          reviewCount: count,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        review: { ...review, images: safeParseImages(review.images) },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Product reviews POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/products/[id]/reviews' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to create review' },
      { status: 500 },
    );
  }
}

function safeParseImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    // ignore
  }
  return [];
}
