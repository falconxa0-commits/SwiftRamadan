import { createServer } from 'http';
import { Server } from 'socket.io';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

type RiderStatus =
  | 'preparing'
  | 'picked_up'
  | 'on_the_way'
  | 'arriving'
  | 'delivered';

interface Rider {
  name: string;
  phone: string;
  photo: string; // we use initials server-side, client renders avatar
  rating: number;
  vehicle: string;
  color: string;
}

interface GeoPoint {
  lat: number;
  lng: number;
}

interface Store {
  name: string;
  lat: number;
  lng: number;
}

interface Delivery {
  orderId: string;
  rider: Rider;
  location: GeoPoint;
  status: RiderStatus;
  eta: number; // minutes
  progress: number; // 0..100
  customer: GeoPoint;
  store: Store;
  startedAt: number;
}

interface ChatMessage {
  orderId: string;
  from: 'rider' | 'customer' | 'system';
  text: string;
  timestamp: number;
}

// ────────────────────────────────────────────────────────────────
// In-memory state
// ────────────────────────────────────────────────────────────────

const deliveries = new Map<string, Delivery>();
const chats = new Map<string, ChatMessage[]>();

// Pool of 5 sample Lagos riders
const RIDER_POOL: Rider[] = [
  {
    name: 'Ibrahim M.',
    phone: '+234 803 555 0142',
    photo: 'IM',
    rating: 4.9,
    vehicle: 'Electric Bike',
    color: '#10E07A',
  },
  {
    name: 'Aisha B.',
    phone: '+234 805 555 0987',
    photo: 'AB',
    rating: 4.8,
    vehicle: 'Scooter',
    color: '#F5C451',
  },
  {
    name: 'Tunde O.',
    phone: '+234 802 555 0421',
    photo: 'TO',
    rating: 4.95,
    vehicle: 'Motorcycle',
    color: '#38BDF8',
  },
  {
    name: 'Fatima K.',
    phone: '+234 807 555 0633',
    photo: 'FK',
    rating: 4.85,
    vehicle: 'Electric Bike',
    color: '#ec4899',
  },
  {
    name: 'Emeka N.',
    phone: '+234 809 555 0778',
    photo: 'EN',
    rating: 4.92,
    vehicle: 'Scooter',
    color: '#a855f7',
  },
];

// Lagos base coordinates (Lekki / VI area)
const LAGOS_BASE = { lat: 6.45, lng: 3.40 };

function jitter(base: number, delta: number): number {
  return base + (Math.random() * 2 - 1) * delta;
}

function pickRider(): Rider {
  return RIDER_POOL[Math.floor(Math.random() * RIDER_POOL.length)];
}

function seedSampleDeliveries() {
  const samples: Array<{
    orderId: string;
    riderIndex: number;
    store: Store;
    customer: GeoPoint;
    progress: number;
    status: RiderStatus;
    eta: number;
  }> = [
    {
      orderId: 'SWR-2847',
      riderIndex: 0,
      store: {
        name: 'Suya Central',
        lat: jitter(LAGOS_BASE.lat, 0.01),
        lng: jitter(LAGOS_BASE.lng, 0.01),
      },
      customer: {
        lat: jitter(LAGOS_BASE.lat, 0.02) + 0.015,
        lng: jitter(LAGOS_BASE.lng, 0.02) + 0.01,
      },
      progress: 42,
      status: 'on_the_way',
      eta: 12,
    },
    {
      orderId: 'SWR-2851',
      riderIndex: 2,
      store: {
        name: 'Iftar Bowl Lekki',
        lat: jitter(LAGOS_BASE.lat, 0.01),
        lng: jitter(LAGOS_BASE.lng, 0.01),
      },
      customer: {
        lat: jitter(LAGOS_BASE.lat, 0.02) + 0.02,
        lng: jitter(LAGOS_BASE.lng, 0.02) - 0.015,
      },
      progress: 18,
      status: 'picked_up',
      eta: 22,
    },
    {
      orderId: 'SWR-2863',
      riderIndex: 1,
      store: {
        name: 'Sahur Express',
        lat: jitter(LAGOS_BASE.lat, 0.01),
        lng: jitter(LAGOS_BASE.lng, 0.01),
      },
      customer: {
        lat: jitter(LAGOS_BASE.lat, 0.02) - 0.015,
        lng: jitter(LAGOS_BASE.lng, 0.02) + 0.02,
      },
      progress: 88,
      status: 'arriving',
      eta: 4,
    },
  ];

  for (const s of samples) {
    const rider = RIDER_POOL[s.riderIndex];
    // Interpolate rider location between store and customer based on initial progress
    const t = s.progress / 100;
    const location: GeoPoint = {
      lat: s.store.lat + (s.customer.lat - s.store.lat) * t,
      lng: s.store.lng + (s.customer.lng - s.store.lng) * t,
    };
    deliveries.set(s.orderId, {
      orderId: s.orderId,
      rider,
      location,
      status: s.status,
      eta: s.eta,
      progress: s.progress,
      customer: s.customer,
      store: s.store,
      startedAt: Date.now(),
    });
    // Seed welcome messages
    chats.set(s.orderId, [
      {
        orderId: s.orderId,
        from: 'rider',
        text: `Salam! I'm ${rider.name}, your SwiftRamadan rider. Picking up your order now 🌙`,
        timestamp: Date.now() - 60_000,
      },
      {
        orderId: s.orderId,
        from: 'system',
        text: 'Order is being prepared at the restaurant.',
        timestamp: Date.now() - 45_000,
      },
    ]);
  }
  console.log(`[tracking] Seeded ${deliveries.size} sample deliveries`);
}

// ────────────────────────────────────────────────────────────────
// Simulation loop - moves riders, updates ETA, status, progress
// ────────────────────────────────────────────────────────────────

const STATUS_BY_PROGRESS: Array<{ at: number; status: RiderStatus }> = [
  { at: 0, status: 'preparing' },
  { at: 20, status: 'picked_up' },
  { at: 60, status: 'on_the_way' },
  { at: 90, status: 'arriving' },
  { at: 100, status: 'delivered' },
];

function statusForProgress(p: number): RiderStatus {
  let result: RiderStatus = 'preparing';
  for (const s of STATUS_BY_PROGRESS) {
    if (p >= s.at) result = s.status;
  }
  return result;
}

function stepDelivery(d: Delivery): Delivery {
  if (d.status === 'delivered') return d;

  // Advance progress (random small step so deliveries feel alive)
  const step = 1.5 + Math.random() * 3.5; // 1.5-5% per tick
  const newProgress = Math.min(100, d.progress + step);

  // Interpolate location from store -> customer
  const t = newProgress / 100;
  const newLocation: GeoPoint = {
    lat: d.store.lat + (d.customer.lat - d.store.lat) * t,
    lng: d.store.lng + (d.customer.lng - d.store.lng) * t,
  };

  // Decrement ETA (faster as progress nears 100)
  const etaStep = Math.max(1, Math.round((100 - newProgress) / 8));
  const newEta = newProgress >= 100 ? 0 : etaStep;

  const newStatus = statusForProgress(newProgress);

  return {
    ...d,
    location: newLocation,
    progress: newProgress,
    eta: newEta,
    status: newStatus,
  };
}

function broadcastUpdate(io: Server, d: Delivery) {
  io.to(`order:${d.orderId}`).emit('location_update', {
    orderId: d.orderId,
    rider: d.rider,
    location: d.location,
    status: d.status,
    eta: d.eta,
    progress: d.progress,
    customer: d.customer,
    store: d.store,
  });

  // On status transition, push a system chat message
  if (d.status === 'delivered') {
    pushSystemMessage(io, d.orderId, '🎉 Delivered! Your order has arrived. Ramadan Mubarak!');
  }
}

function pushSystemMessage(io: Server, orderId: string, text: string) {
  const list = chats.get(orderId) || [];
  const msg: ChatMessage = {
    orderId,
    from: 'system',
    text,
    timestamp: Date.now(),
  };
  list.push(msg);
  chats.set(orderId, list);
  io.to(`order:${orderId}`).emit('new_message', msg);
}

// ────────────────────────────────────────────────────────────────
// HTTP + Socket.io server
// ────────────────────────────────────────────────────────────────

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path - Caddy forwards based on it
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => {
  console.log(`[tracking] Client connected: ${socket.id}`);

  // Send all active deliveries on connect so the UI can pick one
  const snapshot = Array.from(deliveries.values()).map((d) => ({
    orderId: d.orderId,
    rider: d.rider,
    location: d.location,
    status: d.status,
    eta: d.eta,
    progress: d.progress,
    customer: d.customer,
    store: d.store,
  }));
  socket.emit('active_deliveries', snapshot);

  // Subscribe to a specific order's room
  socket.on('subscribe_order', (orderId: string) => {
    if (!orderId || typeof orderId !== 'string') return;
    socket.join(`order:${orderId}`);
    console.log(`[tracking] ${socket.id} subscribed to ${orderId}`);

    const d = deliveries.get(orderId);
    if (d) {
      // Send current state immediately
      socket.emit('location_update', {
        orderId: d.orderId,
        rider: d.rider,
        location: d.location,
        status: d.status,
        eta: d.eta,
        progress: d.progress,
        customer: d.customer,
        store: d.store,
      });
      // Send chat history
      const history = chats.get(orderId) || [];
      socket.emit('chat_history', history);
    }
  });

  // Customer / rider chat
  socket.on(
    'send_message',
    (payload: { orderId: string; from: 'rider' | 'customer'; text: string }) => {
      if (!payload || !payload.orderId || !payload.text) return;
      const msg: ChatMessage = {
        orderId: payload.orderId,
        from: payload.from,
        text: payload.text.slice(0, 500),
        timestamp: Date.now(),
      };
      const list = chats.get(payload.orderId) || [];
      list.push(msg);
      chats.set(payload.orderId, list);
      io.to(`order:${payload.orderId}`).emit('new_message', msg);

      // Simulate the rider auto-replying if the customer sent a message
      if (payload.from === 'customer') {
        const d = deliveries.get(payload.orderId);
        const riderName = d?.rider.name?.split(' ')[0] || 'Rider';
        setTimeout(() => {
          const replies = [
            `On my way! 🙌 ETA ${d?.eta ?? 10} min`,
            `Noted, ${riderName} here. I'll be there shortly 🌙`,
            `Sure thing! Navigating to your area now 📍`,
            `Almost there, please be ready to receive your Iftar 🍽️`,
          ];
          const reply: ChatMessage = {
            orderId: payload.orderId,
            from: 'rider',
            text: replies[Math.floor(Math.random() * replies.length)],
            timestamp: Date.now(),
          };
          const list2 = chats.get(payload.orderId) || [];
          list2.push(reply);
          chats.set(payload.orderId, list2);
          io.to(`order:${payload.orderId}`).emit('new_message', reply);
        }, 1800 + Math.random() * 1500);
      }
    }
  );

  // Request a new rider (no orderId) - creates a fresh delivery
  socket.on('request_rider', (payload?: { orderId?: string; storeName?: string }) => {
    const orderId =
      payload?.orderId || `SWR-${Math.floor(2000 + Math.random() * 8000)}`;
    const rider = pickRider();
    const store: Store = {
      name: payload?.storeName || 'SwiftRamadan Hub',
      lat: jitter(LAGOS_BASE.lat, 0.012),
      lng: jitter(LAGOS_BASE.lng, 0.012),
    };
    const customer: GeoPoint = {
      lat: jitter(LAGOS_BASE.lat, 0.02) + 0.02,
      lng: jitter(LAGOS_BASE.lng, 0.02) + 0.01,
    };
    const delivery: Delivery = {
      orderId,
      rider,
      location: { ...store }, // start at the store
      status: 'preparing',
      eta: 25,
      progress: 0,
      customer,
      store,
      startedAt: Date.now(),
    };
    deliveries.set(orderId, delivery);
    chats.set(orderId, [
      {
        orderId,
        from: 'rider',
        text: `Salam! ${rider.name} assigned to your order. Preparing pickup now 🌙`,
        timestamp: Date.now(),
      },
    ]);

    // Auto-subscribe requester to the new order room
    socket.join(`order:${orderId}`);

    socket.emit('delivery_assigned', {
      orderId,
      rider,
      location: delivery.location,
      status: delivery.status,
      eta: delivery.eta,
      progress: delivery.progress,
      customer,
      store,
    });
    // Also send chat history immediately
    socket.emit('chat_history', chats.get(orderId) || []);

    console.log(`[tracking] New rider assigned: ${rider.name} → ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[tracking] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (err) => {
    console.error(`[tracking] Socket error (${socket.id}):`, err);
  });
});

// ────────────────────────────────────────────────────────────────
// Simulation tick - every 2 seconds move a random active delivery
// ────────────────────────────────────────────────────────────────

setInterval(() => {
  if (deliveries.size === 0) return;
  // Move ALL active deliveries every tick (smaller steps) so customers always see motion
  for (const [orderId, d] of deliveries.entries()) {
    const updated = stepDelivery(d);
    deliveries.set(orderId, updated);
    broadcastUpdate(io, updated);
  }
}, 2000);

// ────────────────────────────────────────────────────────────────
// Boot
// ────────────────────────────────────────────────────────────────

const PORT = 3004;
seedSampleDeliveries();

httpServer.listen(PORT, () => {
  console.log(`[tracking] SwiftRamadan tracking service running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[tracking] ${signal} received, shutting down...`);
  io.close(() => {
    httpServer.close(() => {
      console.log('[tracking] Server closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
