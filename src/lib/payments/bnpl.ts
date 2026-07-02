// BNPL (Buy Now Pay Later) — Creddit, Carbon, OPay / Moniepoint integration
// Nigerian BNPL providers offer "Pay Small-Small" installment payments
// Fallback chain: Creddit → Carbon → Mock

// ─── Installment & late-fee calculators ─────────────────────────────────────

export function calculateInstallmentPlan(
  amount: number,        // in kobo
  installments: number,  // number of installments (e.g. 3)
  interestRate: number,  // annual interest rate as decimal (e.g. 0.15 for 15%)
): {
  totalAmount: number;
  perInstallment: number;
  interestAmount: number;
  principalAmount: number;
  schedule: Array<{ installment: number; amount: number; dueDate: Date }>;
} {
  const principalAmount = amount;
  // Simple interest for the period (assume 30-day installments)
  const periodMonths = installments;
  const interestAmount = Math.round(principalAmount * interestRate * (periodMonths / 12));
  const totalAmount = principalAmount + interestAmount;
  const perInstallment = Math.ceil(totalAmount / installments / 100) * 100; // round up to nearest naira

  const schedule: Array<{ installment: number; amount: number; dueDate: Date }> = [];
  const now = new Date();
  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + i * 30);
    // Last installment absorbs the remainder
    const installmentAmount = i === installments
      ? totalAmount - perInstallment * (i - 1)
      : perInstallment;
    schedule.push({ installment: i, amount: installmentAmount, dueDate });
  }

  return { totalAmount, perInstallment, interestAmount, principalAmount, schedule };
}

export function calculateLateFee(
  amount: number,     // in kobo — the overdue installment amount
  daysLate: number,
  ratePerWeek: number = 0.015, // 1.5% per week
  maxCap: number = 0.15,        // 15% cap
): number {
  if (daysLate <= 0) return 0;

  const weeksLate = Math.ceil(daysLate / 7);
  let fee = Math.round(amount * ratePerWeek * weeksLate);
  const maxFee = Math.round(amount * maxCap);

  return Math.min(fee, maxFee);
}

// ─── BNPL Provider types ────────────────────────────────────────────────────

export type BNPLProvider = 'creddit' | 'carbon' | 'mock';

interface BNPLResult {
  status: boolean;
  provider: BNPLProvider;
  data?: {
    checkoutUrl: string;
    planId: string;
  };
  message?: string;
}

// ─── Creddit BNPL provider (Nigerian BNPL) ─────────────────────────────────

const CREDDIT_API_KEY = process.env.CREDDIT_API_KEY || '';
const CREDDIT_BASE_URL = 'https://api.creddit.ng/v1';

async function initiateCredditBNPL({
  amount,
  reference,
  email,
  name,
  phone,
  installments,
}: {
  amount: number;
  reference: string;
  email: string;
  name: string;
  phone: string;
  installments: number;
}): Promise<BNPLResult> {
  if (!CREDDIT_API_KEY) {
    console.log('[BNPL:Creddit] Not configured — skipping to next provider');
    return { status: false, provider: 'creddit', message: 'Creddit not configured' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(`${CREDDIT_BASE_URL}/plans/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CREDDIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount / 100), // kobo → naira
        reference,
        email,
        name,
        phone,
        installments,
        currency: 'NGN',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[BNPL:Creddit] Init failed: HTTP ${response.status}: ${body.slice(0, 200)}`);
      return { status: false, provider: 'creddit', message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      status: true,
      provider: 'creddit',
      data: {
        checkoutUrl: data.data?.checkoutUrl || data.checkoutUrl || '',
        planId: data.data?.planId || data.planId || `creddit-${reference}`,
      },
    };
  } catch (error) {
    console.error('[BNPL:Creddit] Error:', (error as Error).message);
    return { status: false, provider: 'creddit', message: (error as Error).message };
  }
}

// ─── Carbon BNPL provider ───────────────────────────────────────────────────

const CARBON_API_KEY = process.env.CARBON_API_KEY || '';
const CARBON_BASE_URL = 'https://api.getcarbon.co/v1';

async function initiateCarbonBNPL({
  amount,
  reference,
  email,
  name,
  phone,
  installments,
}: {
  amount: number;
  reference: string;
  email: string;
  name: string;
  phone: string;
  installments: number;
}): Promise<BNPLResult> {
  if (!CARBON_API_KEY) {
    console.log('[BNPL:Carbon] Not configured — skipping to mock');
    return { status: false, provider: 'carbon', message: 'Carbon not configured' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(`${CARBON_BASE_URL}/bnpl/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CARBON_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount / 100), // kobo → naira
        reference,
        email,
        name,
        phone,
        tenure: installments,
        currency: 'NGN',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[BNPL:Carbon] Init failed: HTTP ${response.status}: ${body.slice(0, 200)}`);
      return { status: false, provider: 'carbon', message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      status: true,
      provider: 'carbon',
      data: {
        checkoutUrl: data.data?.checkoutUrl || data.redirectUrl || '',
        planId: data.data?.planId || data.planId || `carbon-${reference}`,
      },
    };
  } catch (error) {
    console.error('[BNPL:Carbon] Error:', (error as Error).message);
    return { status: false, provider: 'carbon', message: (error as Error).message };
  }
}

// ─── Mock BNPL fallback ─────────────────────────────────────────────────────

function initiateMockBNPL({
  amount,
  reference,
  installments,
}: {
  amount: number;
  reference: string;
  installments: number;
}): BNPLResult {
  const perInstallment = Math.ceil(amount / installments / 100);
  console.log('[BNPL:Mock] Mock BNPL initiated — in production, integrate with Creddit/Carbon BNPL API');

  return {
    status: true,
    provider: 'mock',
    data: {
      checkoutUrl: `/bnpl/checkout?ref=${reference}&plan=${installments}`,
      planId: `bnpl-${reference}`,
    },
    message: `Pay ₦${perInstallment.toLocaleString()} x ${installments} installments`,
  };
}

// ─── Unified BNPL with provider fallback chain ──────────────────────────────

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
}): Promise<BNPLResult> {
  const params = { amount, reference, email, name, phone, installments };

  // Fallback chain: Creddit → Carbon → Mock
  const credditResult = await initiateCredditBNPL(params);
  if (credditResult.status) return credditResult;

  const carbonResult = await initiateCarbonBNPL(params);
  if (carbonResult.status) return carbonResult;

  return initiateMockBNPL({ amount, reference, installments });
}
