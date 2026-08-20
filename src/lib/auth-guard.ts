// Auth Guard Utilities for API Route Protection
// Provides reusable authentication and authorization helpers
// These complement the middleware-level auth checks with route-level validation

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, SessionUser } from '@/lib/session';

/**
 * Valid user roles in the system.
 * Use these constants instead of string literals to prevent typos.
 */
export const ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  RIDER: 'rider',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Require authentication and verify the user has one of the allowed roles.
 *
 * Usage:
 * ```
 * const auth = await requireRole(request, [ROLES.VENDOR, ROLES.ADMIN]);
 * if (auth instanceof NextResponse) return auth; // 401 or 403
 * // auth is now typed as SessionUser with verified role
 * ```
 *
 * @param request - The incoming NextRequest object
 * @param roles - Array of roles that are authorized for this route
 * @returns SessionUser if authorized, NextResponse with 401/403 if not
 */
export async function requireRole(
  request: NextRequest,
  roles: Role[],
): Promise<SessionUser | NextResponse> {
  // First check authentication
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Then check role authorization
  if (!roles.includes(auth.role as Role)) {
    return NextResponse.json(
      {
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
        code: 'FORBIDDEN',
        currentRole: auth.role,
      },
      { status: 403 },
    );
  }

  return auth;
}

/**
 * Verify that a resource belongs to the authenticated user (or user is admin).
 * Prevents Insecure Direct Object Reference (IDOR) attacks.
 *
 * Usage:
 * ```
 * const ownershipCheck = await verifyOwnership(request, resourceUserId);
 * if (ownershipCheck instanceof NextResponse) return ownershipCheck; // 403
 * ```
 *
 * @param request - The incoming NextRequest object
 * @param resourceOwnerId - The userId of the resource being accessed
 * @returns true if authorized, NextResponse with 403 if not
 */
export async function verifyOwnership(
  request: NextRequest,
  resourceOwnerId: string | null | undefined,
): Promise<true | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Admin can access any resource
  if (auth.role === ROLES.ADMIN) return true;

  // Check if the authenticated user owns the resource
  if (!resourceOwnerId || resourceOwnerId !== auth.userId) {
    return NextResponse.json(
      {
        error: 'You do not have permission to access this resource',
        code: 'FORBIDDEN',
      },
      { status: 403 },
    );
  }

  return true;
}

/**
 * Optional authentication - returns user if authenticated, null otherwise.
 * Useful for routes that work differently for authenticated vs anonymous users.
 *
 * Usage:
 * ```
 * const user = await optionalAuth(request);
 * if (user) {
 *   // Show personalized data
 * } else {
 *   // Show generic data
 * }
 * ```
 *
 * @param request - The incoming NextRequest object
 * @returns SessionUser if authenticated, null if not
 */
export async function optionalAuth(request: NextRequest): Promise<SessionUser | null> {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return null;
    return auth;
  } catch {
    return null;
  }
}

/**
 * Create a rate-limited action wrapper.
 * Ensures an action cannot be performed more than `maxAttempts` times
 * within `windowMs` milliseconds for a given key.
 *
 * Note: This uses in-memory storage. For distributed systems,
 * use Redis-based rate limiting instead.
 *
 * Usage:
 * ```
 * const rateLimited = await checkAtomicRateLimit('spin:' + userId, 1, 86400000); // Once per day
 * if (rateLimited) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
 * ```
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkAtomicRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true; // Allowed
  }

  if (entry.count >= maxAttempts) {
    return false; // Rate limited
  }

  entry.count++;
  return true; // Allowed
}

/**
 * Reset a rate limit entry (e.g., after successful action).
 * Use sparingly - typically you want limits to persist for the full window.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clean up expired rate limit entries.
 * Call periodically to prevent memory leaks.
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
