import { NextRequest, NextResponse } from 'next/server';
import { searchNearbyPlaces } from '@/lib/maps';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '6.5244');
  const lng = parseFloat(searchParams.get('lng') || '3.3792');
  const radius = parseInt(searchParams.get('radius') || '3000');
  const type = searchParams.get('type') || 'restaurant';
  const keyword = searchParams.get('keyword') || undefined;

  try {
    // Check Redis cache (24 hours)
    const cacheKey = `maps:nearby:${lat}:${lng}:${radius}:${type}:${keyword || ''}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, places: cached });

    const places = await searchNearbyPlaces({ lat, lng, radius, type, keyword });

    // Cache for 24 hours
    if (places) await cacheSet(cacheKey, places, 86400);

    return NextResponse.json({ success: true, places });
  } catch (error) {
    console.error('[Maps API] Nearby search error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/maps/nearby' },
    });
    return NextResponse.json(
      { success: false, message: 'Nearby search failed' },
      { status: 500 },
    );
  }
}
