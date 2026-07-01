import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, productCreateSchema, productUpdateSchema } from '@/lib/validation';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/redis';

// Returns true if the user exists (or vendorId is null/undefined). Returns
// false if a vendorId was provided but no matching User record was found —
// which would otherwise cause a Prisma foreign-key violation on
// `db.product.create()`.
async function assertUserExists(userId: string | undefined): Promise<boolean> {
  if (!userId) return true;
  const u = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  return !!u;
}

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

/* ──────────── GET: static + DB-backed products ──────────── */

export async function GET(request: NextRequest) {
  // Rate limit: 100 requests per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    // Check Redis cache (5 minutes)
    const cacheKey = 'products:all';
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ products: cached });

    const dbProducts = await db.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const dbMapped = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice ?? undefined,
      originalPrice: p.originalPrice ?? undefined,
      category: p.category,
      rating: p.rating,
      reviews: p.reviewCount,
      deliveryTime: p.deliveryTime,
      inStock: p.inStock,
      image: p.image,
      images: safeParseImages(p.images),
      vendorId: p.vendorId,
      createdAt: p.createdAt,
    }));
    const result = [...dbMapped, ...staticProducts];
    // Cache for 5 minutes
    await cacheSet(cacheKey, result, 300);
    return NextResponse.json({ products: result });
  } catch (error) {
    // Fallback to static if DB unavailable
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/products' } });
    return NextResponse.json({ products: staticProducts });
  }
}

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

/* ──────────── POST: create product ──────────── */

export async function POST(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    // Validate payload — schema strips unknown fields silently
    const v = validateInput(productCreateSchema, body);
    if (!v.success) return v.response;
    const { name, description, price, image, category, vendorId, deliveryTime } = v.data;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { success: false, error: 'price must be a non-negative number' },
        { status: 400 }
      );
    }

    // Normalize vendorId: treat empty string as null so the FK guard treats it
    // as "no vendor specified" rather than a malformed id.
    const normalizedVendorId =
      typeof vendorId === 'string' && vendorId.trim() ? vendorId : undefined;

    // FK guard: verify the vendor exists before creating the product,
    // otherwise Prisma throws a foreign-key violation → 500.
    if (normalizedVendorId && !(await assertUserExists(normalizedVendorId))) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        description: typeof description === 'string' ? description : '',
        price,
        image: typeof image === 'string' ? image : '',
        images: JSON.stringify(typeof image === 'string' && image ? [image] : []),
        category: typeof category === 'string' && category ? category : 'meals',
        deliveryTime: typeof deliveryTime === 'string' && deliveryTime ? deliveryTime : '30 min',
        vendorId: normalizedVendorId ?? null,
        inStock: true,
        rating: 0,
        reviewCount: 0,
      },
    });

    // Invalidate products cache
    await cacheInvalidate('products:all');

    return NextResponse.json({ success: true, product: serialize(product) }, { status: 201 });
  } catch (error) {
    console.error('[api/products] POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/products' } });
    await cacheInvalidate('products:all');
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ──────────── PUT: update product (partial) ──────────── */

export async function PUT(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    // Validate the updatable fields (schema strips unknown fields like id silently)
    const v = validateInput(productUpdateSchema, fields);
    if (!v.success) return v.response;

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
      'vendorId',
    ];
    for (const key of allowed) {
      if (key in fields) data[key] = fields[key];
    }
    // Keep images JSON in sync if image provided
    if (typeof fields.image === 'string' && fields.image) {
      data.images = JSON.stringify([fields.image]);
    }

    const product = await db.product.update({
      where: { id },
      data,
    });

    // Invalidate products cache
    await cacheInvalidate('products:all');

    return NextResponse.json({ success: true, product: serialize(product) });
  } catch (error) {
    console.error('[api/products] PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/products' } });
    await cacheInvalidate('products:all');
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ──────────── DELETE: delete product ──────────── */

export async function DELETE(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id query param is required' },
        { status: 400 }
      );
    }

    await db.product.delete({ where: { id } });

    // Invalidate products cache
    await cacheInvalidate('products:all');

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('[api/products] DELETE error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/products' } });
    await cacheInvalidate('products:all');
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
