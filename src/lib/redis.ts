// Upstash Redis — Serverless Redis via REST API
// No local Redis server needed — works over HTTP
// Docs: https://upstash.com/docs/redis

import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

// Create Redis client (returns null if not configured)
export const redis = UPSTASH_URL && UPSTASH_TOKEN
  ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
  : null;

// ─── Session Store (replaces in-memory OTP store) ───

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
    const result = await redis.get(key);
    return result as T | null;
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
