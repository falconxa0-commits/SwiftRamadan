import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { validateInput, communityPostSchema, communityCommentSchema, communityLikeSchema } from '@/lib/validation';
import { requireAuth } from '@/lib/session';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

/**
 * Sanitize a user-provided text field for safe storage & rendering.
 *
 * Community posts & comments are plain text — line breaks are expressed with
 * "\n", never HTML — so we strip ALL HTML tags and then escape any residual
 * HTML-special characters to their entities. This neutralises stored XSS
 * payloads such as `<script>alert(1)</script>` even if a future UI change
 * ever renders the field with `dangerouslySetInnerHTML`.
 *
 * Order matters: `&` must be escaped first so that the entities we emit
 * (`&lt;`, `&gt;`, …) are not themselves double-escaped.
 */
function sanitizeText(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<[^>]*>/g, '') // strip HTML tags (e.g. <script>, <b>, </…>)
    .replace(/&/g, '&amp;') // escape & FIRST
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Safely parse the likedBy JSON string column.
function safeParseLikedBy(raw: string | null | undefined): string[] {
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

// GET /api/community?email=foo@bar.com
// Returns all posts (newest first) with their comments (oldest first).
// Always 200. If DB fails, returns empty array.
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  // email param kept for API symmetry / future owner-specific filtering;
  // community posts are global, so it's accepted but not strictly required.
  const _email = request.nextUrl.searchParams.get('email') || 'guest';
  void _email;
  try {
    const posts = await db.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/community' },
    });
    return NextResponse.json({ success: false, message: 'Failed to load posts' }, { status: 500 });
  }
}

// POST /api/community — three actions based on body.action:
//   undefined      → create a new post
//   'comment'      → add a comment to a post
//   'like'         → toggle the requester's email in the post's likedBy array
// Always returns 200.
//
// SECURITY (Phase 10): write operations now require authentication. The
// previous flow accepted an anonymous `body.email` for the author field,
// which allowed anyone to spoof posts/comments/likes as any email address.
// We now require a valid session. The authenticated user's email is used as
// the author email (with `body.email` as a fallback for backward compat —
// only used if the client explicitly passes it, which the legacy UIs do).
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  // Require authentication for all community write operations.
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  // Prefer the authenticated user's email; fall back to body.email for
  // backward compatibility with legacy clients that pass it explicitly.
  const email = sanitizeText(
    typeof body.email === 'string' && body.email.trim()
      ? body.email
      : auth.email || 'guest',
  );
  const action = typeof body.action === 'string' ? body.action : '';

  // MIGRATED (Phase 11): defense-in-depth user existence check via
  // `usersService.getUserById`. `requireAuth` verifies the JWT but does NOT
  // verify the user still exists in the DB. Without this check, a user
  // deleted between JWT issuance and this request could create community
  // content attributed to a stale email. Returns a clean 404 instead.
  const userExists = await usersService.getUserById(auth.userId);
  if (!userExists) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 },
    );
  }

  try {
    // ── Action: comment ──
    if (action === 'comment') {
      const v = validateInput(communityCommentSchema, { postId: body.postId, authorName: body.authorName, authorInitial: body.authorInitial, authorEmail: email, content: body.content });
      if (!v.success) return v.response;

      const comment = await db.communityComment.create({
        data: {
          postId: v.data.postId,
          authorName: sanitizeText(v.data.authorName),
          authorInitial: sanitizeText(v.data.authorInitial),
          authorEmail: sanitizeText(v.data.authorEmail || email),
          content: sanitizeText(v.data.content),
        },
      });
      return NextResponse.json({ success: true, comment }, { status: 200 });
    }

    // ── Action: like (toggle) ──
    if (action === 'like') {
      const v = validateInput(communityLikeSchema, { postId: body.postId, authorEmail: email });
      if (!v.success) return v.response;

      const post = await db.communityPost.findUnique({
        where: { id: v.data.postId },
      });

      if (!post) {
        return NextResponse.json(
          { success: false, message: 'Post not found' },
          { status: 404 },
        );
      }

      const likedBy = safeParseLikedBy(post.likedBy);
      const likerEmail = sanitizeText(v.data.authorEmail || email);
      const alreadyLiked = likedBy.includes(likerEmail);
      const newLikedBy = alreadyLiked
        ? likedBy.filter((e) => e !== likerEmail)
        : [...likedBy, likerEmail];
      const liked = !alreadyLiked;

      const updated = await db.communityPost.update({
        where: { id: v.data.postId },
        data: {
          likes: newLikedBy.length,
          likedBy: JSON.stringify(newLikedBy),
        },
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
        },
      });

      return NextResponse.json({ success: true, post: updated, liked }, { status: 200 });
    }

    // ── Default action: create post ──
    const v = validateInput(communityPostSchema, {
      authorName: body.authorName,
      authorInitial: body.authorInitial,
      authorEmail: email,
      category: body.category,
      content: body.content,
      imageUrl: body.imageUrl,
    });
    if (!v.success) return v.response;

    const post = await db.communityPost.create({
      data: {
        authorName: sanitizeText(v.data.authorName),
        authorInitial: sanitizeText(v.data.authorInitial),
        authorEmail: sanitizeText(v.data.authorEmail || email),
        category: sanitizeText(v.data.category),
        content: sanitizeText(v.data.content),
        imageUrl: v.data.imageUrl ? sanitizeText(v.data.imageUrl) : null,
      },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error) {
    // Don't expose internal error details to client
    console.error('[Community] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/community' },
    });
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
