import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─────────────────────────────────────────────────────────────
// GET /api/messages?roomId=xxx — list messages in room, oldest first
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    const messages = await db.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[messages] GET error', err);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/messages — create a chat message
// Body: { roomId, senderId?, senderName, senderRole, content }
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const roomId = String(body.roomId || '');
    const senderName = String(body.senderName || 'Guest');
    const senderRole = String(body.senderRole || 'customer');
    const content = String(body.content || '').slice(0, 4000);
    const senderId = body.senderId ? String(body.senderId) : null;

    if (!roomId || !content.trim()) {
      return NextResponse.json({ error: 'roomId and content are required' }, { status: 400 });
    }

    const message = await db.chatMessage.create({
      data: {
        roomId,
        senderId,
        senderName,
        senderRole,
        content,
        read: false,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('[messages] POST error', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/messages — mark messages as read
// Body: { roomId, messageIds? }  (if messageIds omitted → mark ALL unread in room as read)
// ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomId = String(body.roomId || '');
    const messageIds: string[] | undefined = Array.isArray(body.messageIds)
      ? body.messageIds.map(String)
      : undefined;

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    if (messageIds && messageIds.length > 0) {
      const result = await db.chatMessage.updateMany({
        where: { roomId, id: { in: messageIds }, read: false },
        data: { read: true },
      });
      return NextResponse.json({ updated: result.count });
    }

    const result = await db.chatMessage.updateMany({
      where: { roomId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ updated: result.count });
  } catch (err) {
    console.error('[messages] PUT error', err);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
