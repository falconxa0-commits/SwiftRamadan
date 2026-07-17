// Flutterwave — Pan-African payment gateway
// Docs: https://developer.flutterwave.com/
// Production-grade with retry, timeout, webhook verification, refund, and health check

import crypto from 'crypto';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLW_BASE_URL = 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_WEBHOOK_HASH = process.env.FLUTTERWAVE_WEBHOOK_HASH || '';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

// ─── Shared fetch with retry + timeout ──────────────────────────────────────

class FlutterwaveError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(`[Flutterwave] ${message}`);
    this.name = 'FlutterwaveError';
  }
}

async function flutterwaveFetch<T>(url: string, options: RequestInit): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
        console.warn(`[Flutterwave] ${response.status} on attempt ${attempt + 1} — retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new FlutterwaveError(
          response.status,
          `HTTP ${response.status}: ${body.slice(0, 200)}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof FlutterwaveError) throw error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
          console.warn(`[Flutterwave] Timeout on attempt ${attempt + 1} — retrying in ${delay}ms`);
          await sleep(delay);
          continue;
        }
        throw new FlutterwaveError(408, 'Request timed out after retries');
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
        console.warn(`[Flutterwave] Network error on attempt ${attempt + 1} — retrying in ${delay}ms`);
        await sleep(delay);
        lastError = error as Error;
        continue;
      }

      throw new FlutterwaveError(0, `Network error: ${(error as Error).message}`);
    }
  }

  throw new FlutterwaveError(0, `Failed after ${MAX_RETRIES} retries: ${lastError?.message ?? 'unknown'}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface FlwInitializeResponse {
  status: string;
  verified?: boolean;
  message: string;
  data?: {
    link: string;
  };
}

interface FlwVerifyResponse {
  status: string;
  verified?: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    tx_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
  };
}

interface FlwRefundResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    amount: number;
    status: string;
  };
}

// ─── Webhook signature verification (HMAC-SHA256) ───────────────────────────

export function verifyFlutterwaveWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  if (!FLUTTERWAVE_WEBHOOK_HASH) {
    console.warn('[Flutterwave] Cannot verify webhook — FLUTTERWAVE_WEBHOOK_HASH not set');
    return false;
  }

  const expected = crypto
    .createHmac('sha256', FLUTTERWAVE_WEBHOOK_HASH)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    console.error('[Flutterwave] Webhook signature comparison failed — length mismatch');
    return false;
  }
}

// ─── API functions ──────────────────────────────────────────────────────────

export async function initializeFlutterwavePayment({
  tx_ref,
  amount, // in naira
  email,
  name,
  phone,
  redirect_url,
}: {
  tx_ref: string;
  amount: number;
  email: string;
  name: string;
  phone?: string;
  redirect_url?: string;
}): Promise<FlwInitializeResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    console.warn('[Flutterwave] Not configured — cannot initialize payment');
    return {
      status: 'error',
      message: 'Flutterwave not configured',
    };
  }

  return flutterwaveFetch<FlwInitializeResponse>(`${FLW_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref,
      amount,
      currency: 'NGN',
      redirect_url,
      customer: { email, name, phonenumber: phone || '' },
      customizations: {
        title: 'SwiftRamadan',
        logo: 'https://swiftramadan.com/logo.png',
      },
    }),
  });
}

export async function verifyFlutterwavePayment(
  transactionId: string,
): Promise<FlwVerifyResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    console.warn('[Flutterwave] Not configured — cannot verify payment');
    return {
      status: 'error',
      verified: false,
      message: 'Flutterwave not configured',
    };
  }

  return flutterwaveFetch<FlwVerifyResponse>(
    `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
    { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } },
  );
}

export async function refundFlutterwaveTransaction(
  transactionId: string,
  amount?: number, // in naira — if omitted, full refund
): Promise<FlwRefundResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    console.warn('[Flutterwave] Not configured — cannot process refund');
    return {
      status: 'error',
      message: 'Flutterwave not configured',
    };
  }

  const body: Record<string, unknown> = {};
  if (amount) body.amount = amount;

  return flutterwaveFetch<FlwRefundResponse>(
    `${FLW_BASE_URL}/transactions/${transactionId}/refund`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
}

// ─── Health check ───────────────────────────────────────────────────────────

export async function isFlutterwaveHealthy(): Promise<boolean> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);

    const response = await fetch(`${FLW_BASE_URL}/transactions?perPage=1`, {
      headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('[Flutterwave] Health check failed:', (error as Error).message);
    return false;
  }
}
