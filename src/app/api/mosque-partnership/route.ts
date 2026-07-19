import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';

/* ───────── In-memory mosque partnership orders (fallback) ───────── */

interface MosqueOrder {
  id: string;
  mosqueName: string;
  mosqueArea: string;
  totalPacks: number;
  packsClaimed: number;
  pricePerPack: number;
  deadline: string;
  menuDescription: string;
  isJoined: boolean;
  myPacks: number;
  partners: number;
  status: 'open' | 'closing_soon' | 'fulfilled';
  deliveryTime: string;
  createdAt: string;
}

const MOCK_ORDERS: MosqueOrder[] = [
  {
    id: 'mo-1',
    mosqueName: 'Al-Huda Mosque',
    mosqueArea: 'Lekki Phase 1',
    totalPacks: 200,
    packsClaimed: 153,
    pricePerPack: 1500,
    deadline: '2h 15m left',
    menuDescription: 'Jollof rice, chicken, dates, zobo & water',
    isJoined: true,
    myPacks: 5,
    partners: 34,
    status: 'open',
    deliveryTime: '5:45 PM (before Maghrib)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mo-2',
    mosqueName: 'Central Mosque Ikeja',
    mosqueArea: 'Ikeja GRA',
    totalPacks: 500,
    packsClaimed: 453,
    pricePerPack: 1200,
    deadline: '45m left',
    menuDescription: 'Rice & stew, moin-moin, dates, kunu',
    isJoined: false,
    myPacks: 0,
    partners: 67,
    status: 'closing_soon',
    deliveryTime: '5:30 PM (before Maghrib)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mo-3',
    mosqueName: 'Ansar-Ud-Deen Mosque',
    mosqueArea: 'Surulere',
    totalPacks: 150,
    packsClaimed: 150,
    pricePerPack: 1800,
    deadline: 'Fulfilled',
    menuDescription: 'Special iftar: Fried rice, chicken, salad, chapman',
    isJoined: true,
    myPacks: 3,
    partners: 42,
    status: 'fulfilled',
    deliveryTime: '5:00 PM',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mo-4',
    mosqueName: 'Yaba Muslim Community',
    mosqueArea: 'Yaba',
    totalPacks: 100,
    packsClaimed: 38,
    pricePerPack: 1000,
    deadline: '5h left',
    menuDescription: 'Beans porridge, bread, dates, water',
    isJoined: false,
    myPacks: 0,
    partners: 12,
    status: 'open',
    deliveryTime: '6:00 PM',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mo-5',
    mosqueName: 'Victoria Island Islamic Centre',
    mosqueArea: 'Victoria Island',
    totalPacks: 300,
    packsClaimed: 210,
    pricePerPack: 2000,
    deadline: '3h left',
    menuDescription: 'Premium iftar: Ofada rice, assun, smoothies, dessert',
    isJoined: false,
    myPacks: 0,
    partners: 48,
    status: 'open',
    deliveryTime: '5:30 PM',
    createdAt: new Date().toISOString(),
  },
];

/* ───────── GET: Return mosque partnerships ───────── */

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status'); // open | closing_soon | fulfilled
  const joinedOnly = searchParams.get('joined') === 'true';

  // Try DB first for mosque partners
  try {
    const dbMosques = await db.mosquePartner.findMany({
      where: { status: 'active' },
    });

    if (dbMosques.length > 0) {
      const orders: MosqueOrder[] = dbMosques.map((m, i) => {
        const claimed = Math.floor(m.iftarCapacity * (0.5 + i * 0.1));
        const orderStatus: MosqueOrder['status'] = claimed >= m.iftarCapacity ? 'fulfilled' : claimed >= m.iftarCapacity * 0.8 ? 'closing_soon' : 'open';
        return {
          id: m.id,
          mosqueName: m.name,
          mosqueArea: m.area,
          totalPacks: m.iftarCapacity,
          packsClaimed: Math.min(claimed, m.iftarCapacity),
          pricePerPack: 1200 + i * 300,
          deadline: orderStatus === 'fulfilled' ? 'Fulfilled' : `${2 + i}h left`,
          menuDescription: `Iftar meal packs at ${m.name}`,
          isJoined: i === 0,
          myPacks: i === 0 ? 5 : 0,
          partners: Math.floor(m.iftarCapacity / 10),
          status: orderStatus,
          deliveryTime: '5:45 PM (before Maghrib)',
          createdAt: m.createdAt.toISOString(),
        };
      });

      let results = [...orders];
      if (status && ['open', 'closing_soon', 'fulfilled'].includes(status)) {
        results = results.filter((o) => o.status === status);
      }
      if (joinedOnly) {
        results = results.filter((o) => o.isJoined);
      }

      const totalPacks = results.reduce((sum, o) => sum + o.packsClaimed, 0);
      const totalPartners = results.reduce((sum, o) => sum + o.partners, 0);

      return NextResponse.json({
        success: true,
        count: results.length,
        totalPacks,
        totalPartners,
        orders: results,
      });
    }
  } catch {
    // Fallback to mock
  }

  let results = [...MOCK_ORDERS];

  if (status && ['open', 'closing_soon', 'fulfilled'].includes(status)) {
    results = results.filter((o) => o.status === status);
  }

  if (joinedOnly) {
    results = results.filter((o) => o.isJoined);
  }

  const totalPacks = results.reduce((sum, o) => sum + o.packsClaimed, 0);
  const totalPartners = results.reduce((sum, o) => sum + o.partners, 0);

  return NextResponse.json({
    success: true,
    count: results.length,
    totalPacks,
    totalPartners,
    orders: results,
  });
}

/* ───────── POST: Join a mosque order ───────── */

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await request.json();
    const { orderId, packs } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const numPacks = typeof packs === 'number' && packs > 0 ? packs : 10;

    // Try DB lookup for mosque partner
    try {
      const mosque = await db.mosquePartner.findUnique({ where: { id: orderId } });
      if (mosque) {
        return NextResponse.json({
          success: true,
          message: `${numPacks} packs added to ${mosque.name}. Community buying power!`,
          order: {
            id: mosque.id,
            mosqueName: mosque.name,
            packsClaimed: numPacks,
            totalPacks: mosque.iftarCapacity,
            myPacks: numPacks,
            totalCost: numPacks * 1500,
            status: 'open',
          },
        });
      }
    } catch {
      // Fallback
    }

    // Mock fallback
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status === 'fulfilled') {
      return NextResponse.json(
        { success: false, error: 'This order is already fulfilled' },
        { status: 400 }
      );
    }

    const newClaimed = Math.min(order.packsClaimed + numPacks, order.totalPacks);
    const isNowFulfilled = newClaimed >= order.totalPacks;

    order.packsClaimed = newClaimed;
    order.isJoined = true;
    order.myPacks += numPacks;
    order.partners += 1;
    order.status = isNowFulfilled ? 'fulfilled' : order.status;
    order.deadline = isNowFulfilled ? 'Fulfilled' : order.deadline;

    return NextResponse.json({
      success: true,
      message: `${numPacks} packs added to ${order.mosqueName}. Community buying power!`,
      order: {
        id: order.id,
        mosqueName: order.mosqueName,
        packsClaimed: order.packsClaimed,
        totalPacks: order.totalPacks,
        myPacks: order.myPacks,
        totalCost: order.myPacks * order.pricePerPack,
        status: order.status,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
