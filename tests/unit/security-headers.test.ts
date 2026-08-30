/**
 * Middleware security-headers unit tests — `src/middleware.ts`.
 *
 * Verifies:
 *  - The standard security headers are applied to ALL responses:
 *      X-Frame-Options: DENY
 *      X-Content-Type-Options: nosniff
 *      Referrer-Policy: strict-origin-when-cross-origin
 *      Permissions-Policy: camera=(), microphone=(self), geolocation=(self)
 *  - Content-Security-Policy is applied to PAGE requests but NOT to
 *    /api/* requests (CSP on JSON API responses would break clients).
 *  - HSTS is applied in production only (Strict-Transport-Security).
 *  - Invalid session cookies are cleared (Set-Cookie maxAge=0) and the
 *    request is rejected with 401.
 *  - Valid session tokens pass through and the verified user-id/email/role
 *    are attached as request headers (`x-user-id` etc.) for downstream
 *    route handlers.
 *
 * Mock strategy:
 *  - `@/lib/auth-jwt`'s `verifySessionToken` is mocked per-test to control
 *    whether the middleware treats the cookie as valid or invalid.
 *  - `NextResponse.next` is spied on (not replaced) so we can capture the
 *    modified request headers it's called with (for the x-user-id assertion).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock @/lib/auth-jwt so the middleware doesn't depend on real JWT signing.
vi.mock('@/lib/auth-jwt', () => ({
  verifySessionToken: vi.fn(async () => null),
}));

import { middleware } from '@/middleware';
import { verifySessionToken } from '@/lib/auth-jwt';

describe('middleware — security headers', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to development for most tests (HSTS is production-only).
    vi.stubEnv("NODE_ENV", 'development');
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv ?? '');
  });

  it('sets X-Frame-Options: DENY', async () => {
    const req = new NextRequest(new URL('http://localhost/page'));
    const res = await middleware(req);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('sets X-Content-Type-Options: nosniff', async () => {
    const req = new NextRequest(new URL('http://localhost/page'));
    const res = await middleware(req);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('sets Referrer-Policy', async () => {
    const req = new NextRequest(new URL('http://localhost/page'));
    const res = await middleware(req);
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('sets Permissions-Policy (camera disabled, microphone/geolocation self)', async () => {
    const req = new NextRequest(new URL('http://localhost/page'));
    const res = await middleware(req);
    const pp = res.headers.get('Permissions-Policy');
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=(self)');
    expect(pp).toContain('geolocation=(self)');
  });

  it('sets Content-Security-Policy on page (non-API) requests', async () => {
    const req = new NextRequest(new URL('http://localhost/page'));
    const res = await middleware(req);
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
  });

  it('does NOT set Content-Security-Policy on /api/* requests', async () => {
    // Use a public API route so the auth path isn't triggered (we only care
    // about CSP absence).
    const req = new NextRequest(new URL('http://localhost/api/health'));
    const res = await middleware(req);
    expect(res.headers.get('Content-Security-Policy')).toBeNull();
  });

  it('sets HSTS (Strict-Transport-Security) in production only', async () => {
    vi.stubEnv("NODE_ENV", 'production');
    const req = new NextRequest(new URL('https://example.com/page'));
    const res = await middleware(req);
    const hsts = res.headers.get('Strict-Transport-Security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('does NOT set HSTS in development', async () => {
    vi.stubEnv("NODE_ENV", 'development');
    const req = new NextRequest(new URL('http://localhost/page'));
    const res = await middleware(req);
    expect(res.headers.get('Strict-Transport-Security')).toBeNull();
  });
});

describe('middleware — session token handling', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", 'development');
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv ?? '');
  });

  it('clears invalid session cookies with a 401 (maxAge=0 Set-Cookie)', async () => {
    // verifySessionToken is mocked to return null at file scope.
    const req = new NextRequest(new URL('http://localhost/api/cart'), {
      method: 'POST',
      headers: { cookie: 'swiftramadan-session=invalid-token' },
    });
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('swiftramadan-session=');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('passes through valid tokens (200, no 401) and attaches x-user-id header', async () => {
    // Make verifySessionToken return a valid payload for this test only.
    vi.mocked(verifySessionToken).mockResolvedValueOnce({
      userId: 'u123',
      email: 'user@example.com',
      role: 'customer',
      iat: 1,
      exp: 2,
    });
    // Spy on NextResponse.next so we can capture the modified request headers
    // it was called with. The spy preserves the original implementation so the
    // middleware can still call `.headers.set()` on the returned response.
    const nextSpy = vi.spyOn(NextResponse, 'next');

    const req = new NextRequest(new URL('http://localhost/api/cart'), {
      method: 'POST',
      headers: { cookie: 'swiftramadan-session=valid-token' },
    });
    const res = await middleware(req);

    // Should NOT be a 401.
    expect(res.status).not.toBe(401);

    // NextResponse.next should have been called with a `request.headers`
    // containing x-user-id (set by the middleware after token verification).
    expect(nextSpy).toHaveBeenCalled();
    const call = nextSpy.mock.calls[0]?.[0];
    expect(call?.request?.headers).toBeDefined();
    const reqHeaders = call!.request!.headers as Headers;
    expect(reqHeaders.get('x-user-id')).toBe('u123');
    expect(reqHeaders.get('x-user-email')).toBe('user@example.com');
    expect(reqHeaders.get('x-user-role')).toBe('customer');

    nextSpy.mockRestore();
  });
});
