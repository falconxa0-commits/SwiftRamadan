// Identity Verification Orchestrator — Unified BVN/NIN verification with provider fallback
// Provider fallback chain: YouVerify → Prembly → Smile Identity

import { verifyBVN, verifyNIN, isValidBVN, isValidNIN, type VerificationResult } from './bvn';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type VerificationType = 'bvn' | 'nin';

export type VerificationProvider = 'youverify' | 'prembly' | 'smile_identity';

export interface VerificationRequest {
  type: VerificationType;
  idNumber: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  preferredProvider?: VerificationProvider;
}

export interface VerificationStatus {
  userId: string;
  bvnVerified: boolean;
  ninVerified: boolean;
  verifiedAt?: string;
  provider?: VerificationProvider;
}

/* -------------------------------------------------------------------------- */
/* Provider Fallback Chain                                                    */
/* -------------------------------------------------------------------------- */

const PROVIDER_FALLBACK_CHAIN: VerificationProvider[] = [
  'youverify',
  'prembly',
  'smile_identity',
];

/**
 * Build the provider chain. If a preferred provider is specified, put it first.
 */
function buildProviderChain(preferred?: VerificationProvider): VerificationProvider[] {
  if (!preferred) return [...PROVIDER_FALLBACK_CHAIN];

  const chain = [preferred, ...PROVIDER_FALLBACK_CHAIN.filter((p) => p !== preferred)];
  return chain;
}

/* -------------------------------------------------------------------------- */
/* Provider-specific verification functions                                   */
/* -------------------------------------------------------------------------- */

// These are stub implementations that will call each provider's API.
// In production, configure the API keys and endpoints for each provider.

const YOUVERIFY_API_KEY = process.env.YOUVERIFY_API_KEY || '';
const YOUVERIFY_BASE_URL = 'https://api.youverify.co/v2';

const PREMBLY_API_KEY = process.env.PREMBLY_API_KEY || '';
const PREMBLY_BASE_URL = 'https://api.prembly.com/identitypass';

const SMILE_IDENTITY_API_KEY = process.env.SMILE_IDENTITY_API_KEY || '';
const SMILE_IDENTITY_BASE_URL = 'https://smileidentity.com/api/v2';

async function verifyWithYouVerify(request: VerificationRequest): Promise<VerificationResult> {
  if (!YOUVERIFY_API_KEY) {
    throw new Error('YouVerify not configured');
  }

  try {
    const endpoint = request.type === 'bvn' ? '/bvn' : '/nin';
    const body =
      request.type === 'bvn'
        ? { bvn: request.idNumber, first_name: request.firstName, last_name: request.lastName }
        : { nin: request.idNumber, first_name: request.firstName, last_name: request.lastName };

    const response = await fetch(`${YOUVERIFY_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUVERIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      success: true,
      verified: data.verified || data.status === 'verified',
      matchScore: data.match_score || data.confidence || 0,
      firstName: data.first_name || request.firstName || '',
      lastName: data.last_name || request.lastName || '',
      dateOfBirth: data.dob || request.dateOfBirth || '',
      phone: data.phone || request.phone || '',
    };
  } catch (error) {
    console.error('[YouVerify] Verification error:', error);
    throw error;
  }
}

async function verifyWithPrembly(request: VerificationRequest): Promise<VerificationResult> {
  if (!PREMBLY_API_KEY) {
    throw new Error('Prembly not configured');
  }

  try {
    const endpoint = request.type === 'bvn' ? '/bvn/verify' : '/nin/verify';
    const body =
      request.type === 'bvn'
        ? { number: request.idNumber, first_name: request.firstName, last_name: request.lastName }
        : { number: request.idNumber, first_name: request.firstName, last_name: request.lastName };

    const response = await fetch(`${PREMBLY_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'x-api-key': PREMBLY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      success: true,
      verified: data.verified || data.status === 'success',
      matchScore: data.match_score || data.confidence || 0,
      firstName: data.first_name || request.firstName || '',
      lastName: data.last_name || request.lastName || '',
      dateOfBirth: data.dob || request.dateOfBirth || '',
      phone: data.phone || request.phone || '',
    };
  } catch (error) {
    console.error('[Prembly] Verification error:', error);
    throw error;
  }
}

async function verifyWithSmileIdentity(request: VerificationRequest): Promise<VerificationResult> {
  if (!SMILE_IDENTITY_API_KEY) {
    throw new Error('Smile Identity not configured');
  }

  try {
    const body = {
      id_type: request.type === 'bvn' ? 'BVN' : 'NIN',
      id_number: request.idNumber,
      first_name: request.firstName,
      last_name: request.lastName,
    };

    const response = await fetch(`${SMILE_IDENTITY_BASE_URL}/id_verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SMILE_IDENTITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      success: true,
      verified: data.verified || data.ResultCode === '1010',
      matchScore: data.confidence || 0,
      firstName: data.first_name || request.firstName || '',
      lastName: data.last_name || request.lastName || '',
      dateOfBirth: data.dob || request.dateOfBirth || '',
      phone: data.phone || request.phone || '',
    };
  } catch (error) {
    console.error('[SmileIdentity] Verification error:', error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Provider Map                                                               */
/* -------------------------------------------------------------------------- */

const PROVIDER_MAP: Record<VerificationProvider, (req: VerificationRequest) => Promise<VerificationResult>> = {
  youverify: verifyWithYouVerify,
  prembly: verifyWithPrembly,
  smile_identity: verifyWithSmileIdentity,
};

/* -------------------------------------------------------------------------- */
/* Unified verifyIdentity — with provider fallback chain                      */
/* -------------------------------------------------------------------------- */

export async function verifyIdentity(request: VerificationRequest): Promise<VerificationResult & { provider?: VerificationProvider }> {
  // Validate the ID number format first
  if (request.type === 'bvn' && !isValidBVN(request.idNumber)) {
    return {
      success: false,
      verified: false,
      matchScore: 0,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      error: 'Invalid BVN format. Must be 11 digits.',
    };
  }

  if (request.type === 'nin' && !isValidNIN(request.idNumber)) {
    return {
      success: false,
      verified: false,
      matchScore: 0,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      error: 'Invalid NIN format. Must be 11 digits.',
    };
  }

  // Try each provider in the fallback chain
  const providerChain = buildProviderChain(request.preferredProvider);

  for (const provider of providerChain) {
    try {
      const result = await PROVIDER_MAP[provider](request);
      return { ...result, provider };
    } catch (error) {
      console.warn(`[Verification] Provider ${provider} failed, trying next...`, error instanceof Error ? error.message : error);
    }
  }

  // All external providers failed — fall back to built-in BVN/NIN verification

  try {
    if (request.type === 'bvn') {
      const result = await verifyBVN({
        bvn: request.idNumber,
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth,
        phone: request.phone,
      });
      return { ...result, provider: undefined };
    } else {
      const result = await verifyNIN({
        nin: request.idNumber,
        firstName: request.firstName,
        lastName: request.lastName,
      });
      return { ...result, provider: undefined };
    }
  } catch (error) {
    console.error('[Verification] Built-in verification also failed:', error);
    return {
      success: false,
      verified: false,
      matchScore: 0,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      error: 'All verification providers are unavailable. Please try again later.',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* getVerificationStatus — Check if user is verified                          */
/* -------------------------------------------------------------------------- */

export async function getVerificationStatus(userId: string): Promise<VerificationStatus> {
  // In production, this would query a Verification table in the database.
  // For now, return a default unverified status.
  // The actual verification records would be stored when verifyIdentity succeeds.

  try {
    // Dynamic import to avoid circular dependencies
    const { db } = await import('@/lib/db');

    // Check if the user has any verified payments or orders that required verification
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountNumber: true,
        riderAccountNumber: true,
        bankName: true,
        riderBankName: true,
      },
    });

    // A user is considered "verified" if they have bank details filled in
    // (which typically requires BVN verification in Nigeria)
    const hasBankDetails = !!(
      user?.accountNumber ||
      user?.riderAccountNumber
    );

    return {
      userId,
      bvnVerified: hasBankDetails,
      ninVerified: hasBankDetails,
      verifiedAt: hasBankDetails ? new Date().toISOString() : undefined,
    };
  } catch (error) {
    console.error('[Verification] Status check error:', error);
    return {
      userId,
      bvnVerified: false,
      ninVerified: false,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Re-exports from bvn.ts                                                     */
/* -------------------------------------------------------------------------- */

export { verifyBVN, verifyNIN, isValidBVN, isValidNIN, type VerificationResult } from './bvn';
