// Monnify — Bank transfer & payment gateway
// Docs: https://docs.monnify.com/
// Production-grade with retry, timeout, proactive token refresh, 401 retry, refund, health check

import crypto from 'crypto';

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || '';
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || '';
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || '';
const MONNIFY_BASE_URL = 'https://api.monnify.com/v1';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

// Refresh token 2 minutes before actual expiry
const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

// ─── Token cache ────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

function isTokenValid(): boolean {
  return cachedToken !== null && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS;
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) return '';

  // Return cached token if still valid (with 2-minute buffer)
  if (!forceRefresh && isTokenValid()) {
    return cachedToken!.token;
  }

  try {
    const encoded = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(`${MONNIFY_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { Authorization: `Basic ${encoded}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[Monnify] Token refresh failed: HTTP ${response.status}: ${body.slice(0, 200)}`);
      return cachedToken?.token ?? ''; // fall back to stale token if available
    }

    const data = await response.json();

    if (data.responseBody?.accessToken) {
      const expiresIn = (data.responseBody.expiresIn || 300) * 1000;
      cachedToken = {
        token: data.responseBody.accessToken,
        expiresAt: Date.now() + expiresIn - TOKEN_REFRESH_BUFFER_MS,
      };
      console.log('[Monnify] Access token refreshed — expires in', Math.round(expiresIn / 1000), 's');
      return cachedToken.token;
    }

    console.error('[Monnify] Token response missing accessToken:', JSON.stringify(data).slice(0, 200));
    return '';
  } catch (error) {
    console.error('[Monnify] Token refresh error:', (error as Error).message);
    return cachedToken?.token ?? ''; // fall back to stale token
  }
}

// ─── Shared fetch with retry + timeout + 401 auto-refresh ──────────────────

class MonnifyError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(`[Monnify] ${message}`);
    this.name = 'MonnifyError';
  }
}

async function monnifyFetch<T>(
  url: string,
  options: RequestInit,
  _retryOn401 = true,
): Promise<T> {
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

      // 401 — token expired: refresh once and retry
      if (response.status === 401 && _retryOn401) {
        console.warn('[Monnify] 401 Unauthorized — refreshing token and retrying');
        cachedToken = null;
        const newToken = await getAccessToken(true);
        if (newToken && options.headers) {
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${newToken}`);
          options = { ...options, headers };
          // Retry this request with the new token (single retry for 401)
          return monnifyFetch<T>(url, options, false);
        }
      }

      // Retry on 5xx (except on the last attempt)
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
        console.warn(`[Monnify] ${response.status} on attempt ${attempt + 1} — retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // Throw on non-2xx
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new MonnifyError(
          response.status,
          `HTTP ${response.status}: ${body.slice(0, 200)}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof MonnifyError) throw error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
          console.warn(`[Monnify] Timeout on attempt ${attempt + 1} — retrying in ${delay}ms`);
          await sleep(delay);
          continue;
        }
        throw new MonnifyError(408, 'Request timed out after retries');
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4_000;
        console.warn(`[Monnify] Network error on attempt ${attempt + 1} — retrying in ${delay}ms`);
        await sleep(delay);
        lastError = error as Error;
        continue;
      }

      throw new MonnifyError(0, `Network error: ${(error as Error).message}`);
    }
  }

  throw new MonnifyError(0, `Failed after ${MAX_RETRIES} retries: ${lastError?.message ?? 'unknown'}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface MonnifyInitResponse {
  status: boolean;
  data?: {
    accountNumber: string;
    bankName: string;
    reference: string;
  };
  message?: string;
}

interface MonnifyVerifyResponse {
  status: boolean;
  data?: {
    transactionReference: string;
    paymentReference: string;
    amountPaid: number;
    paymentStatus: string;
    paymentDescription: string;
    customerEmail: string;
  };
  message?: string;
}

interface MonnifyRefundResponse {
  status: boolean;
  data?: {
    refundReference: string;
    transactionReference: string;
    refundAmount: number;
    status: string;
  };
  message?: string;
}

// ─── Webhook hash verification ──────────────────────────────────────────────

export function verifyMonnifyWebhookHash(
  payload: string,
  hash: string,
): boolean {
  if (!MONNIFY_SECRET_KEY) {
    console.warn('[Monnify] Cannot verify webhook — MONNIFY_SECRET_KEY not set');
    return false;
  }

  const computedHash = crypto
    .createHmac('sha512', MONNIFY_SECRET_KEY)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(hash),
    );
  } catch {
    console.error('[Monnify] Webhook hash comparison failed — length mismatch');
    return false;
  }
}

// ─── API functions ──────────────────────────────────────────────────────────

export async function initializeBankTransfer({
  amount, // in kobo
  reference,
  customerName,
  customerEmail,
  description,
}: {
  amount: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  description?: string;
}): Promise<MonnifyInitResponse> {
  const token = await getAccessToken();

  if (!token) {
    console.log('[Monnify] Not configured — returning mock response');
    return {
      status: true,
      data: {
        accountNumber: '0000000000',
        bankName: 'Wema Bank',
        reference,
      },
    };
  }

  const data = await monnifyFetch<{
    responseBody?: {
      accountNumber?: string;
      bankName?: string;
    };
    responseMessage?: string;
  }>(`${MONNIFY_BASE_URL}/merchant/transactions/init-transaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount / 100, // Monnify uses naira, not kobo
      contractCode: MONNIFY_CONTRACT_CODE,
      paymentReference: reference,
      customerName,
      customerEmail,
      description: description || 'SwiftRamadan Order',
      paymentMethods: ['ACCOUNT_TRANSFER'],
    }),
  });

  if (data.responseBody) {
    return {
      status: true,
      data: {
        accountNumber: data.responseBody.accountNumber || '',
        bankName: data.responseBody.bankName || '',
        reference,
      },
    };
  }
  return { status: false, message: data.responseMessage || 'Failed to initialize' };
}

export async function verifyTransaction(
  reference: string,
): Promise<MonnifyVerifyResponse> {
  const token = await getAccessToken();

  if (!token) {
    console.log('[Monnify] Not configured — returning mock success');
    return {
      status: true,
      data: {
        transactionReference: reference,
        paymentReference: reference,
        amountPaid: 0,
        paymentStatus: 'PAID',
        paymentDescription: 'Mock payment',
        customerEmail: '',
      },
    };
  }

  const data = await monnifyFetch<{
    responseBody?: {
      transactionReference?: string;
      paymentReference?: string;
      amountPaid?: number;
      paymentStatus?: string;
      paymentDescription?: string;
      customerEmail?: string;
    };
    responseMessage?: string;
  }>(`${MONNIFY_BASE_URL}/merchant/transactions/query?paymentReference=${reference}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (data.responseBody) {
    return {
      status: true,
      data: {
        transactionReference: data.responseBody.transactionReference || reference,
        paymentReference: data.responseBody.paymentReference || reference,
        amountPaid: data.responseBody.amountPaid ?? 0,
        paymentStatus: data.responseBody.paymentStatus || 'UNKNOWN',
        paymentDescription: data.responseBody.paymentDescription || '',
        customerEmail: data.responseBody.customerEmail || '',
      },
    };
  }
  return { status: false, message: data.responseMessage || 'Verification failed' };
}

export async function refundTransaction(
  transactionReference: string,
  amount?: number, // in kobo — if omitted, full refund
): Promise<MonnifyRefundResponse> {
  const token = await getAccessToken();

  if (!token) {
    console.log('[Monnify] Not configured — returning mock refund');
    return {
      status: true,
      data: {
        refundReference: `mock-refund-${transactionReference}`,
        transactionReference,
        refundAmount: amount ?? 0,
        status: 'IN_PROGRESS',
      },
    };
  }

  const body: Record<string, unknown> = {
    transactionReference,
  };
  if (amount) body.refundAmount = amount / 100; // Monnify uses naira

  const data = await monnifyFetch<{
    responseBody?: {
      refundReference?: string;
      transactionReference?: string;
      refundAmount?: number;
      status?: string;
    };
    responseMessage?: string;
  }>(`${MONNIFY_BASE_URL}/merchant/transactions/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (data.responseBody) {
    return {
      status: true,
      data: {
        refundReference: data.responseBody.refundReference || '',
        transactionReference: data.responseBody.transactionReference || transactionReference,
        refundAmount: data.responseBody.refundAmount ?? 0,
        status: data.responseBody.status || 'IN_PROGRESS',
      },
    };
  }
  return { status: false, message: data.responseMessage || 'Refund failed' };
}

// ─── Health check ───────────────────────────────────────────────────────────

export async function isMonnifyHealthy(): Promise<boolean> {
  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    console.log('[Monnify] Health check — not configured, returning false');
    return false;
  }

  try {
    const token = await getAccessToken();
    if (!token) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);

    const response = await fetch(`${MONNIFY_BASE_URL}/banks`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('[Monnify] Health check failed:', (error as Error).message);
    return false;
  }
}
