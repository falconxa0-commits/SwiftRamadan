/* ----------------------------------------------------------------------------
 * Simple in-memory rate limiter (per-process, suitable for single-server dev).
 * For production, use Redis-based rate limiting.
 * ------------------------------------------------------------------------- */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) store.delete(key);
  }
}, 5 * 60 * 1000);

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
 * rate-limited. The IP is derived from the `x-forwarded-for` header (set by
 * the Caddy gateway), falling back to `'unknown'`.
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions = { limit: 100, windowMs: 60 * 1000 },
): Response | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const identifier = `ip:${ip}`;

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
