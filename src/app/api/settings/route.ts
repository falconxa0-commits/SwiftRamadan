import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as usersService from '@/services/users/users.service';

// GET /api/settings — return UserSetting for authenticated user (creates default if missing)
// FIXED: Now requires authentication
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  // REQUIRE AUTHENTICATION - settings are private
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // MIGRATED (Phase 10): the previous flow looked up the user by
    // `auth.email` to get their `id` for the UserSetting FK. We now use
    // `usersService.getUserById(auth.userId)` which is keyed on the
    // authenticated user's ID. The service returns null if the user has
    // been deleted between session issuance and this call (preserves the
    // previous 404 behaviour).
    const user = await usersService.getUserById(auth.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const userId = String(user.id);

    // Find or create default UserSetting
    let setting = await db.userSetting.findUnique({
      where: { userId },
    });

    if (!setting) {
      setting = await db.userSetting.create({
        data: {
          userId,
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
      notificationsEnabled,
      pushEnabled,
      emailEnabled,
      language,
      currency,
      theme,
    } = body;

    // MIGRATED (Phase 10): user lookup via `usersService.getUserById`.
    // The previous flow also accepted a `body.email` fallback; that is
    // dropped (IDOR tightening — only the authenticated user can update
    // their own settings).
    const user = await usersService.getUserById(auth.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const userId = String(user.id);

    const updateData: Record<string, unknown> = {};
    if (typeof notificationsEnabled === 'boolean') updateData.notificationsEnabled = notificationsEnabled;
    if (typeof pushEnabled === 'boolean') updateData.pushEnabled = pushEnabled;
    if (typeof emailEnabled === 'boolean') updateData.emailEnabled = emailEnabled;
    if (typeof language === 'string') updateData.language = language;
    if (typeof currency === 'string') updateData.currency = currency;
    if (typeof theme === 'string') updateData.theme = theme;

    const setting = await db.userSetting.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
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
