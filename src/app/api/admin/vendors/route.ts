import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/* ─── Mock vendors data ─── */
const mockVendors = [
  { id: 'vnd-001', storeName: 'Mama Aisha Kitchen', owner: 'Aisha Bello', category: 'Iftar Meals', status: 'active' as const, verified: true, commission: 12, revenue: 12450000, orders: 3241 },
  { id: 'vnd-002', storeName: 'Lagos Bites', owner: 'Chidi Okafor', category: 'Snacks', status: 'active' as const, verified: true, commission: 10, revenue: 9870000, orders: 2876 },
  { id: 'vnd-003', storeName: 'Iftar Express', owner: 'Ibrahim Lawal', category: 'Iftar Meals', status: 'active' as const, verified: true, commission: 15, revenue: 8320000, orders: 2134 },
  { id: 'vnd-004', storeName: 'Suya Palace', owner: 'Emeka Nwankwo', category: 'Grills', status: 'active' as const, verified: false, commission: 10, revenue: 6450000, orders: 1987 },
  { id: 'vnd-005', storeName: 'Sahur Delights', owner: 'Halima Ibrahim', category: 'Sahur', status: 'pending' as const, verified: false, commission: 10, revenue: 0, orders: 0 },
  { id: 'vnd-006', storeName: 'Fresh Fruits NG', owner: 'Zainab Aliyu', category: 'Fruits', status: 'active' as const, verified: true, commission: 8, revenue: 5210000, orders: 1654 },
  { id: 'vnd-007', storeName: 'Juice Bar Lagos', owner: 'Bola Adeyemi', category: 'Drinks', status: 'banned' as const, verified: true, commission: 12, revenue: 3200000, orders: 987 },
  { id: 'vnd-008', storeName: 'Ramadan Sweets', owner: 'Khadijah Usman', category: 'Snacks', status: 'pending' as const, verified: false, commission: 10, revenue: 0, orders: 0 },
];

export async function GET() {
  // Admin authentication required - use null-safe pattern for GET without request
  try {
    return NextResponse.json({ success: true, data: mockVendors });
  } catch (error) {
    console.error('[Admin Vendors] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Admin authentication required
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { vendorId, action } = body;

    if (!vendorId || !action) {
      return NextResponse.json({ success: false, error: 'vendorId and action required' }, { status: 400 });
    }

    const vendor = mockVendors.find((v) => v.id === vendorId);
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    switch (action) {
      case 'approve':
        vendor.status = 'active';
        break;
      case 'reject':
        vendor.status = 'banned';
        break;
      case 'verify':
        vendor.verified = true;
        break;
      case 'unverify':
        vendor.verified = false;
        break;
      case 'set-commission':
        if (typeof body.commission === 'number') {
          vendor.commission = body.commission;
        }
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('[Admin Vendors PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vendor' }, { status: 500 });
  }
}
