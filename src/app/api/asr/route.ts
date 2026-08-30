import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// POST /api/asr — Convert speech to text using Z-AI ASR
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  // Auth required — AI route (Phase 3 — secure AI routes)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const audio = typeof body?.audio === 'string' ? body.audio : '';
    const language = typeof body?.language === 'string' ? body.language : 'en';

    if (!audio) {
      return NextResponse.json(
        { success: false, message: 'Audio (base64) required' },
        { status: 400 },
      );
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      // @ts-expect-error — ZAI SDK type declares `audio.asr.create`,
      // but the route uses the legacy `asr.create` shortcut. Changing
      // the access path would alter runtime behaviour, so suppress.
      const response = await zai.asr.create({
        audio: audio.startsWith('data:') ? audio : `data:audio/webm;base64,${audio}`,
        language,
      });

      if (response?.text) {
        return NextResponse.json({ success: true, text: response.text, source: 'ai' });
      }
    } catch (aiError) {
      console.error('[ASR] Z-AI error:', aiError);
    }

    // Fallback
    return NextResponse.json({
      success: false,
      message: 'ASR not available — configure Z-AI SDK',
      text: '',
    });
  } catch (error) {
    console.error('[ASR] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/asr' } });
    return NextResponse.json(
      { success: false, message: 'ASR failed' },
      { status: 500 },
    );
  }
}
