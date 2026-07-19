// Admin authentication & authorization helper
// Reusable across all /api/admin/* routes

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, SessionUser } from '@/lib/session';

/**
 * Require authentication + admin role for an API route handler.
 *
 * Usage:
 * ```
 * const auth = await requireAdmin(request);
 * if (auth instanceof NextResponse) return auth; // 401 or 403
 * // auth is now typed as SessionUser with role === 'admin'
 * ```
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<SessionUser | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth; // 401

  if (auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required', code: 'FORBIDDEN' },
      { status: 403 },
    );
  }

  return auth;
}
