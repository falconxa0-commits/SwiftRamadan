import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Safa Live Vision — real-time webcam cooking coach.
 *
 * Receives a single webcam frame (base64 data URL) plus the current recipe +
 * step context, asks the VLM to act as Chef Safa watching over the user's
 * shoulder, and returns structured coaching guidance.
 *
 * Always returns 200 with a graceful fallback so the live-coach UI never breaks.
 */

interface VisionRequest {
  image?: string;
  recipeName?: string;
  currentStep?: number;
  totalSteps?: number;
  stepText?: string;
  history?: string;
}

type Mood = 'praising' | 'coaching' | 'warning' | 'celebrating';

interface CoachGuidance {
  observation: string;
  assessment: 'on track' | 'needs attention' | 'behind' | 'completed' | 'uncertain';
  tip: string;
  encouragement: string;
  stepMatch: boolean;
  mood: Mood;
  detectedItems: string[];
}

const SYSTEM_PROMPT = `You are Chef Safa, a warm, expert halal cooking coach from Lagos, Nigeria.
You are watching a home cook live through their webcam while they prepare a meal. Your job is to give brief, specific, encouraging real-time guidance — exactly like a friend standing next to them in the kitchen.

Your personality:
- Warm, supportive, a little playful. You celebrate small wins.
- You speak in short, punchy sentences (the cook is busy — no walls of text).
- You are halal-conscious and safety-aware (you warn about raw meat cross-contamination, overheating oil, burning, undercooked rice, etc.).
- You reference what you actually SEE in the frame. If you cannot see the food clearly, say so honestly.

Respond with ONLY a JSON object — no markdown, no fences, no commentary. The shape MUST be exactly:
{
  "observation": string,          // 1 sentence: what you see right now (pan, ingredients, action, state)
  "assessment": "on track" | "needs attention" | "behind" | "completed" | "uncertain",
  "tip": string,                  // 1 sentence: the single most useful thing to do next
  "encouragement": string,        // 1 short sentence: a warm, motivating line
  "stepMatch": boolean,           // does what you see match the current step described?
  "mood": "praising" | "coaching" | "warning" | "celebrating",
  "detectedItems": string[]       // 0-5 short names of ingredients/objects you can see
}`;

function buildUserPrompt(req: VisionRequest): string {
  const stepNum = typeof req.currentStep === 'number' ? req.currentStep + 1 : 1;
  const total = typeof req.totalSteps === 'number' ? req.totalSteps : 1;
  const recipe = sanitizePromptInput(req.recipeName ?? '') || 'a home-cooked meal';
  const stepText = sanitizePromptInput(req.stepText ?? '') || '(step text unavailable)';
  const history = sanitizePromptInput(req.history ?? '');

  let prompt = `The cook is making: ${recipe}\n`;
  prompt += `They are on step ${stepNum} of ${total}.\n`;
  prompt += `Current step instruction: "${stepText}"\n`;
  if (history) {
    prompt += `\nRecent guidance you already gave (do not repeat verbatim):\n${history}\n`;
  }
  prompt += `\nLook at this webcam frame and coach them for THIS exact moment. Respond with ONLY the JSON object.`;
  return prompt;
}

const FALLBACKS: CoachGuidance[] = [
  {
    observation: "I can see your kitchen setup — looks like you're working through this step.",
    assessment: 'on track',
    tip: 'Keep your heat steady and stay focused on the current step.',
    encouragement: "You're doing great — steady hands win the dish! 💪",
    stepMatch: true,
    mood: 'coaching',
    detectedItems: [],
  },
  {
    observation: 'The stove looks active and you seem to be mid-preparation.',
    assessment: 'on track',
    tip: 'Taste and adjust seasoning as you go — trust your palate.',
    encouragement: 'Bismillah, keep going — you’re cooking with heart! 🌙',
    stepMatch: true,
    mood: 'praising',
    detectedItems: [],
  },
  {
    observation: 'I can see activity in your cooking area.',
    assessment: 'on track',
    tip: 'Keep an eye on the heat and don’t rush the step you’re on.',
    encouragement: 'Nice pace — every great chef cooks with intention. ✨',
    stepMatch: true,
    mood: 'coaching',
    detectedItems: [],
  },
];

function pickFallback(req: VisionRequest): CoachGuidance {
  const stepNum = typeof req.currentStep === 'number' ? req.currentStep + 1 : 1;
  const total = typeof req.totalSteps === 'number' ? req.totalSteps : 1;
  // If they're on the last step, lean celebratory
  if (stepNum >= total) {
    return {
      observation: 'You look close to finishing — the final stretch!',
      assessment: 'completed',
      tip: 'Do a final taste test and plate it beautifully.',
      encouragement: 'Almost there — this is going to be delicious! 🎉',
      stepMatch: true,
      mood: 'celebrating',
      detectedItems: [],
    };
  }
  return FALLBACKS[stepNum % FALLBACKS.length];
}

function extractJson(content: string): unknown {
  if (!content) return null;
  try { return JSON.parse(content); } catch { /* continue */ }
  const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* continue */ } }
  const first = content.indexOf('{');
  const last = content.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(content.slice(first, last + 1)); } catch { /* continue */ }
  }
  return null;
}

function sanitize(raw: unknown): CoachGuidance | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const observation = typeof obj.observation === 'string' && obj.observation.trim() ? obj.observation.trim() : '';
  if (!observation) return null;

  const validAssessments = ['on track', 'needs attention', 'behind', 'completed', 'uncertain'];
  const assessmentRaw = String(obj.assessment ?? 'on track').toLowerCase();
  const assessment = (validAssessments.includes(assessmentRaw) ? assessmentRaw : 'on track') as CoachGuidance['assessment'];

  const validMoods: Mood[] = ['praising', 'coaching', 'warning', 'celebrating'];
  const moodRaw = String(obj.mood ?? 'coaching').toLowerCase();
  const mood = (validMoods.includes(moodRaw as Mood) ? moodRaw : 'coaching') as Mood;

  const detectedItems = Array.isArray(obj.detectedItems)
    ? obj.detectedItems.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    observation,
    assessment,
    tip: typeof obj.tip === 'string' && obj.tip.trim() ? obj.tip.trim() : 'Keep going — focus on the current step.',
    encouragement: typeof obj.encouragement === 'string' && obj.encouragement.trim() ? obj.encouragement.trim() : "You're doing great! 💪",
    stepMatch: typeof obj.stepMatch === 'boolean' ? obj.stepMatch : true,
    mood,
    detectedItems,
  };
}

export async function POST(request: NextRequest) {
  // Rate limit + auth (Phase 3 — secure AI routes)
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  let body: VisionRequest;
  try {
    body = (await request.json()) as VisionRequest;
  } catch {
    return NextResponse.json({ success: true, guidance: pickFallback({}) });
  }

  const image = typeof body?.image === 'string' ? body.image : '';
  if (!image || !image.startsWith('data:image/')) {
    return NextResponse.json({ success: true, guidance: pickFallback(body) });
  }

  // Cap history length to keep prompt small
  const safeReq: VisionRequest = {
    ...body,
    history: typeof body.history === 'string' ? body.history.slice(-600) : undefined,
  };

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    // @ts-expect-error — `CreateChatCompletionVisionBody.model` is required
    // by the SDK type but the backend selects a default model when omitted.
    const response = await zai.chat.completions.createVision({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: buildUserPrompt(safeReq) },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });
    const content: string = response?.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(content);
    const guidance = sanitize(parsed);
    if (guidance) return NextResponse.json({ success: true, guidance });
  } catch {
    /* fall through to fallback */
  }

  return NextResponse.json({ success: true, guidance: pickFallback(safeReq) });
}
