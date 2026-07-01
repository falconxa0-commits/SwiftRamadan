import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

// GET /api/videos/[id]/comments — list comments for a video
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;

    const comments = await db.videoComment.findMany({
      where: { videoId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error('[videos/comments/GET] error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/videos/[id]/comments' },
    });
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

// POST /api/videos/[id]/comments — add a comment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    const body = await req.json();
    const { authorName, authorHandle, authorAvatar, content } = body;

    if (!content || !authorName) {
      return NextResponse.json({ error: 'Missing content or author' }, { status: 400 });
    }

    const video = await db.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const comment = await db.videoComment.create({
      data: {
        videoId: id,
        authorName: String(authorName),
        authorHandle: String(authorHandle || ''),
        authorAvatar: String(authorAvatar || ''),
        content: String(content).slice(0, 500),
      },
    });

    await db.video.update({
      where: { id },
      data: { comments: video.comments + 1 },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error('[videos/comments/POST] error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/videos/[id]/comments' },
    });
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
