import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';
import { getConversation, saveConversation, clearConversation } from '@/ai/memory';
import { aiRequest } from '@/ai/gateway';
import * as usersService from '@/services/users/users.service';

// ── Conversation memory ────────────────────────────────────────────────────
// The unified AI gateway reads conversation history from Redis (`getConversation`)
// but does NOT write it back — the route is responsible for appending the new
// turn. We keep that contract here: read before the call (so we know the prior
// transcript), call `aiRequest`, then push the new user + assistant messages
// and save.
//
// Keys are namespaced per `auth.userId` so users cannot read each other's
// histories; TTL is 24h (enforced by `@/ai/memory`).

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rl) return rl;

  // Auth required — AI route (Phase 3 — secure AI routes)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

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

    // Sanitize user input destined for the LLM (Phase 3 — input sanitization)
    const cleanMessage = sanitizePromptInput(message);
    if (!cleanMessage) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    // ── Build dynamic context from DB ─────────────────────────────────────
    // PHASE-6-2: the gateway's `buildSystemPrompt` only injects a fixed set
    // of context fields (`userName`, `role`, `loyaltyTier`, `dietaryPrefs`,
    // `cartItems`). The richer "product count + top-rated products" context
    // we used to inject into the system prompt is now prepended to the user
    // message — the model still sees it, just in the user turn instead of
    // the system turn.
    let dynamicContext = 'App is running.';
    let userContext: { userName?: string; loyaltyTier?: string } = {};
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
        // MIGRATED (Phase 10): user lookup via `usersService.getUserById`.
        // The previous flow looked up by `userEmail` (from the request body),
        // which could be ANY email — an IDOR that leaked another user's
        // name + loyalty tier + Hasanat points into the AI context. We now
        // use the authenticated user's ID, so only the caller's own data is
        // injected. The `userEmail` body field is now ignored (kept in the
        // body type for backward compatibility with clients that send it).
        //
        // The service returns a `PublicUser` whose TypeScript type is the
        // union of the base + owner-extras branches of `publicUserFields`.
        // `loyaltyTier` and `hasanatPoints` are owner-extras (only added
        // when `requesterId === user.id`, which the service guarantees by
        // passing `auth.userId` as both args). We use a narrow cast to
        // access them; the runtime values are populated because the service
        // always passes the matching requesterId.
        const user = await usersService.getUserById(auth.userId);
        if (user) {
          const userName = String(user.name);
          const ownerExtras = user as { loyaltyTier?: unknown; hasanatPoints?: unknown };
          const loyaltyTier = ownerExtras.loyaltyTier ? String(ownerExtras.loyaltyTier) : '';
          const hasanatPoints = ownerExtras.hasanatPoints != null ? Number(ownerExtras.hasanatPoints) : 0;
          dynamicContext += ` Current user: ${userName}, ${loyaltyTier} tier, ${hasanatPoints} Hasanat points.`;
          userContext = {
            userName,
            loyaltyTier,
          };
        }
      }
    } catch {
      // Context enrichment is optional — continue with default
    }

    // ── Get or create conversation (Redis-backed, keyed by auth userId) ────
    // We read the history here so we can append the new turn after the call.
    // (The gateway also reads it internally, but does not save it back.)
    let history = await getConversation(auth.userId);

    // Trim history to last 20 messages to keep context manageable
    // (also enforced server-side by `saveConversation`)
    if (history.length > 20) {
      history = history.slice(-20);
    }

    // ── Call the unified AI gateway ───────────────────────────────────────
    // Prepend the dynamic DB context to the user message so the model still
    // sees product/user info (the gateway's system prompt is the fixed
    // default Safa persona).
    const messageWithContext = `[App context: ${dynamicContext}]\n\n${cleanMessage}`;
    const result = await aiRequest({
      userId: auth.userId,
      userRole: auth.role,
      message: messageWithContext,
      context: {
        role: auth.role,
        ...userContext,
      },
      maxTokens: 500,
    });

    if (!result.success || !result.response) {
      return NextResponse.json(
        { success: false, message: result.error || 'AI assistant temporarily unavailable' },
        { status: 500 }
      );
    }

    const aiResponse = result.response;

    // ── Update history (Redis-backed) ─────────────────────────────────────
    // Save the *un-prefixed* user message (no `[App context: …]` prefix) so
    // future turns see a clean transcript. The gateway already returned a
    // validated assistant message, so we persist that as-is.
    history.push({ role: 'user', content: cleanMessage });
    history.push({ role: 'assistant', content: aiResponse });
    await saveConversation(auth.userId, history);

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
  // Auth required — AI route (Phase 3 — secure AI routes)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Clear the authenticated user's conversation in Redis (idempotent).
  await clearConversation(auth.userId);
  return NextResponse.json({ success: true });
}
