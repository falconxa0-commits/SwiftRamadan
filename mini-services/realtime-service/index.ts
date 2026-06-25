/**
 * SwiftRamadan Realtime Service
 * ------------------------------------------------------------------
 * Socket.io mini-service on port 3003 for:
 *   - live order tracking (status updates, rider location)
 *   - real-time chat (per-room broadcast + DB persistence)
 *   - instant notifications (new orders to vendors, delivery
 *     requests to riders)
 *
 * Frontend clients connect via the gateway using:
 *   io("/?XTransformPort=3003", { transports: ["websocket"] })
 *
 * The service keeps its own PrismaClient pointed at the same
 * SQLite database as the main app.
 * ------------------------------------------------------------------
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// ────────────────────────────────────────────────────────────────
// Prisma (decoupled from main app's @/lib/db)
// ────────────────────────────────────────────────────────────────

const databaseUrl =
  process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db';

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: ['error'],
});

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface RegisterUserPayload {
  userId?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

interface ChatMessagePayload {
  roomId: string;
  senderId?: string;
  senderName: string;
  senderRole: string;
  content: string;
}

interface OrderStatusUpdatePayload {
  orderId: string;
  status: string;
  progress?: number;
  riderName?: string;
  eta?: number;
}

interface RiderLocationPayload {
  orderId: string;
  lat: number;
  lng: number;
  progress?: number;
}

interface NewOrderPayload {
  vendorId: string;
  orderData: Record<string, unknown>;
}

interface DeliveryRequestPayload {
  riderId: string;
  orderData: Record<string, unknown>;
}

interface TypingPayload {
  roomId: string;
  userId?: string;
  userName?: string;
  isTyping: boolean;
}

interface ChatMessageRow {
  id: string;
  roomId: string;
  senderId: string | null;
  senderName: string;
  senderRole: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────
// Express + Socket.io setup
// ────────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health-check endpoint (GET /) — gateway + curl can hit this to
// verify the service is alive.
app.get('/', (_req, res) => {
  res.json({
    service: 'swiftramadan-realtime',
    status: 'ok',
    uptime: process.uptime(),
    clients: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  // Use socket.io's default path `/socket.io/` so that express routes
  // on `/` and `/health` continue to work for health-checks. The
  // gateway routes requests by the XTransformPort query param, so
  // any path is fine — the frontend just needs to connect with
  //   io("/?XTransformPort=3003")
  // (socket.io-client appends the /socket.io/ path automatically).
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function safeString(v: unknown, max = 200): string {
  if (typeof v !== 'string') return '';
  return v.slice(0, max);
}

function safeRoomId(v: unknown): string {
  const s = safeString(v, 100);
  // Allow only alphanumerics, dash, underscore
  return s.replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Persist a chat message to the DB. Returns the created row. */
async function persistChatMessage(
  payload: ChatMessagePayload
): Promise<ChatMessageRow | null> {
  try {
    const created = await prisma.chatMessage.create({
      data: {
        roomId: payload.roomId,
        senderId: payload.senderId || null,
        senderName: payload.senderName || 'Anonymous',
        senderRole: payload.senderRole || 'customer',
        content: payload.content.slice(0, 2000),
      },
    });
    return {
      id: created.id,
      roomId: created.roomId,
      senderId: created.senderId,
      senderName: created.senderName,
      senderRole: created.senderRole,
      content: created.content,
      read: created.read,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (err) {
    console.error('[realtime] persist chat message failed:', err);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// Connection handler
// ────────────────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(
    `[realtime] ✓ connected: ${socket.id} (total: ${io.engine.clientsCount})`
  );

  /* ── Register user identity (called once after connect) ───── */
  socket.on('register', (payload: RegisterUserPayload) => {
    const userId = safeString(payload?.userId, 100);
    const userRole = safeString(payload?.userRole, 50);
    const userName = safeString(payload?.userName, 100);
    const userEmail = safeString(payload?.userEmail, 200);

    (socket as Socket & {
      userId?: string;
      userRole?: string;
      userName?: string;
      userEmail?: string;
    }).userId = userId;
    (socket as Socket & { userRole?: string }).userRole = userRole;
    (socket as Socket & { userName?: string }).userName = userName;
    (socket as Socket & { userEmail?: string }).userEmail = userEmail;

    socket.emit('registered', { ok: true, socketId: socket.id });
  });

  /* ── Room management ──────────────────────────────────────── */
  socket.on('join-room', (roomId: unknown) => {
    const room = safeRoomId(roomId);
    if (!room) return;
    socket.join(room);
    socket.emit('room-joined', { roomId: room });
    socket.to(room).emit('user-joined-room', {
      roomId: room,
      socketId: socket.id,
    });
  });

  socket.on('leave-room', (roomId: unknown) => {
    const room = safeRoomId(roomId);
    if (!room) return;
    socket.leave(room);
    socket.emit('room-left', { roomId: room });
    socket.to(room).emit('user-left-room', {
      roomId: room,
      socketId: socket.id,
    });
  });

  /* ── Chat messages (broadcast + persist) ──────────────────── */
  socket.on('chat-message', async (payload: ChatMessagePayload) => {
    const roomId = safeRoomId(payload?.roomId);
    const content = safeString(payload?.content, 2000);
    if (!roomId || !content) return;

    const senderName = safeString(payload?.senderName, 100) || 'Anonymous';
    const senderRole = safeString(payload?.senderRole, 50) || 'customer';
    const senderId =
      safeString(payload?.senderId, 100) ||
      (socket as Socket & { userId?: string }).userId ||
      null;

    // Persist to DB (fire-and-await so we can echo back the row id)
    const row = await persistChatMessage({
      roomId,
      senderId: senderId || undefined,
      senderName,
      senderRole,
      content,
    });

    const message = row
      ? row
      : {
          id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          roomId,
          senderId: senderId || null,
          senderName,
          senderRole,
          content,
          read: false,
          createdAt: new Date().toISOString(),
        };

    // Broadcast to everyone in the room (including sender for echo / dedupe)
    io.to(roomId).emit('chat-message', message);
  });

  /* ── Typing indicator ─────────────────────────────────────── */
  socket.on('typing', (payload: TypingPayload) => {
    const roomId = safeRoomId(payload?.roomId);
    if (!roomId) return;
    socket.to(roomId).emit('typing', {
      roomId,
      userId:
        safeString(payload?.userId, 100) ||
        (socket as Socket & { userId?: string }).userId ||
        socket.id,
      userName: safeString(payload?.userName, 100),
      isTyping: !!payload?.isTyping,
    });
  });

  /* ── Order status updates (vendor / rider → customer) ─────── */
  socket.on('order-status-update', (payload: OrderStatusUpdatePayload) => {
    const orderId = safeString(payload?.orderId, 100);
    if (!orderId) return;
    const room = `order-${orderId}`;
    io.to(room).emit('order-status-update', {
      orderId,
      status: safeString(payload?.status, 50),
      progress:
        typeof payload?.progress === 'number' ? payload.progress : undefined,
      riderName: safeString(payload?.riderName, 100),
      eta: typeof payload?.eta === 'number' ? payload.eta : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  /* ── Rider location (rider → customer, live tracking) ─────── */
  socket.on('rider-location', (payload: RiderLocationPayload) => {
    const orderId = safeString(payload?.orderId, 100);
    if (!orderId) return;
    if (
      typeof payload?.lat !== 'number' ||
      typeof payload?.lng !== 'number'
    )
      return;
    const room = `order-${orderId}`;
    io.to(room).emit('rider-location', {
      orderId,
      lat: payload.lat,
      lng: payload.lng,
      progress:
        typeof payload?.progress === 'number' ? payload.progress : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  /* ── New order (customer / system → vendor) ──────────────── */
  socket.on('new-order', (payload: NewOrderPayload) => {
    const vendorId = safeString(payload?.vendorId, 100);
    if (!vendorId) return;
    const room = `vendor-${vendorId}`;
    io.to(room).emit('new-order', {
      vendorId,
      orderData: payload?.orderData || {},
      timestamp: new Date().toISOString(),
    });
  });

  /* ── Delivery request (system / vendor → rider) ──────────── */
  socket.on('delivery-request', (payload: DeliveryRequestPayload) => {
    const riderId = safeString(payload?.riderId, 100);
    if (!riderId) return;
    const room = `rider-${riderId}`;
    io.to(room).emit('delivery-request', {
      riderId,
      orderData: payload?.orderData || {},
      timestamp: new Date().toISOString(),
    });
  });

  /* ── Disconnect ───────────────────────────────────────────── */
  socket.on('disconnect', (reason: string) => {
    console.log(
      `[realtime] ✗ disconnected: ${socket.id} (reason: ${reason})`
    );
  });

  socket.on('error', (err: unknown) => {
    console.error(`[realtime] socket error (${socket.id}):`, err);
  });
});

// ────────────────────────────────────────────────────────────────
// Boot
// ────────────────────────────────────────────────────────────────

const PORT = 3003;

httpServer.listen(PORT, () => {
  console.log(
    `[realtime] 🚀 SwiftRamadan realtime service listening on port ${PORT}`
  );
  console.log(`[realtime]    health-check:  http://localhost:${PORT}/`);
  console.log(`[realtime]    db:           ${databaseUrl}`);
});

// ────────────────────────────────────────────────────────────────
// Graceful shutdown
// ────────────────────────────────────────────────────────────────

const shutdown = async (signal: string) => {
  console.log(`[realtime] ${signal} received, shutting down...`);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  io.close(() => {
    httpServer.close(() => {
      console.log('[realtime] server closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
