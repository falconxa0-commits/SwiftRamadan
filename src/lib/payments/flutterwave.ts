// Flutterwave — Pan-African payment gateway
// Docs: https://developer.flutterwave.com/

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

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
}): Promise<{ status: string; data?: { link: string }; message?: string }> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    console.log('[Flutterwave] Not configured — returning mock response');
    return {
      status: 'success',
      data: { link: `${redirect_url || 'http://localhost:3000'}?tx_ref=${tx_ref}&status=successful` },
    };
  }

  const response = await fetch(`${FLW_BASE_URL}/payments`, {
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

  return response.json();
}

export async function verifyFlutterwavePayment(
  transactionId: string
): Promise<{ status: string; data?: { status: string; amount: number; tx_ref: string } }> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    return { status: 'success', data: { status: 'successful', amount: 0, tx_ref: '' } };
  }

  const response = await fetch(`${FLW_BASE_URL}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
  });
  return response.json();
}
