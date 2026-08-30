import { NextRequest, NextResponse } from 'next/server';
import { sendTermiiSMS } from '@/lib/communications/termii';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import { enqueueSMS } from '@/lib/queues';

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { to, message } = await request.json();
    if (!to || !message) {
      return NextResponse.json({ success: false, message: 'to and message required' }, { status: 400 });
    }

    // PHASE-10: enqueue via BullMQ for durable, retry-able delivery. The
    // queue worker calls the same `sendTermiiSMS` provider under the hood
    // (see `src/lib/queues/processors.ts`), so this is a transparent
    // migration — the only behavioural change is that the actual send now
    // happens in a worker process rather than the request thread. The
    // `enqueueSMS` helper returns `null` (no throw) when Redis is
    // unavailable; in that case we fall back to a direct synchronous send
    // so the API still functions without Redis.
    let queued = false;
    try {
      const jobId = await enqueueSMS({ to, message });
      queued = jobId !== null;
    } catch (err) {
      console.error('[communications/sms] enqueue failed, falling back to direct send:', err);
    }

    if (queued) {
      return NextResponse.json({ success: true, message: 'SMS queued', queued: true });
    }

    // Fallback: direct synchronous send (Redis unavailable or enqueue failed).
    const result = await sendTermiiSMS({ to, message });
    return NextResponse.json({ ...result, queued: false });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/communications/sms' },
    });
    return NextResponse.json({ success: false, message: 'SMS failed' }, { status: 500 });
  }
}
