// Paystack — Nigerian payment gateway for card payments & bank transfers
// Docs: https://paystack.com/docs/api

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
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
    console.log('[Paystack] Not configured — returning mock response');
    return {
      status: true,
      message: 'Mock: Paystack not configured',
      data: {
        authorization_url: `${callback_url || 'http://localhost:3000'}?reference=${reference}&status=success`,
        access_code: 'mock_access_code',
        reference,
      },
    };
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
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
  });

  return response.json();
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    console.log('[Paystack] Not configured — returning mock success');
    return {
      status: true,
      message: 'Mock: Paystack not configured',
      data: {
        id: 0,
        domain: 'test',
        status: 'success',
        reference,
        amount: 0,
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        channel: 'card',
        currency: 'NGN',
        metadata: {},
      },
    };
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  return response.json();
}

export async function verifyBankAccount({
  accountNumber,
  bankCode,
}: {
  accountNumber: string;
  bankCode: string;
}): Promise<{ status: boolean; data?: { account_number: string; account_name: string }; message?: string }> {
  if (!PAYSTACK_SECRET_KEY) {
    return { status: true, data: { account_number: accountNumber, account_name: 'Verified Account' } };
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
  );
  return response.json();
}

export async function listBanks(): Promise<{ status: boolean; data: Array<{ id: number; name: string; code: string }> }> {
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

  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  return response.json();
}
