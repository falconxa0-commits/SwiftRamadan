import { initializeTransaction as paystackInit, verifyTransaction as paystackVerify, refundTransaction as paystackRefund, verifyPaystackWebhookSignature, isPaystackHealthy, verifyBankAccount, listBanks } from './paystack';
import { initializeBankTransfer as monnifyInit, verifyTransaction as monnifyVerify, refundTransaction as monnifyRefund, verifyMonnifyWebhookHash, isMonnifyHealthy } from './monnify';
import { initializeFlutterwavePayment as flwInit, verifyFlutterwavePayment as flwVerify, refundFlutterwaveTransaction as flwRefund, verifyFlutterwaveWebhookSignature, isFlutterwaveHealthy } from './flutterwave';
import { initiateBNPL, calculateInstallmentPlan, calculateLateFee } from './bnpl';
import { initializeTransaction as opayInit, verifyTransaction as opayVerify, refundTransaction as opayRefund } from './opay';
import { initiateBankTransfer as moniepointTransferInit, initiatePOSPayment as moniepointPOSInit, verifyTransaction as moniepointVerify } from './moniepoint';

export type PaymentProvider = 'paystack' | 'monnify' | 'flutterwave' | 'swift-pay' | 'bnpl' | 'opay' | 'moniepoint';

export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'bnpl' | 'pos' | 'opay_wallet';

export interface PaymentInitResult {
  success: boolean;
  provider: PaymentProvider;
  reference: string;
  checkoutUrl?: string;
  accountNumber?: string;
  bankName?: string;
  message?: string;
}

// Convert naira to kobo (Paystack/Monnify use kobo)
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return Math.round(kobo / 100);
}

// Unified payment initialization
export async function initiatePayment({
  provider,
  amount, // in NAIRA
  reference,
  email,
  name,
  phone,
  metadata,
  callbackUrl,
  method,
}: {
  provider: PaymentProvider;
  amount: number;
  reference: string;
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  method?: PaymentMethod;
}): Promise<PaymentInitResult> {
  const amountKobo = nairaToKobo(amount);

  try {
    switch (provider) {
      case 'paystack': {
        const result = await paystackInit({
          email,
          amount: amountKobo,
          reference,
          metadata,
          callback_url: callbackUrl,
        });
        return {
          success: result.status,
          provider: 'paystack',
          reference,
          checkoutUrl: result.data?.authorization_url,
          message: result.message,
        };
      }

      case 'monnify': {
        const result = await monnifyInit({
          amount: amountKobo,
          reference,
          customerName: name,
          customerEmail: email,
          description: metadata?.description as string,
        });
        return {
          success: result.status,
          provider: 'monnify',
          reference,
          accountNumber: result.data?.accountNumber,
          bankName: result.data?.bankName,
          message: result.message,
        };
      }

      case 'flutterwave': {
        const result = await flwInit({
          tx_ref: reference,
          amount,
          email,
          name,
          phone,
          redirect_url: callbackUrl,
        });
        return {
          success: result.status === 'success',
          provider: 'flutterwave',
          reference,
          checkoutUrl: result.data?.link,
          message: result.message,
        };
      }

      case 'bnpl': {
        const result = await initiateBNPL({
          amount: amountKobo,
          reference,
          email,
          name,
          phone: phone || '',
        });
        return {
          success: result.status,
          provider: 'bnpl',
          reference,
          checkoutUrl: result.data?.checkoutUrl,
          message: result.message,
        };
      }

      case 'opay': {
        const opayMethod = method === 'opay_wallet' ? 'opayWallet' : method === 'bank_transfer' ? 'bankTransfer' : 'card';
        const result = await opayInit({
          reference,
          amount: amountKobo,
          email,
          name,
          phone,
          method: opayMethod as 'card' | 'bankTransfer' | 'opayWallet',
          callbackUrl,
          metadata,
        });
        return {
          success: result.status,
          provider: 'opay',
          reference,
          checkoutUrl: result.checkoutUrl,
          message: result.message,
        };
      }

      case 'moniepoint': {
        if (method === 'pos') {
          const result = await moniepointPOSInit({
            amount: amountKobo,
            reference,
            metadata,
          });
          return {
            success: result.status,
            provider: 'moniepoint',
            reference,
            message: result.message,
          };
        }
        // Default to bank transfer
        const result = await moniepointTransferInit({
          amount: amountKobo,
          reference,
          customerName: name,
          customerEmail: email,
          description: metadata?.description as string,
        });
        return {
          success: result.status,
          provider: 'moniepoint',
          reference,
          accountNumber: result.accountNumber,
          bankName: result.bankName,
          message: result.message,
        };
      }

      case 'swift-pay':
      default: {
        // Cash on delivery — no gateway needed
        return {
          success: true,
          provider: 'swift-pay',
          reference,
          message: 'Cash on delivery — pay when you receive',
        };
      }
    }
  } catch (error) {
    console.error(`[Payment] ${provider} initiation error:`, error);
    return {
      success: false,
      provider,
      reference,
      message: 'Payment initialization failed',
    };
  }
}

// Verify payment
export async function verifyPayment(
  provider: PaymentProvider,
  reference: string,
  transactionId?: string
): Promise<{ verified: boolean; amount?: number; gatewayResponse?: string }> {
  try {
    switch (provider) {
      case 'paystack': {
        const result = await paystackVerify(reference);
        return {
          verified: result.data?.status === 'success',
          amount: result.data?.amount,
          gatewayResponse: result.data?.gateway_response,
        };
      }
      case 'flutterwave': {
        if (!transactionId) return { verified: false };
        const result = await flwVerify(transactionId);
        return {
          verified: result.data?.status === 'successful',
          amount: result.data?.amount ? nairaToKobo(result.data.amount) : undefined,
        };
      }
      case 'opay': {
        const result = await opayVerify(reference);
        return {
          verified: result.verified,
          amount: result.amount,
          gatewayResponse: result.channel,
        };
      }
      case 'moniepoint': {
        const result = await moniepointVerify(reference);
        return {
          verified: result.verified,
          amount: result.amount,
          gatewayResponse: result.channel,
        };
      }
      default:
        console.warn(`[Payments] No verification implemented for provider: ${provider}. Refusing to auto-verify.`);
        return { verified: false };
    }
  } catch {
    return { verified: false };
  }
}

// ─── Re-export new hardened functions ─────────────────────────────────────────
export { verifyPaystackWebhookSignature, isPaystackHealthy, refundTransaction as paystackRefund } from './paystack';
export { verifyFlutterwaveWebhookSignature, isFlutterwaveHealthy, refundFlutterwaveTransaction as flutterwaveRefund } from './flutterwave';
export { verifyMonnifyWebhookHash, isMonnifyHealthy, verifyTransaction as monnifyVerify, refundTransaction as monnifyRefund } from './monnify';
export { calculateInstallmentPlan, calculateLateFee } from './bnpl';
export { initializeTransaction as opayInitialize, verifyTransaction as opayVerifyTx, refundTransaction as opayRefundTx } from './opay';
export { initiatePOSPayment as moniepointPOS, initiateBankTransfer as moniepointTransfer, verifyTransaction as moniepointVerifyTx } from './moniepoint';

// ─── Health check for all providers ────────────────────────────────────────────
export async function checkAllPaymentProviders(): Promise<{
  paystack: boolean;
  flutterwave: boolean;
  monnify: boolean;
  opay: boolean;
  moniepoint: boolean;
}> {
  const [paystack, flutterwave, monnify, opay, moniepoint] = await Promise.allSettled([
    isPaystackHealthy(),
    isFlutterwaveHealthy(),
    isMonnifyHealthy(),
    // OPay health: check if configured
    Promise.resolve(!!(process.env.OPAY_MERCHANT_ID && process.env.OPAY_SECRET_KEY)),
    // Moniepoint health: check if configured
    Promise.resolve(!!(process.env.MONIEPOINT_API_KEY && process.env.MONIEPOINT_SECRET_KEY)),
  ]);
  return {
    paystack: paystack.status === 'fulfilled' && paystack.value,
    flutterwave: flutterwave.status === 'fulfilled' && flutterwave.value,
    monnify: monnify.status === 'fulfilled' && monnify.value,
    opay: opay.status === 'fulfilled' && opay.value,
    moniepoint: moniepoint.status === 'fulfilled' && moniepoint.value,
  };
}

// ─── Per-provider health check ─────────────────────────────────────────────────
export async function checkProviderHealth(provider: PaymentProvider): Promise<boolean> {
  switch (provider) {
    case 'paystack':
      return isPaystackHealthy();
    case 'flutterwave':
      return isFlutterwaveHealthy();
    case 'monnify':
      return isMonnifyHealthy();
    case 'opay':
      return !!(process.env.OPAY_MERCHANT_ID && process.env.OPAY_SECRET_KEY);
    case 'moniepoint':
      return !!(process.env.MONIEPOINT_API_KEY && process.env.MONIEPOINT_SECRET_KEY);
    case 'bnpl':
    case 'swift-pay':
      return true; // Always available (mock / COD)
    default:
      return false;
  }
}

// ─── Recommended Provider ──────────────────────────────────────────────────────
export function getRecommendedProvider(
  amount: number,
  method: PaymentMethod = 'card',
): PaymentProvider {
  // Small amounts under ₦2,000 — OPay wallet is cheapest
  if (method === 'opay_wallet') return 'opay';

  // POS payments → Moniepoint
  if (method === 'pos') return 'moniepoint';

  // Bank transfer — Monnify is best for dedicated account numbers
  if (method === 'bank_transfer') {
    if (amount >= 50_000) return 'monnify'; // Monnify for large transfers
    return 'moniepoint'; // Moniepoint for smaller transfers
  }

  // Card payments
  if (method === 'card') {
    // Large amounts → Flutterwave (higher limits)
    if (amount >= 500_000) return 'flutterwave';
    // Medium amounts → Paystack (reliable, good rates)
    if (amount >= 10_000) return 'paystack';
    // Small amounts → OPay (lower fees)
    return 'opay';
  }

  // BNPL
  if (method === 'bnpl') return 'bnpl';

  // Cash
  if (method === 'cash') return 'swift-pay';

  // Default: Paystack (most reliable all-rounder)
  return 'paystack';
}

export { verifyBankAccount, listBanks };
