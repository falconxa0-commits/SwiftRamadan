import { NextRequest, NextResponse } from 'next/server';
import { getDirections } from '@/lib/maps';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  if (!origin || !destination) {
    return NextResponse.json(
      { success: false, message: 'origin and destination required' },
      { status: 400 },
    );
  }

  try {
    // Check Redis cache (24 hours)
    const cacheKey = `maps:directions:${origin}:${destination}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, result: cached });

    const result = await getDirections(origin, destination);

    // Cache for 24 hours
    if (result) await cacheSet(cacheKey, result, 86400);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Maps API] Directions error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/maps/directions' },
    });
    return NextResponse.json(
      { success: false, message: 'Directions failed' },
      { status: 500 },
    );
  }
}
