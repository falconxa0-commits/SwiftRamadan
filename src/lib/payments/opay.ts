// OPay — Nigerian mobile payment gateway (card, bank transfer, OPay wallet)
// Docs: https://documentation.opay.com/

import crypto from 'crypto';
import { resilientFetch, assertOk } from '@/lib/http-client';

const OPAY_MERCHANT_ID = process.env.OPAY_MERCHANT_ID || '';
const OPAY_PUBLIC_KEY = process.env.OPAY_PUBLIC_KEY || '';
const OPAY_SECRET_KEY = process.env.OPAY_SECRET_KEY || '';
const OPAY_BASE_URL = 'https://cashierapi.opayweb.com/api/v3';

const isConfigured = !!(OPAY_MERCHANT_ID && OPAY_PUBLIC_KEY && OPAY_SECRET_KEY);

/* -------------------------------------------------------------------------- */
/* HMAC-SHA256 Request Signing                                                */
/* -------------------------------------------------------------------------- */

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', OPAY_SECRET_KEY).update(payload).digest('hex');
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type OPayPaymentMethod = 'card' | 'bankTransfer' | 'opayWallet';

export interface OPayInitParams {
  reference: string;
  amount: number;          // in kobo
  currency?: string;       // default NGN
  email: string;
  name: string;
  phone?: string;
  method?: OPayPaymentMethod;
  callbackUrl?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface OPayInitResult {
  status: boolean;
  provider: 'opay';
  reference: string;
  checkoutUrl?: string;
  message?: string;
}

export interface OPayVerifyResult {
  status: boolean;
  verified: boolean;
  amount?: number;
  currency?: string;
  channel?: string;
  message?: string;
}

export interface OPayRefundResult {
  status: boolean;
  refundId?: string;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Initialize Transaction                                                     */
/* -------------------------------------------------------------------------- */

export async function initializeTransaction(params: OPayInitParams): Promise<OPayInitResult> {
  if (!isConfigured) {
    console.log('[OPay] Not configured — returning mock response');
    return {
      status: true,
      provider: 'opay',
      reference: params.reference,
      checkoutUrl: `${params.callbackUrl || 'http://localhost:3000'}?reference=${params.reference}&status=success`,
      message: 'Mock: OPay not configured',
    };
  }

  try {
    const body = {
      merchantId: OPAY_MERCHANT_ID,
      reference: params.reference,
      amount: params.amount,
      currency: params.currency || 'NGN',
      payMethod: params.method || 'card',
      customer: {
        email: params.email,
        name: params.name,
        phone: params.phone || '',
      },
      callbackUrl: params.callbackUrl,
      returnUrl: params.returnUrl,
      product: {
        name: 'SwiftRamadan Order',
        description: (params.metadata?.description as string) || 'SwiftRamadan Order',
      },
    };

    const payload = JSON.stringify(body);
    const signature = signPayload(payload);

    const response = await resilientFetch(`${OPAY_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPAY_PUBLIC_KEY}`,
        'Signature': signature,
      },
      body: payload,
    }, { provider: 'opay' });

    await assertOk(response, 'OPay');

    const data = await response.json();

    return {
      status: data.code === '00000',
      provider: 'opay',
      reference: params.reference,
      checkoutUrl: data.data?.cashierUrl || data.data?.checkoutUrl,
      message: data.message || 'Transaction initialized',
    };
  } catch (error) {
    console.error('[OPay] Initialize error:', error);
    return {
      status: false,
      provider: 'opay',
      reference: params.reference,
      message: 'Failed to initialize OPay transaction',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Verify Transaction                                                         */
/* -------------------------------------------------------------------------- */

export async function verifyTransaction(reference: string): Promise<OPayVerifyResult> {
  if (!isConfigured) {
    console.log('[OPay] Not configured — returning mock success');
    return {
      status: true,
      verified: true,
      amount: 0,
      currency: 'NGN',
      channel: 'opayWallet',
      message: 'Mock: OPay not configured',
    };
  }

  try {
    const body = {
      merchantId: OPAY_MERCHANT_ID,
      reference,
    };

    const payload = JSON.stringify(body);
    const signature = signPayload(payload);

    const response = await resilientFetch(`${OPAY_BASE_URL}/transaction/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPAY_PUBLIC_KEY}`,
        'Signature': signature,
      },
      body: payload,
    }, { provider: 'opay' });

    await assertOk(response, 'OPay');

    const data = await response.json();

    return {
      status: data.code === '00000',
      verified: data.data?.status === 'SUCCESS',
      amount: data.data?.amount,
      currency: data.data?.currency,
      channel: data.data?.payMethod,
      message: data.message,
    };
  } catch (error) {
    console.error('[OPay] Verify error:', error);
    return {
      status: false,
      verified: false,
      message: 'Failed to verify OPay transaction',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Refund Transaction                                                         */
/* -------------------------------------------------------------------------- */

export async function refundTransaction({
  reference,
  amount,
  reason,
}: {
  reference: string;
  amount: number;    // in kobo — partial refund if less than original
  reason?: string;
}): Promise<OPayRefundResult> {
  if (!isConfigured) {
    console.log('[OPay] Not configured — returning mock refund');
    return {
      status: true,
      refundId: `mock-refund-${Date.now()}`,
      message: 'Mock: OPay not configured',
    };
  }

  try {
    const body = {
      merchantId: OPAY_MERCHANT_ID,
      reference,
      refundAmount: amount,
      refundReason: reason || 'Customer request',
    };

    const payload = JSON.stringify(body);
    const signature = signPayload(payload);

    const response = await resilientFetch(`${OPAY_BASE_URL}/transaction/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPAY_PUBLIC_KEY}`,
        'Signature': signature,
      },
      body: payload,
    }, { provider: 'opay' });

    await assertOk(response, 'OPay');

    const data = await response.json();

    return {
      status: data.code === '00000',
      refundId: data.data?.refundId,
      message: data.message,
    };
  } catch (error) {
    console.error('[OPay] Refund error:', error);
    return {
      status: false,
      message: 'Failed to process OPay refund',
    };
  }
}
