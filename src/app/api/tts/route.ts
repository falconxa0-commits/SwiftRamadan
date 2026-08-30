import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';
import { captureException } from '@/lib/monitoring/sentry';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

// POST /api/tts — Convert text to speech using Z-AI TTS
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  // Auth required — AI route (Phase 3 — secure AI routes)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // MIGRATED (Phase 11): defense-in-depth user existence check via
  // `usersService.getUserById`. Mirrors `/api/cart/route.ts` — returns a
  // clean 404 if the user was deleted between JWT issuance and this request.
  const userExists = await usersService.getUserById(auth.userId);
  if (!userExists) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? sanitizePromptInput(body.text) : '';
    const voice = typeof body?.voice === 'string' ? body.voice.trim() : 'alloy';

    if (!text) {
      return NextResponse.json(
        { success: false, message: 'Text is required' },
        { status: 400 },
      );
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      // @ts-expect-error — ZAI SDK type declares `audio.tts.create`,
      // but the route uses the legacy `tts.create` shortcut. Changing
      // the access path would alter runtime behaviour, so suppress.
      const response = await zai.tts.create({
        text,
        voice,
      });

      if (response) {
        // Return audio data as binary response
        const audioBuffer = Buffer.from(await response.arrayBuffer());

        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length.toString(),
          },
        });
      }
    } catch (aiError) {
      console.error('[TTS] Z-AI error:', aiError);
    }

    // Fallback: return info message
    return NextResponse.json({
      success: false,
      message: 'TTS not available — configure Z-AI SDK',
      text,
    });
  } catch (error) {
    console.error('[TTS] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/tts' } });
    return NextResponse.json(
      { success: false, message: 'TTS failed' },
      { status: 500 },
    );
  }
}
