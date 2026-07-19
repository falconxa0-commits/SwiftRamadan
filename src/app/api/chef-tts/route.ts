import { NextRequest, NextResponse } from 'next/server';

/* ----------------------------------------------------------------------------
 * Chef Safa Voice (TTS) API
 * Uses z-ai-web-dev-sdk audio.tts to narrate cooking steps / chef greetings.
 * Returns audio/wav so the client can play it directly via <audio>.
 * Text is clamped to 1000 chars (API limit is 1024) to stay safe.
 * Voice "tongtong" chosen for warm, friendly tone. Speed default 1.0.
 * ------------------------------------------------------------------------- */

const MAX_LEN = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const safeText = text.length > MAX_LEN ? text.slice(0, MAX_LEN) : text;

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: safeText,
      voice: 'tongtong',
      speed: 1.0,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TTS failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
