import { NextRequest, NextResponse } from 'next/server';

/* ─── Mock users data ─── */
const mockUsers = [
  { id: 'usr-001', name: 'Amina Bello', email: 'amina@email.com', role: 'customer' as const, status: 'active' as const, joined: 'Jan 2026', verified: true },
  { id: 'usr-002', name: 'Sani Musa', email: 'sani@swiftramadan.app', role: 'vendor' as const, status: 'active' as const, joined: 'Dec 2025', verified: true },
  { id: 'usr-003', name: 'Chidi Okafor', email: 'chidi@email.com', role: 'rider' as const, status: 'active' as const, joined: 'Feb 2026', verified: true },
  { id: 'usr-004', name: 'Fatima Abdullahi', email: 'fatima@email.com', role: 'customer' as const, status: 'banned' as const, joined: 'Nov 2025', verified: false },
  { id: 'usr-005', name: 'Ibrahim Lawal', email: 'ibrahim@email.com', role: 'vendor' as const, status: 'active' as const, joined: 'Jan 2026', verified: true },
  { id: 'usr-006', name: 'Ngozi Eze', email: 'ngozi@email.com', role: 'customer' as const, status: 'active' as const, joined: 'Mar 2026', verified: false },
  { id: 'usr-007', name: 'Yusuf Garba', email: 'yusuf@email.com', role: 'rider' as const, status: 'active' as const, joined: 'Feb 2026', verified: true },
  { id: 'usr-008', name: 'Halima Ibrahim', email: 'halima@email.com', role: 'vendor' as const, status: 'pending' as const, joined: 'Mar 2026', verified: false },
  { id: 'usr-009', name: 'Emeka Nwankwo', email: 'emeka@email.com', role: 'customer' as const, status: 'active' as const, joined: 'Jan 2026', verified: true },
  { id: 'usr-010', name: 'Aisha Mohammed', email: 'aisha@email.com', role: 'admin' as const, status: 'active' as const, joined: 'Oct 2025', verified: true },
  { id: 'usr-011', name: 'Bola Adeyemi', email: 'bola@email.com', role: 'customer' as const, status: 'active' as const, joined: 'Feb 2026', verified: false },
  { id: 'usr-012', name: 'Abdul Rahman', email: 'abdul@email.com', role: 'rider' as const, status: 'banned' as const, joined: 'Dec 2025', verified: false },
  { id: 'usr-013', name: 'Zainab Aliyu', email: 'zainab@email.com', role: 'vendor' as const, status: 'active' as const, joined: 'Nov 2025', verified: true },
  { id: 'usr-014', name: 'Oluwaseun Bakare', email: 'seun@email.com', role: 'customer' as const, status: 'active' as const, joined: 'Mar 2026', verified: true },
  { id: 'usr-015', name: 'Khadijah Usman', email: 'khadijah@email.com', role: 'customer' as const, status: 'active' as const, joined: 'Jan 2026', verified: false },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'All';

    let filtered = [...mockUsers];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    if (role && role !== 'All') {
      filtered = filtered.filter((u) => u.role === role.toLowerCase());
    }

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({ success: true, data: paginated, total: filtered.length });
  } catch (error) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'userId and action required' }, { status: 400 });
    }

    // Mock action processing
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'ban':
        user.status = 'banned';
        break;
      case 'unban':
        user.status = 'active';
        break;
      case 'verify':
        user.verified = true;
        break;
      case 'change-role':
        // Role change handled in body
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('[Admin Users PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
