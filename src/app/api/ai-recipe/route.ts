import { NextRequest, NextResponse } from 'next/server';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';
import { aiRequest } from '@/ai/gateway';
import * as usersService from '@/services/users/users.service';

/* ----------------------------------------------------------------------------
 * AI Recipe Generator API
 * Uses z-ai-web-dev-sdk LLM ("Chef Safa") to generate a Ramadan-themed recipe
 * as strict JSON. Falls back to a hardcoded sample recipe if the LLM is
 * unavailable or returns invalid JSON. Always returns HTTP 200 so the UI works.
 * ------------------------------------------------------------------------- */

interface Ingredient {
  name: string;
  price: number;
  quantity: string;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface AIRecipe {
  name: string;
  description: string;
  prepTime: string;
  servings: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: string[];
  tips: string;
}

const SYSTEM_PROMPT =
  "You are Chef Safa, an expert in Nigerian/Ramadan cuisine. Generate a recipe based on the user's craving. Respond ONLY with valid JSON in this exact shape: { name: string, description: string, prepTime: string, servings: number, difficulty: 'Easy'|'Medium'|'Hard', ingredients: [{name, price, quantity}], steps: string[], tips: string }. Use Naira (₦) for prices (realistic Lagos market prices 500-5000). Make it halal and Ramadan-appropriate (either iftar or sahur).";

const FALLBACK_RECIPES: AIRecipe[] = [
  {
    name: 'Smoky Party Jollof Rice',
    description:
      'A classic Nigerian jollof rice simmered in fiery scotch bonnet pepper sauce and crowned with grilled chicken — the perfect iftar centerpiece.',
    prepTime: '45 mins',
    servings: 4,
    difficulty: 'Medium',
    ingredients: [
      { name: 'Long grain rice', price: 1200, quantity: '2 cups (500g)' },
      { name: 'Fresh tomatoes', price: 800, quantity: '6 medium' },
      { name: 'Red bell peppers', price: 600, quantity: '3 medium' },
      { name: 'Scotch bonnet peppers', price: 300, quantity: '4 pieces' },
      { name: 'Onions', price: 400, quantity: '2 large' },
      { name: 'Chicken', price: 3500, quantity: '1 kg' },
      { name: 'Vegetable oil', price: 1500, quantity: '250ml' },
      { name: 'Curry & thyme spices', price: 500, quantity: '2 tsp' },
      { name: 'Stock cubes', price: 200, quantity: '3 cubes' },
    ],
    steps: [
      'Wash and parboil the rice for 5 minutes, then drain and set aside.',
      'Blend tomatoes, red bell peppers, scotch bonnet and half an onion into a smooth puree.',
      'Boil and season the chicken with salt, onion, curry, thyme and stock cubes. Grill or fry once cooked.',
      'Heat oil in a pot, fry the remaining sliced onions, then pour in the blended puree and fry for 15 minutes until reduced.',
      'Add the chicken stock, bring to a boil, then stir in the parboiled rice.',
      'Cover tightly with foil and a lid, cook on low heat for 25–30 minutes until fluffy and smoky.',
      'Serve hot with grilled chicken on top, garnished with fried plantain if desired.',
    ],
    tips: 'For the signature smoky "party jollof" flavor, let the bottom catch slightly at the end — Nigerians call this "the bottom pot".',
  },
  {
    name: 'Spicy Beef Suya Platter',
    description:
      'Street-style suya made with thinly sliced beef marinated in yaji spice — a beloved iftar favorite across Lagos.',
    prepTime: '30 mins',
    servings: 3,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Beef sirloin', price: 4500, quantity: '500g' },
      { name: 'Yaji suya spice mix', price: 800, quantity: '4 tbsp' },
      { name: 'Groundnut oil', price: 700, quantity: '3 tbsp' },
      { name: 'Onions', price: 300, quantity: '1 large' },
      { name: 'Fresh tomatoes', price: 500, quantity: '2 medium' },
      { name: 'Cabbage (shredded)', price: 600, quantity: '1 cup' },
      { name: 'Salt & stock cubes', price: 200, quantity: 'to taste' },
    ],
    steps: [
      'Slice the beef into paper-thin strips and pound lightly to tenderize.',
      'Mix oil, salt and half of the yaji spice; coat the beef thoroughly.',
      'Thread the beef onto skewers, then dust generously with more yaji on all sides.',
      'Grill over open flame or hot grill pan for 3–4 minutes per side until charred.',
      'Serve with sliced onions, tomatoes and shredded cabbage on the side.',
    ],
    tips: 'For an authentic suya flavor, let the meat sit in the fridge overnight with the yaji — the spice penetrates deeper.',
  },
  {
    name: 'Steamed Moi Moi with Pap',
    description:
      'Protein-rich bean pudding steamed in leaves — a nourishing sahur meal that keeps you full till iftar.',
    prepTime: '60 mins',
    servings: 4,
    difficulty: 'Hard',
    ingredients: [
      { name: 'Brown beans', price: 1500, quantity: '3 cups' },
      { name: 'Red bell peppers', price: 500, quantity: '2 medium' },
      { name: 'Scotch bonnet', price: 200, quantity: '2 pieces' },
      { name: 'Onions', price: 300, quantity: '1 large' },
      { name: 'Palm oil', price: 1000, quantity: '4 tbsp' },
      { name: 'Boiled eggs', price: 600, quantity: '4 eggs' },
      { name: 'Corn pap (akamu)', price: 800, quantity: '2 cups' },
      { name: 'Ground crayfish', price: 700, quantity: '2 tbsp' },
      { name: 'Stock cubes & salt', price: 200, quantity: 'to taste' },
    ],
    steps: [
      'Soak beans for 30 minutes, then peel off the outer skin by rubbing between palms.',
      'Blend beans with peppers, onion and a little water into a thick smooth batter.',
      'Stir in palm oil, crayfish, crushed stock cubes and salt until well combined.',
      'Fold in chopped boiled eggs, then scoop batter into foil or leaf parcels.',
      'Steam in a large pot with a little water for 45–50 minutes until set.',
      'Serve hot with creamy corn pap (akamu) for a complete sahur meal.',
    ],
    tips: 'Adding a spoon of oil to the steaming water prevents the moi moi from sticking and gives it a silky texture.',
  },
];

function pickFallback(prompt: string): AIRecipe {
  const p = prompt.toLowerCase();
  if (p.includes('suya') || p.includes('spicy') || p.includes('beef')) return FALLBACK_RECIPES[1];
  if (p.includes('moi') || p.includes('bean') || p.includes('sahur')) return FALLBACK_RECIPES[2];
  return FALLBACK_RECIPES[0];
}

function sanitizeRecipe(raw: unknown): AIRecipe | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  const description = typeof obj.description === 'string' ? obj.description.trim() : '';
  const prepTime = typeof obj.prepTime === 'string' ? obj.prepTime.trim() : '';
  const servings =
    typeof obj.servings === 'number' && obj.servings > 0
      ? Math.min(Math.floor(obj.servings), 50)
      : 4;
  const difficultyRaw = obj.difficulty;
  const difficulty: Difficulty =
    difficultyRaw === 'Easy' || difficultyRaw === 'Medium' || difficultyRaw === 'Hard'
      ? difficultyRaw
      : 'Medium';

  const ingredientsRaw = Array.isArray(obj.ingredients) ? obj.ingredients : [];
  const ingredients: Ingredient[] = ingredientsRaw
    .map((ing) => {
      if (!ing || typeof ing !== 'object') return null;
      const i = ing as Record<string, unknown>;
      const ingName = typeof i.name === 'string' ? i.name.trim() : '';
      const price =
        typeof i.price === 'number' && i.price >= 0
          ? i.price
          : typeof i.price === 'string'
            ? Number(i.price.replace(/[^0-9.]/g, '')) || 1000
            : 1000;
      const quantity = typeof i.quantity === 'string' ? i.quantity.trim() : '1 unit';
      return { name: ingName, price, quantity };
    })
    .filter((x): x is Ingredient => Boolean(x) && Boolean((x as Ingredient).name));

  const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];
  const steps = stepsRaw
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s) => s.length > 0);

  const tips = typeof obj.tips === 'string' ? obj.tips.trim() : '';

  if (!name || ingredients.length === 0 || steps.length === 0) return null;

  return { name, description, prepTime, servings, difficulty, ingredients, steps, tips };
}

function extractJson(content: string): unknown {
  // 1. Direct parse
  try {
    return JSON.parse(content);
  } catch {
    // continue
  }
  // 2. Strip ```json ... ``` code fences
  const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {
      // continue
    }
  }
  // 3. Grab the outermost { ... } block
  const first = content.indexOf('{');
  const last = content.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(content.slice(first, last + 1));
    } catch {
      // continue
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  // Rate limit: 20 AI requests per minute per IP (LLM calls are expensive)
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
    return NextResponse.json({ recipe: pickFallback('jollof') }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? sanitizePromptInput(body.prompt) : '';
    const dietaryPrefs: string[] = Array.isArray(body?.dietaryPrefs)
      ? body.dietaryPrefs.filter((p: unknown): p is string => typeof p === 'string')
      : [];

    if (!prompt) {
      return NextResponse.json({ recipe: pickFallback('jollof') });
    }

    const userContent = dietaryPrefs.length
      ? `${prompt}\n\nDietary preferences: ${dietaryPrefs.join(', ')}`
      : prompt;

    try {
      // PHASE-6-2: route now goes through the unified AI gateway. The gateway
      // owns the Safa persona, sanitization, token budget, and output
      // validation. The Chef-Safa JSON instruction is baked into the user
      // message because the gateway's system prompt is the fixed default
      // Safa persona (which is fine — the JSON contract is reinforced in the
      // user turn).
      const fullMessage = `${SYSTEM_PROMPT}\n\nUser request: ${userContent}`;
      const result = await aiRequest({
        userId: auth.userId,
        userRole: auth.role,
        message: fullMessage,
        maxTokens: 1000,
      });
      if (result.success && result.response) {
        const parsed = extractJson(result.response);
        const recipe = sanitizeRecipe(parsed);
        if (recipe) {
          return NextResponse.json({ recipe });
        }
      }
    } catch {
      // fall through to fallback
    }

    // Fallback — always 200
    return NextResponse.json({ recipe: pickFallback(prompt) });
  } catch {
    // Last-resort fallback — always 200
    return NextResponse.json({ recipe: pickFallback('jollof') });
  }
}
