import { NextRequest, NextResponse } from 'next/server';
import { registerDeviceToken } from '@/lib/supabase';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

export const runtime = 'nodejs';

// POST /api/auth/device-token — Register device for push notifications
// SECURITY FIX: Now requires authentication (audit B12).
// Previously, /api/auth/* was in the public route prefix, allowing anonymous
// attackers to register device tokens and intercept any user's push notifications.
// Now we verify the session AND ensure the userId matches the authenticated user.
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.auth);
  if (rateLimited) return rateLimited;

  // Require authentication — only the logged-in user can register their own device
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { userId, token, platform } = await request.json();

    if (!userId || !token || !platform) {
      return NextResponse.json(
        { success: false, message: 'userId, token, and platform are required' },
        { status: 400 },
      );
    }

    // SECURITY: The authenticated user can only register their OWN device token.
    // Any mismatch → 403. Prevents push-notification phishing.
    if (userId !== auth.userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: you can only register your own device' },
        { status: 403 },
      );
    }

    const result = await registerDeviceToken(userId, token, platform);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Device token API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/auth/device-token' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to register device' },
      { status: 500 },
    );
  }
}
