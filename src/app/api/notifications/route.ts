import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In-memory fallback used when the DB is unreachable / during previews
const fallbackNotifications = [
  { id: 1, title: "Order Confirmed!", message: "Your Ramadan Family Box is being prepared.", time: "2 min ago", read: false, type: "order" },
  { id: 2, title: "Flash Sale Alert", message: "30% off all Dates & Fruit Boxes - 1 hour left!", time: "15 min ago", read: false, type: "promo" },
  { id: 3, title: "Iftar Reminder", message: "Maghrib is at 6:45 PM. Order your Iftar now!", time: "1 hr ago", read: true, type: "reminder" },
  { id: 4, title: "SwiftRewards", message: "You've earned 500 points from your last order!", time: "3 hrs ago", read: true, type: "reward" },
  { id: 5, title: "Group Buy Update", message: "Your group buy for Groceries is 80% filled.", time: "5 hrs ago", read: true, type: "social" },
  { id: 6, title: "Delivery Update", message: "Your rider Ibrahim is 5 mins away!", time: "8 hrs ago", read: true, type: "order" },
];

export async function GET() {
  try {
    const dbNotifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (dbNotifications.length === 0) {
      return NextResponse.json({
        notifications: fallbackNotifications,
        unreadCount: fallbackNotifications.filter(n => !n.read).length,
      });
    }

    const formatted = dbNotifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: timeAgo(n.createdAt),
      read: n.read,
      type: n.type,
    }));

    return NextResponse.json({
      notifications: formatted,
      unreadCount: formatted.filter(n => !n.read).length,
    });
  } catch (error) {
    console.error('Notifications API GET error:', error);
    return NextResponse.json({
      notifications: fallbackNotifications,
      unreadCount: fallbackNotifications.filter(n => !n.read).length,
    });
  }
}

// POST /api/notifications — create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type = 'info', userId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'title and message are required' },
        { status: 400 }
      );
    }

    const notification = await db.notification.create({
      data: {
        title,
        message,
        type,
        userId: userId || null,
        read: false,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Notifications API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications — mark notifications as read
// Body: { id } → mark single notification as read
// Body: { userId, all: true } → mark all of a user's notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, all } = body;

    // Bulk: mark all of a user's notifications as read
    if (all === true && userId) {
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

    // Bulk fallback: mark all notifications as read (no userId filter)
    if (all === true) {
      const result = await db.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} notification(s) as read`,
        updatedCount: result.count,
      });
    }

    // Single: mark one notification as read by id
    if (id) {
      // Try by cuid first
      let updated = null;
      try {
        updated = await db.notification.update({
          where: { id: String(id) },
          data: { read: true },
        });
      } catch {
        // id may be numeric (fallback list) — ignore
      }

      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Notification not found' },
          { status: 404 }
        );
      }

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
    return NextResponse.json(
      { success: false, message: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

/* ─── helpers ─── */

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
