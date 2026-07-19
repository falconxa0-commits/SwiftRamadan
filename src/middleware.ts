import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth-jwt';
import { isPublicApiRoute, SESSION_COOKIE_NAME } from '@/lib/session';

/**
 * SwiftRamadan Middleware — Edge Runtime
 *
 * Auth gate: verifies JWT session tokens on protected API routes.
 * Public routes bypass verification for performance.
 * Invalid/expired tokens are rejected and the cookie is cleared.
 */

export async function middleware(request: NextRequest) {
  // ── 1. Build the base response with security headers ──

  const requestHeaders = new Headers(request.headers);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Security headers (applied to all responses)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(self)');

  // ── 2. API route handling ──

  if (request.nextUrl.pathname.startsWith('/api/')) {
    // CORS headers (same-origin by default)
    const origin = request.headers.get('origin');
    if (origin) {
      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
      const isAllowed = allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV === 'development' && origin.includes('localhost'));
      if (isAllowed) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
        response.headers.set('Vary', 'Origin');
      }
    }

    // Handle preflight OPTIONS requests — no auth needed
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }

    // ── 3. Protected route: verify JWT session token ──

    if (!isPublicApiRoute(request.nextUrl.pathname, request.method)) {
      const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

      // No cookie at all — reject
      if (!sessionCookie) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Verify the JWT — rejects invalid signatures, expired tokens, malformed tokens
      const payload = await verifySessionToken(sessionCookie);

      if (!payload) {
        // Invalid or expired token — reject and clear the bad cookie
        const rejectResponse = new NextResponse(
          JSON.stringify({ success: false, message: 'Invalid or expired session' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
        rejectResponse.cookies.set(SESSION_COOKIE_NAME, '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        });
        return rejectResponse;
      }

      // Valid token — attach verified user info to request headers
      // Downstream route handlers can read these via request.headers.get('x-user-id') etc.
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-email', payload.email);
      requestHeaders.set('x-user-role', payload.role);
    }
  }

  // ── 4. HTTPS redirect in production ──

  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      return NextResponse.redirect(
        `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
        301,
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
