/**
 * @module payment-webhook
 * @description Payment webhook security utilities for SwiftRamadan.
 *
 * Provides HMAC signature verification for Paystack, Flutterwave, and Monnify
 * webhooks using the **Web Crypto API** (edge-compatible, works in Next.js
 * Edge Runtime and standard Node.js environments).
 *
 * Also includes idempotency helpers to prevent replay attacks and duplicate
 * transaction processing.
 *
 * @example
 * ```ts
 * import { verifyPaystackSignature, isTransactionProcessed } from '@/lib/payment-webhook';
 *
 * const isValid = verifyPaystackSignature(rawBody, signature, secret);
 * const processed = await isTransactionProcessed('ref_123');
 * ```
 */

import { db } from '@/lib/db';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default TTL for in-memory processed transaction cache (5 minutes) */
const PROCESSED_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * In-memory cache of recently processed transaction references.
 * Used for fast idempotency checks without hitting the database.
 *
 * Structure: Map<reference, { timestamp: number; providerTxId: string }>
 */
const processedCache = new Map<
  string,
  { timestamp: number; providerTxId: string }
>();

// ─── Web Crypto API Helpers ──────────────────────────────────────────────────

/**
 * Compute HMAC-SHA512 digest using Web Crypto API (edge-compatible).
 *
 * @param data - Raw string data to hash
 * @param key - Secret key string
 * @returns Hex-encoded HMAC-SHA512 digest
 *
 * @remarks
 * Uses `crypto.subtle.sign()` which is available in:
 * - Modern browsers
 * - Node.js 19+ (via global crypto)
 * - Next.js Edge Runtime
 * - Cloudflare Workers / Vercel Edge
 */
async function hmacSha512(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBytes = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
  return bufferToHex(signature);
}

/**
 * Compute HMAC-SHA256 digest using Web Crypto API (edge-compatible).
 *
 * @param data - Raw string data to hash
 * @param key - Secret key string
 * @returns Hex-encoded HMAC-SHA256 digest
 */
async function hmacSha256(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBytes = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
  return bufferToHex(signature);
}

/**
 * Convert ArrayBuffer to hex string.
 *
 * @param buffer - ArrayBuffer to convert
 * @returns Hex-encoded string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Timing-safe comparison of two hex strings.
 *
 * Prevents timing attacks by always comparing full length regardless of
 * early mismatch. Uses a constant-time algorithm approach.
 *
 * @param a - First hex string
 * @param b - Second hex string
 * @returns true if strings are identical
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── Paystack Signature Verification ─────────────────────────────────────────

/**
 * Verify Paystack webhook signature (HMAC-SHA512).
 *
 * Paystack signs webhook payloads with HMAC-SHA512 using your secret key
 * and sends the signature in the `x-paystack-signature` header.
 *
 * @param rawBody - Raw JSON string body of the request (must NOT be parsed)
 * @param signature - Value from `x-paystack-signature` header
 * @param secret - Your Paystack secret key (defaults to PAYSTACK_SECRET_KEY env)
 * @returns true if signature is valid
 *
 * @example
 * ```ts
 * const rawBody = await request.text();
 * const sig = request.headers.get('x-paystack-signature')!;
 * const valid = await verifyPaystackSignature(rawBody, sig);
 * ```
 */
export async function verifyPaystackSignature(
  rawBody: string,
  signature: string,
  secret?: string
): Promise<boolean> {
  const key = secret || process.env.PAYSTACK_SECRET_KEY || '';

  if (!key) {
    console.warn('[PaymentWebhook] Cannot verify Paystack signature — no secret key configured');
    return false;
  }

  if (!signature) {
    console.warn('[PaymentWebhook] Missing Paystack signature header');
    return false;
  }

  try {
    const expected = await hmacSha512(rawBody, key);
    return timingSafeEqual(expected, signature);
  } catch (error) {
    console.error('[PaymentWebhook] Paystack signature verification error:', error);
    return false;
  }
}

// ─── Flutterwave Signature Verification ──────────────────────────────────────

/**
 * Verify Flutterwave webhook signature (HMAC-SHA256).
 *
 * Flutterwave signs webhook payloads with HMAC-SHA256 using your webhook hash
 * secret and sends it in the `verif-hash` header.
 *
 * @param rawBody - Raw JSON string body of the request
 * @param signature - Value from `verif-hash` header
 * @param secret - Your Flutterwave webhook hash (defaults to FLUTTERWAVE_WEBHOOK_HASH env)
 * @returns true if signature is valid
 *
 * @example
 * ```ts
 * const rawBody = await request.text();
 * const sig = request.headers.get('verif-hash')!;
 * const valid = await verifyFlutterwaveSignature(rawBody, sig);
 * ```
 */
export async function verifyFlutterwaveSignature(
  rawBody: string,
  signature: string,
  secret?: string
): Promise<boolean> {
  const key = secret || process.env.FLUTTERWAVE_WEBHOOK_HASH || '';

  if (!key) {
    console.warn('[PaymentWebhook] Cannot verify Flutterwave signature — no webhook hash configured');
    return false;
  }

  if (!signature) {
    console.warn('[PaymentWebhook] Missing Flutterwave signature header');
    return false;
  }

  try {
    const expected = await hmacSha256(rawBody, key);
    return timingSafeEqual(expected, signature);
  } catch (error) {
    console.error('[PaymentWebhook] Flutterwave signature verification error:', error);
    return false;
  }
}

// ─── Monnify Signature Verification ──────────────────────────────────────────

/**
 * Verify Monnify webhook signature (HMAC-SHA512).
 *
 * Monnify signs webhook payloads with HMAC-SHA512 using your API secret key
 * and sends it in the `monnify-signature` header.
 *
 * @param rawBody - Raw JSON string body of the request
 * @param signature - Value from `monnify-signature` header
 * @param secret - Your Monnify secret key (defaults to MONNIFY_SECRET_KEY env)
 * @returns true if signature is valid
 *
 * @example
 * ```ts
 * const rawBody = await request.text();
 * const sig = request.headers.get('monnify-signature')!;
 * const valid = await verifyMonnifySignature(rawBody, sig);
 * ```
 */
export async function verifyMonnifySignature(
  rawBody: string,
  signature: string,
  secret?: string
): Promise<boolean> {
  const key = secret || process.env.MONNIFY_SECRET_KEY || '';

  if (!key) {
    console.warn('[PaymentWebhook] Cannot verify Monnify signature — no secret key configured');
    return false;
  }

  if (!signature) {
    console.warn('[PaymentWebhook] Missing Monnify signature header');
    return false;
  }

  try {
    const expected = await hmacSha512(rawBody, key);
    return timingSafeEqual(expected, signature);
  } catch (error) {
    console.error('[PaymentWebhook] Monnify signature verification error:', error);
    return false;
  }
}

// ─── Idempotency Helpers ─────────────────────────────────────────────────────

/**
 * Clean up expired entries from the in-memory processed cache.
 *
 * Called internally before cache lookups to ensure stale entries don't
 * accumulate over time.
 */
function cleanupProcessedCache(): void {
  const now = Date.now();
  const entries = Array.from(processedCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > PROCESSED_CACHE_TTL_MS) {
      processedCache.delete(key);
    }
  }
}

/**
 * Check if a transaction reference has already been processed.
 *
 * Uses a two-tier idempotency check:
 * 1. Fast in-memory cache lookup (for recent transactions within TTL)
 * 2. Database query as fallback (for older transactions or after restarts)
 *
 * This prevents replay attacks where an attacker resends a previously
 * valid webhook to trigger duplicate payment processing.
 *
 * @param reference - Transaction reference to check
 * @returns true if the transaction was already successfully processed
 *
 * @example
 * ```ts
 * if (await isTransactionProcessed(reference)) {
 *   return NextResponse.json({ received: true }, { status: 409 });
 * }
 * ```
 */
export async function isTransactionProcessed(reference: string): Promise<boolean> {
  // Tier 1: Check in-memory cache (fast path)
  cleanupProcessedCache();
  const cached = processedCache.get(reference);
  if (cached) {
    return true;
  }

  // Tier 2: Check database (slow path, handles server restarts)
  try {
    const payment = await db.payment.findUnique({
      where: { reference },
      select: { status: true },
    });

    // Cache the result if already processed
    if (payment?.status === 'success') {
      processedCache.set(reference, {
        timestamp: Date.now(),
        providerTxId: '',
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PaymentWebhook] Error checking transaction status:', error);
    // Fail safe: assume not processed to allow retry
    return false;
  }
}

/**
 * Mark a transaction reference as processed (prevent replays).
 *
 * Stores the reference in both:
 * 1. In-memory cache (immediate, for fast subsequent checks)
 * 2. Database (persistent, survives server restarts)
 *
 * Note: The database update should be done inside the payment processing
 * transaction for atomicity. This helper primarily manages the in-memory cache.
 *
 * @param reference - Transaction reference to mark
 * @param providerTxId - Provider's transaction ID (for logging/audit)
 *
 * @example
 * ```ts
 * await markTransactionProcessed(reference, providerTxId);
 * ```
 */
export async function markTransactionProcessed(
  reference: string,
  providerTxId: string
): Promise<void> {
  // Store in memory cache
  processedCache.set(reference, {
    timestamp: Date.now(),
    providerTxId,
  });

  // Note: Actual DB update happens in the main $transaction block
  // This ensures atomicity between payment status + order status updates
}

/**
 * Get statistics about the in-memory processed cache (for monitoring/debugging).
 *
 * @returns Object with cache size and oldest entry age
 */
export function getProcessedCacheStats(): {
  size: number;
  oldestEntryMs: number | null;
} {
  cleanupProcessedCache();

  let oldestEntryMs: number | null = null;
  const now = Date.now();
  const values = Array.from(processedCache.values());

  for (const entry of values) {
    const age = now - entry.timestamp;
    if (oldestEntryMs === null || age > oldestEntryMs) {
      oldestEntryMs = age;
    }
  }

  return {
    size: processedCache.size,
    oldestEntryMs,
  };
}

// ─── Unified Signature Verification ─────────────────────────────────────────

/**
 * Supported payment providers that send webhooks.
 */
export type WebhookProvider = 'paystack' | 'flutterwave' | 'monnify';

/**
 * Result of unified webhook signature verification.
 */
export interface WebhookVerificationResult {
  /** Whether the signature is valid */
  valid: boolean;
  /** Which provider sent this webhook (if detected) */
  provider: WebhookProvider | null;
  /** Human-readable error message (if invalid) */
  error?: string;
}

/**
 * Detect the payment provider and verify the webhook signature.
 *
 * Inspects request headers to determine which provider sent the webhook,
 * then verifies the signature using the appropriate algorithm.
 *
 * @param rawBody - Raw JSON string body
 * @param headers - Request headers object (or Headers instance)
 * @returns Verification result with provider detection
 *
 * @example
 * ```ts
 * const rawBody = await request.text();
 * const result = await verifyWebhookSignature(rawBody, request.headers);
 *
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 * console.log(`Verified ${result.provider} webhook`);
 * ```
 */
export async function verifyWebhookSignature(
  rawBody: string,
  headers: Headers | Record<string, string | null>
): Promise<WebhookVerificationResult> {
  // Extract signatures from headers
  const paystackSig =
    headers instanceof Headers
      ? headers.get('x-paystack-signature')
      : headers['x-paystack-signature'];

  const flutterwaveSig =
    headers instanceof Headers
      ? headers.get('verif-hash')
      : headers['verif-hash'];

  const monnifySig =
    headers instanceof Headers
      ? headers.get('monnify-signature')
      : headers['monnify-signature'];

  // Determine provider and verify
  if (paystackSig) {
    const valid = await verifyPaystackSignature(rawBody, paystackSig);
    return {
      valid,
      provider: 'paystack',
      error: valid ? undefined : 'Invalid Paystack signature',
    };
  }

  if (flutterwaveSig) {
    const valid = await verifyFlutterwaveSignature(rawBody, flutterwaveSig);
    return {
      valid,
      provider: 'flutterwave',
      error: valid ? undefined : 'Invalid Flutterwave signature',
    };
  }

  if (monnifySig) {
    const valid = await verifyMonnifySignature(rawBody, monnifySig);
    return {
      valid,
      provider: 'monnify',
      error: valid ? undefined : 'Invalid Monnify signature',
    };
  }

  // No recognized signature header found
  return {
    valid: false,
    provider: null,
    error: 'No recognized webhook signature header found',
  };
}
