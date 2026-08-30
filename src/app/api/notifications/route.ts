import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import * as usersService from '@/services/users/users.service';

/* ──────────── helpers ──────────── */

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
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Use authenticated user's userId — no longer accepts query param to prevent IDOR
    const userId = auth.userId;

    const dbNotifications = await db.notification.findMany({
      where: { userId },
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
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { title, message, type = 'info' } = body;
    // Use authenticated user's userId — admin can override via body if needed
    const userId = auth.role === 'admin' && body.userId ? body.userId : auth.userId;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'title and message are required' },
        { status: 400 }
      );
    }

    // MIGRATED (Phase 11): defense-in-depth user existence check via
    // `usersService.getUserById`. Returns a clean 404 instead of a Prisma FK
    // violation 500 if the user was deleted between JWT issuance and this
    // request. Mirrors `/api/cart/route.ts` and `/api/support/route.ts`.
    const userExists = await usersService.getUserById(userId);
    if (!userExists) {
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
        userId,
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
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { id, all } = body;
    // Use authenticated user's userId
    const userId = auth.userId;

    // Bulk: mark all of THIS user's unread notifications as read
    if (all === true) {
      const result = await db.notification.updateMany({
        where: { userId, read: false },
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
      if (existing.userId !== userId) {
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
      { success: false, message: 'Provide { id } or { all: true }' },
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
