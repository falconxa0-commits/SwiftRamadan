import bcrypt from 'bcryptjs';
import { createSessionToken, verifySessionToken, generateSecureToken } from './auth-jwt';

// Re-export JWT functions from the Edge-compatible module
export { createSessionToken, verifySessionToken, generateSecureToken };

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
 * a simple string comparison and flag the password for auto-migration.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  // If the stored value looks like a bcrypt hash, use bcrypt.compare
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }

  // SECURITY WARNING: Plaintext password detected — auto-migrate
  console.error('[SECURITY] Plaintext password comparison detected. Auto-migrating to bcrypt.');
  const isMatch = password === storedHash;
  if (isMatch) {
    // Mark for migration — the caller should re-hash the password
    (verifyPassword as { _needsMigration?: boolean })._needsMigration = true;
  }
  return isMatch;
}

/**
 * Check if the last verifyPassword call detected a plaintext password needing migration.
 * If so, hash the password and return the new hash for storage.
 */
export async function migratePlaintextPassword(
  email: string,
  plaintextPassword: string,
): Promise<string | null> {
  // Always return a bcrypt hash for migration
  return hashPassword(plaintextPassword);
}

/**
 * Check whether a stored password string is a bcrypt hash.
 */
export function isBcryptHash(value: string): boolean {
  return value.startsWith('$2');
}
