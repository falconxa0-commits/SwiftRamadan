import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const USER_TEXT_PROMPT =
  'Look at this webcam frame of someone cooking. Give them real-time guidance for their current step.';

const VALID_MOODS = ['praise', 'guide', 'correct', 'encourage'] as const;
type Mood = (typeof VALID_MOODS)[number];

interface Coaching {
  tip: string;
  mood: Mood;
  progress: number;
  done: boolean;
}

function buildSystemPrompt(
  recipeName: string,
  currentStep: string,
  stepIndex: number,
): string {
  return `You are Chef Safa, an encouraging live cooking coach watching a home cook via webcam. The cook is making '${recipeName}' and is on step ${stepIndex + 1}: '${currentStep}'. Analyze what you see and give ONE short, warm, actionable coaching tip (max 25 words). Respond ONLY with raw JSON: { tip: string, mood: 'praise'|'guide'|'correct'|'encourage', progress: number(0-100), done: boolean }`;
}

// 3-tier JSON extraction: direct parse → strip ```json fences → find first { to last }
function extractJson(text: string): unknown | null {
  if (!text) return null;
  // Tier 1: direct parse
  try {
    return JSON.parse(text);
  } catch {
    // fall through
  }
  // Tier 2: strip markdown code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }
  // Tier 3: find first { to last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

// Rotating fallback tips, indexed by stepIndex
const FALLBACK_TIPS = [
  "Keep going, you're doing great! Stir gently and watch the heat.",
  'Looking good! Make sure the oil is hot before adding more.',
  'Nice work! Now adjust seasoning to taste — a pinch of salt helps.',
  "Excellent! Lower the heat slightly so nothing burns.",
  'Almost there — give it a final stir and check for doneness.',
  'Wonderful! Plate it up nicely and garnish before serving.',
  'Fantastic! Let it rest a moment before serving.',
  "Beautiful! Trust your instincts — it's looking delicious.",
];

function buildFallbackCoaching(stepIndex: number): Coaching {
  const idx = Math.max(0, Math.floor(stepIndex));
  const tip = FALLBACK_TIPS[idx % FALLBACK_TIPS.length];
  const progress = Math.min(95, 30 + idx * 15);
  return { tip, mood: 'encourage', progress, done: false };
}

function normalizeCoaching(
  raw: unknown,
  stepIndex: number,
): Coaching | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.tip !== 'string' || !obj.tip.trim()) return null;

  const mood: Mood = (VALID_MOODS as readonly string[]).includes(
    obj.mood as string,
  )
    ? (obj.mood as Mood)
    : 'encourage';

  const fallbackProgress = Math.min(95, 30 + Math.max(0, stepIndex) * 15);
  const progress =
    typeof obj.progress === 'number' && isFinite(obj.progress)
      ? Math.max(0, Math.min(100, Math.round(obj.progress)))
      : typeof obj.progress === 'string' && !isNaN(Number(obj.progress))
        ? Math.max(0, Math.min(100, Math.round(Number(obj.progress))))
        : fallbackProgress;

  const done =
    typeof obj.done === 'boolean' ? obj.done : progress >= 100;

  return { tip: obj.tip.trim(), mood, progress, done };
}

// POST /api/live-vision
// body: { image, recipeName, currentStep, stepIndex, email? }
// Uses VLM to analyze the webcam frame and return real-time coaching guidance.
export async function POST(request: NextRequest) {
  let stepIndex = 0;
  try {
    const body = await request.json();
    stepIndex = Number(body?.stepIndex ?? 0) || 0;
    const image = typeof body?.image === 'string' ? body.image : '';
    const recipeName =
      typeof body?.recipeName === 'string' && body.recipeName.trim()
        ? body.recipeName
        : 'a delicious meal';
    const currentStep =
      typeof body?.currentStep === 'string' ? body.currentStep : '';

    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json(
        { coaching: buildFallbackCoaching(stepIndex) },
        { status: 200 },
      );
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(recipeName, currentStep, stepIndex),
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: USER_TEXT_PROMPT },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      });

      const content: string =
        response?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson(content);
      const normalized = normalizeCoaching(parsed, stepIndex);

      if (normalized) {
        return NextResponse.json({ coaching: normalized }, { status: 200 });
      }

      return NextResponse.json(
        { coaching: buildFallbackCoaching(stepIndex) },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        { coaching: buildFallbackCoaching(stepIndex) },
        { status: 200 },
      );
    }
  } catch {
    return NextResponse.json(
      { coaching: buildFallbackCoaching(stepIndex) },
      { status: 200 },
    );
  }
}
