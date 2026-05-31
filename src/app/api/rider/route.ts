import { NextResponse } from 'next/server';

// Mock rider data
const riderData = {
  name: 'Babatunde Yusuf',
  tier: 'Elite Rider',
  memberSince: 'Oct 2023',
  location: 'Lagos, NG',
  todayEarnings: 24500,
  completedToday: 12,
  rating: 4.9,
  online: true,
  activeDelivery: {
    id: 'DEL-8825',
    customer: 'Amina O.',
    address: '15 Bourdillon Rd, Ikoyi',
    items: 'Ramadan Box Premium',
    progress: 65,
    eta: '8 min',
  },
  deliveryRequests: [
    {
      id: 'DEL-8829',
      customer: 'Ahmed K.',
      address: '12 Admiralty Way, Lekki Phase 1',
      items: '1x Jollof Rice & Lamb Platter, 2x Zobo',
      amount: 8500,
      deliveryFee: 1200,
      iftarDeadline: '6:42 PM',
      minutesUntilIftar: 22,
      distance: '3.2 km',
      priority: 'iftar',
    },
    {
      id: 'DEL-8831',
      customer: 'Fatima B.',
      address: '8 Akin Adesola St, Victoria Island',
      items: 'Large Suya Sampler, 4x Masa Cakes',
      amount: 6700,
      deliveryFee: 1000,
      iftarDeadline: '6:45 PM',
      minutesUntilIftar: 25,
      distance: '2.1 km',
      priority: 'iftar',
    },
    {
      id: 'DEL-8835',
      customer: 'Yusuf M.',
      address: '5 Awolowo Rd, Ikoyi',
      items: '2x Date Smoothie, 1x Moi Moi',
      amount: 5200,
      deliveryFee: 900,
      iftarDeadline: '7:00 PM',
      minutesUntilIftar: 40,
      distance: '4.5 km',
      priority: 'standard',
    },
  ],
  earningsBreakdown: {
    basePay: 15000,
    iftarBonuses: 6500,
    tips: 3000,
    onTimeRate: 98,
    avgRating: 4.9,
  },
  performanceMetrics: {
    completionRate: 99.2,
    rating: 4.98,
    compliments: 128,
    incentiveProgress: 85,
  },
};

export async function GET() {
  return NextResponse.json({ success: true, data: riderData });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, deliveryId } = body;

  if (action === 'accept-delivery' && deliveryId) {
    return NextResponse.json({
      success: true,
      message: `Delivery ${deliveryId} accepted. Head to pickup location.`,
      data: { deliveryId, status: 'accepted', pickupAddress: 'Suya Central, Victoria Island' },
    });
  }

  if (action === 'decline-delivery' && deliveryId) {
    return NextResponse.json({
      success: true,
      message: `Delivery ${deliveryId} declined.`,
    });
  }

  if (action === 'toggle-online') {
    return NextResponse.json({
      success: true,
      message: `You are now ${body.online ? 'online' : 'offline'}.`,
    });
  }

  if (action === 'cash-out') {
    return NextResponse.json({
      success: true,
      message: 'Cash out request submitted. Payment will arrive in 1-2 hours.',
      data: { amount: 24500, reference: 'CO-' + Date.now() },
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}
