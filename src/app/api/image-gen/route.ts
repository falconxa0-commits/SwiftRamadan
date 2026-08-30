import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';
import { captureException } from '@/lib/monitoring/sentry';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

// POST /api/image-gen — Generate images using Z-AI Image Generation
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
    const prompt = typeof body?.prompt === 'string' ? sanitizePromptInput(body.prompt) : '';
    const size = typeof body?.size === 'string' ? body.size.trim() : '1024x1024';
    const style = typeof body?.style === 'string' ? sanitizePromptInput(body.style) : '';

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

      // @ts-expect-error — ZAI SDK type exposes `images.generations.create`,
      // but this route uses the legacy `image.create` shortcut. Changing
      // the access path would alter runtime behaviour, so suppress.
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
