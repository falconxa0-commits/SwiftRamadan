import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

// POST /api/videos/[id]/share — increment share count + record view
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;

    const video = await db.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const updated = await db.video.update({
      where: { id },
      data: { shares: video.shares + 1 },
    });

    return NextResponse.json({ shares: updated.shares, videoId: id });
  } catch (err) {
    console.error('[videos/share] error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/videos/[id]/share' },
    });
    return NextResponse.json({ error: 'Failed to record share' }, { status: 500 });
  }
}

// POST /api/videos/[id]/view — increment view count
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;

    const video = await db.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const updated = await db.video.update({
      where: { id },
      data: { views: video.views + 1 },
    });

    return NextResponse.json({ views: updated.views, videoId: id });
  } catch (err) {
    console.error('[videos/view] error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/videos/[id]/share' },
    });
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
