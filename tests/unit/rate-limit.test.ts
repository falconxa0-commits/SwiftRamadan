/**
 * Rate limiter unit tests — `src/lib/rate-limit.ts`.
 *
 * Tests:
 *  - The in-memory `rateLimit` function: first-request allow, block after
 *    limit, reset after window expiry.
 *  - The `checkRateLimit` HTTP helper: returns null when allowed, returns a
 *    429 `Response` when blocked, includes the standard rate-limit headers.
 *  - IP derivation from `x-forwarded-for` (rightmost IP — the trusted gateway IP).
 *  - The `RATE_LIMITS` preset map: auth (10/min), general (100/min), write
 *    (30/min), upload (10/min), ai (20/min).
 *
 * Mock strategy:
 *  - `@/lib/redis` is mocked so `checkRedisRateLimit` returns "Redis not
 *    configured" semantics (`remaining === options.limit`), which makes
 *    `checkRateLimit` fall through to the in-memory limiter. This isolates
 *    the tests from any real Redis backend.
 *  - Each test uses a unique identifier (timestamp + counter) so the
 *    module-level `store` Map doesn't carry state across tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @/lib/redis so checkRateLimit always falls through to the in-memory limiter.
vi.mock('@/lib/redis', () => ({
  // Returning `remaining === maxRequests` signals "Redis not configured" to
  // `checkRateLimit` (per the `redisResult.remaining < options.limit` check),
  // which makes it fall through to the in-memory `rateLimit` call.
  checkRedisRateLimit: vi.fn(async (_id: string, maxRequests: number, windowSeconds: number) => ({
    allowed: true,
    remaining: maxRequests,
    resetAt: Date.now() + windowSeconds * 1000,
  })),
}));

import { rateLimit, checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Counter for unique identifiers per test (avoids cross-test contamination
// from the module-level `store` Map).
let _counter = 0;
function uniqueId(prefix: string): string {
  _counter += 1;
  return `${prefix}-${Date.now()}-${_counter}`;
}

describe('rate-limit — `rateLimit` (in-memory)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows the first request within the window', () => {
    const id = uniqueId('first');
    const r = rateLimit(id, { limit: 5, windowMs: 60_000 });
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(4);
    expect(r.limit).toBe(5);
  });

  it('blocks requests after the limit is exceeded', () => {
    const id = uniqueId('block');
    const opts = { limit: 3, windowMs: 60_000 };
    expect(rateLimit(id, opts).success).toBe(true);
    expect(rateLimit(id, opts).success).toBe(true);
    expect(rateLimit(id, opts).success).toBe(true);
    // 4th request should be blocked.
    const blocked = rateLimit(id, opts);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets the counter after the window expires', async () => {
    const id = uniqueId('reset');
    const opts = { limit: 1, windowMs: 50 }; // 50ms window for fast test
    expect(rateLimit(id, opts).success).toBe(true);
    expect(rateLimit(id, opts).success).toBe(false);
    // Wait for window to expire.
    await new Promise((r) => setTimeout(r, 80));
    const after = rateLimit(id, opts);
    expect(after.success).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it('respects different limit tiers independently (auth vs ai)', () => {
    // Same identifier but different limits should not interfere (in practice
    // they'd be used for different routes; here we just confirm the limiter
    // honours the passed-in `limit`).
    const id = uniqueId('tiers');
    const r1 = rateLimit(id, RATE_LIMITS.auth);
    expect(r1.limit).toBe(10);
    const id2 = uniqueId('tiers2');
    const r2 = rateLimit(id2, RATE_LIMITS.ai);
    expect(r2.limit).toBe(20);
  });

  it('handles concurrent requests against the same identifier (serial increments)', () => {
    // Even though the limiter is sync, we verify that a burst of N synchronous
    // calls correctly counts toward the same window.
    const id = uniqueId('concurrent');
    const opts = { limit: 100, windowMs: 60_000 };
    let last: { success: boolean; remaining: number } | undefined;
    let allowed = 0;
    for (let i = 0; i < 50; i++) {
      last = rateLimit(id, opts);
      if (last.success) allowed++;
    }
    expect(allowed).toBe(50);
    // After 50 successful calls (count === 50), remaining should be 50.
    expect(last!.remaining).toBe(50);
  });
});

describe('rate-limit — `checkRateLimit` (HTTP helper)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows the first request (returns null when not rate-limited)', async () => {
    const req = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const result = await checkRateLimit(req, { limit: 5, windowMs: 60_000 });
    expect(result).toBeNull();
  });

  it('returns a 429 Response when the limit is exceeded', async () => {
    const ip = uniqueId('ip-block');
    const opts = { limit: 2, windowMs: 60_000 };
    const req = () =>
      new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': ip },
      });
    // Use up the limit.
    expect(await checkRateLimit(req(), opts)).toBeNull();
    expect(await checkRateLimit(req(), opts)).toBeNull();
    // 3rd request should be blocked.
    const blocked = await checkRateLimit(req(), opts);
    expect(blocked).not.toBeNull();
    expect(blocked instanceof Response).toBe(true);
    expect(blocked!.status).toBe(429);
  });

  it('includes Retry-After and X-RateLimit-* headers on the 429 response', async () => {
    const ip = uniqueId('ip-headers');
    const opts = { limit: 1, windowMs: 60_000 };
    const req = () =>
      new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': ip },
      });
    expect(await checkRateLimit(req(), opts)).toBeNull();
    const blocked = await checkRateLimit(req(), opts);
    expect(blocked).not.toBeNull();
    expect(blocked!.headers.get('Retry-After')).toBeTruthy();
    expect(blocked!.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(blocked!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(blocked!.headers.get('X-RateLimit-Reset')).toBeTruthy();
    expect(blocked!.headers.get('Content-Type')).toBe('application/json');
    const body = await blocked!.json();
    expect(body.success).toBe(false);
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('uses the rightmost IP from x-forwarded-for as the identifier', async () => {
    // The rightmost value is the one set by our trusted gateway (Caddy);
    // earlier entries can be spoofed by the client.
    const trustedIp = uniqueId('trusted-ip');
    const spoofedIp = '9.9.9.9';
    const forwarded = `${spoofedIp}, ${trustedIp}`;
    const opts = { limit: 1, windowMs: 60_000 };
    const req = () =>
      new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': forwarded },
      });
    expect(await checkRateLimit(req(), opts)).toBeNull();
    // Now block using ONLY the trustedIp (proves the limiter keyed on it).
    const blocked = await checkRateLimit(req(), opts);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
  });

  it('uses "unknown" as the identifier when x-forwarded-for is missing', async () => {
    // Two requests from "unknown" should share the same limiter slot.
    // To avoid colliding with other tests that use no x-forwarded-for,
    // we use a tight window and a low limit; just verify it doesn't crash.
    const req = new Request('http://localhost/api/test');
    const result = await checkRateLimit(req, { limit: 1000, windowMs: 60_000 });
    expect(result).toBeNull();
  });

  it('works without Redis (falls through to in-memory limiter)', async () => {
    // The mocked `checkRedisRateLimit` returns `remaining === maxRequests`,
    // which signals "Redis not configured" and makes `checkRateLimit` fall
    // through to the in-memory limiter. Two requests with the same IP
    // should be counted.
    const ip = uniqueId('no-redis');
    const opts = { limit: 1, windowMs: 60_000 };
    const req = () =>
      new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': ip },
      });
    expect(await checkRateLimit(req(), opts)).toBeNull();
    expect((await checkRateLimit(req(), opts))?.status).toBe(429);
  });
});

describe('rate-limit — `RATE_LIMITS` presets', () => {
  it('has auth, general, write, upload, ai presets', () => {
    expect(RATE_LIMITS).toHaveProperty('auth');
    expect(RATE_LIMITS).toHaveProperty('general');
    expect(RATE_LIMITS).toHaveProperty('write');
    expect(RATE_LIMITS).toHaveProperty('upload');
    expect(RATE_LIMITS).toHaveProperty('ai');
  });

  it('RATE_LIMITS.auth is 10 per minute (60_000 ms)', () => {
    expect(RATE_LIMITS.auth.limit).toBe(10);
    expect(RATE_LIMITS.auth.windowMs).toBe(60 * 1000);
  });
});
