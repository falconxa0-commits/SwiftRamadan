import { NextRequest, NextResponse } from 'next/server';
import {
  verifyBVN,
  verifyNIN,
  isValidBVN,
  isValidNIN,
} from '@/lib/verification/bvn';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.auth);
  if (rateLimited) return rateLimited;

  try {
    const { type, number, firstName, lastName, dateOfBirth, phone } =
      await request.json();

    if (!type || !number) {
      return NextResponse.json(
        { success: false, message: 'type and number are required' },
        { status: 400 },
      );
    }

    if (type === 'bvn') {
      if (!isValidBVN(number)) {
        return NextResponse.json(
          { success: false, message: 'BVN must be 11 digits' },
          { status: 400 },
        );
      }
      const result = await verifyBVN({
        bvn: number,
        firstName,
        lastName,
        dateOfBirth,
        phone,
      });
      return NextResponse.json(result);
    }

    if (type === 'nin') {
      if (!isValidNIN(number)) {
        return NextResponse.json(
          { success: false, message: 'NIN must be 11 digits' },
          { status: 400 },
        );
      }
      const result = await verifyNIN({ nin: number, firstName, lastName });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, message: 'type must be bvn or nin' },
      { status: 400 },
    );
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/verify/identity' },
    });
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 },
    );
  }
}
