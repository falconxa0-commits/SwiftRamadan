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

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = (searchParams.get('postId') || '').trim();
  const userEmail = (searchParams.get('userEmail') || 'guest').trim();

  if (!postId) return NextResponse.json({ success: true, replies: [] });

  try {
    const rows = await db.communityReply.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const replies = rows.map((r) => {
      const likedBy = parseLikedBy(r.likedBy);
      return {
        id: r.id,
        postId: r.postId,
        authorName: r.authorName,
        authorInitial: r.authorInitial,
        authorColor: r.authorColor,
        content: r.content,
        likes: r.likes,
        liked: likedBy.includes(userEmail),
        createdAt: r.createdAt,
        timeAgo: timeAgo(new Date(r.createdAt)),
      };
    });

    return NextResponse.json({ success: true, replies });
  } catch {
    return NextResponse.json({ success: true, replies: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userEmail = (body?.userEmail || 'guest').trim();
    const postId = (body?.postId || '').trim();
    const authorName = (body?.authorName || 'Guest').trim().slice(0, 40);
    const content = (body?.content || '').toString().trim().slice(0, 1000);

    if (!postId || !content) {
      return NextResponse.json({ success: false, error: 'postId and content required' });
    }

    const authorInitial = authorName.charAt(0).toUpperCase() || 'G';
    const colors = ['green', 'gold', 'purple', 'cyan'];
    const authorColor = colors[authorName.charCodeAt(0) % colors.length];

    const reply = await db.communityReply.create({
      data: {
        postId,
        authorName,
        authorInitial,
        authorColor,
        content,
        owner: userEmail,
        likedBy: '[]',
      },
    });

    // Increment repliesCount on the post
    try {
      await db.communityPost.update({
        where: { id: postId },
        data: { repliesCount: { increment: 1 } },
      });
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      success: true,
      reply: {
        id: reply.id,
        postId: reply.postId,
        authorName: reply.authorName,
        authorInitial: reply.authorInitial,
        authorColor: reply.authorColor,
        content: reply.content,
        likes: 0,
        liked: false,
        createdAt: reply.createdAt,
        timeAgo: 'just now',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not create reply' });
  }
}
