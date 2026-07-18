import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheInvalidate } from '@/lib/redis';
import { validateInput, productCreateSchema, checkBodySize } from '@/lib/validation';
import { requireAuth } from '@/lib/session';

/* ──────────── helpers ──────────── */

async function resolveVendorId(vendorId?: string | null, vendorEmail?: string | null) {
  if (vendorId) {
    const byId = await db.user.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (byId) return byId.id;
  }
  if (vendorEmail) {
    const byEmail = await db.user.findUnique({ where: { email: vendorEmail }, select: { id: true } });
    if (byEmail) return byEmail.id;
  }
  return null;
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
    reviewCount: p.reviewCount,
    deliveryTime: p.deliveryTime,
    inStock: p.inStock,
    image: p.image,
    images: safeParseImages(p.images),
    vendorId: p.vendorId,
    createdAt: p.createdAt,
  };
}

/* ──────────── GET: vendor's products ──────────── */

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('vendorEmail') || searchParams.get('email');

    const resolvedId = await resolveVendorId(vendorId, vendorEmail);
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found', products: [] },
        { status: 404 }
      );
    }

    const products = await db.product.findMany({
      where: { vendorId: resolvedId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      products: products.map((p) => serialize(p)),
      vendorId: resolvedId,
    });
  } catch (error) {
    console.error('[api/vendor/products] GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/vendor/products' },
    });
    return NextResponse.json(
      { success: false, error: 'Server error', products: [] },
      { status: 500 }
    );
  }
}

/* ──────────── POST: create product (auto-sets vendorId) ──────────── */

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'vendor') {
    return NextResponse.json(
      { success: false, error: 'Vendor access required' },
      { status: 403 }
    );
  }

  const bodyResult = await checkBodySize(request);
  if (bodyResult.tooLarge) return bodyResult.response;

  try {
    const rawBody = JSON.parse(bodyResult.body);
    const { vendorId, vendorEmail, ...productData } = rawBody;

    // Validate with Zod schema (consistent with /api/products)
    const v = validateInput(productCreateSchema, productData);
    if (!v.success) return v.response;

    const resolvedId = await resolveVendorId(vendorId, vendorEmail);
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found — pass vendorId or vendorEmail' },
        { status: 400 }
      );
    }

    // Verify the authenticated vendor matches the resolved vendor
    if (resolvedId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only create products for your own store' },
        { status: 403 }
      );
    }

    const product = await db.product.create({
      data: {
        name: v.data.name.trim(),
        description: v.data.description || '',
        price: v.data.price,
        image: v.data.image || '',
        images: JSON.stringify(v.data.image ? [v.data.image] : []),
        category: v.data.category,
        deliveryTime: v.data.deliveryTime,
        salePrice: v.data.salePrice,
        originalPrice: v.data.salePrice ? v.data.price : undefined,
        vendorId: resolvedId,
        inStock: true,
        rating: 0,
        reviewCount: 0,
      },
    });

    // Invalidate products cache
    await cacheInvalidate('products');

    return NextResponse.json(
      { success: true, product: serialize(product) },
      { status: 201 }
    );
  } catch (error) {
    console.error('[api/vendor/products] POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/vendor/products' },
    });
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ──────────── PUT: update product (verify ownership) ──────────── */
export async function PUT(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'vendor') {
    return NextResponse.json(
      { success: false, error: 'Vendor access required' },
      { status: 403 }
    );
  }

  const bodyResult = await checkBodySize(request);
  if (bodyResult.tooLarge) return bodyResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const vendorIdQ = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('vendorEmail') || searchParams.get('email');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id query param is required' },
        { status: 400 }
      );
    }

    const body = JSON.parse(bodyResult.body);

    if (!vendorIdQ && !vendorEmail) {
      return NextResponse.json(
        { success: false, error: 'Vendor identity required — pass vendorId or vendorEmail' },
        { status: 401 }
      );
    }
    const resolvedVendorId = await resolveVendorId(vendorIdQ, vendorEmail);
    if (!resolvedVendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor identity required — pass vendorId or vendorEmail' },
        { status: 401 }
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    if (!existing.vendorId || existing.vendorId !== resolvedVendorId) {
      return NextResponse.json(
        { success: false, error: "You don't own this product" },
        { status: 403 }
      );
    }

    // Verify the authenticated vendor owns this product
    if (existing.vendorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own products' },
        { status: 403 }
      );
    }

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
    ];
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    if (typeof body.image === 'string' && body.image) {
      data.images = JSON.stringify([body.image]);
    }

    const product = await db.product.update({ where: { id }, data });

    // Invalidate products cache
    await cacheInvalidate('products');

    return NextResponse.json({ success: true, product: serialize(product) });
  } catch (error) {
    console.error('[api/vendor/products] PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/vendor/products' },
    });
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ──────────── DELETE: delete product (verify ownership) ──────────── */
export async function DELETE(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'vendor') {
    return NextResponse.json(
      { success: false, error: 'Vendor access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const vendorIdQ = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('vendorEmail') || searchParams.get('email');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id query param is required' },
        { status: 400 }
      );
    }

    if (!vendorIdQ && !vendorEmail) {
      return NextResponse.json(
        { success: false, error: 'Vendor identity required — pass vendorId or vendorEmail' },
        { status: 401 }
      );
    }
    const resolvedVendorId = await resolveVendorId(vendorIdQ, vendorEmail);
    if (!resolvedVendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor identity required — pass vendorId or vendorEmail' },
        { status: 401 }
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    if (!existing.vendorId || existing.vendorId !== resolvedVendorId) {
      return NextResponse.json(
        { success: false, error: "You don't own this product" },
        { status: 403 }
      );
    }

    // Verify the authenticated vendor owns this product
    if (existing.vendorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own products' },
        { status: 403 }
      );
    }

    await db.product.delete({ where: { id } });

    // Invalidate products cache
    await cacheInvalidate('products');

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('[api/vendor/products] DELETE error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/vendor/products' },
    });
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
