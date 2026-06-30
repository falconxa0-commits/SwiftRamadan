import { initializeTransaction as paystackInit, verifyTransaction as paystackVerify, verifyBankAccount, listBanks } from './paystack';
import { initializeBankTransfer as monnifyInit } from './monnify';
import { initializeFlutterwavePayment as flwInit, verifyFlutterwavePayment as flwVerify } from './flutterwave';
import { initiateBNPL } from './bnpl';

export type PaymentProvider = 'paystack' | 'monnify' | 'flutterwave' | 'swift-pay' | 'bnpl';

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
}: {
  provider: PaymentProvider;
  amount: number;
  reference: string;
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
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
      default:
        return { verified: true }; // COD/Monnify/swift-pay assumed verified
    }
  } catch {
    return { verified: false };
  }
}

export { verifyBankAccount, listBanks };
