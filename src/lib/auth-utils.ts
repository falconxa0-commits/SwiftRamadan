import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored hash.
 *
 * Supports both bcrypt-hashed passwords and legacy plain-text passwords for
 * backward compatibility during the migration period.  If the stored value
 * doesn't look like a bcrypt hash (doesn't start with "$2"), we fall back to
 * a simple string comparison.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  // If the stored value looks like a bcrypt hash, use bcrypt.compare
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }

  // Legacy plain-text fallback — do NOT remove until all passwords are migrated
  return password === storedHash;
}

/**
 * Check whether a stored password string is a bcrypt hash.
 */
export function isBcryptHash(value: string): boolean {
  return value.startsWith('$2');
}

/**
 * Generate a cryptographically-secure random token.
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback (shouldn't happen in modern Node/Browser)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
}

/**
 * Minimal session-token encoder (demo only — replace with NextAuth JWT in
 * production).  The token is NOT signed, so treat it as opaque.
 */
export function encodeSessionToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');

  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 }),
  ).toString('base64url');

  // In production, sign with a secret key. For now, just concatenate.
  return `${header}.${body}`;
}
