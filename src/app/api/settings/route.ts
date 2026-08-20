import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

// GET /api/settings — return UserSetting for authenticated user (creates default if missing)
// FIXED: Now requires authentication
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  // REQUIRE AUTHENTICATION - settings are private
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // Use authenticated user's email - no need for query param
    const email = auth.email;

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Find or create default UserSetting
    let setting = await db.userSetting.findUnique({
      where: { userId: user.id },
    });

    if (!setting) {
      setting = await db.userSetting.create({
        data: {
          userId: user.id,
          notificationsEnabled: true,
          pushEnabled: true,
          emailEnabled: false,
          language: 'en',
          currency: 'NGN',
          theme: 'dark',
        },
      });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('Settings API GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/settings' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings — upsert UserSetting
export async function PUT(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const {
      email,
      notificationsEnabled,
      pushEnabled,
      emailEnabled,
      language,
      currency,
      theme,
    } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof notificationsEnabled === 'boolean') updateData.notificationsEnabled = notificationsEnabled;
    if (typeof pushEnabled === 'boolean') updateData.pushEnabled = pushEnabled;
    if (typeof emailEnabled === 'boolean') updateData.emailEnabled = emailEnabled;
    if (typeof language === 'string') updateData.language = language;
    if (typeof currency === 'string') updateData.currency = currency;
    if (typeof theme === 'string') updateData.theme = theme;

    const setting = await db.userSetting.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        notificationsEnabled: notificationsEnabled ?? true,
        pushEnabled: pushEnabled ?? true,
        emailEnabled: emailEnabled ?? false,
        language: language ?? 'en',
        currency: currency ?? 'NGN',
        theme: theme ?? 'dark',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings saved',
      setting,
    });
  } catch (error) {
    console.error('Settings API PUT error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/settings' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
