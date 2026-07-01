// BVN/NIN Verification — Nigerian identity verification
// In production, integrate with Nigeria Inter-Bank Settlement System (NIBSS) BVN API
// or licensed verification providers like YouVerify, Prembly, or Smile Identity

const VERIFICATION_API_KEY =
  process.env.IDENTITY_VERIFICATION_API_KEY || '';
const VERIFICATION_BASE_URL =
  process.env.IDENTITY_VERIFICATION_URL || '';

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  matchScore: number; // 0-100
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  error?: string;
}

export async function verifyBVN({
  bvn,
  firstName,
  lastName,
  dateOfBirth,
  phone,
}: {
  bvn: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
}): Promise<VerificationResult> {
  if (!VERIFICATION_API_KEY) {
    console.warn('[BVN] Verification service not configured — refusing to auto-verify');
    return {
      success: false,
      verified: false,
      matchScore: 0,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      error: 'Verification service not configured',
    };
  }

  try {
    const response = await fetch(`${VERIFICATION_BASE_URL}/bvn/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${VERIFICATION_API_KEY}`,
      },
      body: JSON.stringify({
        bvn,
        first_name: firstName,
        last_name: lastName,
        dob: dateOfBirth,
        phone,
      }),
    });

    const data = await response.json();
    return {
      success: true,
      verified: data.verified || data.status === 'success',
      matchScore: data.match_score || 0,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      dateOfBirth: data.dob || '',
      phone: data.phone || '',
    };
  } catch (error) {
    console.error('[BVN] Verification error:', error);
    return {
      success: false,
      verified: false,
      matchScore: 0,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      error: 'Verification service unavailable',
    };
  }
}

export async function verifyNIN({
  nin,
  firstName,
  lastName,
}: {
  nin: string;
  firstName?: string;
  lastName?: string;
}): Promise<VerificationResult> {
  if (!VERIFICATION_API_KEY) {
    console.warn('[NIN] Verification service not configured — refusing to auto-verify');
    return {
      success: false,
      verified: false,
      matchScore: 0,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      error: 'Verification service not configured',
    };
  }

  try {
    const response = await fetch(`${VERIFICATION_BASE_URL}/nin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${VERIFICATION_API_KEY}`,
      },
      body: JSON.stringify({ nin, first_name: firstName, last_name: lastName }),
    });

    const data = await response.json();
    return {
      success: true,
      verified: data.verified || data.status === 'success',
      matchScore: data.match_score || 0,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      dateOfBirth: data.dob || '',
      phone: data.phone || '',
    };
  } catch (error) {
    console.error('[NIN] Verification error:', error);
    return {
      success: false,
      verified: false,
      matchScore: 0,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      error: 'Verification service unavailable',
    };
  }
}

// Validate BVN format (11 digits)
export function isValidBVN(bvn: string): boolean {
  return /^\d{11}$/.test(bvn);
}

// Validate NIN format (11 digits)
export function isValidNIN(nin: string): boolean {
  return /^\d{11}$/.test(nin);
}
