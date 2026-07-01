import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, reverseGeocode } from '@/lib/maps';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    if (address) {
      // Check Redis cache (24 hours)
      const cacheKey = `maps:geocode:addr:${address}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return NextResponse.json({ success: true, result: cached });

      const result = await geocodeAddress(address);

      // Cache for 24 hours
      if (result) await cacheSet(cacheKey, result, 86400);

      return NextResponse.json({ success: true, result });
    } else if (lat && lng) {
      // Check Redis cache (24 hours)
      const cacheKey = `maps:geocode:rev:${lat}:${lng}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return NextResponse.json({ success: true, result: cached });

      const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));

      // Cache for 24 hours
      if (result) await cacheSet(cacheKey, result, 86400);

      return NextResponse.json({ success: true, result });
    }
    return NextResponse.json(
      { success: false, message: 'Provide address or lat/lng' },
      { status: 400 },
    );
  } catch (error) {
    console.error('[Maps API] Geocode error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/maps/geocode' },
    });
    return NextResponse.json(
      { success: false, message: 'Geocoding failed' },
      { status: 500 },
    );
  }
}
