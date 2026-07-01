import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// POST /api/image-gen — Generate images using Z-AI Image Generation
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const size = typeof body?.size === 'string' ? body.size.trim() : '1024x1024';
    const style = typeof body?.style === 'string' ? body.style.trim() : '';

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt is required' },
        { status: 400 },
      );
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const fullPrompt = style
        ? `${prompt}, ${style}`
        : `${prompt}, Nigerian food photography, professional lighting, dark background`;

      const response = await zai.image.create({
        prompt: fullPrompt,
        size,
      });

      if (response) {
        // Return image data as base64
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        const base64Image = imageBuffer.toString('base64');

        return NextResponse.json({
          success: true,
          image: `data:image/png;base64,${base64Image}`,
          source: 'ai',
        });
      }
    } catch (aiError) {
      console.error('[Image Gen] Z-AI error:', aiError);
    }

    // Fallback: return placeholder
    return NextResponse.json({
      success: true,
      image: `https://placehold.co/1024x1024/0B0D14/10E07A?text=${encodeURIComponent(prompt.substring(0, 20))}`,
      source: 'placeholder',
    });
  } catch (error) {
    console.error('[Image Gen] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/image-gen' } });
    return NextResponse.json(
      { success: false, message: 'Image generation failed' },
      { status: 500 },
    );
  }
}
