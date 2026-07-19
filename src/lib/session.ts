// Session management — JWT-based session cookies for SwiftRamadan
// Provides helpers for creating, reading, and clearing session cookies
// Auth verification runs in Node.js runtime (API routes) to avoid Edge Runtime issues

import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken } from '@/lib/auth-jwt';

export const SESSION_COOKIE_NAME = 'swiftramadan-session';
const SESSION_MAX_AGE = 30 * 24 * 3600; // 30 days in seconds

export interface SessionUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Set the session cookie on a NextResponse object.
 * Async because createSessionToken uses Web Crypto API.
 */
export async function setSessionCookie(response: NextResponse, user: SessionUser): Promise<void> {
  const token = await createSessionToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Get the authenticated user from a request's session cookie.
 * Works in Node.js runtime (API route handlers).
 * Returns null if no valid session exists.
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * Require authentication for an API route handler.
 * Returns the session user if authenticated, or a 401 NextResponse if not.
 *
 * Usage in API routes:
 * ```
 * const auth = await requireAuth(request);
 * if (auth instanceof NextResponse) return auth; // 401 response
 * // auth is now typed as SessionUser
 * const { userId, email, role } = auth;
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    );
  }
  return user;
}

/**
 * Clear the session cookie (logout).
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Check if a route path should be accessible without authentication.
 *
 * Routes that are ALWAYS public (any HTTP method):
 *   - /api/auth          — login, signup, OTP, logout
 *   - /api/health         — health checks / readiness probes
 *   - /api/monitoring     — Sentry tunnel
 *   - /api/payments/callback — payment gateway webhooks/redirects
 *
 * Routes that are public for GET requests only (browsable content):
 *   - Products, offers, coupons, vendors, group-buy, analytics, etc.
 */
export function isPublicApiRoute(pathname: string, method: string): boolean {
  // ── Always-public routes ──
  const alwaysPublic = [
    '/api/auth',              // login, signup, OTP, logout
    '/api/health',            // health checks / readiness probes
    '/api/monitoring',        // Sentry tunnel
    '/api/payments/callback', // payment gateway webhooks/redirects
  ];
  for (const route of alwaysPublic) {
    if (pathname === route || pathname.startsWith(route + '/')) return true;
  }

  // ── GET-only public routes (browsable content) ──
  if (method === 'GET') {
    const publicGetRoutes = [
      '/api/products',
      '/api/prayer-times',
      '/api/hijri-calendar',
      '/api/dua',
      '/api/trending',
      '/api/videos',
      '/api/community',
      '/api/offers',
      '/api/coupons',
      '/api/search',
      '/api/maps/',
      '/api/vendor',       // browsing vendor stores
      '/api/group-buy',    // group buy listings
      '/api/analytics',    // public analytics data
    ];

    for (const route of publicGetRoutes) {
      if (pathname.startsWith(route)) return true;
    }
  }

  return false;
}
