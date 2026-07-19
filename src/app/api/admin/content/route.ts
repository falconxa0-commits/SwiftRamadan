import { NextResponse } from 'next/server';

/* ─── Mock featured items ─── */
const mockFeaturedItems = [
  { id: 'feat-001', title: 'Ramadan Family Bundle', type: 'product' as const, position: 1, active: true, image: '/images/products/ramadan-box-1.png' },
  { id: 'feat-002', title: 'Mama Aisha Kitchen', type: 'vendor' as const, position: 2, active: true, image: '/images/vendors/vendor-1.png' },
  { id: 'feat-003', title: 'Iftar Meals', type: 'category' as const, position: 3, active: true, image: '/images/categories/cat-iftar.png' },
  { id: 'feat-004', title: 'Jollof Rice Special', type: 'product' as const, position: 4, active: false, image: '/images/meals/meal-jollof.png' },
  { id: 'feat-005', title: 'Sahur Collection', type: 'category' as const, position: 5, active: true, image: '/images/categories/cat-sahur.png' },
];

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: mockFeaturedItems });
  } catch (error) {
    console.error('[Admin Content] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { itemId, action } = body;

    if (!itemId || !action) {
      return NextResponse.json({ success: false, error: 'itemId and action required' }, { status: 400 });
    }

    const item = mockFeaturedItems.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    switch (action) {
      case 'toggle':
        item.active = !item.active;
        break;
      case 'update-position':
        if (typeof body.position === 'number') item.position = body.position;
        break;
      case 'delete':
        const idx = mockFeaturedItems.findIndex((i) => i.id === itemId);
        if (idx > -1) mockFeaturedItems.splice(idx, 1);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('[Admin Content PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update content' }, { status: 500 });
  }
}
