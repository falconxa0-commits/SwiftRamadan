import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// POST /api/web-reader — Extract content from a web page URL using Z-AI Web Reader
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 },
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid URL format' },
        { status: 400 },
      );
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const response = await zai.functions.invoke('web_reader', { url });

      if (response) {
        return NextResponse.json({ success: true, content: response, source: 'ai' });
      }
    } catch (aiError) {
      console.error('[Web Reader] Z-AI error:', aiError);
    }

    return NextResponse.json(
      { success: false, message: 'Web reader not available' },
      { status: 500 },
    );
  } catch (error) {
    console.error('[Web Reader] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/web-reader' } });
    return NextResponse.json(
      { success: false, message: 'Web reader failed' },
      { status: 500 },
    );
  }
}
