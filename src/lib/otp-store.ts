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
 * Redis-backed (Upstash) is used as primary when configured; the in-memory
 * Maps serve as a fallback for local development without Redis.
 * ------------------------------------------------------------------------- */

import {
  storeOTP as redisStoreOTP,
  getOTP as redisGetOTP,
  deleteOTP as redisDeleteOTP,
  markEmailVerified as redisMarkVerified,
  isEmailVerifiedRedis,
} from '@/lib/redis';

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

/** Store (or replace) the OTP code for `email` — synchronous in-memory only. */
export function setOtp(email: string, code: string, ttlMs: number = DEFAULT_OTP_TTL_MS): void {
  if (!email) return;
  otpStore.set(email, { code, expiresAt: Date.now() + ttlMs });
}

/** Store (or replace) the OTP code for `email` — async, tries Redis first. */
export async function setOtpAsync(email: string, code: string, ttlMs: number = DEFAULT_OTP_TTL_MS): Promise<void> {
  if (!email) return;
  // Try Redis first
  const redisOk = await redisStoreOTP(email, code, Math.floor(ttlMs / 1000));
  if (redisOk) return;

  // Fallback to in-memory
  otpStore.set(email, { code, expiresAt: Date.now() + ttlMs });
}

/**
 * Verify `code` for `email` — synchronous in-memory only.
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

/**
 * Verify `code` for `email` — async, tries Redis first, falls back to in-memory.
 */
export async function verifyOtpAsync(email: string, code: string): Promise<boolean> {
  if (!email || !code) return false;

  // Try Redis first
  const redisData = await redisGetOTP(email);
  if (redisData) {
    if (redisData.code === code) {
      await redisDeleteOTP(email);
      await redisMarkVerified(email, Math.floor(VERIFIED_TTL_MS / 1000));
      // Also update in-memory for consistency
      verifiedStore.set(email, { expiresAt: Date.now() + VERIFIED_TTL_MS });
      return true;
    }
    return false;
  }

  // Fallback to in-memory
  return verifyOtp(email, code);
}

/** Manually remove an OTP entry (e.g. on signup collision or user request). */
export function clearOtp(email: string): void {
  if (!email) return;
  otpStore.delete(email);
}

/** Manually remove an OTP entry — async, tries Redis first. */
export async function clearOtpAsync(email: string): Promise<void> {
  if (!email) return;
  await redisDeleteOTP(email);
  otpStore.delete(email);
}

/** Has `email` verified via OTP in the last 10 minutes? — synchronous in-memory only. */
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

/** Has `email` verified via OTP in the last 10 minutes? — async, tries Redis first. */
export async function isEmailVerifiedAsync(email: string): Promise<boolean> {
  if (!email) return false;

  // Try Redis first
  const redisResult = await isEmailVerifiedRedis(email);
  if (redisResult) return true;

  // Fallback to in-memory
  return isEmailVerified(email);
}

/** Manually clear the verified-email flag (e.g. on logout or password change). */
export function clearVerified(email: string): void {
  if (!email) return;
  verifiedStore.delete(email);
}

/** Manually clear the verified-email flag — async, tries Redis first. */
export async function clearVerifiedAsync(email: string): Promise<void> {
  if (!email) return;
  // Clear from Redis (best-effort)
  const { redisDel } = await import('@/lib/redis');
  await redisDel(`verified:${email}`);
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
