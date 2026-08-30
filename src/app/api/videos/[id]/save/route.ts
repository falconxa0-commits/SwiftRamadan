import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import * as usersService from '@/services/users/users.service';

// Resolve an identifier (id OR email) to a User.id. Returns null if not found.
//
// MIGRATED (Phase 10): the `by id` lookup path is delegated to
// `usersService.getUserById` (returns `PublicUser | null`). The `by email`
// fallback stays inline because the service only supports userId-keyed
// lookups.
async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  // Try by id first (via service)
  const byId = await usersService.getUserById(identifier);
  if (byId) return String(byId.id);
  // Then by email (inline)
  const byEmail = await db.user.findUnique({ where: { email: identifier }, select: { id: true } });
  return byEmail ? byEmail.id : null;
}

// ─────────────────────────────────────────────────────────────
// POST /api/videos/[id]/save — toggle a SavedVideo bookmark
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const videoId = String(body.videoId || id);
    const userRaw = String(body.userId || 'guest');

    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Resolve userId (email or id) to a real User.id
    const userId = await resolveUserId(userRaw);
    if (!userId) {
      return NextResponse.json({ error: 'User not registered' }, { status: 404 });
    }

    const existing = await db.savedVideo.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await db.savedVideo.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false, videoId });
    }

    await db.savedVideo.create({ data: { userId, videoId } });
    return NextResponse.json({ saved: true, videoId }, { status: 201 });
  } catch (err) {
    console.error('[videos/save] POST error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/videos/[id]/save' },
    });
    return NextResponse.json({ error: 'Failed to toggle save' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/videos/[id]/save?userId=xxx
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    const url = new URL(req.url);
    const userRaw = url.searchParams.get('userId') || 'guest';

    // Resolve userId (email or id) to a real User.id
    const userId = await resolveUserId(userRaw);

    const video = await db.video.findUnique({ where: { id } }).catch(() => null);

    if (!video) {
      // Return all saved videos for this user (or empty if user not registered)
      if (!userId) {
        return NextResponse.json({ saved: true, videos: [] });
      }
      const saved = await db.savedVideo.findMany({
        where: { userId },
        include: { video: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const videos = saved
        .map((s) => s.video)
        .filter(Boolean)
        .map((v) => ({
          ...v,
          likedBy: safeParseArr(v.likedBy),
        }));
      return NextResponse.json({ saved: true, videos });
    }

    // Single-video status mode
    if (!userId) {
      return NextResponse.json({ saved: false, videoId: id });
    }
    const existing = await db.savedVideo.findUnique({
      where: { userId_videoId: { userId, videoId: id } },
    });
    return NextResponse.json({ saved: !!existing, videoId: id });
  } catch (err) {
    console.error('[videos/save] GET error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/videos/[id]/save' },
    });
    return NextResponse.json({ error: 'Failed to fetch saved videos' }, { status: 500 });
  }
}

function safeParseArr(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
