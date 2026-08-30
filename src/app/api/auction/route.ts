import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';

// Fallback mock auctions
const MOCK_AUCTIONS = [
  {
    id: 1,
    name: 'Suya Platter Premium',
    vendor: 'Mama Aisha Kitchen',
    startPrice: 5000,
    currentPrice: 3500,
    dropRate: 200,
    totalStock: 10,
    remainingStock: 7,
    minutesLeft: 14,
    image: '/images/products/suya-platter.png',
    category: 'Iftar',
    active: true,
  },
  {
    id: 2,
    name: 'Ramadan Fruit Basket',
    vendor: 'Fresh Harvest NG',
    startPrice: 8000,
    currentPrice: 5200,
    dropRate: 300,
    totalStock: 5,
    remainingStock: 3,
    minutesLeft: 9,
    image: '/images/products/fruit-basket.png',
    category: 'Sahur',
    active: true,
  },
  {
    id: 3,
    name: 'Jollof Rice Family Pack',
    vendor: 'Alhaji Bello Foods',
    startPrice: 12000,
    currentPrice: 7800,
    dropRate: 500,
    totalStock: 8,
    remainingStock: 5,
    minutesLeft: 22,
    image: '/images/products/jollof-family.png',
    category: 'Iftar',
    active: true,
  },
];

export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const dbAuctions = await db.auctionItem.findMany({
      where: { status: 'live' },
      include: { bids: true },
      take: 50,
    });

    if (dbAuctions.length > 0) {
      const now = new Date();
      const auctions = dbAuctions.map(a => ({
        id: a.id,
        name: a.name,
        vendor: a.description || 'SwiftRamadan Vendor',
        startPrice: a.startPrice,
        currentPrice: a.currentBid || a.startPrice,
        dropRate: Math.floor(a.startPrice / 20),
        totalStock: 10,
        remainingStock: Math.max(1, 10 - a.bidCount),
        minutesLeft: Math.max(0, Math.round((a.endTime.getTime() - now.getTime()) / 60000)),
        image: a.image || '/images/products/suya-platter.png',
        category: 'Iftar' as const,
        active: a.status === 'live',
      }));
      return NextResponse.json({ auctions });
    }
  } catch {
    // Fallback to mock
  }

  return NextResponse.json({ auctions: MOCK_AUCTIONS.filter((a) => a.active) });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await request.json();
    const { auctionId, bidderName = 'Anonymous', userId = 'anonymous' } = body;

    if (!auctionId) {
      return NextResponse.json({ error: 'auctionId is required' }, { status: 400 });
    }

    // Try DB
    try {
      const auction = await db.auctionItem.findUnique({
        where: { id: String(auctionId) },
      });

      if (auction && auction.status === 'live') {
        const bidAmount = auction.currentBid || auction.startPrice;

        // Create bid record
        await db.auctionBid.create({
          data: {
            auctionId: auction.id,
            userId,
            bidderName,
            amount: bidAmount,
          },
        });

        // Update auction bid count
        await db.auctionItem.update({
          where: { id: auction.id },
          data: {
            bidCount: { increment: 1 },
          },
        });

        return NextResponse.json({
          success: true,
          message: `Grabbed "${auction.name}" for ₦${bidAmount.toLocaleString()}`,
          grabbedPrice: bidAmount,
          remainingStock: Math.max(0, 10 - auction.bidCount - 1),
        });
      }
    } catch {
      // Fallback to mock behavior
    }

    // Mock fallback
    const auction = MOCK_AUCTIONS.find((a) => String(a.id) === String(auctionId) && a.active);
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found or ended' }, { status: 404 });
    }

    if (auction.remainingStock <= 0) {
      return NextResponse.json({ error: 'Sold out' }, { status: 400 });
    }

    auction.remainingStock -= 1;
    if (auction.remainingStock <= 0) {
      auction.active = false;
    }

    return NextResponse.json({
      success: true,
      message: `Grabbed "${auction.name}" for ₦${auction.currentPrice.toLocaleString()}`,
      grabbedPrice: auction.currentPrice,
      remainingStock: auction.remainingStock,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
