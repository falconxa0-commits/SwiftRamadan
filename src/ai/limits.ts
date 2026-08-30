/**
 * Token budget + rate limiting for the unified AI gateway.
 *
 * Pipeline enforcement (per spec PHASE-2-AI-GATEWAY):
 *   Authentication → Permission → Input sanitization → Token budget → Model call → Output validation
 *
 * This module owns the "Token budget" step. Every AI request MUST go through
 * `checkTokenBudget` BEFORE the model call, and `recordTokenUsage` AFTER it.
 *
 * Design notes:
 *  - Backed by Upstash Redis (`@/lib/redis`) for shared state across instances.
 *  - Falls open (allow) when Redis is not configured — matches the rest of the
 *    codebase's "fail open on Redis errors" convention (see `src/lib/redis.ts`
 *    `checkRedisRateLimit`). Fail-closed would lock the entire app out of AI
 *    if Redis blips, which is worse for a Ramadan food-delivery super-app.
 *  - Daily counter resets automatically via TTL.
 *  - The `redis` client is imported directly (not cacheGet/cacheSet) because
 *    we need atomic `incr`/`incrby` semantics; cacheGet/cacheSet are JSON-only.
 */

import { redis } from '@/lib/redis';

/** Default daily + per-request token budgets for AI requests. */
export const TOKEN_BUDGETS = {
  /** Max tokens a single user can consume per day (across all AI routes). */
  daily: 10_000,
  /** Default max_tokens for a single completion call. */
  perRequest: 500,
} as const;

/**
 * Rate-limit preset for AI routes. 20 requests per 60 seconds per user.
 * Route handlers should still call `checkRateLimit(request, RATE_LIMITS.ai)`
 * from `@/lib/rate-limit` for the IP-based outer limiter; this constant is the
 * AI-specific per-user layer that the gateway itself enforces.
 */
export const AI_RATE_LIMITS = {
  requests: 20,
  /** Window length in seconds (60s = 1 minute). */
  window: 60,
} as const;

/** 24 hours in seconds — TTL for daily budget counters. */
const DAILY_TTL_SECONDS = 86_400;

/** Maximum per-request tokens the gateway will allow (hard ceiling). */
export const MAX_PER_REQUEST_TOKENS = 2_000;

/**
 * Format today's date as `YYYY-MM-DD` in UTC. Used in the Redis key so the
 * counter naturally partitions per calendar day. We deliberately use UTC
 * (not Lagos/WAT) so the partition is deterministic across server instances
 * regardless of their local timezone.
 */
function todayKey(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function budgetKey(userId: string): string {
  return `ai:budget:${userId}:${todayKey()}`;
}

/**
 * Check whether `userId` still has token budget remaining for today.
 *
 * Returns `{ allowed: true, remaining }` when the user is under the daily
 * cap, or `{ allowed: false, remaining: 0 }` when they've exhausted it.
 *
 * When Redis is unavailable (no Upstash config) or errors, returns the full
 * daily budget as remaining — fail-open. This matches `checkRedisRateLimit`
 * semantics and prevents a Redis outage from breaking every AI route.
 */
export async function checkTokenBudget(
  userId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!userId) {
    return { allowed: false, remaining: 0 };
  }

  if (!redis) {
    // Redis not configured — fail open with full budget.
    return { allowed: true, remaining: TOKEN_BUDGETS.daily };
  }

  try {
    const key = budgetKey(userId);
    // `get` returns the stored value or null. We parse to a number; if the
    // key doesn't exist yet (first request of the day), treated as 0.
    const raw = await redis.get<string>(key);
    const used = typeof raw === 'number' ? raw : Number(raw ?? 0);
    const remaining = Math.max(0, TOKEN_BUDGETS.daily - used);
    return { allowed: remaining > 0, remaining };
  } catch (error) {
    console.error('[ai/limits] checkTokenBudget error:', error);
    return { allowed: true, remaining: TOKEN_BUDGETS.daily };
  }
}

/**
 * Increment the daily token-usage counter for `userId` by `tokens`.
 *
 * Uses Redis `incrby` for an atomic increment, then sets a 24h TTL so the
 * counter auto-expires at end of day. The TTL is set on every call —
 * Upstash's `expire` overwrites the previous TTL, which is fine: the key
 * will live ~24h from the most recent write. (For a daily counter this is
 * correct: the counter persists for as long as the user keeps hitting the
 * gateway, then disappears a day after their last request.)
 *
 * Fails open: if Redis is unavailable, the call is a no-op (logged but not
 * thrown). Under-counting usage is preferable to blocking the user.
 */
export async function recordTokenUsage(
  userId: string,
  tokens: number,
): Promise<void> {
  if (!userId || tokens <= 0) return;

  if (!redis) return;

  try {
    const key = budgetKey(userId);
    // Upstash exposes `incrby` for atomic integer increment.
    // Type note: the Upstash client types `incrby` loosely; cast to satisfy tsc.
    const r = redis as unknown as {
      incrby?: (k: string, v: number) => Promise<number>;
      expire?: (k: string, s: number) => Promise<number>;
      set: (k: string, v: unknown) => Promise<string>;
      get: <T = string>(k: string) => Promise<T | null>;
    };
    if (typeof r.incrby === 'function') {
      await r.incrby(key, Math.floor(tokens));
    } else {
      // Fallback path: read-modify-write. Less atomic but still correct
      // for our scale (single-user-per-key writes).
      const raw = await r.get<string>(key);
      const used = typeof raw === 'number' ? raw : Number(raw ?? 0);
      await r.set(key, used + Math.floor(tokens));
    }

    // (Re)set TTL so the key expires 24h after the last write.
    if (typeof r.expire === 'function') {
      await r.expire(key, DAILY_TTL_SECONDS);
    }
  } catch (error) {
    // Fail open — never throw from accounting code.
    console.error('[ai/limits] recordTokenUsage error:', error);
  }
}

/**
 * Resolve the effective per-request `max_tokens` for a gateway call.
 *
 * Callers may pass `maxTokens` to override the default; the value is clamped
 * to `[1, MAX_PER_REQUEST_TOKENS]` to prevent runaway token spend from a
 * single request.
 */
export function resolveMaxTokens(maxTokens?: number): number {
  const requested = typeof maxTokens === 'number' && Number.isFinite(maxTokens)
    ? Math.floor(maxTokens)
    : TOKEN_BUDGETS.perRequest;
  if (requested < 1) return 1;
  if (requested > MAX_PER_REQUEST_TOKENS) return MAX_PER_REQUEST_TOKENS;
  return requested;
}
