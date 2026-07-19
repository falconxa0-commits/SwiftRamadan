import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const metrics = {
      totalUsers: 12847,
      totalOrders: 34562,
      totalRevenue: 287500000,
      activeVendors: 243,
      activeRiders: 189,
      revenueTrend: [
        { day: 'Mon', revenue: 38500000 },
        { day: 'Tue', revenue: 42100000 },
        { day: 'Wed', revenue: 36700000 },
        { day: 'Thu', revenue: 45300000 },
        { day: 'Fri', revenue: 52800000 },
        { day: 'Sat', revenue: 41200000 },
        { day: 'Sun', revenue: 30900000 },
      ],
      ordersByStatus: [
        { status: 'Delivered', count: 24189, color: '#10E07A' },
        { status: 'Preparing', count: 3241, color: '#F5C451' },
        { status: 'Confirmed', count: 2187, color: '#38BDF8' },
        { status: 'Dispatched', count: 2743, color: '#56b3f8' },
        { status: 'Cancelled', count: 2202, color: '#ef4444' },
      ],
      topVendors: [
        { name: 'Mama Aisha Kitchen', revenue: 12450000, orders: 3241 },
        { name: 'Lagos Bites', revenue: 9870000, orders: 2876 },
        { name: 'Iftar Express', revenue: 8320000, orders: 2134 },
        { name: 'Suya Palace', revenue: 6450000, orders: 1987 },
        { name: 'Sahur Delights', revenue: 5210000, orders: 1654 },
      ],
    };

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('[Admin Metrics] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
