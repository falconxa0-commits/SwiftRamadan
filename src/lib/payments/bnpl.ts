// BNPL (Buy Now Pay Later) — OPay / Moniepoint integration
// These providers offer "Pay Small-Small" installment payments

export async function initiateBNPL({
  amount,
  reference,
  email,
  name,
  phone,
  installments = 3,
}: {
  amount: number; // in kobo
  reference: string;
  email: string;
  name: string;
  phone: string;
  installments?: number;
}): Promise<{ status: boolean; data?: { checkoutUrl: string; planId: string }; message?: string }> {
  // OPay BNPL is not yet publicly documented as a standard API
  // Moniepoint also requires direct partnership
  // For now, return a mock response. In production, contact OPay/Moniepoint for their BNPL API.

  const perInstallment = Math.ceil(amount / installments / 100);

  console.log('[BNPL] Mock BNPL initiated — in production, integrate with OPay/Moniepoint BNPL API');

  return {
    status: true,
    data: {
      checkoutUrl: `http://localhost:3000/bnpl/checkout?ref=${reference}&plan=${installments}`,
      planId: `bnpl-${reference}`,
    },
    message: `Pay ₦${perInstallment.toLocaleString()} x ${installments} installments`,
  };
}
