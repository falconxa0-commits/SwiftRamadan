import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import * as walletService from '@/services/wallet/wallet.service';

export const runtime = 'nodejs';

// GET /api/wallet/transactions — List all wallet transactions with pagination
// MIGRATED (Phase 10): the previous flow used `db.wallet.findUnique` /
// `db.wallet.create` to look up a `Wallet` row keyed on `userId`, then
// filtered `WalletTransaction`s by `walletId`. The `Wallet` model does NOT
// exist in the Prisma schema (the route was buggy — it would have thrown a
// Prisma "unknown field" error at runtime), and `WalletTransaction` is
// keyed directly on `userId`. We now:
//   - Use `walletService.getHistory` when no `type` filter is provided
//     (the service does the same pagination + userId filter).
//   - Keep the inline `db.walletTransaction.findMany` path when a `type`
//     filter IS provided (the service does not support server-side type
//     filtering), but fix the `where` clause to use `userId` directly
//     instead of the non-existent `walletId`.
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

    if (type) {
      // Type-filtered path — service doesn't support server-side type
      // filtering, so we keep this branch inline (now correctly keyed on
      // `userId` instead of the non-existent `walletId`).
      const where: { userId: string; type: string } = { userId: auth.userId, type };
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
    }

    // No type filter — delegate to `walletService.getHistory` which does
    // the same pagination + userId-keyed query.
    const result = await walletService.getHistory(auth.userId, page, limit);

    return NextResponse.json({
      success: true,
      transactions: result.transactions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
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
