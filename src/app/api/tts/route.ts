import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// POST /api/tts — Convert text to speech using Z-AI TTS
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
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
    return NextResponse.json(
      { success: false, message: 'TTS failed' },
      { status: 500 },
    );
  }
}
