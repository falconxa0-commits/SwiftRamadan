// JWT Session Token — Web Crypto API (Edge Runtime compatible)
// This file MUST NOT import any Node.js-only modules (bcrypt, crypto, etc.)
// because it's imported by middleware which runs in the Edge Runtime.

/**
 * Resolve the JWT signing secret from environment variables.
 *
 * Resolution order:
 *   1. APP_SECRET          — the canonical name going forward
 *   2. NEXTAUTH_SECRET     — legacy compatibility (existing deployments)
 *
 * In production (NODE_ENV === 'production'): if neither is set, the function
 * throws immediately — the server MUST NOT start without a configured secret.
 *
 * In development: if neither is set, a fixed development-only fallback is
 * used. A prominent warning is logged once so the developer knows. The
 * fallback is deterministic so that sessions survive HMR reloads.
 */

const DEV_ONLY_FALLBACK_SECRET = 'swift-ramadan-dev-only-do-not-use-in-production';

let _devSecretWarned = false;

function getJwtSecret(): string {
  const secret = process.env.APP_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret) return secret;

  // ── Production: fail fast ──
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[FATAL] APP_SECRET (or NEXTAUTH_SECRET) environment variable is required in production. ' +
      'Refusing to start with an insecure fallback. ' +
      'Generate one with: openssl rand -base64 48',
    );
  }

  // ── Development: use fallback with warning ──
  if (!_devSecretWarned) {
    _devSecretWarned = true;
    console.warn(
      '\n' +
      '⚠️  [AUTH] APP_SECRET is not set. Using development-only fallback.\n' +
      '   This is INSECURE and must never happen in production.\n' +
      '   Add to your .env: APP_SECRET=$(openssl rand -base64 48)\n',
    );
  }

  return DEV_ONLY_FALLBACK_SECRET;
}

/** Encode a string to base64url (Unicode-safe, no Buffer dependency). */
function toBase64Url(data: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode a base64url string (Unicode-safe, no Buffer dependency). */
function fromBase64Url(data: string): string {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/** HMAC-SHA256 sign using Web Crypto API (works in both Node.js and Edge Runtime). */
async function hmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  // Convert ArrayBuffer to base64url
  const sigBytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < sigBytes.length; i++) {
    binary += String.fromCharCode(sigBytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Create a properly signed JWT session token.
 * Uses HMAC-SHA256 via Web Crypto API (Edge Runtime compatible).
 */
export async function createSessionToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  const secret = getJwtSecret();
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days
    }),
  );
  const signature = await hmacSha256(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Compares every character regardless of where the first difference occurs.
 * Both strings must be the same length — call only on same-length inputs.
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify a signed JWT session token.
 * Returns the payload if valid, null if invalid/expired.
 * Uses Web Crypto API (Edge Runtime compatible).
 * Uses constant-time signature comparison to prevent timing attacks.
 */
export async function verifySessionToken(token: string): Promise<{ userId: string; email: string; role: string; iat: number; exp: number } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const secret = getJwtSecret();
    const expectedSig = await hmacSha256(`${header}.${body}`, secret);

    // Constant-time comparison prevents timing-based signature forgery
    if (!constantTimeEquals(signature, expectedSig)) return null;

    const payload = JSON.parse(fromBase64Url(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a cryptographically-secure random token.
 * Uses Web Crypto API (works in both Node.js and Edge Runtime).
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
    throw new Error('crypto.getRandomValues is not available — cannot generate secure token');
  }

  return result;
}
