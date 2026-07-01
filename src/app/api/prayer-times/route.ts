import { NextRequest, NextResponse } from 'next/server';
import { getPrayerTimesByCoords, getPrayerTimesByCity } from '@/lib/islamic/aladhan';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const city = searchParams.get('city') || 'Lagos';
    const country = searchParams.get('country') || 'Nigeria';
    const method = parseInt(searchParams.get('method') || '3');

    // Check Redis cache (1 hour)
    const cacheKey = lat && lng
      ? `prayer-times:coords:${lat}:${lng}:${method}`
      : `prayer-times:${city}:${country}:${method}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, prayerTimes: cached });

    let result;
    if (lat && lng) {
      result = await getPrayerTimesByCoords({ lat: parseFloat(lat), lng: parseFloat(lng), method });
    } else {
      result = await getPrayerTimesByCity({ city, country, method });
    }

    if (result) {
      // Cache for 1 hour
      await cacheSet(cacheKey, result, 3600);
      return NextResponse.json({ success: true, prayerTimes: result });
    }
    return NextResponse.json({ success: false, message: 'Could not fetch prayer times' }, { status: 500 });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/prayer-times' },
    });
    return NextResponse.json({ success: false, message: 'Prayer times API error' }, { status: 500 });
  }
}
