import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/* ─── Mock orders data ─── */
const mockOrders = [
  { id: 'ord-a1b2c3d4e5f6', shortId: 'A1B2C3', customer: 'Amina Bello', vendor: 'Mama Aisha Kitchen', items: 3, total: 8500, status: 'Preparing', date: 'Mar 15, 2026', rider: null },
  { id: 'ord-b2c3d4e5f6g7', shortId: 'B2C3D4', customer: 'Chidi Okafor', vendor: 'Lagos Bites', items: 2, total: 4200, status: 'Confirmed', date: 'Mar 15, 2026', rider: 'Yusuf G.' },
  { id: 'ord-c3d4e5f6g7h8', shortId: 'C3D4E5', customer: 'Ngozi Eze', vendor: 'Iftar Express', items: 5, total: 15700, status: 'Delivered', date: 'Mar 14, 2026', rider: 'Chidi O.' },
  { id: 'ord-d4e5f6g7h8i9', shortId: 'D4E5F6', customer: 'Fatima Abdullahi', vendor: 'Suya Palace', items: 1, total: 3500, status: 'Cancelled', date: 'Mar 14, 2026', rider: null },
  { id: 'ord-e5f6g7h8i9j0', shortId: 'E5F6G7', customer: 'Ibrahim Lawal', vendor: 'Mama Aisha Kitchen', items: 4, total: 12000, status: 'Dispatched', date: 'Mar 15, 2026', rider: 'Yusuf G.' },
  { id: 'ord-f6g7h8i9j0k1', shortId: 'F6G7H8', customer: 'Bola Adeyemi', vendor: 'Fresh Fruits NG', items: 2, total: 6800, status: 'Preparing', date: 'Mar 15, 2026', rider: null },
  { id: 'ord-g7h8i9j0k1l2', shortId: 'G7H8I9', customer: 'Emeka Nwankwo', vendor: 'Lagos Bites', items: 3, total: 9200, status: 'Delivered', date: 'Mar 13, 2026', rider: 'Abdul R.' },
  { id: 'ord-h8i9j0k1l2m3', shortId: 'H8I9J0', customer: 'Khadijah Usman', vendor: 'Iftar Express', items: 1, total: 2800, status: 'Confirmed', date: 'Mar 15, 2026', rider: null },
];

export async function GET(request: NextRequest) {
  // Admin authentication required
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'All';

    let filtered = [...mockOrders];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) => o.shortId.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All') {
      filtered = filtered.filter((o) => o.status === status);
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error('[Admin Orders] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Admin authentication required
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { orderId, action } = body;

    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: 'orderId and action required' }, { status: 400 });
    }

    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    switch (action) {
      case 'change-status':
        if (body.status) order.status = body.status;
        break;
      case 'assign-rider':
        if (body.riderName) order.rider = body.riderName;
        break;
      case 'refund':
        order.status = 'Cancelled';
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('[Admin Orders PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
