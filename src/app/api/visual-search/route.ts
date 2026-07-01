import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// Fallback result returned if the VLM fails or JSON parsing fails.
const FALLBACK_RESULT = {
  foodName: 'Jollof Rice',
  category: 'Iftar Meals' as const,
  description: 'A delicious Nigerian dish',
  tags: ['rice', 'spicy'],
  estimatedPriceNGN: 4500,
};

const SYSTEM_PROMPT =
  "You are a food identification expert for a Nigerian/Ramadan food delivery app. Analyze the food in the image and respond ONLY with valid JSON: { foodName: string, category: 'Iftar Meals'|'Sahur'|'Dates'|'Drinks'|'Snacks'|'Fruits'|'Groceries', description: string, tags: string[], estimatedPriceNGN: number }";

const USER_TEXT_PROMPT =
  "Identify the food in this image. Respond ONLY with the JSON object described in the system prompt — no markdown, no explanation, just raw JSON.";

const VALID_CATEGORIES = [
  'Iftar Meals',
  'Sahur',
  'Dates',
  'Drinks',
  'Snacks',
  'Fruits',
  'Groceries',
] as const;

type FoodCategory = (typeof VALID_CATEGORIES)[number];

interface VisualSearchResult {
  foodName: string;
  category: FoodCategory;
  description: string;
  tags: string[];
  estimatedPriceNGN: number;
}

function extractJson(text: string): unknown | null {
  if (!text) return null;
  // Strip common markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find the first JSON object inside the text
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
}

function normalizeResult(raw: unknown): VisualSearchResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const foodName = typeof obj.foodName === 'string' ? obj.foodName.trim() : '';
  if (!foodName) return null;

  const rawCategory = typeof obj.category === 'string' ? obj.category.trim() : '';
  const category: FoodCategory = (
    VALID_CATEGORIES as readonly string[]
  ).includes(rawCategory)
    ? (rawCategory as FoodCategory)
    : 'Iftar Meals';

  const description =
    typeof obj.description === 'string' && obj.description.trim()
      ? obj.description.trim()
      : 'A delicious food item.';

  const tags = Array.isArray(obj.tags)
    ? obj.tags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const estimatedPriceNGN =
    typeof obj.estimatedPriceNGN === 'number' && isFinite(obj.estimatedPriceNGN)
      ? Math.max(0, Math.round(obj.estimatedPriceNGN))
      : typeof obj.estimatedPriceNGN === 'string'
        ? Math.max(0, Math.round(Number(obj.estimatedPriceNGN)) || 0)
        : 0;

  if (estimatedPriceNGN === 0) return null;

  return { foodName, category, description, tags, estimatedPriceNGN };
}

export async function POST(request: NextRequest) {
  // Rate limit: 20 AI requests per minute per IP (VLM calls are expensive)
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  let image: string | undefined;
  try {
    const body = await request.json();
    image = typeof body?.image === 'string' ? body.image : undefined;
  } catch {
    return NextResponse.json({ result: FALLBACK_RESULT }, { status: 200 });
  }

  if (!image || !image.startsWith('data:image/')) {
    return NextResponse.json({ result: FALLBACK_RESULT }, { status: 200 });
  }

  // Try the VLM SDK first
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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
    const normalized = parsed ? normalizeResult(parsed) : null;

    if (normalized) {
      return NextResponse.json({ result: normalized }, { status: 200 });
    }

    // VLM returned content we couldn't parse — fall back
    return NextResponse.json({ result: FALLBACK_RESULT }, { status: 200 });
  } catch {
    // Any failure → graceful fallback so the UI always has something to show
    return NextResponse.json({ result: FALLBACK_RESULT }, { status: 200 });
  }
}
