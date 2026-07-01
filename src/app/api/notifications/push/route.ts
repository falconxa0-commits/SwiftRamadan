import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/supabase';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

export const runtime = 'nodejs';

// POST /api/notifications/push — Send push notification
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { userId, title, body, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { success: false, message: 'userId, title, and body are required' },
        { status: 400 },
      );
    }

    const result = await sendPushNotification({ userId, title, body, data });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Push notification API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/notifications/push' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to send notification' },
      { status: 500 },
    );
  }
}
