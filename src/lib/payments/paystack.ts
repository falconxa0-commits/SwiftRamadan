// Paystack — Nigerian payment gateway for card payments & bank transfers
// Docs: https://paystack.com/docs/api
// Production-grade with retry, timeout, refund, and health check

import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000]; // exponential backoff for 5xx

// ─── Shared fetch with retry + timeout ──────────────────────────────────────

class PaystackError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(`[Paystack] ${message}`);
    this.name = 'PaystackError';
  }
}

async function paystackFetch<T>(url: string, options: RequestInit): Promise<T> {
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

      // Retry on 5xx (except on the last attempt)
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
        console.warn(`[Paystack] ${response.status} on attempt ${attempt + 1} — retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // Throw on non-2xx
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new PaystackError(
          response.status,
          `HTTP ${response.status}: ${body.slice(0, 200)}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof PaystackError) throw error;

      // AbortError = timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
          console.warn(`[Paystack] Timeout on attempt ${attempt + 1} — retrying in ${delay}ms`);
          await sleep(delay);
          continue;
        }
        throw new PaystackError(408, 'Request timed out after retries');
      }

      // Network errors — retry
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
        console.warn(`[Paystack] Network error on attempt ${attempt + 1} — retrying in ${delay}ms`);
        await sleep(delay);
        lastError = error as Error;
        continue;
      }

      throw new PaystackError(0, `Network error: ${(error as Error).message}`);
    }
  }

  throw new PaystackError(0, `Failed after ${MAX_RETRIES} retries: ${lastError?.message ?? 'unknown'}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  verified?: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    channel: string;
    currency: string;
    metadata: Record<string, unknown>;
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    refund_code: string;
    amount: number;
    status: string;
    transaction_id: number;
    reference: string;
  };
}

// ─── Webhook signature verification (HMAC-SHA512) ───────────────────────────

export function verifyPaystackWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn('[Paystack] Cannot verify webhook — PAYSTACK_SECRET_KEY not set');
    return false;
  }
  const expected = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature),
  );
}

// ─── API functions ──────────────────────────────────────────────────────────

export async function initializeTransaction({
  email,
  amount, // in kobo (multiply naira by 100)
  reference,
  metadata,
  callback_url,
}: {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}): Promise<PaystackInitializeResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn('[Paystack] Not configured — cannot initialize transaction');
    return {
      status: false,
      message: 'Paystack not configured',
    };
  }

  return paystackFetch<PaystackInitializeResponse>(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        metadata: metadata || {},
        callback_url,
      }),
    },
  );
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn('[Paystack] Not configured — cannot verify transaction');
    return {
      status: false,
      verified: false,
      message: 'Paystack not configured',
    };
  }

  return paystackFetch<PaystackVerifyResponse>(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    },
  );
}

export async function refundTransaction(
  reference: string,
  amount?: number, // in kobo — if omitted, full refund
): Promise<PaystackRefundResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn('[Paystack] Not configured — cannot process refund');
    return {
      status: false,
      message: 'Paystack not configured',
    };
  }

  const body: Record<string, unknown> = { reference };
  if (amount) body.amount = amount;

  return paystackFetch<PaystackRefundResponse>(
    `${PAYSTACK_BASE_URL}/refund`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
}

export async function verifyBankAccount({
  accountNumber,
  bankCode,
}: {
  accountNumber: string;
  bankCode: string;
}): Promise<{ status: boolean; data?: { account_number: string; account_name: string }; message?: string }> {
  if (!PAYSTACK_SECRET_KEY) {
    return { status: false, message: 'Paystack not configured' };
  }

  return paystackFetch<{
    status: boolean;
    data?: { account_number: string; account_name: string };
    message?: string;
  }>(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
  );
}

export async function listBanks(): Promise<{
  status: boolean;
  data: Array<{ id: number; name: string; code: string }>;
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      status: true,
      data: [
        { id: 1, name: 'Access Bank', code: '044' },
        { id: 2, name: 'GTBank', code: '058' },
        { id: 3, name: 'First Bank', code: '011' },
        { id: 4, name: 'UBA', code: '033' },
        { id: 5, name: 'Zenith Bank', code: '057' },
        { id: 6, name: 'Kuda Bank', code: '50211' },
        { id: 7, name: 'OPay', code: '100005' },
        { id: 8, name: 'Moniepoint', code: '50515' },
      ],
    };
  }

  return paystackFetch<{
    status: boolean;
    data: Array<{ id: number; name: string; code: string }>;
  }>(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
}

// ─── Health check ───────────────────────────────────────────────────────────

export async function isPaystackHealthy(): Promise<boolean> {
  if (!PAYSTACK_SECRET_KEY) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);

    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&perPage=1`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('[Paystack] Health check failed:', (error as Error).message);
    return false;
  }
}
