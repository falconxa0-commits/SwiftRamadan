import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Fallback mock data returned when the VLM is unavailable
const FALLBACK_ITEMS = [
  { name: 'Tomatoes', category: 'produce', estimated_quantity: '4-5', freshness: 'fresh' },
  { name: 'Pepper', category: 'produce', estimated_quantity: '3', freshness: 'fresh' },
  { name: 'Onions', category: 'produce', estimated_quantity: '2', freshness: 'fresh' },
  { name: 'Milk', category: 'dairy', estimated_quantity: '1 bottle', freshness: 'fresh' },
  { name: 'Chicken', category: 'protein', estimated_quantity: '500g', freshness: 'fresh' },
  { name: 'Rice', category: 'grain', estimated_quantity: '2kg', freshness: 'fresh' },
];

const VALID_CATEGORIES = [
  'produce',
  'dairy',
  'grain',
  'protein',
  'spice',
  'beverage',
  'condiment',
  'other',
] as const;

type ItemCategory = (typeof VALID_CATEGORIES)[number];

interface DetectedItem {
  name: string;
  category: ItemCategory;
  estimated_quantity: string;
  freshness: string;
}

function normalizeCategory(raw: string): ItemCategory {
  const lower = raw.toLowerCase().trim();
  if ((VALID_CATEGORIES as readonly string[]).includes(lower)) return lower as ItemCategory;
  return 'other';
}

function normalizeFreshness(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (['fresh', 'aging', 'expiring'].includes(lower)) return lower;
  return 'fresh';
}

function sanitizeItems(raw: unknown): DetectedItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: DetectedItem[] = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const name = typeof obj.name === 'string' ? obj.name.trim() : '';
      if (!name) return null;
      return {
        name,
        category: normalizeCategory(typeof obj.category === 'string' ? obj.category : 'other'),
        estimated_quantity: typeof obj.estimated_quantity === 'string' ? obj.estimated_quantity.trim() : '1',
        freshness: normalizeFreshness(typeof obj.freshness === 'string' ? obj.freshness : 'fresh'),
      };
    })
    .filter((x): x is DetectedItem => x !== null);

  return items.length > 0 ? items : null;
}

function extractJsonArray(text: string): unknown | null {
  if (!text) return null;
  // Try to find JSON array in the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
  return null;
}

// POST /api/fridge-scan — Detect ingredients from fridge photo using Z-AI VLM
export async function POST(request: NextRequest) {
  // Rate limit: 20 AI requests per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => ({}));
    const image = typeof body?.image === 'string' ? body.image : '';

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'Image (base64) required' },
        { status: 400 },
      );
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'system',
            content:
              'You are a food ingredient detection AI. Analyze fridge/pantry photos and identify ALL visible food items. Return ONLY a JSON array of objects with: name, category (produce/dairy/grain/protein/spice/beverage/condiment/other), estimated_quantity (like "2-3", "500g", "1 bottle"), freshness (fresh/aging/expiring). Be thorough — check all shelves, drawers, and door compartments.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify all food ingredients visible in this fridge/pantry photo. Be specific with names and quantities.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      });

      const content: string = response?.choices?.[0]?.message?.content ?? '';

      const parsed = extractJsonArray(content);
      const normalized = parsed ? sanitizeItems(parsed) : null;

      if (normalized) {
        return NextResponse.json({ success: true, items: normalized, source: 'vlm' });
      }

      // VLM returned unparseable content — fall back
      return NextResponse.json({ success: true, items: FALLBACK_ITEMS, source: 'mock' });
    } catch (aiError) {
      console.error('[Fridge Scan] Z-AI error:', aiError);
      // Fallback to mock data
      return NextResponse.json({ success: true, items: FALLBACK_ITEMS, source: 'mock' });
    }
  } catch (error) {
    console.error('[Fridge Scan] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Fridge scan failed' },
      { status: 500 },
    );
  }
}
