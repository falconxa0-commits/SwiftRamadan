import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

interface RecipeRemix {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  twist_explanation: string;
}

interface PopularRemix {
  name: string;
  description: string;
  originalName: string;
  likes: number;
}

const POPULAR_REMIXES: PopularRemix[] = [
  { name: 'Coconut Jollof', description: 'Creamy twist on the classic', originalName: 'Jollof Rice', likes: 234 },
  { name: 'Plantain Suya', description: 'Sweet meets spicy', originalName: 'Suya', likes: 189 },
  { name: 'Moi Moi Parfait', description: 'Deconstructed bean pudding', originalName: 'Moi Moi', likes: 156 },
  { name: 'Suya Tacos', description: 'Nigerian-Yoruba meets Mexican', originalName: 'Suya', likes: 142 },
  { name: 'Jollof Arancini', description: 'Italian crunch meets Nigerian soul', originalName: 'Jollof Rice', likes: 128 },
];

const FALLBACK_REMIX: RecipeRemix = {
  name: 'Healthy Jollof Rice',
  description: 'A creative twist on the classic Jollof Rice that adds freshness while keeping the soul of the dish.',
  ingredients: ['Rice', 'Tomatoes', 'Onions', 'Pepper', 'Bell peppers', 'Carrots', 'Green beans', 'Coconut oil'],
  steps: [
    'Wash and parboil the rice for 5 minutes, then drain.',
    'Blend tomatoes, peppers, and onions into a smooth puree.',
    'Sauté diced carrots and green beans in coconut oil.',
    'Add the puree and simmer for 15 minutes until reduced.',
    'Stir in the rice, add stock, and cook on low heat for 25 minutes.',
    'Garnish with fresh herbs and serve.',
  ],
  twist_explanation: 'This twist adds extra vegetables and uses coconut oil for a lighter, healthier version while preserving the signature jollof flavor.',
};

function sanitizeRemix(raw: unknown): RecipeRemix | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (!name) return null;

  const description = typeof obj.description === 'string' ? obj.description.trim() : '';

  const ingredientsRaw = Array.isArray(obj.ingredients) ? obj.ingredients : [];
  const ingredients = ingredientsRaw
    .map((i: unknown) => (typeof i === 'string' ? i.trim() : ''))
    .filter(Boolean);

  const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];
  const steps = stepsRaw
    .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);

  const twist_explanation = typeof obj.twist_explanation === 'string' ? obj.twist_explanation.trim() : '';

  if (ingredients.length === 0 || steps.length === 0) return null;

  return { name, description, ingredients, steps, twist_explanation };
}

function extractJsonObject(text: string): unknown | null {
  if (!text) return null;
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// POST /api/recipe-remix — Generate recipe remix using AI
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => ({}));
    const originalRecipe = typeof body?.originalRecipe === 'string' ? body.originalRecipe.trim() : 'Jollof Rice';
    const twist = typeof body?.twist === 'string' ? body.twist.trim() : 'make it healthier with extra vegetables';

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a creative Nigerian food remix AI. Take a classic Nigerian dish and add a creative twist. Return ONLY a JSON object with: name (remixed name), description (1-2 sentences), ingredients (array of strings), steps (array of strings), twist_explanation (why this twist works).',
          },
          {
            role: 'user',
            content: `Remix "${originalRecipe}" with this twist: "${twist}"`,
          },
        ],
      });

      const content: string = response?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJsonObject(content);
      const remix = sanitizeRemix(parsed);

      if (remix) {
        return NextResponse.json({ success: true, remix, source: 'ai' });
      }
    } catch (aiError) {
      console.error('[Recipe Remix] AI error:', aiError);
    }

    // Fallback
    return NextResponse.json({
      success: true,
      remix: {
        ...FALLBACK_REMIX,
        name: `${twist || 'Healthy'} ${originalRecipe}`,
        description: `A creative twist on the classic ${originalRecipe}`,
      },
      source: 'mock',
    });
  } catch (error) {
    console.error('[Recipe Remix] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/recipe-remix' } });
    return NextResponse.json(
      { success: false, message: 'Recipe remix failed' },
      { status: 500 },
    );
  }
}

// GET /api/recipe-remix — Get popular remixes
export async function GET() {
  return NextResponse.json({
    success: true,
    remixes: POPULAR_REMIXES,
  });
}
