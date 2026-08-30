import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheInvalidate } from '@/lib/redis';
import { requireAuth } from '@/lib/session';

/* ──────────── Static seed products (preserved for browse) ──────────── */

const staticProducts = [
  {
    id: 1,
    name: 'The Ultimate Ramadan Box',
    description:
      'Curated Iftar & Sahur essentials box filled with premium rice, cooking oil, dates, fruits, and spices to keep you and your family energized throughout the blessed month.',
    originalPrice: 25000,
    salePrice: 17500,
    category: 'bundles',
    rating: 4.9,
    reviews: 234,
    deliveryTime: '25-35 min',
    inStock: true,
    image: '/images/products/ramadan-box-1.png',
    images: [
      '/images/products/ramadan-box-1.png',
      '/images/products/ramadan-box-2.png',
      '/images/products/ramadan-box-3.png',
      '/images/products/ramadan-box-4.png',
    ],
    contents: '12 Premium Items',
  },
  {
    id: 2,
    name: 'Jollof Rice & Chicken',
    description: 'Smoky party jollof with succulent grilled chicken. A Lagos classic!',
    price: 4500,
    category: 'meals',
    rating: 4.9,
    reviews: 289,
    deliveryTime: '25 min',
    inStock: true,
    image: '/images/meals/meal-jollof.png',
    images: ['/images/meals/meal-jollof.png'],
  },
  {
    id: 3,
    name: 'Suya Platter',
    description: 'Spicy beef suya with fresh onions and tomatoes. A Lagos street food classic.',
    price: 3200,
    category: 'meals',
    rating: 4.8,
    reviews: 203,
    deliveryTime: '30 min',
    inStock: true,
    image: '/images/meals/meal-suya.png',
    images: ['/images/meals/meal-suya.png'],
  },
  {
    id: 4,
    name: 'Moi Moi & Pap',
    description: 'Steamed bean pudding with creamy corn pap. Perfect for Sahur.',
    price: 2800,
    category: 'meals',
    rating: 4.7,
    reviews: 156,
    deliveryTime: '20 min',
    inStock: true,
    image: '/images/meals/meal-moimoi.png',
    images: ['/images/meals/meal-moimoi.png'],
  },
  {
    id: 5,
    name: 'Date & Nut Smoothie',
    description: 'Energy-packed date smoothie with groundnuts. Great for Iftar or Sahur.',
    price: 1800,
    category: 'drinks',
    rating: 4.9,
    reviews: 178,
    deliveryTime: '15 min',
    inStock: true,
    image: '/images/meals/meal-smoothie.png',
    images: ['/images/meals/meal-smoothie.png'],
  },
  {
    id: 6,
    name: 'Premium Dates Box',
    description: 'Premium Ajwa and Medjool dates. Perfect for breaking your fast.',
    originalPrice: 12000,
    salePrice: 7500,
    category: 'bundles',
    rating: 4.7,
    reviews: 98,
    deliveryTime: '20-25 min',
    inStock: true,
    image: '/images/flash-sales/flash-dates.png',
    images: ['/images/flash-sales/flash-dates.png'],
  },
  {
    id: 7,
    name: 'Iftar Family Bundle',
    description: 'Complete Iftar meal for the whole family. Serves 6.',
    originalPrice: 18000,
    salePrice: 11000,
    category: 'bundles',
    rating: 4.8,
    reviews: 142,
    deliveryTime: '30-40 min',
    inStock: true,
    image: '/images/flash-sales/flash-iftar-bundle.png',
    images: ['/images/flash-sales/flash-iftar-bundle.png'],
  },
  {
    id: 8,
    name: 'Zobo & Kunu Pack',
    description: 'Traditional hibiscus and millet drinks. Refreshing and nutritious.',
    originalPrice: 5000,
    salePrice: 2800,
    category: 'drinks',
    rating: 4.6,
    reviews: 67,
    deliveryTime: '15-20 min',
    inStock: true,
    image: '/images/flash-sales/flash-zobo-kunu.png',
    images: ['/images/flash-sales/flash-zobo-kunu.png'],
  },
];

/* ──────────── Helpers ──────────── */

function safeParseImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serialize(p: Awaited<ReturnType<typeof db.product.findFirst>>) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice ?? undefined,
    originalPrice: p.originalPrice ?? undefined,
    category: p.category,
    rating: p.rating,
    reviews: p.reviewCount,
    reviewCount: p.reviewCount,
    deliveryTime: p.deliveryTime,
    inStock: p.inStock,
    image: p.image,
    images: safeParseImages(p.images),
    vendorId: p.vendorId,
    createdAt: p.createdAt,
  };
}

/** Check whether an ID refers to a static product (1–8) */
function isStaticProductId(id: string): boolean {
  const num = Number(id);
  return Number.isInteger(num) && num >= 1 && num <= 8;
}

/* ──────────── GET: single product by ID ──────────── */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 100 requests per minute per IP
  const rateLimited = await checkRateLimit(_request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;

    // 1. Check static products first
    if (isStaticProductId(id)) {
      const staticProduct = staticProducts.find((p) => p.id === Number(id));
      if (staticProduct) {
        return NextResponse.json({ product: staticProduct });
      }
    }

    // 2. Query database
    const dbProduct = await db.product.findUnique({ where: { id } });
    if (dbProduct) {
      return NextResponse.json({ product: serialize(dbProduct) });
    }

    // 3. Not found
    return NextResponse.json(
      { success: false, error: 'Product not found' },
      { status: 404 },
    );
  } catch (error) {
    console.error('[api/products/[id]] GET error:', error);
    await captureException(
      error instanceof Error ? error : new Error(String(error)),
      { tags: { route: '/api/products/[id]' } },
    );
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 },
    );
  }
}

/* ──────────── PUT: update product by ID ──────────── */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  // SECURITY FIX: Require authentication (audit B10).
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Cannot update static products
    if (isStaticProductId(id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot update static product' },
        { status: 400 },
      );
    }

    // SECURITY FIX: Ownership check (audit B10).
    // Only the vendor who owns the product (or an admin) can update it.
    // vendorId is REMOVED from the allowed-fields list to prevent product theft.
    const existing = await db.product.findUnique({ where: { id }, select: { vendorId: true } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 },
      );
    }
    if (auth.role !== 'admin' && existing.vendorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only update your own products' },
        { status: 403 },
      );
    }

    const body = await request.json();

    const data: Record<string, unknown> = {};
    const allowed = [
      'name',
      'description',
      'price',
      'salePrice',
      'originalPrice',
      'image',
      'category',
      'deliveryTime',
      'inStock',
      'rating',
      'reviewCount',
      // SECURITY: 'vendorId' intentionally removed — prevents product theft
    ];
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    // Keep images JSON in sync if image provided
    if (typeof body.image === 'string' && body.image) {
      data.images = JSON.stringify([body.image]);
    }

    const product = await db.product.update({
      where: { id },
      data,
    });

    // Invalidate products cache
    await cacheInvalidate('products:all');

    return NextResponse.json({ success: true, product: serialize(product) });
  } catch (error) {
    console.error('[api/products/[id]] PUT error:', error);
    await captureException(
      error instanceof Error ? error : new Error(String(error)),
      { tags: { route: '/api/products/[id]' } },
    );
    await cacheInvalidate('products:all');
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 },
    );
  }
}

/* ──────────── DELETE: delete product by ID ──────────── */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  // SECURITY FIX: Require authentication (audit B10).
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Cannot delete static products
    if (isStaticProductId(id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete static product' },
        { status: 400 },
      );
    }

    // SECURITY FIX: Ownership check (audit B10).
    // Only the vendor who owns the product (or an admin) can delete it.
    const existing = await db.product.findUnique({ where: { id }, select: { vendorId: true } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 },
      );
    }
    if (auth.role !== 'admin' && existing.vendorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only delete your own products' },
        { status: 403 },
      );
    }

    await db.product.delete({ where: { id } });

    // Invalidate products cache
    await cacheInvalidate('products:all');

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('[api/products/[id]] DELETE error:', error);
    await captureException(
      error instanceof Error ? error : new Error(String(error)),
      { tags: { route: '/api/products/[id]' } },
    );
    await cacheInvalidate('products:all');
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
