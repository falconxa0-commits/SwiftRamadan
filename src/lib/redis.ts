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
    const now = Date.now();

    // Get current count
    const current = await redisGet<{ count: number; windowStart: number }>(key);

    if (!current || now - current.windowStart > windowSeconds * 1000) {
      // New window
      await redisSet(key, { count: 1, windowStart: now }, windowSeconds);
      return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSeconds * 1000 };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: current.windowStart + windowSeconds * 1000 };
    }

    // Increment
    await redisSet(key, { count: current.count + 1, windowStart: current.windowStart }, windowSeconds);
    return { allowed: true, remaining: maxRequests - current.count - 1, resetAt: current.windowStart + windowSeconds * 1000 };
  } catch (error) {
    console.error('[Redis] Rate limit error:', error);
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
