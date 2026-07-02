/* ----------------------------------------------------------------------------
 * Rate limiter with Redis (Upstash) as primary, in-memory as fallback.
 * For production with multiple instances, Redis ensures shared rate-limit state.
 * For single-server dev, the in-memory store is sufficient.
 * ------------------------------------------------------------------------- */

import { checkRedisRateLimit } from '@/lib/redis';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  const handle = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
  if (typeof handle === 'object' && handle && typeof (handle as NodeJS.Timeout).unref === 'function') {
    (handle as NodeJS.Timeout).unref();
  }
}

export interface RateLimitOptions {
  /** Maximum number of requests in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    store.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetTime: now + options.windowMs,
    };
  }

  if (entry.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Helper for API routes: returns `null` if allowed, or a 429 `Response` if
 * rate-limited. Checks Redis first (when configured), then falls back to
 * in-memory. The IP is derived from the rightmost entry in `x-forwarded-for`
 * (set by the Caddy gateway — the rightmost value is the real client IP;
 * earlier entries can be spoofed by the client).
 */
export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions = { limit: 100, windowMs: 60 * 1000 },
): Promise<Response | null> {
  const forwarded = request.headers.get('x-forwarded-for');
  // Take the LAST IP in the chain — that's the one set by our trusted gateway
  const ip = forwarded?.split(',').pop()?.trim() || 'unknown';
  const identifier = `ip:${ip}`;

  // Try Redis rate limiting first
  const redisResult = await checkRedisRateLimit(identifier, options.limit, Math.floor(options.windowMs / 1000));
  if (redisResult.allowed === false) {
    const retryAfter = Math.ceil((redisResult.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(options.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(redisResult.resetAt),
          'Retry-After': String(retryAfter),
        },
      },
    );
  }

  // If Redis is configured and allowed the request, we're done
  if (redisResult.remaining < options.limit) {
    // Redis handled this request — it was not a "Redis not configured" fallback
    return null;
  }

  // Fall through to in-memory rate limiting (Redis not configured or first request)
  const result = rateLimit(identifier, options);
  if (!result.success) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetTime),
          'Retry-After': String(retryAfter),
        },
      },
    );
  }
  return null;
}

/** Preset rate limits for different endpoint types */
export const RATE_LIMITS = {
  /** Auth: 10 attempts per minute (prevent brute force) */
  auth: { limit: 10, windowMs: 60 * 1000 },
  /** General API: 100 requests per minute */
  general: { limit: 100, windowMs: 60 * 1000 },
  /** Write operations (POST/PUT/DELETE): 30 per minute */
  write: { limit: 30, windowMs: 60 * 1000 },
  /** Upload: 10 per minute */
  upload: { limit: 10, windowMs: 60 * 1000 },
  /** AI endpoints: 20 per minute (expensive) */
  ai: { limit: 20, windowMs: 60 * 1000 },
} as const;
