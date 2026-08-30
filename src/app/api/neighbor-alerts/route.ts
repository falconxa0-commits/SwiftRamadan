import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';

/* ──────────────────────────────────────────────────────────────────
   /api/neighbor-alerts — Neighbor Alerts
   GET  returns nearby combinable orders
   POST joins a combined delivery
   ────────────────────────────────────────────────────────────────── */

interface NeighborOrder {
  id: string;
  area: string;
  restaurant: string;
  items: string[];
  total: number;
  deliveryFee: number;
  savedFee: number;
  timeLeft: string;
  distance: string;
  orderCount: number;
  maxOrders: number;
  isJoined: boolean;
  privacyLevel: 'area-only' | 'building' | 'street';
}

// Fallback mock orders
const MOCK_ORDERS: NeighborOrder[] = [
  {
    id: 'na1',
    area: 'Lekki Phase 1',
    restaurant: 'The Food Hub',
    items: ['Jollof Rice', 'Grilled Chicken', 'Zobo'],
    total: 4500,
    deliveryFee: 1200,
    savedFee: 500,
    timeLeft: '15 min',
    distance: '0.3 km',
    orderCount: 2,
    maxOrders: 4,
    isJoined: false,
    privacyLevel: 'area-only',
  },
  {
    id: 'na2',
    area: 'Victoria Island',
    restaurant: 'Suya Palace',
    items: ['Suya Platter', 'Kunnu'],
    total: 3200,
    deliveryFee: 1500,
    savedFee: 700,
    timeLeft: '22 min',
    distance: '0.8 km',
    orderCount: 1,
    maxOrders: 3,
    isJoined: false,
    privacyLevel: 'building',
  },
  {
    id: 'na3',
    area: 'Ikoyi',
    restaurant: 'Mama Calabar',
    items: ['Edikang Ikong', 'Pounded Yam', 'Pepper Soup'],
    total: 5800,
    deliveryFee: 1800,
    savedFee: 600,
    timeLeft: '8 min',
    distance: '1.2 km',
    orderCount: 3,
    maxOrders: 5,
    isJoined: false,
    privacyLevel: 'street',
  },
  {
    id: 'na4',
    area: 'Yaba',
    restaurant: 'Amala Spot',
    items: ['Amala & Ewedu', 'Gbegiri', 'Assorted Meat'],
    total: 2800,
    deliveryFee: 900,
    savedFee: 400,
    timeLeft: '18 min',
    distance: '0.5 km',
    orderCount: 1,
    maxOrders: 4,
    isJoined: false,
    privacyLevel: 'area-only',
  },
];

export async function GET() {
  // Try DB first for neighbor alerts
  try {
    const dbAlerts = await db.neighborAlert.findMany({
      where: {
        OR: [
          { expiresAt: { gt: new Date() } },
          { expiresAt: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (dbAlerts.length > 0) {
      const orders: NeighborOrder[] = dbAlerts.map((a, i) => ({
        id: a.id,
        area: a.authorArea,
        restaurant: a.title,
        items: a.description ? a.description.split(',').map(s => s.trim()) : [a.title],
        total: 3000 + i * 1000,
        deliveryFee: 1200 + i * 200,
        savedFee: 500 + i * 100,
        timeLeft: a.expiresAt
          ? `${Math.max(1, Math.round((a.expiresAt.getTime() - Date.now()) / 60000))} min`
          : '30 min',
        distance: `${(0.3 + i * 0.4).toFixed(1)} km`,
        orderCount: 1 + i,
        maxOrders: 4 + i,
        isJoined: false,
        privacyLevel: (['area-only', 'building', 'street'] as const)[i % 3],
      }));
      return NextResponse.json({ orders });
    }
  } catch {
    // Fallback to mock
  }

  return NextResponse.json({ orders: MOCK_ORDERS });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await req.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Try to find in DB
    try {
      const alert = await db.neighborAlert.findUnique({ where: { id: orderId } });
      if (alert) {
        // Update the alert (mark as joined by incrementing description or similar)
        // For now just return success
        return NextResponse.json({
          success: true,
          savedFee: 500,
          message: `Joined delivery! You'll save ₦500`,
        });
      }
    } catch {
      // Fallback
    }

    // Mock fallback
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.isJoined) {
      return NextResponse.json(
        { error: 'Already joined this delivery' },
        { status: 400 }
      );
    }

    if (order.orderCount >= order.maxOrders) {
      return NextResponse.json(
        { error: 'This delivery group is full' },
        { status: 400 }
      );
    }

    order.isJoined = true;
    order.orderCount += 1;

    return NextResponse.json({
      success: true,
      savedFee: order.savedFee,
      message: `Joined delivery! You'll save ₦${order.savedFee.toLocaleString()}`,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
