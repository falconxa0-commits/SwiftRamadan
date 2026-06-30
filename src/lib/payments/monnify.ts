// Monnify — Bank transfer & payment gateway
// Docs: https://docs.monnify.com/

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || '';
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || '';
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || '';
const MONNIFY_BASE_URL = 'https://api.monnify.com/v1';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) return '';

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const encoded = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
  const response = await fetch(`${MONNIFY_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { Authorization: `Basic ${encoded}` },
  });
  const data = await response.json();

  if (data.responseBody?.accessToken) {
    cachedToken = {
      token: data.responseBody.accessToken,
      expiresAt: Date.now() + (data.responseBody.expiresIn || 300) * 1000 - 60000,
    };
    return cachedToken.token;
  }
  return '';
}

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
}): Promise<{ status: boolean; data?: { accountNumber: string; bankName: string; reference: string }; message?: string }> {
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

  const response = await fetch(`${MONNIFY_BASE_URL}/merchant/transactions/init-transaction`, {
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

  const data = await response.json();
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
