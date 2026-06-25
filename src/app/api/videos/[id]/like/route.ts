import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/videos/[id]/like — toggle like (returns new state)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const viewer = String(body.viewer || 'guest');

    const video = await db.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    let likedBy: string[] = [];
    try {
      likedBy = JSON.parse(video.likedBy || '[]');
    } catch {
      likedBy = [];
    }

    const hasLiked = likedBy.includes(viewer);
    let newLikedBy: string[];
    let newLikes: number;

    if (hasLiked) {
      newLikedBy = likedBy.filter((v) => v !== viewer);
      newLikes = Math.max(0, video.likes - 1);
    } else {
      newLikedBy = [...likedBy, viewer];
      newLikes = video.likes + 1;
    }

    const updated = await db.video.update({
      where: { id },
      data: {
        likedBy: JSON.stringify(newLikedBy),
        likes: newLikes,
      },
    });

    return NextResponse.json({
      liked: !hasLiked,
      likes: newLikes,
      likedBy: newLikedBy,
      videoId: id,
    });
  } catch (err) {
    console.error('[videos/like] error', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
