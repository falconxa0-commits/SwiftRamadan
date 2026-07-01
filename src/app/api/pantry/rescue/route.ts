import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

const SYSTEM_PROMPT =
  "You are Chef Safa, a Nigerian/Ramadan cooking expert. Given these pantry items, suggest ONE creative recipe. Respond ONLY with raw JSON (no markdown): { recipeName, description, timeMins, difficulty, ingredients: [{name, use}], steps: [string], chefTip }";

const FALLBACK_RECIPE = {
  recipeName: 'Quick Jollof Rice',
  description:
    'A fast, flavorful Nigerian Jollof Rice perfect for iftar — tomato-rich, gently spiced, and satisfying.',
  timeMins: 30,
  difficulty: 'easy',
  ingredients: [
    { name: 'Rice', use: '2 cups, parboiled' },
    { name: 'Tomato blend', use: '1.5 cups, blended smooth' },
    { name: 'Onion', use: '1 medium, finely chopped' },
    { name: 'Vegetable oil', use: '3 tablespoons' },
  ],
  steps: [
    'Heat the oil in a pot and sauté the chopped onions until translucent.',
    'Add the blended tomato mix and fry for 5–7 minutes until it darkens slightly.',
    'Stir in the parboiled rice, season with salt, bouillon, and curry powder.',
    'Pour in just enough water to cover; cover the pot and simmer on low heat.',
    'Once the rice is cooked and fluffy, fluff with a fork and serve hot.',
  ],
  chefTip:
    'For a smoky party-Jollof flavor, let the bottom layer toast slightly before stirring.',
};

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

interface RawRecipe {
  recipeName: unknown;
  description?: unknown;
  timeMins?: unknown;
  difficulty?: unknown;
  ingredients?: unknown;
  steps?: unknown;
  chefTip?: unknown;
}

function isRecipeShape(v: unknown): v is RawRecipe {
  return (
    !!v &&
    typeof v === 'object' &&
    'recipeName' in (v as Record<string, unknown>)
  );
}

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const items: string[] = Array.isArray(body?.items)
      ? body.items
          .filter((x: unknown): x is string => typeof x === 'string')
          .map((x: string) => x.trim())
          .filter(Boolean)
      : [];

    if (items.length === 0) {
      return NextResponse.json({ recipe: FALLBACK_RECIPE }, { status: 200 });
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Pantry items: ${items.join(', ')}. Suggest a recipe I can cook now.`,
          },
        ],
        thinking: { type: 'disabled' },
      });

      const content: string =
        response?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson(content);

      if (
        parsed &&
        isRecipeShape(parsed) &&
        typeof parsed.recipeName === 'string' &&
        parsed.recipeName.trim()
      ) {
        return NextResponse.json({ recipe: parsed }, { status: 200 });
      }

      return NextResponse.json({ recipe: FALLBACK_RECIPE }, { status: 200 });
    } catch (error) {
      console.error('API error:', error);
      await captureException(error instanceof Error ? error : new Error(String(error)), {
        tags: { route: '/api/pantry/rescue' },
      });
      return NextResponse.json({ recipe: FALLBACK_RECIPE }, { status: 200 });
    }
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/pantry/rescue' },
    });
    return NextResponse.json({ recipe: FALLBACK_RECIPE }, { status: 200 });
  }
}
