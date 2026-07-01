import { NextRequest, NextResponse } from 'next/server';
import { getHijriCalendar, isRamadan } from '@/lib/islamic/aladhan';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '9'); // Default: Ramadan
    const year = parseInt(searchParams.get('year') || '1447');

    // Check Redis cache (24 hours)
    const cacheKey = `hijri-calendar:${month}:${year}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const calendar = await getHijriCalendar({ month, year });
    const ramadanStatus = calendar.length > 0 ? isRamadan(calendar[0]?.month?.en || '') : false;

    const result = {
      success: true,
      month,
      year,
      isRamadan: ramadanStatus,
      calendar,
    };

    // Cache for 24 hours
    await cacheSet(cacheKey, result, 86400);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/hijri-calendar' },
    });
    return NextResponse.json({ success: false, message: 'Hijri calendar error' }, { status: 500 });
  }
}
