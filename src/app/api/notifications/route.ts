import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

/* ──────────── helpers ──────────── */

// Resolve an identifier (id OR email) to a real User.id. Returns null if not found.
// Used to (a) prevent FK-violation crashes on bad IDs (audit C1) and
// (b) normalise email-based lookups to a stable user id for `where` clauses.
async function resolveUserId(identifier: string | null | undefined): Promise<string | null> {
  if (!identifier) return null;
  const byId = await db.user.findUnique({ where: { id: identifier }, select: { id: true } });
  if (byId) return byId.id;
  const byEmail = await db.user.findUnique({ where: { email: identifier }, select: { id: true } });
  return byEmail ? byEmail.id : null;
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  if (diffMs < 0) return 'just now';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr > 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? 's' : ''} ago`;
}

/* ──────────── GET /api/notifications ──────────── */
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const userIdRaw = searchParams.get('userId');

    if (!userIdRaw) {
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        deprecated: true,
        warning:
          'userId query param is required; returning an empty list to prevent a global data leak. Update the caller to pass ?userId=...',
      });
    }

    const resolvedId = await resolveUserId(userIdRaw);
    if (!resolvedId) {
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        warning: 'User not found; returning an empty list.',
      });
    }

    const dbNotifications = await db.notification.findMany({
      where: { userId: resolvedId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = dbNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: timeAgo(n.createdAt),
      read: n.read,
      type: n.type,
    }));

    return NextResponse.json({
      notifications: formatted,
      unreadCount: formatted.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('Notifications API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/notifications' },
    });
    // On DB failure, return empty list (NOT the legacy global demo array — that was a leak too).
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      warning: 'Failed to load notifications.',
    });
  }
}

/* ──────────── POST /api/notifications — create ──────────── */
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { title, message, type = 'info', userId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'title and message are required' },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    const resolvedId = await resolveUserId(String(userId));
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const notification = await db.notification.create({
      data: {
        title,
        message,
        type,
        userId: resolvedId,
        read: false,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Notifications API POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/notifications' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/* ──────────── PUT /api/notifications — mark as read ──────────── */
export async function PUT(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { id, userId, all } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    const resolvedId = await resolveUserId(String(userId));
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Bulk: mark all of THIS user's unread notifications as read
    if (all === true) {
      const result = await db.notification.updateMany({
        where: { userId: resolvedId, read: false },
        data: { read: true },
      });
      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} notification(s) as read`,
        updatedCount: result.count,
      });
    }

    // Single: mark one notification as read by id (verify ownership first)
    if (id) {
      const existing = await db.notification.findUnique({ where: { id: String(id) } });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Notification not found' },
          { status: 404 }
        );
      }
      if (existing.userId !== resolvedId) {
        return NextResponse.json(
          { success: false, message: 'You do not own this notification' },
          { status: 403 }
        );
      }

      const updated = await db.notification.update({
        where: { id: String(id) },
        data: { read: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
        notification: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Provide { id } or { userId, all: true }' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notifications API PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/notifications' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
