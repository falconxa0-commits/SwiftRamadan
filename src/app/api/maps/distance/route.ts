import { NextRequest, NextResponse } from 'next/server';
import { getDistanceMatrix } from '@/lib/maps';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const origins = searchParams.get('origins');
  const destinations = searchParams.get('destinations');

  if (!origins || !destinations) {
    return NextResponse.json(
      { success: false, message: 'origins and destinations required' },
      { status: 400 },
    );
  }

  try {
    // Check Redis cache (24 hours)
    const cacheKey = `maps:distance:${origins}:${destinations}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, result: cached });

    const result = await getDistanceMatrix(origins, destinations);

    // Cache for 24 hours
    if (result) await cacheSet(cacheKey, result, 86400);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Maps API] Distance error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/maps/distance' },
    });
    return NextResponse.json(
      { success: false, message: 'Distance calculation failed' },
      { status: 500 },
    );
  }
}
