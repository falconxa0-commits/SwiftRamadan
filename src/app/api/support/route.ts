import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { checkBodySize } from '@/lib/validation';
import * as usersService from '@/services/users/users.service';

const VALID_CATEGORIES = ['general', 'order', 'payment', 'delivery', 'account', 'vendor', 'rider'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const bodyResult = await checkBodySize(request);
    if (bodyResult.tooLarge) return bodyResult.response;

    const body = JSON.parse(bodyResult.body);
    const { action } = body;

    switch (action) {
      case 'create':
        return await handleCreate(body, auth.userId);
      case 'list':
        return await handleList(auth.userId);
      case 'get':
        return await handleGet(body, auth.userId);
      case 'message':
        return await handleMessage(body, auth.userId);
      case 'close':
        return await handleClose(body, auth.userId);
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
async function handleCreate(
  body: {
    category: string;
    subject: string;
    message: string;
    priority?: string;
  },
  userId: string,
) {
  const { category, subject, message, priority } = body;

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

  // MIGRATED (Phase 10 Alpha Batch 2): defense-in-depth user check via
  // `usersService.getUserById`. `requireAuth` only verifies the JWT — it
  // does NOT verify the user still exists in the DB. Without this check,
  // a user deleted between JWT issuance and this request would cause a
  // Prisma FK violation on `supportTicket.create` below, which the outer
  // catch would surface as a generic 500. This check returns a clean 404
  // with a meaningful message instead. Mirrors the pattern in
  // `/api/cart/route.ts` (`assertUserExists`).
  const userExists = await usersService.getUserById(userId);
  if (!userExists) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
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
async function handleList(userId: string) {
  const tickets = await db.supportTicket.findMany({
    where: { userId },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ success: true, tickets });
}

// ── Get single ticket with messages ──
async function handleGet(body: { ticketId: string }, userId: string) {
  const { ticketId } = body;

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
async function handleMessage(body: { ticketId: string; message: string }, userId: string) {
  const { ticketId, message } = body;

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

  // IMPROVED (Phase 10 Alpha Batch 2): wrap the message create + ticket
  // `updatedAt` bump in a `$transaction` for atomicity. Previously these
  // were two separate writes — if the `supportTicket.update` failed after
  // the `ticketMessage.create` succeeded, the ticket would have a new
  // message but a stale `updatedAt` timestamp. The `$transaction` ensures
  // both succeed or both fail. Response shape is unchanged.
  const newMessage = await db.$transaction(async (tx) => {
    const msg = await tx.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        message: message.trim(),
        isAdmin: false,
      },
    });

    // Update ticket's updatedAt timestamp
    await tx.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return msg;
  });

  return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
}

// ── Close a ticket ──
async function handleClose(body: { ticketId: string }, userId: string) {
  const { ticketId } = body;

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
