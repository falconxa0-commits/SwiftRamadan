import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

// POST /api/analytics — receive analytics events (for production use)
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { success: false, message: 'events array required' },
        { status: 400 }
      );
    }

    // Cap to prevent abuse
    if (events.length > 500) {
      return NextResponse.json(
        { success: false, message: 'too many events in a single batch (max 500)' },
        { status: 413 }
      );
    }

    // In production, store in DB or send to analytics provider

    return NextResponse.json({ success: true, received: events.length });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/analytics' },
    });
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 });
  }
}
