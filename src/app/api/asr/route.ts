import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// POST /api/asr — Convert speech to text using Z-AI ASR
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

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
    return NextResponse.json(
      { success: false, message: 'ASR failed' },
      { status: 500 },
    );
  }
}
