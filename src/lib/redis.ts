// Redis client — supports BOTH Upstash REST API (cloud) and standard Redis (Docker).
//
// Protocol selection (priority order):
//   1. UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN → Upstash cloud (REST/HTTPS)
//      Uses `@upstash/redis` (already installed). Optimal for serverless / Vercel.
//   2. REDIS_URL → standard Redis (redis://... — works with docker-compose `redis:7-alpine`)
//      Uses `ioredis` (added in Phase 8.2). Optimal for self-hosted / docker deploys.
//   3. (none) → in-memory Map (single-process dev fallback)
//      Not suitable for multi-instance production; sufficient for `bun run dev`.
//
// All three backends expose the same surface (`set`/`setex`/`get`/`del`/`incr`/
// `expire`/`incrby`/`ping`) with auto-JSON semantics:
//   - `set(key, value)`: strings stored as-is; non-strings JSON-stringified.
//   - `get<T>(key)`: returns null when the key is missing; otherwise JSON-parses
//     the stored value (falls back to the raw string when not valid JSON).
//
// This matches `@upstash/redis`'s built-in auto-serialization, so callers
// (e.g. `redisSet`/`redisGet` below, `src/ai/limits.ts`, `src/lib/otp-store.ts`)
// work identically against any backend.

import { Redis as UpstashRedis } from '@upstash/redis';

// ─── Unified backend interface ───────────────────────────────────────────────

interface RedisLike {
  set: (key: string, value: unknown) => Promise<unknown>;
  setex: (key: string, seconds: number, value: unknown) => Promise<unknown>;
  get: <T = unknown>(key: string) => Promise<T | null>;
  del: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  incrby: (key: string, value: number) => Promise<number>;
  ping: () => Promise<string>;
}

type BackendName = 'upstash' | 'ioredis' | 'memory' | null;

// ─── Environment scan ─────────────────────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REDIS_URL = process.env.REDIS_URL || '';

// ─── Backend construction ────────────────────────────────────────────────────
//
// Each backend is built lazily inside a try/catch so a misconfigured backend
// (e.g. `ioredis` not installed despite `REDIS_URL` being set) degrades to
// the in-memory fallback rather than crashing the process at import time.

let backend: BackendName = null;
let client: RedisLike | null = null;

// 1 — Upstash cloud (REST/HTTPS). Tried first when both Upstash env vars are set.
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    const upstash = new UpstashRedis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
    // @upstash/redis already exposes the RedisLike surface with auto-JSON
    // semantics, so we wrap minimally to satisfy the unified interface.
    client = {
      set: (k, v) => upstash.set(k, v),
      setex: (k, s, v) => upstash.setex(k, s, v),
      get: <T = unknown>(k: string) => upstash.get<T>(k),
      del: (k) => upstash.del(k),
      incr: (k) => upstash.incr(k),
      expire: (k, s) => upstash.expire(k, s),
      incrby: (k, v) => upstash.incrby(k, v),
      // `@upstash/redis` exposes `ping()` natively (sends `PING`, returns
      // `'PONG'`). `args` is optional; calling without args sends `["ping"]`.
      ping: () => upstash.ping() as Promise<string>,
    };
    backend = 'upstash';
  } catch (error) {
    console.error('[Redis] Upstash client init failed — trying next backend:', error);
    client = null;
  }
}

// 2 — Standard Redis (redis://...); requires `ioredis`. Tried when Upstash
//     isn't configured OR Upstash construction failed above.
if (client === null && REDIS_URL) {
  try {
    // Lazy require so `ioredis` stays an optional dependency: if it isn't
    // installed (e.g. local dev without `bun add ioredis`), the require throws
    // and we fall through to the in-memory backend. Next.js still bundles
    // `ioredis` because of static analysis, but no connection is opened at
    // import time unless `REDIS_URL` is set.
    //
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis');
    const io = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      // Don't crash the process on transient connection errors — the
      // callers already fail-open on Redis errors (see `checkRedisRateLimit`).
      retryStrategy: (times: number) => Math.min(times * 200, 2000),
      enableOfflineQueue: true,
      lazyConnect: false,
    });
    client = {
      set: (k, v) => io.set(k, typeof v === 'string' ? v : JSON.stringify(v)),
      setex: (k, s, v) => io.setex(k, s, typeof v === 'string' ? v : JSON.stringify(v)),
      get: async <T = unknown>(k: string): Promise<T | null> => {
        const raw = await io.get(k);
        if (raw === null) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      },
      del: (k) => io.del(k),
      incr: (k) => io.incr(k),
      expire: (k, s) => io.expire(k, s),
      incrby: (k, v) => io.incrby(k, v),
      ping: () => io.ping(),
    };
    backend = 'ioredis';
  } catch (error) {
    console.warn(
      '[Redis] REDIS_URL set but `ioredis` could not be loaded — falling back to in-memory.',
      'Install with: `bun add ioredis`. Error:',
      error,
    );
    client = null;
  }
}

// 3 — In-memory fallback (single-process dev; not multi-instance safe).
//    Used when neither Upstash nor ioredis is available, OR when both
//    constructions failed. Always builds a non-null client so callers never
//    have to handle a null `redis` (the existing helpers null-check anyway).
if (client === null) {
  interface MemEntry {
    value: string;            // Always stored as a string (matches Redis wire format).
    expiresAt?: number;       // Epoch ms; undefined = no TTL.
  }
  const memoryStore = new Map<string, MemEntry>();

  // Periodic GC of expired entries — runs every 60s, `unref`'d so it doesn't
  // keep the Node process alive on shutdown. Guarded for runtimes without
  // `setInterval` (e.g. Edge — though none of our routes use Edge today).
  if (typeof setInterval !== 'undefined') {
    const handle = setInterval(() => {
      const now = Date.now();
      for (const [k, e] of memoryStore.entries()) {
        if (e.expiresAt !== undefined && e.expiresAt < now) memoryStore.delete(k);
      }
    }, 60 * 1000);
    if (typeof handle === 'object' && handle && typeof (handle as NodeJS.Timeout).unref === 'function') {
      (handle as NodeJS.Timeout).unref();
    }
  }

  const isExpired = (e: MemEntry | undefined): boolean =>
    !!e && e.expiresAt !== undefined && e.expiresAt < Date.now();

  client = {
    set: async (k, v) => {
      const existing = memoryStore.get(k);
      // Preserve existing TTL when overwriting with `set` (matches Redis semantics).
      memoryStore.set(k, {
        value: typeof v === 'string' ? v : JSON.stringify(v),
        expiresAt: existing?.expiresAt,
      });
      return 'OK';
    },
    setex: async (k, s, v) => {
      memoryStore.set(k, {
        value: typeof v === 'string' ? v : JSON.stringify(v),
        expiresAt: Date.now() + s * 1000,
      });
      return 'OK';
    },
    get: async <T = unknown>(k: string): Promise<T | null> => {
      const e = memoryStore.get(k);
      if (!e) return null;
      if (isExpired(e)) {
        memoryStore.delete(k);
        return null;
      }
      try {
        return JSON.parse(e.value) as T;
      } catch {
        return e.value as unknown as T;
      }
    },
    del: async (k) => {
      const existed = memoryStore.delete(k);
      return existed ? 1 : 0;
    },
    incr: async (k) => {
      const e = memoryStore.get(k);
      if (!e || isExpired(e)) {
        memoryStore.set(k, { value: '1' });
        return 1;
      }
      const next = (Number(e.value) || 0) + 1;
      memoryStore.set(k, { value: String(next), expiresAt: e.expiresAt });
      return next;
    },
    expire: async (k, s) => {
      const e = memoryStore.get(k);
      if (!e || isExpired(e)) return 0;
      e.expiresAt = Date.now() + s * 1000;
      return 1;
    },
    incrby: async (k, by) => {
      const e = memoryStore.get(k);
      if (!e || isExpired(e)) {
        memoryStore.set(k, { value: String(by) });
        return by;
      }
      const next = (Number(e.value) || 0) + by;
      memoryStore.set(k, { value: String(next), expiresAt: e.expiresAt });
      return next;
    },
    ping: async () => 'PONG',
  };
  backend = 'memory';
}

// ─── Public exports ──────────────────────────────────────────────────────────

/**
 * The active Redis client (or `null` if no backend could be constructed).
 * Callers should always null-check before use; helpers below (`redisSet`,
 * `redisGet`, etc.) already do this and fail-open on errors.
 *
 * Direct use is reserved for callers that need atomic primitives not covered
 * by the helpers (e.g. `incrby` in `src/ai/limits.ts`).
 */
export const redis: RedisLike | null = client;

/**
 * `true` when an actual Redis backend (Upstash or ioredis) is configured.
 * `false` when only the in-memory fallback is in use. Used by the health
 * endpoint (`/api/health`) to surface the active backend to ops.
 */
export const isRedisAvailable: boolean = backend === 'upstash' || backend === 'ioredis';

/**
 * Human-readable name of the active backend — exposed for logs/health.
 * One of: `'upstash'`, `'ioredis'`, `'memory'`, or `null` (only if all
 * construction paths failed, which the in-memory fallback prevents).
 */
export const redisBackend: BackendName = backend;

// ─── Session Store (replaces in-memory OTP store) ────────────────────────────

export async function redisSet(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
  if (!redis) return false;
  try {
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      await redis.set(key, JSON.stringify(value));
    }
    return true;
  } catch (error) {
    console.error('[Redis] SET error:', error);
    return false;
  }
}

export async function redisGet<T = unknown>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const result = await redis.get<T>(key);
    return result;
  } catch (error) {
    console.error('[Redis] GET error:', error);
    return null;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('[Redis] DEL error:', error);
    return false;
  }
}

// ─── OTP Store (Redis-backed) ───

export async function storeOTP(email: string, code: string, ttlSeconds: number = 300): Promise<boolean> {
  return redisSet(`otp:${email}`, { code, createdAt: Date.now() }, ttlSeconds);
}

export async function getOTP(email: string): Promise<{ code: string; createdAt: number } | null> {
  return redisGet(`otp:${email}`);
}

export async function deleteOTP(email: string): Promise<boolean> {
  return redisDel(`otp:${email}`);
}

// ─── Rate Limiting (Redis-backed) ───

export async function checkRedisRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    // If Redis not configured, allow all requests (fallback to in-memory limiter)
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }

  try {
    const key = `ratelimit:${identifier}`;
    const windowStartKey = `ratelimit:start:${identifier}`;

    // Atomic INCR — if key doesn't exist, Redis creates it with value 1
    const count = await redis.incr(key);

    // Set TTL only on first request in the window (count === 1 after incr)
    if (count === 1) {
      // Start a new window — set expiry and record the window start time
      await redis.expire(key, windowSeconds);
      await redisSet(windowStartKey, { windowStart: Date.now() }, windowSeconds);
    }

    // Retrieve the window start time for resetAt calculation
    const windowInfo = await redisGet<{ windowStart: number }>(windowStartKey);
    const windowStart = windowInfo?.windowStart || Date.now();

    if (count > maxRequests) {
      return { allowed: false, remaining: 0, resetAt: windowStart + windowSeconds * 1000 };
    }

    return { allowed: true, remaining: maxRequests - count, resetAt: windowStart + windowSeconds * 1000 };
  } catch (error) {
    console.error('[Redis] Rate limit error:', error);
    // Fail open — don't block requests on Redis errors
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

// ─── Verified Email Tracking ───

export async function markEmailVerified(email: string, ttlSeconds: number = 600): Promise<boolean> {
  return redisSet(`verified:${email}`, { verifiedAt: Date.now() }, ttlSeconds);
}

export async function isEmailVerifiedRedis(email: string): Promise<boolean> {
  const result = await redisGet(`verified:${email}`);
  return result !== null;
}

// ─── Cache Helpers ───

export async function cacheGet<T>(key: string): Promise<T | null> {
  return redisGet<T>(`cache:${key}`);
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 3600): Promise<boolean> {
  return redisSet(`cache:${key}`, value, ttlSeconds);
}

export async function cacheInvalidate(pattern: string): Promise<number> {
  if (!redis) return 0;
  try {
    // Upstash doesn't support KEYS pattern efficiently, so we just delete the exact key
    await redis.del(`cache:${pattern}`);
    return 1;
  } catch {
    return 0;
  }
}
