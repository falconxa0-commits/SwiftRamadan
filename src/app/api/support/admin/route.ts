import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    // Auth check: all admin support actions require authentication
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { action } = body;

    // reply and update-status require admin role; list-all is available to any authenticated user
    if ((action === 'reply' || action === 'update-status') && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    switch (action) {
      case 'list-all':
        return await handleListAll(body);
      case 'reply':
        return await handleReply(body);
      case 'update-status':
        return await handleUpdateStatus(body);
      default:
        return NextResponse.json(
          { success: false, message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Support Admin API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── List all tickets (with filters) ──
async function handleListAll(body: {
  status?: string;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  const { status, category, priority, page = 1, limit = 20 } = body;

  // Build filter conditions
  const where: Record<string, string> = {};
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status;
  }
  if (category) {
    where.category = category;
  }
  if (priority && VALID_PRIORITIES.includes(priority)) {
    where.priority = priority;
  }

  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const take = Math.min(Math.max(1, limit), 100); // cap at 100

  const [tickets, total] = await Promise.all([
    db.supportTicket.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    db.supportTicket.count({ where }),
  ]);

  const totalPages = Math.ceil(total / take);

  return NextResponse.json({
    success: true,
    tickets,
    total,
    page: Math.max(1, page),
    totalPages,
  });
}

// ── Admin replies to ticket ──
async function handleReply(body: {
  ticketId: string;
  message: string;
  senderId: string;
}) {
  const { ticketId, message, senderId } = body;

  if (!ticketId) {
    return NextResponse.json(
      { success: false, message: 'ticketId is required' },
      { status: 400 }
    );
  }

  if (!message || !message.trim()) {
    return NextResponse.json(
      { success: false, message: 'message is required' },
      { status: 400 }
    );
  }

  if (!senderId) {
    return NextResponse.json(
      { success: false, message: 'senderId is required' },
      { status: 400 }
    );
  }

  // Verify ticket exists
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json(
      { success: false, message: 'Ticket not found' },
      { status: 404 }
    );
  }

  // Create admin message and update ticket status in a transaction
  const newMessage = await db.$transaction(async (tx) => {
    const msg = await tx.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        message: message.trim(),
        isAdmin: true,
      },
    });

    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'in_progress',
        updatedAt: new Date(),
      },
    });

    return msg;
  });

  return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
}

// ── Admin updates ticket status ──
async function handleUpdateStatus(body: {
  ticketId: string;
  status: string;
  priority?: string;
}) {
  const { ticketId, status, priority } = body;

  if (!ticketId) {
    return NextResponse.json(
      { success: false, message: 'ticketId is required' },
      { status: 400 }
    );
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // Verify ticket exists
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json(
      { success: false, message: 'Ticket not found' },
      { status: 404 }
    );
  }

  // Build update data
  const updateData: { status: string; updatedAt: Date; priority?: string } = {
    status,
    updatedAt: new Date(),
  };

  if (priority) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { success: false, message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.priority = priority;
  }

  const updatedTicket = await db.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  return NextResponse.json({ success: true, ticket: updatedTicket });
}
