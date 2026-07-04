// Moniepoint — Nigerian POS & bank transfer payment gateway
// Docs: https://developer.moniepoint.com/

import { resilientFetch, assertOk } from '@/lib/http-client';

const MONIEPOINT_API_KEY = process.env.MONIEPOINT_API_KEY || '';
const MONIEPOINT_SECRET_KEY = process.env.MONIEPOINT_SECRET_KEY || '';
const MONIEPOINT_BASE_URL = 'https://api.moniepoint.com/v1';

const isConfigured = !!(MONIEPOINT_API_KEY && MONIEPOINT_SECRET_KEY);

/* -------------------------------------------------------------------------- */
/* Token caching with 2-minute expiry buffer                                 */
/* -------------------------------------------------------------------------- */

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!isConfigured) return '';

  // Return cached token if still valid (with 2-minute / 120s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 120_000) {
    return cachedToken.token;
  }

  try {
    const encoded = Buffer.from(`${MONIEPOINT_API_KEY}:${MONIEPOINT_SECRET_KEY}`).toString('base64');

    const response = await resilientFetch(`${MONIEPOINT_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
    }, { provider: 'moniepoint' });

    await assertOk(response, 'Moniepoint');

    const data = await response.json();

    if (data.token || data.access_token) {
      const token = data.token || data.access_token;
      const expiresIn = data.expires_in || data.expiresIn || 3600; // default 1 hour

      cachedToken = {
        token,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      return token;
    }

    return '';
  } catch (error) {
    console.error('[Moniepoint] Token error:', error);
    return '';
  }
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface MoniepointPOSParams {
  amount: number;          // in kobo
  reference: string;
  terminalId?: string;
  metadata?: Record<string, unknown>;
}

export interface MoniepointTransferParams {
  amount: number;          // in kobo
  reference: string;
  customerName: string;
  customerEmail: string;
  description?: string;
}

export interface MoniepointInitResult {
  status: boolean;
  verified?: boolean;
  provider: 'moniepoint';
  reference: string;
  checkoutUrl?: string;
  accountNumber?: string;
  bankName?: string;
  message?: string;
}

export interface MoniepointVerifyResult {
  status: boolean;
  verified: boolean;
  amount?: number;
  channel?: string;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* POS Payment Initiation                                                     */
/* -------------------------------------------------------------------------- */

export async function initiatePOSPayment(params: MoniepointPOSParams): Promise<MoniepointInitResult> {
  if (!isConfigured) {
    console.warn('[Moniepoint] Not configured — cannot initiate POS payment');
    return {
      status: false,
      verified: false,
      provider: 'moniepoint',
      reference: params.reference,
      message: 'Moniepoint not configured',
    };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        status: false,
        provider: 'moniepoint',
        reference: params.reference,
        message: 'Failed to authenticate with Moniepoint',
      };
    }

    const response = await resilientFetch(`${MONIEPOINT_BASE_URL}/payments/pos/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        reference: params.reference,
        terminalId: params.terminalId || '',
        metadata: params.metadata || {},
      }),
    }, { provider: 'moniepoint' });

    await assertOk(response, 'Moniepoint');

    const data = await response.json();

    return {
      status: data.status === 'success' || data.status === 'pending',
      provider: 'moniepoint',
      reference: params.reference,
      message: data.message || 'POS payment initiated',
    };
  } catch (error) {
    console.error('[Moniepoint] POS initiate error:', error);
    return {
      status: false,
      provider: 'moniepoint',
      reference: params.reference,
      message: 'Failed to initiate Moniepoint POS payment',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Bank Transfer via Moniepoint                                               */
/* -------------------------------------------------------------------------- */

export async function initiateBankTransfer(params: MoniepointTransferParams): Promise<MoniepointInitResult> {
  if (!isConfigured) {
    console.warn('[Moniepoint] Not configured — cannot initiate bank transfer');
    return {
      status: false,
      verified: false,
      provider: 'moniepoint',
      reference: params.reference,
      message: 'Moniepoint not configured',
    };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        status: false,
        provider: 'moniepoint',
        reference: params.reference,
        message: 'Failed to authenticate with Moniepoint',
      };
    }

    const response = await resilientFetch(`${MONIEPOINT_BASE_URL}/payments/transfer/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        reference: params.reference,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        description: params.description || 'SwiftRamadan Order',
      }),
    }, { provider: 'moniepoint' });

    await assertOk(response, 'Moniepoint');

    const data = await response.json();

    return {
      status: data.status === 'success',
      provider: 'moniepoint',
      reference: params.reference,
      accountNumber: data.data?.accountNumber || '',
      bankName: data.data?.bankName || 'Moniepoint MFB',
      message: data.message,
    };
  } catch (error) {
    console.error('[Moniepoint] Bank transfer initiate error:', error);
    return {
      status: false,
      provider: 'moniepoint',
      reference: params.reference,
      message: 'Failed to initiate Moniepoint bank transfer',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Verify Transaction                                                         */
/* -------------------------------------------------------------------------- */

export async function verifyTransaction(reference: string): Promise<MoniepointVerifyResult> {
  if (!isConfigured) {
    console.warn('[Moniepoint] Not configured — cannot verify transaction');
    return {
      status: false,
      verified: false,
      message: 'Moniepoint not configured',
    };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        status: false,
        verified: false,
        message: 'Failed to authenticate with Moniepoint',
      };
    }

    const response = await resilientFetch(`${MONIEPOINT_BASE_URL}/payments/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, { provider: 'moniepoint' });

    await assertOk(response, 'Moniepoint');

    const data = await response.json();

    return {
      status: data.status === 'success',
      verified: data.data?.status === 'successful' || data.data?.status === 'SUCCESS',
      amount: data.data?.amount,
      channel: data.data?.channel,
      message: data.message,
    };
  } catch (error) {
    console.error('[Moniepoint] Verify error:', error);
    return {
      status: false,
      verified: false,
      message: 'Failed to verify Moniepoint transaction',
    };
  }
}
