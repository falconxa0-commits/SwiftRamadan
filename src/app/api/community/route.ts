import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
  // email param kept for API symmetry / future owner-specific filtering;
  // community posts are global, so it's accepted but not strictly required.
  const _email = request.nextUrl.searchParams.get('email') || 'guest';
  void _email;
  try {
    const posts = await db.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return NextResponse.json({ posts }, { status: 200 });
  } catch {
    return NextResponse.json({ posts: [] }, { status: 200 });
  }
}

// POST /api/community — three actions based on body.action:
//   undefined      → create a new post
//   'comment'      → add a comment to a post
//   'like'         → toggle the requester's email in the post's likedBy array
// Always returns 200.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { post: null, comment: null, liked: false, error: 'Invalid JSON body' },
      { status: 200 },
    );
  }

  const email = sanitizeText(
    typeof body.email === 'string' && body.email.trim() ? body.email : 'guest',
  );
  const action = typeof body.action === 'string' ? body.action : '';

  try {
    // ── Action: comment ──
    if (action === 'comment') {
      const postId = String(body.postId || '');
      if (!postId) {
        return NextResponse.json(
          { comment: null, error: 'postId required' },
          { status: 200 },
        );
      }
      const comment = await db.communityComment.create({
        data: {
          postId,
          authorName: sanitizeText(body.authorName || 'Anonymous'),
          authorInitial: sanitizeText(body.authorInitial || 'U'),
          authorEmail: email,
          content: sanitizeText(body.content || ''),
        },
      });
      return NextResponse.json({ comment }, { status: 200 });
    }

    // ── Action: like (toggle) ──
    if (action === 'like') {
      const postId = String(body.postId || '');
      if (!postId) {
        return NextResponse.json(
          { post: null, liked: false, error: 'postId required' },
          { status: 200 },
        );
      }

      const post = await db.communityPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return NextResponse.json({ post: null, liked: false }, { status: 200 });
      }

      const likedBy = safeParseLikedBy(post.likedBy);
      const alreadyLiked = likedBy.includes(email);
      const newLikedBy = alreadyLiked
        ? likedBy.filter((e) => e !== email)
        : [...likedBy, email];
      const liked = !alreadyLiked;

      const updated = await db.communityPost.update({
        where: { id: postId },
        data: {
          likes: newLikedBy.length,
          likedBy: JSON.stringify(newLikedBy),
        },
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
        },
      });

      return NextResponse.json({ post: updated, liked }, { status: 200 });
    }

    // ── Default action: create post ──
    const post = await db.communityPost.create({
      data: {
        authorName: sanitizeText(body.authorName || 'Anonymous'),
        authorInitial: sanitizeText(body.authorInitial || 'U'),
        authorEmail: email,
        category: sanitizeText(body.category || 'General'),
        content: sanitizeText(body.content || ''),
        imageUrl:
          typeof body.imageUrl === 'string' && body.imageUrl.trim()
            ? sanitizeText(body.imageUrl)
            : null,
      },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json({ post }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { post: null, comment: null, liked: false, error: msg },
      { status: 200 },
    );
  }
}
