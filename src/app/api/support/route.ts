import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_CATEGORIES = ['general', 'order', 'payment', 'delivery', 'account', 'vendor', 'rider'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return await handleCreate(body);
      case 'list':
        return await handleList(body);
      case 'get':
        return await handleGet(body);
      case 'message':
        return await handleMessage(body);
      case 'close':
        return await handleClose(body);
      default:
        return NextResponse.json(
          { success: false, message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── Create a support ticket ──
async function handleCreate(body: {
  userId: string;
  category: string;
  subject: string;
  message: string;
  priority?: string;
}) {
  const { userId, category, subject, message, priority } = body;

  // Validate required fields
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 }
    );
  }

  if (!subject || !subject.trim()) {
    return NextResponse.json(
      { success: false, message: 'subject is required' },
      { status: 400 }
    );
  }

  if (!message || !message.trim()) {
    return NextResponse.json(
      { success: false, message: 'message is required' },
      { status: 400 }
    );
  }

  // Validate category
  const ticketCategory = category || 'general';
  if (!VALID_CATEGORIES.includes(ticketCategory)) {
    return NextResponse.json(
      { success: false, message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate / default priority
  const ticketPriority = priority || 'medium';
  if (!VALID_PRIORITIES.includes(ticketPriority)) {
    return NextResponse.json(
      { success: false, message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
      { status: 400 }
    );
  }

  // Create ticket and first message in a transaction
  const ticket = await db.supportTicket.create({
    data: {
      userId,
      category: ticketCategory,
      subject: subject.trim(),
      priority: ticketPriority,
      status: 'open',
      messages: {
        create: {
          senderId: userId,
          message: message.trim(),
          isAdmin: false,
        },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json({ success: true, ticket }, { status: 201 });
}

// ── List user's tickets ──
async function handleList(body: { userId: string }) {
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 }
    );
  }

  const tickets = await db.supportTicket.findMany({
    where: { userId },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, tickets });
}

// ── Get single ticket with messages ──
async function handleGet(body: { userId: string; ticketId: string }) {
  const { userId, ticketId } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 }
    );
  }

  if (!ticketId) {
    return NextResponse.json(
      { success: false, message: 'ticketId is required' },
      { status: 400 }
    );
  }

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!ticket) {
    return NextResponse.json(
      { success: false, message: 'Ticket not found' },
      { status: 404 }
    );
  }

  // Verify ticket belongs to user
  if (ticket.userId !== userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized access to this ticket' },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, ticket });
}

// ── Add message to ticket ──
async function handleMessage(body: { userId: string; ticketId: string; message: string }) {
  const { userId, ticketId, message } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 }
    );
  }

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

  // Verify ticket exists and belongs to user
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json(
      { success: false, message: 'Ticket not found' },
      { status: 404 }
    );
  }

  if (ticket.userId !== userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized access to this ticket' },
      { status: 403 }
    );
  }

  // Create message and update ticket in a transaction
  const newMessage = await db.ticketMessage.create({
    data: {
      ticketId,
      senderId: userId,
      message: message.trim(),
      isAdmin: false,
    },
  });

  // Update ticket's updatedAt timestamp
  await db.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
}

// ── Close a ticket ──
async function handleClose(body: { userId: string; ticketId: string }) {
  const { userId, ticketId } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 }
    );
  }

  if (!ticketId) {
    return NextResponse.json(
      { success: false, message: 'ticketId is required' },
      { status: 400 }
    );
  }

  // Verify ticket exists and belongs to user
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json(
      { success: false, message: 'Ticket not found' },
      { status: 404 }
    );
  }

  if (ticket.userId !== userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized access to this ticket' },
      { status: 403 }
    );
  }

  const updatedTicket = await db.supportTicket.update({
    where: { id: ticketId },
    data: { status: 'closed' },
  });

  return NextResponse.json({ success: true, ticket: updatedTicket });
}
