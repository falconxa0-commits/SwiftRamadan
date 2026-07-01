import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

interface MoodProduct {
  name: string;
  description: string;
  price: number;
  image: string;
  mood_match: string;
  spice_level: number;
  prep_time: number;
}

const MOOD_FALLBACKS: Record<string, MoodProduct[]> = {
  energetic: [
    { name: 'Pepper Soup', description: 'Spicy Nigerian pepper soup with goat meat', price: 3500, image: '', mood_match: 'The heat gets your blood pumping', spice_level: 5, prep_time: 25 },
    { name: 'Suya Platter', description: 'Spicy grilled beef with yaji spice', price: 3200, image: '', mood_match: 'Bold flavors match your energy', spice_level: 4, prep_time: 20 },
    { name: 'Ofada Rice & Stew', description: 'Fiery designer rice with ayamase stew', price: 4000, image: '', mood_match: 'Intense flavors for an intense mood', spice_level: 5, prep_time: 30 },
    { name: 'Asun (Spicy Goat)', description: 'Smoky peppered goat meat', price: 5500, image: '', mood_match: 'Adventurous dish for your adventurous mood', spice_level: 5, prep_time: 35 },
    { name: 'Nkwobi', description: 'Spicy cow foot delicacy', price: 4800, image: '', mood_match: 'Bold and unforgettable', spice_level: 4, prep_time: 25 },
    { name: 'Boli & Groundnut', description: 'Roasted plantain with spicy groundnut', price: 1500, image: '', mood_match: 'Street energy in every bite', spice_level: 2, prep_time: 10 },
  ],
  cozy: [
    { name: 'Jollof Rice & Chicken', description: 'Warm, smoky party jollof with grilled chicken', price: 4500, image: '', mood_match: 'Comfort food at its finest', spice_level: 2, prep_time: 30 },
    { name: 'Moi Moi & Pap', description: 'Steamed bean pudding with creamy corn pap', price: 2800, image: '', mood_match: 'Warm and soothing', spice_level: 1, prep_time: 20 },
    { name: 'Pepper Soup (Catfish)', description: 'Comforting catfish pepper soup', price: 3800, image: '', mood_match: 'Like a warm hug in a bowl', spice_level: 2, prep_time: 25 },
    { name: 'Yam Porridge', description: 'Hearty yam in savory tomato sauce', price: 2500, image: '', mood_match: 'Home cooking at its best', spice_level: 1, prep_time: 30 },
    { name: 'Egusi Soup & Pounded Yam', description: 'Rich melon soup with soft pounded yam', price: 4000, image: '', mood_match: 'The ultimate comfort meal', spice_level: 2, prep_time: 35 },
    { name: 'Akara & Pap', description: 'Crispy bean fritters with sweet pap', price: 1200, image: '', mood_match: 'Cozy morning vibes', spice_level: 1, prep_time: 15 },
  ],
  adventurous: [
    { name: 'Isiewu (Goat Head)', description: 'Spicy goat head delicacy from Eastern Nigeria', price: 6000, image: '', mood_match: 'For the bold and curious', spice_level: 4, prep_time: 40 },
    { name: 'Nkwobi', description: 'Spicy cow foot in palm oil sauce', price: 4800, image: '', mood_match: 'Dare to try something new', spice_level: 4, prep_time: 25 },
    { name: 'Ofe Nsala (White Soup)', description: 'Rare white soup with fresh catfish', price: 4200, image: '', mood_match: 'A taste of Eastern Nigeria', spice_level: 3, prep_time: 35 },
    { name: 'Edikang Ikong', description: 'Rich vegetable soup from Calabar', price: 3800, image: '', mood_match: 'Explore Cross River cuisine', spice_level: 2, prep_time: 30 },
    { name: 'Abacha (African Salad)', description: 'Tangy cassava flake salad from the East', price: 2500, image: '', mood_match: 'Street food adventure', spice_level: 3, prep_time: 15 },
    { name: 'Kilishi', description: 'Dried spicy meat from Northern Nigeria', price: 3500, image: '', mood_match: 'Savory Northern flavors', spice_level: 4, prep_time: 10 },
  ],
  romantic: [
    { name: 'Grilled Prawns', description: 'Butter garlic grilled prawns', price: 7000, image: '', mood_match: 'Elegant seafood for special moments', spice_level: 1, prep_time: 20 },
    { name: 'Coconut Rice & Grilled Fish', description: 'Creamy coconut rice with perfectly grilled fish', price: 5500, image: '', mood_match: 'Delicate flavors, special moments', spice_level: 1, prep_time: 30 },
    { name: 'Peppered Snails', description: 'Giant African snails in spicy sauce', price: 6500, image: '', mood_match: 'A delicacy worth sharing', spice_level: 3, prep_time: 25 },
    { name: 'Fried Rice & Salad', description: 'Colorful fried rice with fresh salad', price: 4000, image: '', mood_match: 'A feast for two', spice_level: 1, prep_time: 25 },
    { name: 'Plantain & Honey', description: 'Ripe plantain drizzled with honey', price: 2000, image: '', mood_match: 'Sweet moments, sweet flavors', spice_level: 0, prep_time: 10 },
    { name: 'Suya Wrap', description: 'Tender suya in a warm flatbread wrap', price: 3500, image: '', mood_match: 'Shareable and satisfying', spice_level: 3, prep_time: 15 },
  ],
  focused: [
    { name: 'Bran Flakes & Fruit', description: 'Light cereal with fresh fruit', price: 1800, image: '', mood_match: 'Brain food, light and clean', spice_level: 0, prep_time: 5 },
    { name: 'Grilled Chicken Salad', description: 'Protein-packed salad bowl', price: 3500, image: '', mood_match: 'Clean energy for productivity', spice_level: 1, prep_time: 15 },
    { name: 'Green Smoothie Bowl', description: 'Nutrient-rich green smoothie', price: 2200, image: '', mood_match: 'Fuel for deep focus', spice_level: 0, prep_time: 5 },
    { name: 'Moi Moi', description: 'High-protein steamed bean pudding', price: 1500, image: '', mood_match: 'Sustained energy without the crash', spice_level: 1, prep_time: 20 },
    { name: 'Boiled Yam & Egg Sauce', description: 'Simple, filling, and energizing', price: 2000, image: '', mood_match: 'Classic fuel for long work sessions', spice_level: 2, prep_time: 15 },
    { name: 'Zobo Drink', description: 'Refreshing hibiscus drink', price: 800, image: '', mood_match: 'Stay hydrated, stay focused', spice_level: 0, prep_time: 5 },
  ],
};

function sanitizeProducts(raw: unknown): MoodProduct[] | null {
  if (!Array.isArray(raw)) return null;
  const products: MoodProduct[] = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const name = typeof obj.name === 'string' ? obj.name.trim() : '';
      if (!name) return null;
      return {
        name,
        description: typeof obj.description === 'string' ? obj.description.trim() : '',
        price: typeof obj.price === 'number' && obj.price > 0 ? Math.round(obj.price) : 2000,
        image: typeof obj.image === 'string' ? obj.image : '',
        mood_match: typeof obj.mood_match === 'string' ? obj.mood_match.trim() : '',
        spice_level: typeof obj.spice_level === 'number' ? Math.max(0, Math.min(5, Math.round(obj.spice_level))) : 2,
        prep_time: typeof obj.prep_time === 'number' ? Math.max(1, Math.round(obj.prep_time)) : 20,
      };
    })
    .filter((x): x is MoodProduct => x !== null);

  return products.length > 0 ? products : null;
}

function extractJsonArray(text: string): unknown | null {
  if (!text) return null;
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

// GET /api/mood-feed?mood=cozy — Get mood-based food recommendations
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const mood = searchParams.get('mood') || 'cozy';

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a Nigerian food recommendation AI. Given a mood, suggest 6 specific Nigerian/West African dishes that match. Return ONLY a JSON array of objects with: name, description (1 sentence), price (in naira, realistic), image (empty string), mood_match (why this dish fits the mood), spice_level (1-5), prep_time (minutes).',
          },
          {
            role: 'user',
            content: `Suggest Nigerian dishes for someone feeling ${mood}.`,
          },
        ],
      });

      const content: string = response?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJsonArray(content);
      const normalized = parsed ? sanitizeProducts(parsed) : null;

      if (normalized) {
        return NextResponse.json({ success: true, products: normalized, mood, source: 'ai' });
      }
    } catch (aiError) {
      console.error('[Mood Feed] AI error:', aiError);
    }

    // Fallback mock data
    const fallbackProducts = MOOD_FALLBACKS[mood] || MOOD_FALLBACKS.cozy;
    return NextResponse.json({
      success: true,
      products: fallbackProducts,
      mood,
      source: 'mock',
    });
  } catch (error) {
    console.error('[Mood Feed] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/mood-feed' } });
    return NextResponse.json(
      { success: false, message: 'Mood feed failed' },
      { status: 500 },
    );
  }
}
