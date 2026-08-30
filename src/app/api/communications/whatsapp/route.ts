import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsApp } from '@/lib/communications/twilio';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as usersService from '@/services/users/users.service';

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // MIGRATED (Phase 11): defense-in-depth user existence check via
  // `usersService.getUserById`. Mirrors `/api/cart/route.ts` — returns a
  // clean 404 if the user was deleted between JWT issuance and this request.
  const userExists = await usersService.getUserById(auth.userId);
  if (!userExists) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  try {
    const { to, body, templateSid, templateParams } = await request.json();
    if (!to) {
      return NextResponse.json({ success: false, message: 'to is required' }, { status: 400 });
    }
    const result = await sendWhatsApp({ to, body, templateSid, templateParams });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/communications/whatsapp' },
    });
    return NextResponse.json({ success: false, message: 'WhatsApp failed' }, { status: 500 });
  }
}
