import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, addressSchema } from '@/lib/validation';
import { geocodeAddress } from '@/lib/maps';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

/** Resolve email-or-id to real User.id; returns null if not found. */
async function resolveUserId(raw: string | null | undefined): Promise<string | null> {
  if (!raw || raw === 'guest') return null;
  const byId = await db.user.findUnique({ where: { id: raw } });
  if (byId) return byId.id;
  const byEmail = await db.user.findUnique({ where: { email: raw } });
  return byEmail?.id ?? null;
}

// GET /api/addresses?userId=xxx → returns addresses (default first)
export async function GET(request: NextRequest) {
  // Rate limit: 100 requests per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const userId = await resolveUserId(rawUserId);

    if (!userId) {
      return NextResponse.json({ addresses: [] });
    }

    const addresses = await db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Addresses API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/addresses' } });
    return NextResponse.json(
      { addresses: [], message: 'Failed to fetch addresses' },
      { status: 500 },
    );
  }
}

// POST /api/addresses { userId, label, address, area, city, instructions, lat?, lng?, isDefault }
export async function POST(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    // Validate payload
    const v = validateInput(addressSchema, body);
    if (!v.success) return v.response;
    const { userId: rawUserId, label, address, area, city, instructions, lat, lng, isDefault } = v.data;

    if (!rawUserId || !address) {
      return NextResponse.json(
        { success: false, message: 'userId and address are required' },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(rawUserId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not found — please log in to save addresses' },
        { status: 404 },
      );
    }

    // Auto-geocode if lat/lng not provided
    let finalLat = typeof lat === 'number' ? lat : null;
    let finalLng = typeof lng === 'number' ? lng : null;

    if (!finalLat || !finalLng) {
      const fullAddress = [address, area, city].filter(Boolean).join(', ');
      const geocoded = await geocodeAddress(fullAddress);
      if (geocoded) {
        finalLat = geocoded.lat;
        finalLng = geocoded.lng;
      }
    }

    // If this is set as default, unset previous defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const addressRecord = await db.address.create({
      data: {
        userId,
        label: String(label || 'Home'),
        address: String(address),
        area: String(area || ''),
        city: String(city || 'Lagos'),
        instructions: String(instructions || ''),
        lat: finalLat,
        lng: finalLng,
        isDefault: Boolean(isDefault),
      },
    });

    return NextResponse.json({ success: true, address: addressRecord }, { status: 201 });
  } catch (error) {
    console.error('Addresses API POST error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/addresses' } });
    return NextResponse.json(
      { success: false, message: 'Failed to create address' },
      { status: 500 },
    );
  }
}

// PUT /api/addresses { id, ...fields } → update address
export async function PUT(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { id, label, address, area, city, instructions, lat, lng, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Address id is required' },
        { status: 400 },
      );
    }

    // Validate updateable fields (partial schema strips `id` silently)
    const v = validateInput(addressSchema.partial(), body);
    if (!v.success) return v.response;

    const existing = await db.address.findUnique({ where: { id: String(id) } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 },
      );
    }

    // If marking as default, unset previous defaults for this user
    if (isDefault && !existing.isDefault) {
      await db.address.updateMany({
        where: { userId: existing.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (label !== undefined) updateData.label = String(label);
    if (address !== undefined) updateData.address = String(address);
    if (area !== undefined) updateData.area = String(area);
    if (city !== undefined) updateData.city = String(city);
    if (instructions !== undefined) updateData.instructions = String(instructions);
    if (lat !== undefined) updateData.lat = typeof lat === 'number' ? lat : null;
    if (lng !== undefined) updateData.lng = typeof lng === 'number' ? lng : null;
    if (isDefault !== undefined) updateData.isDefault = Boolean(isDefault);

    const updated = await db.address.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    console.error('Addresses API PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/addresses' } });
    return NextResponse.json(
      { success: false, message: 'Failed to update address' },
      { status: 500 },
    );
  }
}

// DELETE /api/addresses?id=xxx → delete address
export async function DELETE(request: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Address id is required' },
        { status: 400 },
      );
    }

    await db.address.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Addresses API DELETE error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/addresses' } });
    return NextResponse.json(
      { success: false, message: 'Failed to delete address' },
      { status: 500 },
    );
  }
}
