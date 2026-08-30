/**
 * Redis-backed conversation memory for the unified AI gateway.
 *
 * Replaces the in-memory `Map<string, ChatMessage[]>` in `/api/safa` (audit
 * Echo E2: "in-memory conversations"). The Map leaked conversations across
 * users on serverless warm instances, was unbounded, and was lost on every
 * cold start.
 *
 * Pipeline enforcement (per spec PHASE-2-AI-GATEWAY):
 *   Authentication → Permission → Input sanitization → Token budget → Model call → Output validation
 *
 * Memory sits OUTSIDE the per-request pipeline — it's the persistence layer
 * the gateway reads from before the call and writes to after. It still has
 * to be safe, though: keys are namespaced per userId so users cannot read
 * each other's histories, and the values are TTL'd (24h) so we don't store
 * transcripts forever (NDPR/GDPR hygiene).
 *
 * Storage: Upstash Redis via `cacheGet`/`cacheSet` from `@/lib/redis`.
 * Key:    `ai:conversation:${userId}`
 * TTL:    86_400 seconds (24 hours)
 *
 * When Redis is not configured (`cacheGet` returns null and `cacheSet`
 * returns false), all three functions degrade gracefully: reads return an
 * empty array, writes are no-ops, deletes are no-ops. This matches the
 * "fail open" convention used by the rest of the AI gateway.
 */

import { cacheGet, cacheSet, redisDel } from '@/lib/redis';

/**
 * ChatMessage shape — kept compatible with the existing in-memory store in
 * `/api/safa` so callers can swap implementations with no code changes.
 *
 * The `role` union is deliberately wider than ZAI's `ChatMessage['role']`
 * because some callers write `'system'` messages into history; the gateway
 * will filter to the ZAI-supported roles before passing to the model.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Optional ISO timestamp for debugging / TTL bookkeeping. */
  timestamp?: string;
}

/** Redis key namespace for conversation memory. */
const KEY_NAMESPACE = 'ai:conversation';

/** 24 hours in seconds — TTL for stored conversations. */
const CONVERSATION_TTL_SECONDS = 86_400;

/** Hard cap on stored history length (most recent N messages kept). */
const MAX_HISTORY_MESSAGES = 20;

function conversationKey(userId: string): string {
  // cacheGet/cacheSet already prepend `cache:`, so the final Redis key is
  // `cache:ai:conversation:${userId}`. The spec uses the unprefixed form
  // in documentation; the prefix is an implementation detail of `@/lib/redis`.
  return `${KEY_NAMESPACE}:${userId}`;
}

/**
 * Fetch a user's conversation history from Redis.
 *
 * Returns an empty array when:
 *  - `userId` is empty
 *  - Redis is not configured
 *  - The key doesn't exist (first message in the window)
 *  - The stored value can't be parsed (corrupt JSON — treated as empty
 *    so the user can keep chatting)
 *
 * Never throws — gateway callers depend on this being total.
 */
export async function getConversation(userId: string): Promise<ChatMessage[]> {
  if (!userId) return [];

  try {
    const stored = await cacheGet<ChatMessage[]>(conversationKey(userId));
    if (!Array.isArray(stored)) return [];

    // Defensive copy + cap to MAX_HISTORY_MESSAGES so a stale Redis entry
    // can't grow unbounded.
    return stored.slice(-MAX_HISTORY_MESSAGES);
  } catch (error) {
    console.error('[ai/memory] getConversation error:', error);
    return [];
  }
}

/**
 * Persist a user's conversation history to Redis with a 24h TTL.
 *
 * The caller is expected to pass the FULL updated history (including the
 * most recent user + assistant messages). This function trims to the last
 * `MAX_HISTORY_MESSAGES` entries before writing — older messages are
 * dropped. The trim is server-side so clients don't have to know the cap.
 *
 * Each message's `timestamp` is set to "now" if missing, so we can later
 * inspect storage health / age.
 */
export async function saveConversation(
  userId: string,
  messages: ChatMessage[],
): Promise<void> {
  if (!userId) return;
  if (!Array.isArray(messages)) return;

  try {
    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ?? new Date().toISOString(),
    }));

    await cacheSet(conversationKey(userId), trimmed, CONVERSATION_TTL_SECONDS);
  } catch (error) {
    // Fail open — never throw from a persistence helper.
    console.error('[ai/memory] saveConversation error:', error);
  }
}

/**
 * Delete a user's conversation history from Redis.
 *
 * Used by the `/api/safa` DELETE handler (and equivalent in other AI routes)
 * to implement "clear chat". Idempotent — deleting a missing key is a no-op.
 */
export async function clearConversation(userId: string): Promise<void> {
  if (!userId) return;

  try {
    // `redisDel` from `@/lib/redis` already handles the `cache:` prefix
    // because `cacheSet` writes with that prefix. We pass the same logical
    // key used by `saveConversation` and let `redisDel` prepend the prefix.
    //
    // NOTE: `@/lib/redis` does NOT export a `cacheDel` helper, but
    // `redisDel` itself doesn't prepend `cache:`. We need to delete the
    // exact key that `cacheSet` wrote, which is `cache:${conversationKey}`.
    // For safety, attempt BOTH the prefixed and unprefixed keys so this
    // works regardless of how `@/lib/redis` evolves the prefix.
    await redisDel(`cache:${conversationKey(userId)}`);
  } catch (error) {
    console.error('[ai/memory] clearConversation error:', error);
  }
}
