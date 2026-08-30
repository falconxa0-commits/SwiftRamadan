import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/communications/resend';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import { enqueueEmail } from '@/lib/queues';

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { to, subject, html, from } = await request.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, message: 'to, subject, html required' }, { status: 400 });
    }

    // PHASE-10: enqueue via BullMQ for durable, retry-able delivery. The
    // queue worker calls the same `sendEmail` provider under the hood
    // (see `src/lib/queues/processors.ts`), so this is a transparent
    // migration — the only behavioural change is that the actual send now
    // happens in a worker process rather than the request thread. The
    // `enqueueEmail` helper returns `null` (no throw) when Redis is
    // unavailable; in that case we fall back to a direct synchronous send
    // so the API still functions without Redis.
    let queued = false;
    try {
      const jobId = await enqueueEmail({ to, subject, html, from });
      queued = jobId !== null;
    } catch (err) {
      console.error('[communications/email] enqueue failed, falling back to direct send:', err);
    }

    if (queued) {
      return NextResponse.json({ success: true, message: 'Email queued', queued: true });
    }

    // Fallback: direct synchronous send (Redis unavailable or enqueue failed).
    const result = await sendEmail({ to, subject, html, from });
    return NextResponse.json({ ...result, queued: false });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/communications/email' },
    });
    return NextResponse.json({ success: false, message: 'Email failed' }, { status: 500 });
  }
}
