import { NextResponse } from 'next/server';

// Mock vendor data
const vendorData = {
  storeName: 'Suya Central',
  category: 'Ramadan 2026 Vendor',
  online: true,
  balance: 450000,
  pendingSettlement: 25400,
  totalEarnings: 1280000,
  todayRevenue: 87500,
  todayOrders: 24,
  avgOrderValue: 3646,
  incomingOrders: [
    {
      id: 'RAM-4829',
      customer: 'Ahmed K.',
      area: 'Lekki Phase 1',
      items: [{ name: 'Jollof Rice & Lamb Platter', qty: 1, price: 6500 }, { name: 'Zobo Drink', qty: 2, price: 2000 }],
      total: 8500,
      minutesUntilIftar: 22,
      status: 'incoming',
    },
    {
      id: 'RAM-4831',
      customer: 'Fatima B.',
      area: 'Victoria Island',
      items: [{ name: 'Large Suya Sampler', qty: 1, price: 4200 }, { name: 'Masa Cakes', qty: 4, price: 2500 }],
      total: 6700,
      minutesUntilIftar: 25,
      status: 'incoming',
    },
  ],
  transactions: [
    { id: 'TXN-001', reference: 'Order #RAM-4829', type: 'credit', amount: 12500, status: 'completed', date: 'Today, 2:45 PM' },
    { id: 'TXN-002', reference: 'Payout to GT Bank', type: 'debit', amount: 50000, status: 'processing', date: 'Yesterday, 10:15 AM' },
    { id: 'TXN-003', reference: 'Order #RAM-4811', type: 'credit', amount: 8200, status: 'completed', date: 'Mar 22, 2024' },
  ],
  salesInsights: {
    topSellingItem: 'Ramadan Box Premium',
    peakHour: '5:30 PM - 7:00 PM',
    customerRetention: 78,
    ramadanRevenue: 1280000,
    ramadanOrders: 847,
    dailyTrend: [
      { day: 'Mon', revenue: 65000 },
      { day: 'Tue', revenue: 72000 },
      { day: 'Wed', revenue: 87500 },
      { day: 'Thu', revenue: 91000 },
      { day: 'Fri', revenue: 105000 },
      { day: 'Sat', revenue: 98000 },
      { day: 'Sun', revenue: 82000 },
    ],
  },
};

export async function GET() {
  return NextResponse.json({ success: true, data: vendorData });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, orderId, menuItemId, available } = body;

  if (action === 'accept-order' && orderId) {
    return NextResponse.json({
      success: true,
      message: `Order ${orderId} accepted. Start preparing!`,
      data: { orderId, status: 'processing' },
    });
  }

  if (action === 'mark-ready' && orderId) {
    return NextResponse.json({
      success: true,
      message: `Order ${orderId} marked as ready for pickup.`,
      data: { orderId, status: 'ready' },
    });
  }

  if (action === 'toggle-availability' && menuItemId !== undefined) {
    return NextResponse.json({
      success: true,
      message: `Menu item ${menuItemId} is now ${available ? 'available' : 'unavailable'}.`,
    });
  }

  if (action === 'toggle-online') {
    return NextResponse.json({
      success: true,
      message: `Store is now ${body.online ? 'online' : 'offline'}.`,
    });
  }

  if (action === 'withdraw') {
    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted. Payment will arrive in 24 hours.',
      data: { amount: body.amount || 450000, reference: 'WD-' + Date.now() },
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}
