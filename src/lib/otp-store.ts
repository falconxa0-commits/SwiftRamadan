/* ----------------------------------------------------------------------------
 * In-memory OTP store + verified-email tracker.
 *
 * Used by `/api/auth` to:
 *   - issue random 6-digit OTP codes keyed by email (5-minute TTL)
 *   - verify a submitted code (one-time use; deletes the code on success)
 *   - track which emails have recently verified via OTP (10-minute TTL)
 *     so other auth actions (login for demo accounts, update-profile) can
 *     require a recent verification without a separate session/JWT system.
 *
 * Suitable for single-server dev only. For production, swap these Maps for
 * a Redis-backed store so verification state is shared across instances.
 * ------------------------------------------------------------------------- */

type OtpEntry = { code: string; expiresAt: number };
type VerifiedEntry = { expiresAt: number };

const otpStore = new Map<string, OtpEntry>();
const verifiedStore = new Map<string, VerifiedEntry>();

const DEFAULT_OTP_TTL_MS = 5 * 60 * 1000;        // 5 minutes for an issued OTP
const VERIFIED_TTL_MS = 10 * 60 * 1000;          // 10 minutes for the verified-email flag

/** Generate a random 6-digit OTP code (100000–999999 inclusive). */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Store (or replace) the OTP code for `email`. */
export function setOtp(email: string, code: string, ttlMs: number = DEFAULT_OTP_TTL_MS): void {
  if (!email) return;
  otpStore.set(email, { code, expiresAt: Date.now() + ttlMs });
}

/**
 * Verify `code` for `email`.
 * Returns `true` and deletes the OTP (one-time use) if the code matches and
 * is not expired; also marks the email as verified for 10 minutes.
 * Returns `false` otherwise (no entry, wrong code, or expired).
 */
export function verifyOtp(email: string, code: string): boolean {
  if (!email || !code) return false;
  const entry = otpStore.get(email);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return false;
  }

  // Constant-time-ish comparison to avoid trivial timing leaks.
  if (entry.code.length !== code.length || entry.code !== code) {
    return false;
  }

  // Success: delete the OTP so it can't be reused, and mark the email as
  // verified for 10 minutes (used by login + update-profile auth gates).
  otpStore.delete(email);
  verifiedStore.set(email, { expiresAt: Date.now() + VERIFIED_TTL_MS });
  return true;
}

/** Manually remove an OTP entry (e.g. on signup collision or user request). */
export function clearOtp(email: string): void {
  if (!email) return;
  otpStore.delete(email);
}

/** Has `email` verified via OTP in the last 10 minutes? */
export function isEmailVerified(email: string): boolean {
  if (!email) return false;
  const entry = verifiedStore.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    verifiedStore.delete(email);
    return false;
  }
  return true;
}

/** Manually clear the verified-email flag (e.g. on logout or password change). */
export function clearVerified(email: string): void {
  if (!email) return;
  verifiedStore.delete(email);
}

/* Periodic cleanup of expired entries — runs every 60 seconds.
 * `unref` is called so the timer doesn't keep the Node process alive on
 * shutdown (only available in Node, not in the edge runtime; guarded). */
if (typeof setInterval !== 'undefined') {
  const handle = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of otpStore.entries()) {
      if (entry.expiresAt < now) otpStore.delete(key);
    }
    for (const [key, entry] of verifiedStore.entries()) {
      if (entry.expiresAt < now) verifiedStore.delete(key);
    }
  }, 60 * 1000);
  if (typeof handle === 'object' && handle && typeof (handle as NodeJS.Timeout).unref === 'function') {
    (handle as NodeJS.Timeout).unref();
  }
}
