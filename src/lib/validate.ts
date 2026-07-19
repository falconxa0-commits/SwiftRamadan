/* ──────────────────────────────────────────────────────────────────
   Lightweight input validation & sanitization utilities.
   No external dependencies — complements the Zod-based validation.ts
   for scenarios that only need simple checks or HTML escaping.
   ────────────────────────────────────────────────────────────────── */

/**
 * Escape HTML-special characters in a string to prevent XSS when the value
 * is later rendered in a browser.  Order matters: `&` must be escaped first
 * so that the entities we emit (`&lt;`, `&gt;`, …) are not double-escaped.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Basic email format check (not RFC-5322 exhaustive, good enough for UX). */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Loosely validate a phone number (digits, +, -, spaces, parentheses, 7-15 chars). */
export function validatePhone(phone: string): boolean {
  return /^[\d+\-\s()]{7,15}$/.test(phone);
}

/** Return an error string if the value is empty/null/undefined, otherwise null. */
export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/** Validate a monetary amount is finite, non-negative, and not absurdly large. */
export function validateAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < 0) return 'Invalid amount';
  if (amount > 10000000) return 'Amount exceeds maximum';
  return null;
}

/**
 * Factory that returns a per-identifier rate-limiter closure.
 *
 * Each call to the returned function checks whether `identifier` has exceeded
 * `MAX_HITS` requests within the sliding `WINDOW_MS` window.
 *
 * Suitable for single-process dev servers. For production, use the shared
 * `checkRateLimit` / `RATE_LIMITS` helpers from `@/lib/rate-limit` which
 * include proper response headers, periodic cleanup, and presets.
 */
export function rateLimiter() {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const WINDOW_MS = 60_000; // 1 minute
  const MAX_HITS = 30;

  return (identifier: string): { allowed: boolean; remaining: number } => {
    const now = Date.now();
    const entry = hits.get(identifier);

    if (!entry || now > entry.resetAt) {
      hits.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
      return { allowed: true, remaining: MAX_HITS - 1 };
    }

    entry.count++;
    if (entry.count > MAX_HITS) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: MAX_HITS - entry.count };
  };
}
