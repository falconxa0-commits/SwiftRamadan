import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// GET /api/wallet/transactions — List all wallet transactions with pagination
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
    const type = searchParams.get('type') || undefined; // filter by type

    // Ensure wallet exists
    let wallet = await db.wallet.findUnique({ where: { userId: auth.userId } });
    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId: auth.userId, balance: 0, currency: 'NGN' },
      });
    }

    const where: { walletId: string; type?: string } = { walletId: wallet.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.walletTransaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[api/wallet/transactions] GET error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/wallet/transactions' },
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transactions' },
      { status: 500 },
    );
  }
}
