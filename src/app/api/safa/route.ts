import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// ── Singleton ZAI instance ──────────────────────────────────────────────────
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

// ── In-memory conversation store (sessionId → messages[]) ───────────────────
const conversations = new Map<string, { role: string; content: string }[]>();

// ── Rich system prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Safa, the AI assistant for SwiftRamadan — a Ramadan food delivery super-app in Lagos, Nigeria. You help users with:

1. **Ordering Food**: When users say "I want jollof rice" or "order suya for me", help them find the right product. Suggest popular items. Prices are in Nigerian Naira (₦).

2. **Order Tracking**: When users ask about their order, tell them you can check the status. Suggest they check the Orders tab for real-time tracking.

3. **Recipe Help**: Help users with cooking tips, ingredient substitutions, and iftar meal planning.

4. **Ramadan Info**: Answer questions about prayer times, iftar/sahur traditions, and halal food guidelines.

5. **App Navigation**: Help users find features like flash sales, group buys, loyalty rewards, vendor profiles, etc.

**Tone**: Warm, friendly, helpful. Use occasional Arabic greetings like "Assalamu Alaikum" and "Ramadan Kareem". Keep responses concise (2-3 sentences max, unless giving a recipe). Use Nigerian Pidgin occasionally for local flavor.

**Key Rules**:
- Always be respectful of Islamic traditions
- Never suggest non-halal items
- When suggesting products, mention the price in ₦
- If you don't know something, say so honestly
- For order-related queries, suggest checking the Orders tab
- For delivery queries, suggest the real-time tracking feature

**Current Context**: {dynamicContext}`;

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, RATE_LIMITS.ai);
  if (rl) return rl;

  try {
    const body = await request.json();
    const { message, sessionId = 'default', userEmail } = body as {
      message?: string;
      sessionId?: string;
      userEmail?: string;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    // ── Build dynamic context from DB ─────────────────────────────────────
    let dynamicContext = 'App is running.';
    try {
      const productCount = await db.product.count({
        where: { inStock: true },
      });
      const topProducts = await db.product.findMany({
        where: { inStock: true },
        orderBy: { rating: 'desc' },
        take: 5,
        select: { name: true, price: true, category: true, rating: true },
      });
      dynamicContext = `There are ${productCount} products available. Top rated: ${topProducts.map((p) => `${p.name} (₦${p.price}, ${p.category}, ⭐${p.rating})`).join(', ')}.`;

      if (userEmail) {
        const user = await db.user.findUnique({
          where: { email: userEmail },
          select: { name: true, loyaltyTier: true, hasanatPoints: true },
        });
        if (user) {
          dynamicContext += ` Current user: ${user.name}, ${user.loyaltyTier} tier, ${user.hasanatPoints} Hasanat points.`;
        }
      }
    } catch {
      // Context enrichment is optional — continue with default
    }

    // ── Get or create conversation ────────────────────────────────────────
    let history = conversations.get(sessionId) || [];

    // Trim history to last 20 messages to keep context manageable
    if (history.length > 20) {
      history = history.slice(-20);
    }

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: SYSTEM_PROMPT.replace('{dynamicContext}', dynamicContext),
        },
        ...history,
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    });

    const aiResponse =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't process that. Please try again.";

    // ── Update history ────────────────────────────────────────────────────
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: aiResponse });
    conversations.set(sessionId, history);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId,
    });
  } catch (error) {
    console.error('Safa AI error:', error);
    return NextResponse.json(
      { success: false, message: 'AI assistant temporarily unavailable' },
      { status: 500 }
    );
  }
}

// ── DELETE handler — clear conversation ─────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (sessionId) conversations.delete(sessionId);
  return NextResponse.json({ success: true });
}
