import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

function parseLikedBy(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Toggle like on a post or reply.
 * Body: { targetType: 'post' | 'reply', id, userEmail }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetType = body?.targetType === 'reply' ? 'reply' : 'post';
    const id = (body?.id || '').toString().trim();
    const userEmail = (body?.userEmail || 'guest').toString().trim();

    if (!id || !userEmail || userEmail === 'guest') {
      // guests can't persist likes — return optimistic ok
      return NextResponse.json({ success: true, liked: true, likes: 1 });
    }

    if (targetType === 'post') {
      const post = await db.communityPost.findUnique({ where: { id } });
      if (!post) return NextResponse.json({ success: false, error: 'not found' });
      const likedBy = parseLikedBy(post.likedBy);
      const liked = !likedBy.includes(userEmail);
      const newLikedBy = liked ? [...likedBy, userEmail] : likedBy.filter((e) => e !== userEmail);
      const updated = await db.communityPost.update({
        where: { id },
        data: { likes: newLikedBy.length, likedBy: JSON.stringify(newLikedBy) },
      });
      return NextResponse.json({ success: true, liked, likes: updated.likes });
    } else {
      const reply = await db.communityReply.findUnique({ where: { id } });
      if (!reply) return NextResponse.json({ success: false, error: 'not found' });
      const likedBy = parseLikedBy(reply.likedBy);
      const liked = !likedBy.includes(userEmail);
      const newLikedBy = liked ? [...likedBy, userEmail] : likedBy.filter((e) => e !== userEmail);
      const updated = await db.communityReply.update({
        where: { id },
        data: { likes: newLikedBy.length, likedBy: JSON.stringify(newLikedBy) },
      });
      return NextResponse.json({ success: true, liked, likes: updated.likes });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Could not toggle like' });
  }
}
