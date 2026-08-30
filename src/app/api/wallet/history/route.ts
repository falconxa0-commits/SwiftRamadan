import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import * as walletService from '@/services/wallet/wallet.service';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

// GET /api/wallet/history?userId=xxx&page=1&limit=20
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // SECURITY FIX: IDOR protection (audit B8).
    // Use the authenticated user's ID, NEVER the query param. The query param
    // is accepted only if it matches the authenticated user (for backward compat).
    // Any mismatch → 403. This prevents users from reading anyone else's wallet.
    if (requestedUserId && requestedUserId !== auth.userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: you can only view your own wallet history' },
        { status: 403 },
      );
    }
    const userId = auth.userId; // Always use the authenticated user's ID

    // MIGRATED (Phase 10): user existence check via `usersService.getUserById`
    // (was `db.user.findUnique({ select: { id: true } })`). Same null-check
    // semantics.
    const user = await usersService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    // MIGRATED (Phase 6.1): inline `db.walletTransaction.findMany` + `count`
    // (and the local `skip`/`totalPages` math) replaced with
    // `walletService.getHistory`. The service performs the same pagination
    // logic and clamps page/limit to safe bounds. IDOR check above unchanged.
    const result = await walletService.getHistory(userId, page, limit);

    return NextResponse.json({
      success: true,
      transactions: result.transactions,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('[Wallet History API] GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
