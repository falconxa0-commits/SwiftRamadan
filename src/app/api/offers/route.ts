import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { formatNaira } from '@/lib/format';

export const runtime = 'nodejs';

// GET /api/offers → returns a mix of active coupons from DB + curated static offers.
// Seeding is handled by /api/coupons (same table) — this GET does NOT mutate.
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    // Pull active coupons from DB (read-only — no seeding on GET)
    const coupons = await db.coupon.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Static curated offers (flash sales + Ramadan specials that aren't coupons)
    const curatedOffers = [
      {
        id: 'flash-iftar-bundle',
        type: 'flash-sale',
        title: 'Iftar Family Bundle',
        description: 'Feeds 4-6 people — 39% off for the next 2 hours',
        image: '/images/flash-sales/flash-iftar-bundle.png',
        originalPrice: 18000,
        salePrice: 11000,
        discountPercent: 39,
        endsInMinutes: 135,
      },
      {
        id: 'flash-dates',
        type: 'flash-sale',
        title: 'Premium Dates Box',
        description: 'Medjool dates from Saudi — 38% off',
        image: '/images/flash-sales/flash-dates.png',
        originalPrice: 12000,
        salePrice: 7500,
        discountPercent: 38,
        endsInMinutes: 105,
      },
      {
        id: 'flash-zobo-kunu',
        type: 'flash-sale',
        title: 'Zobo & Kunu Pack',
        description: 'Refreshing local drinks — 44% off',
        image: '/images/flash-sales/flash-zobo-kunu.png',
        originalPrice: 5000,
        salePrice: 2800,
        discountPercent: 44,
        endsInMinutes: 210,
      },
      {
        id: 'ramadan-special-box',
        type: 'ramadan-special',
        title: 'The Ultimate Ramadan Box',
        description: 'Curated Iftar & Sahur essentials — 30% off',
        image: '/images/products/ramadan-box-1.png',
        originalPrice: 25000,
        salePrice: 17500,
        discountPercent: 30,
        endsInMinutes: null,
      },
    ];

    // Format coupons as offer objects (so OffersTab can render them uniformly)
    const couponOffers = coupons.map(c => {
      const discountLabel =
        c.type === 'percent' ? `${c.value}% off` : `${formatNaira(c.value)} off`;
      const color = c.type === 'percent'
        ? (c.value >= 20 ? '#A78BFA' : '#10E07A')
        : '#F5C451';
      return {
        id: `coupon-${c.id}`,
        type: 'coupon',
        code: c.code,
        title: c.code,
        description: `${discountLabel} — min ${formatNaira(c.minOrder)}`,
        discountLabel,
        color,
        minOrder: c.minOrder,
        value: c.value,
        couponType: c.type,
        usesLeft: Math.max(0, c.maxUses - c.uses),
      };
    });

    return NextResponse.json({
      success: true,
      coupons: couponOffers,
      offers: curatedOffers,
      flashSales: curatedOffers.filter(o => o.type === 'flash-sale'),
      ramadanSpecials: curatedOffers.filter(o => o.type === 'ramadan-special'),
    });
  } catch (error) {
    console.error('Offers API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/offers' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch offers' },
      { status: 500 },
    );
  }
}
