import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

// Resolve an identifier (id OR email) to a User.id. Returns null if not found.
async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  // Try by id first
  const byId = await db.user.findUnique({ where: { id: identifier }, select: { id: true } });
  if (byId) return byId.id;
  // Then by email
  const byEmail = await db.user.findUnique({ where: { email: identifier }, select: { id: true } });
  return byEmail ? byEmail.id : null;
}

// ─────────────────────────────────────────────────────────────
// POST /api/users/follow — toggle follow relationship
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json().catch(() => ({}));
    const followerRaw = String(body.followerId || '');
    const followeeRaw = String(body.followeeId || '');

    if (!followerRaw || !followeeRaw) {
      return NextResponse.json({ error: 'followerId and followeeId are required' }, { status: 400 });
    }

    // Resolve both to real User IDs
    const [followerId, followeeId] = await Promise.all([
      resolveUserId(followerRaw),
      resolveUserId(followeeRaw),
    ]);

    if (!followerId) {
      return NextResponse.json({ error: 'Follower not registered' }, { status: 404 });
    }
    if (!followeeId) {
      return NextResponse.json({ error: 'User to follow is not registered' }, { status: 404 });
    }
    if (followerId === followeeId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const existing = await db.follow.findUnique({
      where: { followerId_followeeId: { followerId, followeeId } },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false, followerId, followeeId });
    }

    await db.follow.create({ data: { followerId, followeeId } });
    return NextResponse.json({ following: true, followerId, followeeId }, { status: 201 });
  } catch (err) {
    console.error('[users/follow] POST error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/users/follow' },
    });
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/users/follow
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const url = new URL(req.url);
    const followerRaw = url.searchParams.get('followerId');
    const followeeRaw = url.searchParams.get('followeeId');
    const userRaw = url.searchParams.get('userId');
    const type = url.searchParams.get('type'); // 'followers' | 'following'

    // 1) Check single follow status
    if (followerRaw && followeeRaw) {
      const [followerId, followeeId] = await Promise.all([
        resolveUserId(followerRaw),
        resolveUserId(followeeRaw),
      ]);
      if (!followerId || !followeeId) {
        return NextResponse.json({ following: false, followerId: followerRaw, followeeId: followeeRaw });
      }
      const existing = await db.follow.findUnique({
        where: { followerId_followeeId: { followerId, followeeId } },
      });
      return NextResponse.json({ following: !!existing, followerId, followeeId });
    }

    // 2) List followers / following of a user
    if (userRaw && (type === 'followers' || type === 'following')) {
      const userId = await resolveUserId(userRaw);
      if (!userId) {
        return NextResponse.json({ users: [], count: 0 });
      }

      if (type === 'followers') {
        const follows = await db.follow.findMany({
          where: { followeeId: userId },
          include: { follower: true },
          orderBy: { createdAt: 'desc' },
        });
        const users = follows
          .map((f) => f.follower)
          .filter(Boolean)
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
          }));
        return NextResponse.json({ users, count: users.length });
      }

      // type === 'following'
      const follows = await db.follow.findMany({
        where: { followerId: userId },
        include: { followee: true },
        orderBy: { createdAt: 'desc' },
      });
      const users = follows
        .map((f) => f.followee)
        .filter(Boolean)
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
        }));
      return NextResponse.json({ users, count: users.length });
    }

    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  } catch (err) {
    console.error('[users/follow] GET error', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/users/follow' },
    });
    return NextResponse.json({ error: 'Failed to query follows' }, { status: 500 });
  }
}
