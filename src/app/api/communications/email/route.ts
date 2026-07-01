import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/communications/resend';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const { to, subject, html, from } = await request.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, message: 'to, subject, html required' }, { status: 400 });
    }
    const result = await sendEmail({ to, subject, html, from });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/communications/email' },
    });
    return NextResponse.json({ success: false, message: 'Email failed' }, { status: 500 });
  }
}
