import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * In-memory Group Buy store (server-side slot tracking).
 * Resets when the server restarts — sufficient for the demo.
 */

interface GroupBuySlot {
  id: number;
  filled: number;
  total: number;
  joinedUserIds: string[];
}

interface GroupBuyDeal {
  id: number;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  salePrice: number;
  perPersonPrice: number;
  totalSlots: number;
  guaranteedDelivery: string;
  category: string;
}

// Static catalog of group buy deals (mirrors the frontend mock)
const GROUP_BUY_DEALS: GroupBuyDeal[] = [
  {
    id: 1,
    name: 'Whole Cow Split',
    description: 'Premium cow, freshly slaughtered. Split with your neighbors and save big!',
    image: '/images/meals/meal-suya.png',
    originalPrice: 350000,
    salePrice: 245000,
    perPersonPrice: 17500,
    totalSlots: 14,
    guaranteedDelivery: 'Friday, Mar 15',
    category: 'Livestock',
  },
  {
    id: 2,
    name: '50kg Rice Bulk Split',
    description: 'Premium long grain rice. 14 people, each gets ~3.5kg.',
    image: '/images/categories/cat-groceries.png',
    originalPrice: 45000,
    salePrice: 32000,
    perPersonPrice: 2286,
    totalSlots: 14,
    guaranteedDelivery: 'Thursday, Mar 14',
    category: 'Grains',
  },
  {
    id: 3,
    name: 'Cooking Oil 25L Split',
    description: 'Premium vegetable oil. Each person gets ~1.8L.',
    image: '/images/categories/cat-groceries.png',
    originalPrice: 28000,
    salePrice: 20000,
    perPersonPrice: 1429,
    totalSlots: 14,
    guaranteedDelivery: 'Saturday, Mar 16',
    category: 'Oils',
  },
  {
    id: 4,
    name: 'Dates Premium 10kg Split',
    description: 'Medjool dates, direct from Saudi. Each gets ~700g.',
    image: '/images/categories/cat-dates.png',
    originalPrice: 35000,
    salePrice: 25000,
    perPersonPrice: 1786,
    totalSlots: 14,
    guaranteedDelivery: 'Wednesday, Mar 13',
    category: 'Dates',
  },
];

// Initial slot fill counts (mirror the mock data)
const initialFilled: Record<number, number> = {
  1: 9,
  2: 11,
  3: 6,
  4: 4,
};

// Server-side in-memory slot tracking. Module-level variable persists across requests.
const slotStore: Map<number, GroupBuySlot> = new Map(
  GROUP_BUY_DEALS.map(d => [
    d.id,
    {
      id: d.id,
      filled: initialFilled[d.id] ?? 0,
      total: d.totalSlots,
      joinedUserIds: [],
    },
  ]),
);

// GET /api/group-buy → returns active group buys with slot counts
export async function GET() {
  try {
    const groupBuys = GROUP_BUY_DEALS.map(deal => {
      const slot = slotStore.get(deal.id);
      return {
        ...deal,
        filledSlots: slot?.filled ?? 0,
        totalSlots: deal.totalSlots,
        slotsLeft: deal.totalSlots - (slot?.filled ?? 0),
        isFull: (slot?.filled ?? 0) >= deal.totalSlots,
      };
    });

    return NextResponse.json({ groupBuys });
  } catch (error) {
    console.error('Group buy API GET error:', error);
    return NextResponse.json(
      { groupBuys: [], message: 'Failed to fetch group buys' },
      { status: 500 },
    );
  }
}

// POST /api/group-buy { userId, groupBuyId } → joins a group buy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: rawUserId, groupBuyId } = body;

    if (!groupBuyId) {
      return NextResponse.json(
        { success: false, message: 'groupBuyId is required' },
        { status: 400 },
      );
    }

    const dealId = Number(groupBuyId);
    const deal = GROUP_BUY_DEALS.find(d => d.id === dealId);
    if (!deal) {
      return NextResponse.json(
        { success: false, message: 'Group buy not found' },
        { status: 404 },
      );
    }

    const slot = slotStore.get(dealId);
    if (!slot) {
      return NextResponse.json(
        { success: false, message: 'Slot not initialized' },
        { status: 500 },
      );
    }

    const userKey = (typeof rawUserId === 'string' && rawUserId) || 'guest';

    // Already joined?
    if (slot.joinedUserIds.includes(userKey)) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        message: 'You have already joined this group buy',
        groupBuy: {
          id: deal.id,
          name: deal.name,
          filledSlots: slot.filled,
          totalSlots: slot.total,
          slotsLeft: slot.total - slot.filled,
          isFull: slot.filled >= slot.total,
        },
      });
    }

    // Full?
    if (slot.filled >= slot.total) {
      return NextResponse.json(
        { success: false, message: 'This group buy is already full' },
        { status: 200 },
      );
    }

    // Join
    slot.filled += 1;
    slot.joinedUserIds.push(userKey);

    return NextResponse.json({
      success: true,
      message: `Joined "${deal.name}" — slot reserved!`,
      groupBuy: {
        id: deal.id,
        name: deal.name,
        filledSlots: slot.filled,
        totalSlots: slot.total,
        slotsLeft: slot.total - slot.filled,
        isFull: slot.filled >= slot.total,
      },
    });
  } catch (error) {
    console.error('Group buy API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to join group buy' },
      { status: 500 },
    );
  }
}
