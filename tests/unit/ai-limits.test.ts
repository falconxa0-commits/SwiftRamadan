/**
 * Token budget + rate limiting unit tests — `src/ai/limits.ts`.
 *
 * Verifies:
 *  - `checkTokenBudget`: allows when under daily cap, blocks when over,
 *    and fails open (returns `allowed: true, remaining: TOKEN_BUDGETS.daily`)
 *    when Redis is unavailable.
 *  - `recordTokenUsage`: increments the daily counter via `incrby` and
 *    resets the 24h TTL via `expire`.
 *  - `resolveMaxTokens`: clamps to `[1, MAX_PER_REQUEST_TOKENS]`, defaults
 *    to `TOKEN_BUDGETS.perRequest` (500) when called with no argument.
 *  - `TOKEN_BUDGETS` / `AI_RATE_LIMITS` / `MAX_PER_REQUEST_TOKENS` export
 *    the spec-defined constant values.
 *
 * Mock strategy:
 *  - `@/lib/redis` is mocked. The `redis` export is a writable mock we can
 *    swap between "configured" (returns values from `get`/`incrby`/`expire`)
 *    and "unavailable" (`null`) so we can test the fail-open path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to be able to swap `redis` between `null` and a real-ish mock per
// test, so we export an object with a mutable `redis` property.
const redisMock = {
  get: vi.fn(),
  set: vi.fn(),
  incrby: vi.fn(),
  expire: vi.fn(),
};

// Build a mock that exposes `redis` as a getter so we can swap it at runtime.
let _redis: unknown = redisMock;
vi.mock('@/lib/redis', () => ({
  get redis() {
    return _redis;
  },
}));

import {
  checkTokenBudget,
  recordTokenUsage,
  resolveMaxTokens,
  TOKEN_BUDGETS,
  AI_RATE_LIMITS,
  MAX_PER_REQUEST_TOKENS,
} from '@/ai/limits';

describe('ai/limits — constants', () => {
  it('TOKEN_BUDGETS has daily=10000 and perRequest=500', () => {
    expect(TOKEN_BUDGETS.daily).toBe(10_000);
    expect(TOKEN_BUDGETS.perRequest).toBe(500);
  });

  it('AI_RATE_LIMITS has requests=20, window=60', () => {
    expect(AI_RATE_LIMITS.requests).toBe(20);
    expect(AI_RATE_LIMITS.window).toBe(60);
  });

  it('MAX_PER_REQUEST_TOKENS is 2000 (hard ceiling)', () => {
    expect(MAX_PER_REQUEST_TOKENS).toBe(2_000);
  });
});

describe('ai/limits — `checkTokenBudget`', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _redis = redisMock; // Redis available by default.
  });

  it('allows when the user is under the daily budget', async () => {
    redisMock.get.mockResolvedValueOnce(2_000); // 2000 tokens used today.
    const result = await checkTokenBudget('user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(8_000); // 10000 - 2000
  });

  it('blocks when the user is over the daily budget', async () => {
    redisMock.get.mockResolvedValueOnce(10_000); // exactly the cap.
    const result = await checkTokenBudget('user-2');
    // remaining = max(0, 10000 - 10000) = 0; allowed = remaining > 0 = false.
    expect(result.remaining).toBe(0);
    expect(result.allowed).toBe(false);
  });

  it('tracks daily usage via a date-scoped key (YYYY-MM-DD in UTC)', async () => {
    redisMock.get.mockResolvedValueOnce(500);
    await checkTokenBudget('user-3');
    expect(redisMock.get).toHaveBeenCalledTimes(1);
    const key = redisMock.get.mock.calls[0][0] as string;
    // Key format: ai:budget:<userId>:<YYYY-MM-DD>
    expect(key).toMatch(/^ai:budget:user-3:\d{4}-\d{2}-\d{2}$/);
  });

  it('handles Redis unavailable (redis === null) by failing open', async () => {
    _redis = null; // simulate Redis not configured.
    const result = await checkTokenBudget('user-4');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(TOKEN_BUDGETS.daily);
  });

  it('handles Redis errors by failing open (does not throw)', async () => {
    redisMock.get.mockRejectedValueOnce(new Error('Redis down'));
    const result = await checkTokenBudget('user-5');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(TOKEN_BUDGETS.daily);
  });

  it('returns allowed:false for an empty userId', async () => {
    const result = await checkTokenBudget('');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe('ai/limits — `recordTokenUsage`', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _redis = redisMock;
  });

  it('increments usage via `incrby` and resets the 24h TTL via `expire`', async () => {
    redisMock.incrby.mockResolvedValueOnce(500);
    redisMock.expire.mockResolvedValueOnce(1);
    await recordTokenUsage('user-rec-1', 500);
    expect(redisMock.incrby).toHaveBeenCalledTimes(1);
    const [key, amount] = redisMock.incrby.mock.calls[0];
    expect(key).toMatch(/^ai:budget:user-rec-1:\d{4}-\d{2}-\d{2}$/);
    expect(amount).toBe(500);
    expect(redisMock.expire).toHaveBeenCalledTimes(1);
    const [expireKey, ttl] = redisMock.expire.mock.calls[0];
    expect(expireKey).toBe(key);
    expect(ttl).toBe(86_400); // 24h in seconds.
  });

  it('no-ops when tokens <= 0', async () => {
    await recordTokenUsage('user-rec-2', 0);
    await recordTokenUsage('user-rec-2', -5);
    expect(redisMock.incrby).not.toHaveBeenCalled();
  });

  it('no-ops when userId is empty', async () => {
    await recordTokenUsage('', 500);
    expect(redisMock.incrby).not.toHaveBeenCalled();
  });

  it('no-ops when Redis is unavailable (redis === null)', async () => {
    _redis = null;
    await recordTokenUsage('user-rec-3', 500);
    expect(redisMock.incrby).not.toHaveBeenCalled();
  });
});

describe('ai/limits — `resolveMaxTokens`', () => {
  it('returns the user-supplied value when within bounds', () => {
    expect(resolveMaxTokens(100)).toBe(100);
    expect(resolveMaxTokens(750)).toBe(750);
  });

  it('caps the value at MAX_PER_REQUEST_TOKENS (2000)', () => {
    expect(resolveMaxTokens(5_000)).toBe(MAX_PER_REQUEST_TOKENS);
    expect(resolveMaxTokens(2_001)).toBe(MAX_PER_REQUEST_TOKENS);
  });

  it('clamps values below 1 to 1', () => {
    expect(resolveMaxTokens(0)).toBe(1);
    expect(resolveMaxTokens(-10)).toBe(1);
  });

  it('uses the default (TOKEN_BUDGETS.perRequest = 500) when no value is given', () => {
    expect(resolveMaxTokens(undefined)).toBe(TOKEN_BUDGETS.perRequest);
    expect(resolveMaxTokens(NaN)).toBe(TOKEN_BUDGETS.perRequest);
    expect(resolveMaxTokens(Infinity)).toBe(TOKEN_BUDGETS.perRequest);
  });
});
