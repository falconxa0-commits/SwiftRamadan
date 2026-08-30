import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as usersService from '@/services/users/users.service';

// Fallback storefront data
const storefrontData = {
  id: 1,
  name: 'Mama Aisha Kitchen',
  tagline: 'Authentic Nigerian Iftar Since 2019',
  description: 'Handcrafted meals with love. Every dish tells a story of tradition and family.',
  avatar: 'MAK',
  isPremium: true,
  theme: 'aurora',
  rating: 4.9,
  reviewCount: 847,
  totalSales: 12500,
  followers: 3200,
  highlights: [
    { id: 1, title: 'Our Kitchen', views: 2400 },
    { id: 2, title: 'Jollof Prep', views: 1800 },
    { id: 3, title: 'Happy Iftar!', views: 3100 },
    { id: 4, title: 'Fresh Ingredients', views: 900 },
    { id: 5, title: 'Eid Special', views: 4200 },
  ],
  featuredProducts: [
    { id: 101, name: 'Signature Jollof Rice', price: 3500, sold: 5200, rating: 4.9, badge: 'Best Seller' },
    { id: 102, name: 'Suya Platter (Large)', price: 5000, originalPrice: 6000, sold: 3100, rating: 4.8, badge: 'Popular' },
    { id: 103, name: 'Pepper Soup Combo', price: 4500, sold: 2800, rating: 4.7 },
    { id: 104, name: 'Iftar Family Pack', price: 15000, originalPrice: 18000, sold: 1400, rating: 4.9, badge: 'Premium' },
  ],
  specialOffers: [
    { id: 1, title: 'Ramadan Bundle', discount: 20, code: 'RAMADAN20' },
    { id: 2, title: 'First Order Off', discount: 15, code: 'WELCOME15' },
  ],
  reviews: [
    { id: 1, user: 'Amina B.', rating: 5, comment: 'Best jollof in Lagos!', date: '2 days ago' },
    { id: 2, user: 'Yusuf K.', rating: 5, comment: 'Suya platter was amazing.', date: '1 week ago' },
    { id: 3, user: 'Halima M.', rating: 4, comment: 'Great food, reliable service.', date: '2 weeks ago' },
  ],
};

export async function GET() {
  // Try DB for vendor storefront
  try {
    const dbStorefront = await db.vendorStorefront.findFirst();
    if (dbStorefront) {
      return NextResponse.json({
        storefront: {
          id: dbStorefront.id,
          name: 'Mama Aisha Kitchen',
          tagline: dbStorefront.tagline || storefrontData.tagline,
          description: storefrontData.description,
          avatar: 'MAK',
          isPremium: dbStorefront.isPremium,
          theme: 'aurora',
          rating: dbStorefront.rating || storefrontData.rating,
          reviewCount: storefrontData.reviewCount,
          totalSales: storefrontData.totalSales,
          followers: storefrontData.followers,
          highlights: storefrontData.highlights,
          featuredProducts: storefrontData.featuredProducts,
          specialOffers: storefrontData.specialOffers,
          reviews: storefrontData.reviews,
          accentColor: dbStorefront.accentColor,
          specialties: JSON.parse(dbStorefront.specialties || '[]'),
        },
      });
    }
  } catch {
    // Fallback
  }

  return NextResponse.json({ storefront: storefrontData });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { theme, vendorId } = body;

    const validThemes = ['aurora', 'golden', 'royal', 'ocean'];
    if (!theme || !validThemes.includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme. Valid: aurora, golden, royal, ocean' }, { status: 400 });
    }

    storefrontData.theme = theme;

    // Try to update DB storefront
    try {
      if (vendorId) {
        // MIGRATED (Phase 11): defense-in-depth vendor existence check via
        // `usersService.getUserById`. The `vendorId` body field is used as
        // the FK on `vendorStorefront`. Verify the vendor exists before
        // upserting to prevent FK violations. Mirrors `/api/cart/route.ts`.
        const vendor = await usersService.getUserById(vendorId);
        if (!vendor) {
          return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        await db.vendorStorefront.upsert({
          where: { vendorId },
          update: {},
          create: {
            vendorId,
            tagline: storefrontData.tagline,
            isPremium: storefrontData.isPremium,
            rating: storefrontData.rating,
          },
        });
      }
    } catch {
      // Silently continue
    }

    return NextResponse.json({
      success: true,
      message: `Theme updated to "${theme}"`,
      storefront: storefrontData,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
