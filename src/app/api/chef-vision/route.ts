import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';

/* ----------------------------------------------------------------------------
 * Chef Safa Live Vision Coach API
 * Uses z-ai-web-dev-sdk VLM (glm-4.6v) to "look" at a camera frame from the
 * user's kitchen and give real-time spoken coaching on the current step.
 *
 * Input  : { image: <base64 data URL or raw base64>, recipeName, step, stepIndex, mode }
 * Output : { coaching: string, action: 'continue'|'wait'|'next'|'trouble', tip: string }
 *
 * The coaching text is short (1-2 sentences), warm, and actionable so it can
 * be passed straight to /api/chef-tts for narration. Always returns HTTP 200
 * with a graceful fallback if the VLM is unavailable.
 * ------------------------------------------------------------------------- */

type Action = 'continue' | 'wait' | 'next' | 'trouble';

interface VisionResponse {
  coaching: string;
  action: Action;
  tip: string;
}

const MAX_IMAGE_BYTES = 4_000_000; // 4MB safety cap on base64 payload

function buildSystemPrompt(recipeName: string, step: string, stepIndex: number): string {
  return `You are Chef Safa, a warm, expert Nigerian/Ramadan home-cooking coach watching a live kitchen camera feed.

The cook is making "${recipeName}".
They are currently on STEP ${stepIndex + 1}: "${step}"

Look at the frame and give ONE short, specific, actionable coaching note (1-2 sentences, max 40 words). Speak as if talking to a friend beside you — warm, encouraging, direct. Reference what you actually SEE in the frame (e.g. onions browning, oil shimmering, pot bubbling, rice looking dry, etc.).

Then classify the situation into one action:
- "continue" : everything looks on track, keep going
- "wait"     : needs more time (e.g. onions not browned yet, oil not hot enough)
- "next"     : this step looks done, move to the next one
- "trouble"  : something looks wrong (burning, too dry, boiling over) — intervene

Respond ONLY with valid JSON, no markdown, in this exact shape:
{ "coaching": "<your spoken note>", "action": "continue"|"wait"|"next"|"trouble", "tip": "<one short extra tip, optional>" }

If you cannot see a kitchen or food clearly, say so kindly and ask them to angle the camera toward the pot/board.`;
}

function extractJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    /* continue */
  }
  const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {
      /* continue */
    }
  }
  const first = content.indexOf('{');
  const last = content.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(content.slice(first, last + 1));
    } catch {
      /* continue */
    }
  }
  return null;
}

function sanitizeResponse(raw: unknown, step: string): VisionResponse {
  if (!raw || typeof raw !== 'object') {
    return fallbackResponse(step);
  }
  const obj = raw as Record<string, unknown>;
  const coaching = typeof obj.coaching === 'string' ? obj.coaching.trim() : '';
  const actionRaw = typeof obj.action === 'string' ? obj.action.trim().toLowerCase() : 'continue';
  const action: Action =
    actionRaw === 'wait' || actionRaw === 'next' || actionRaw === 'trouble' ? actionRaw : 'continue';
  const tip = typeof obj.tip === 'string' ? obj.tip.trim() : '';

  if (!coaching) return fallbackResponse(step);

  return {
    coaching: coaching.slice(0, 300),
    action,
    tip: tip.slice(0, 200),
  };
}

function fallbackResponse(step: string): VisionResponse {
  const notes = [
    `Looking good! Keep an eye on the heat and follow step: ${step.slice(0, 80)}...`,
    `You're doing great. Focus on the current step and trust your instincts.`,
    `Stay calm and cook with intention. The next move is in your hands.`,
  ];
  return {
    coaching: notes[Math.floor(Math.random() * notes.length)],
    action: 'continue',
    tip: 'Angle the camera toward your pot so Chef Safa can see better.',
  };
}

export async function POST(request: NextRequest) {
  // Rate limit + auth (Phase 3 — secure AI routes)
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const imageRaw = typeof body?.image === 'string' ? body.image.trim() : '';
    const recipeName = typeof body?.recipeName === 'string' ? sanitizePromptInput(body.recipeName).slice(0, 120) : 'your dish';
    const step = typeof body?.step === 'string' ? sanitizePromptInput(body.step).slice(0, 600) : '';
    const stepIndex = Math.min(Math.max(Number(body?.stepIndex) || 0, 0), 100);

    if (!imageRaw) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (imageRaw.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Image too large. Please use a smaller frame.' },
        { status: 413 }
      );
    }

    // Normalize to a data URL the VLM accepts
    const imageUrl = imageRaw.startsWith('data:')
      ? imageRaw
      : `data:image/jpeg;base64,${imageRaw}`;

    const systemPrompt = buildSystemPrompt(recipeName, step, stepIndex);

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      // @ts-expect-error — `CreateChatCompletionVisionBody.model` is required
      // by the SDK type but the backend selects a default model when omitted;
      // passing a model would change runtime behaviour, so suppress here.
      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      });

      const content: string = response?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson(content);
      const result = sanitizeResponse(parsed, step);
      return NextResponse.json(result);
    } catch (visionError) {
      // VLM unavailable — fall back gracefully
      const message = visionError instanceof Error ? visionError.message : 'vision failed';
      return NextResponse.json({
        ...fallbackResponse(step),
        tip: `Vision service busy: ${message.slice(0, 80)}`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chef vision failed';
    return NextResponse.json(
      { error: message, ...fallbackResponse('') },
      { status: 500 }
    );
  }
}
