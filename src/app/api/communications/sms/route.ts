import { NextRequest, NextResponse } from 'next/server';
import { sendTermiiSMS } from '@/lib/communications/termii';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { to, message } = await request.json();
    if (!to || !message) {
      return NextResponse.json({ success: false, message: 'to and message required' }, { status: 400 });
    }
    const result = await sendTermiiSMS({ to, message });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/communications/sms' },
    });
    return NextResponse.json({ success: false, message: 'SMS failed' }, { status: 500 });
  }
}
