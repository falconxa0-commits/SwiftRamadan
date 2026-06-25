import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ──────────── helpers ──────────── */

// Resolve vendorId / vendorEmail to a real User.id.
// SECURITY (fix S8): previously this returned the raw `vendorId` string without verifying
// it referred to an existing user — meaning any opaque string was treated as a valid
// vendor identity. Now both branches verify the user actually exists in the DB.
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
    return NextResponse.json(
      { success: false, error: 'Server error', products: [] },
      { status: 500 }
    );
  }
}

/* ──────────── POST: create product (auto-sets vendorId) ──────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, image, category, deliveryTime, vendorId, vendorEmail } = body;

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

    const resolvedId = await resolveVendorId(vendorId, vendorEmail);
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found — pass vendorId or vendorEmail' },
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
        vendorId: resolvedId,
        inStock: true,
        rating: 0,
        reviewCount: 0,
      },
    });

    return NextResponse.json(
      { success: true, product: serialize(product) },
      { status: 201 }
    );
  } catch (error) {
    console.error('[api/vendor/products] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ──────────── PUT: update product (verify ownership) ────────────
 * SECURITY (fix S8 — ownership bypass):
 *   Previously the ownership check was `if (resolvedVendorId && existing.vendorId !== ...)`.
 *   When the request supplied NEITHER `vendorId` NOR `vendorEmail`, `resolvedVendorId`
 *   was `null` and the entire check was skipped — letting anyone edit any product.
 *
 * New behaviour:
 *   - Require `vendorId` or `vendorEmail` (401 "Vendor identity required" if neither).
 *   - Resolve to a real User.id (401 if the identifier doesn't match any user).
 *   - Block updates on legacy products (vendorId === null) — no admin role exists to allow
 *     an override, so 403 "You don't own this product".
 *   - 403 if `existing.vendorId !== resolvedVendorId`.
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();

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
    return NextResponse.json({ success: true, product: serialize(product) });
  } catch (error) {
    console.error('[api/vendor/products] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ──────────── DELETE: delete product (verify ownership) ────────────
 * SECURITY (fix S8 — ownership bypass): same fix as PUT — see comment above.
 */
export async function DELETE(request: NextRequest) {
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

    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('[api/vendor/products] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
