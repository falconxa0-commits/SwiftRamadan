import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { aiRequest } from '@/ai/gateway';
import { captureException } from '@/lib/monitoring/sentry';
import * as usersService from '@/services/users/users.service';

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

// GET /api/predictive-reorder — Get AI-predicted reorder suggestions (requires auth)
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // MIGRATED (Phase 11): defense-in-depth user existence check via
  // `usersService.getUserById`. Mirrors `/api/cart/route.ts` — returns a
  // clean 404 if the user was deleted between JWT issuance and this request.
  const userExists = await usersService.getUserById(auth.userId);
  if (!userExists) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 },
    );
  }

  try {
    const userId = auth.userId;

    try {
      // PHASE-10: migrated to the unified AI gateway (`aiRequest`). The
      // task-specific system instruction is prepended to the user message
      // because the gateway bakes in a fixed Safa system persona (see
      // `src/ai/gateway.ts`). The model still receives the JSON output
      // constraint; the only structural change is that it arrives in the
      // user turn instead of the system turn.
      const reorderSystemInstruction =
        'You are a food reorder prediction AI for a Nigerian food delivery app. Based on typical Ramadan ordering patterns, predict what the user likely wants to reorder. Return ONLY a JSON array of objects with: name, price (naira), image (empty string), lastOrdered (relative time like "3 days ago"), reorderScore (0-100 likelihood), reason (short explanation).';
      const userContext = userId ? `The user ID is ${userId}. ` : '';
      const fullMessage =
        `${reorderSystemInstruction}\n\n${userContext}Suggest reorder items for a Nigerian Muslim during Ramadan who typically orders for iftar and sahur.`;
      const result = await aiRequest({
        userId: auth.userId,
        userRole: auth.role,
        message: fullMessage,
        maxTokens: 1000,
      });

      if (result.success && result.response) {
        const parsed = extractJsonArray(result.response);
        const normalized = parsed ? sanitizeItems(parsed) : null;

        if (normalized) {
          return NextResponse.json({ success: true, items: normalized, source: 'ai' });
        }
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
