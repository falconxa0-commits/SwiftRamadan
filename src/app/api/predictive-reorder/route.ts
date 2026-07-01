import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

interface ReorderItem {
  name: string;
  price: number;
  image: string;
  lastOrdered: string;
  reorderScore: number;
  reason: string;
}

const FALLBACK_ITEMS: ReorderItem[] = [
  { name: 'Jollof Rice & Chicken', price: 4500, image: '', lastOrdered: '2 days ago', reorderScore: 92, reason: 'Your most ordered iftar meal' },
  { name: 'Premium Dates Box', price: 7500, image: '', lastOrdered: '5 days ago', reorderScore: 87, reason: 'Running low based on your usage' },
  { name: 'Zobo Drink', price: 800, image: '', lastOrdered: '3 days ago', reorderScore: 78, reason: 'You order this every 3 days' },
  { name: 'Suya Platter', price: 3200, image: '', lastOrdered: '1 week ago', reorderScore: 65, reason: 'Weekend favorite' },
  { name: 'Moi Moi', price: 1500, image: '', lastOrdered: '4 days ago', reorderScore: 60, reason: 'High-protein sahur staple' },
];

function sanitizeItems(raw: unknown): ReorderItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: ReorderItem[] = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const name = typeof obj.name === 'string' ? obj.name.trim() : '';
      if (!name) return null;
      return {
        name,
        price: typeof obj.price === 'number' && obj.price > 0 ? Math.round(obj.price) : 2000,
        image: typeof obj.image === 'string' ? obj.image : '',
        lastOrdered: typeof obj.lastOrdered === 'string' ? obj.lastOrdered.trim() : 'recently',
        reorderScore: typeof obj.reorderScore === 'number' ? Math.max(0, Math.min(100, Math.round(obj.reorderScore))) : 50,
        reason: typeof obj.reason === 'string' ? obj.reason.trim() : '',
      };
    })
    .filter((x): x is ReorderItem => x !== null);

  return items.length > 0 ? items : null;
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

// GET /api/predictive-reorder — Get AI-predicted reorder suggestions
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const userContext = userId
        ? `The user ID is ${userId}. `
        : '';

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a food reorder prediction AI for a Nigerian food delivery app. Based on typical Ramadan ordering patterns, predict what the user likely wants to reorder. Return ONLY a JSON array of objects with: name, price (naira), image (empty string), lastOrdered (relative time like "3 days ago"), reorderScore (0-100 likelihood), reason (short explanation).',
          },
          {
            role: 'user',
            content: `${userContext}Suggest reorder items for a Nigerian Muslim during Ramadan who typically orders for iftar and sahur.`,
          },
        ],
      });

      const content: string = response?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJsonArray(content);
      const normalized = parsed ? sanitizeItems(parsed) : null;

      if (normalized) {
        return NextResponse.json({ success: true, items: normalized, source: 'ai' });
      }
    } catch (aiError) {
      console.error('[Predictive Reorder] AI error:', aiError);
    }

    // Fallback mock data
    return NextResponse.json({
      success: true,
      items: FALLBACK_ITEMS,
      source: 'mock',
    });
  } catch (error) {
    console.error('[Predictive Reorder] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/predictive-reorder' } });
    return NextResponse.json(
      { success: false, message: 'Predictions failed' },
      { status: 500 },
    );
  }
}
