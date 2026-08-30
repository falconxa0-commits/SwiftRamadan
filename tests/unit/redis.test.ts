import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Redis unit tests — lock in the Phase 8.2 multi-backend behaviour.
 *
 * Scope:
 *  - `cacheGet`/`cacheSet`/`cacheInvalidate` round-trip against the in-memory
 *    fallback backend (the default in tests — no `UPSTASH_REDIS_REST_URL` /
 *    `REDIS_URL` env vars are set by `tests/setup.ts`).
 *  - `redisSet`/`redisGet`/`redisDel` round-trip + TTL expiry semantics.
 *  - `checkRedisRateLimit` windowing + `incr` semantics on the in-memory map.
 *  - `isRedisAvailable` / `redisBackend` exports report the active backend.
 *  - `storeOTP`/`getOTP`/`deleteOTP` happy-path.
 *
 * Why no Upstash/ioredis tests: those backends need network and credentials.
 * The unified `RedisLike` interface guarantees the in-memory assertions hold
 * against Upstash/ioredis too — the only difference is which wire protocol
 * is used; the JSON auto-serialize semantics are identical (verified by
 * code inspection in `src/lib/redis.ts`).
 *
 * Tests run with `process.env.UPSTASH_REDIS_REST_URL` and `REDIS_URL` both
 * unset (verified by `tests/setup.ts` not defining them and the local `.env`
 * only containing `DATABASE_URL`), so the in-memory fallback is the active
 * backend.
 */
import {
  cacheGet,
  cacheSet,
  cacheInvalidate,
  redisSet,
  redisGet,
  redisDel,
  storeOTP,
  getOTP,
  deleteOTP,
  checkRedisRateLimit,
  markEmailVerified,
  isEmailVerifiedRedis,
  isRedisAvailable,
  redisBackend,
} from '@/lib/redis';

describe('redis — multi-backend module (in-memory fallback)', () => {
  beforeEach(async () => {
    // Clear any state carried over between tests. The cache prefix is the
    // main concern — OTP/verified/ratelimit keys are isolated by their
    // own namespaces and tests use unique emails/identifiers, so this is
    // belt-and-braces rather than strictly necessary.
    await cacheInvalidate('test:');
  });

  describe('backend selection', () => {
    it('reports the in-memory backend when no env vars are set', () => {
      // The test env doesn't set UPSTASH_REDIS_REST_URL or REDIS_URL (see
      // `tests/setup.ts` and `.env`), so the in-memory fallback is active.
      expect(redisBackend).toBe('memory');
      expect(isRedisAvailable).toBe(false);
    });
  });

  describe('cacheGet / cacheSet / cacheInvalidate', () => {
    it('round-trips a JSON-serializable value and returns it intact', async () => {
      const key = `test:roundtrip:${Date.now()}`;
      const payload = { hello: 'world', n: 42, list: [1, 2, 3] };

      const setOk = await cacheSet(key, payload, 60);
      expect(setOk).toBe(true);

      const got = await cacheGet<typeof payload>(key);
      expect(got).toEqual(payload);
    });

    it('returns null for a missing key (cache miss)', async () => {
      const got = await cacheGet('test:does-not-exist');
      expect(got).toBeNull();
    });

    it('honours the TTL — expired entries return null', async () => {
      const key = 'test:ttl';
      await cacheSet(key, { v: 1 }, 1); // 1s TTL

      // Immediately: should be present.
      const before = await cacheGet<{ v: number }>(key);
      expect(before).toEqual({ v: 1 });

      // After ~1.1s: should be evicted by the in-memory TTL check on read.
      await new Promise((r) => setTimeout(r, 1100));
      const after = await cacheGet(key);
      expect(after).toBeNull();
    });

    it('cacheInvalidate deletes the cached value', async () => {
      const key = 'test:invalidate';
      await cacheSet(key, { v: 'gone' }, 60);
      expect(await cacheGet(key)).toEqual({ v: 'gone' });

      const removed = await cacheInvalidate(key);
      expect(removed).toBe(1);

      expect(await cacheGet(key)).toBeNull();
    });
  });

  describe('redisSet / redisGet / redisDel (raw key API)', () => {
    it('stores and retrieves a JSON-stringified object', async () => {
      const key = `raw:${Date.now()}`;
      const value = { code: '123456', createdAt: 1700000000000 };

      await redisSet(key, value, 60);
      const got = await redisGet<typeof value>(key);
      expect(got).toEqual(value);

      const delOk = await redisDel(key);
      expect(delOk).toBe(true);
      expect(await redisGet(key)).toBeNull();
    });

    it('preserves existing TTL when overwriting with `set` (no TTL arg)', async () => {
      const key = 'raw:overwrite';
      await redisSet(key, { v: 1 }, 2);          // 2s TTL
      await redisSet(key, { v: 2 });              // no TTL arg → preserve 2s TTL

      const got = await redisGet<{ v: number }>(key);
      expect(got?.v).toBe(2);

      // After ~2.1s the preserved TTL should evict.
      await new Promise((r) => setTimeout(r, 2200));
      expect(await redisGet(key)).toBeNull();
    });
  });

  describe('OTP store', () => {
    it('stores, fetches, and deletes an OTP by email', async () => {
      const email = `user+${Date.now()}@example.com`;
      const code = '654321';

      const storeOk = await storeOTP(email, code, 60);
      expect(storeOk).toBe(true);

      const got = await getOTP(email);
      expect(got?.code).toBe(code);
      expect(typeof got?.createdAt).toBe('number');

      const delOk = await deleteOTP(email);
      expect(delOk).toBe(true);

      expect(await getOTP(email)).toBeNull();
    });
  });

  describe('verified-email tracking', () => {
    it('marks, checks, and expires', async () => {
      const email = `verified+${Date.now()}@example.com`;

      expect(await isEmailVerifiedRedis(email)).toBe(false);

      await markEmailVerified(email, 1); // 1s TTL
      expect(await isEmailVerifiedRedis(email)).toBe(true);

      await new Promise((r) => setTimeout(r, 1100));
      expect(await isEmailVerifiedRedis(email)).toBe(false);
    });
  });

  describe('checkRedisRateLimit', () => {
    it('allows up to `maxRequests` then blocks further requests in the window', async () => {
      const id = `rl+${Date.now()}`;
      const max = 3;
      const window = 2; // 2s

      const r1 = await checkRedisRateLimit(id, max, window);
      const r2 = await checkRedisRateLimit(id, max, window);
      const r3 = await checkRedisRateLimit(id, max, window);
      const r4 = await checkRedisRateLimit(id, max, window);

      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(max - 1);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(max - 2);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(max - 3);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });

    it('resets the counter after the window expires', async () => {
      const id = `rl-reset+${Date.now()}`;
      const max = 1;
      const window = 1; // 1s

      const first = await checkRedisRateLimit(id, max, window);
      expect(first.allowed).toBe(true);

      const blocked = await checkRedisRateLimit(id, max, window);
      expect(blocked.allowed).toBe(false);

      // Wait for the window to expire (1s TTL on the rate-limit key).
      await new Promise((r) => setTimeout(r, 1200));

      const afterReset = await checkRedisRateLimit(id, max, window);
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(max - 1);
    });
  });
});
