import { NextRequest, NextResponse } from 'next/server';
import { verifyBankAccount, listBanks } from '@/lib/payments';

export const runtime = 'nodejs';

// GET /api/bank-verify?accountNumber=xxx&bankCode=xxx — Verify bank account
// GET /api/bank-verify?action=banks — List available banks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // List banks endpoint
    if (action === 'banks') {
      const banks = await listBanks();
      return NextResponse.json(banks);
    }

    // Verify account endpoint
    const accountNumber = searchParams.get('accountNumber');
    const bankCode = searchParams.get('bankCode');

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { success: false, message: 'accountNumber and bankCode are required' },
        { status: 400 },
      );
    }

    const result = await verifyBankAccount({ accountNumber, bankCode });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Bank verification error:', error);
    return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
  }
}
