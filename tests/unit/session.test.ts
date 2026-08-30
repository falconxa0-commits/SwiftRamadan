/**
 * Session management unit tests — `src/lib/session.ts`.
 *
 * Tests:
 *  - `isPublicApiRoute(pathname, method)` exact-match semantics. Verifies that
 *    the B12 audit fix (no `/api/auth/*` prefix match) holds: protected auth
 *    sub-routes like `/api/auth/device-token` are NOT public.
 *  - `SESSION_COOKIE_NAME` is the expected `'swiftramadan-session'` constant.
 *  - `requireAuth(request)` returns the SessionUser when the cookie is valid,
 *    and a 401 NextResponse when no cookie is present or the token is invalid.
 *
 * Mock strategy:
 *  - `@/lib/auth-jwt` is mocked so `requireAuth` tests don't depend on real
 *    JWT signing (which would also depend on APP_SECRET being set).
 *  - We construct `NextRequest` via the real `next/server` constructor — jsdom
 *    provides `Request`/`Headers`/`URL` globals that Next.js's NextRequest
 *    builds on, so this works without a running Next.js server.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the auth-jwt module so getSessionUser doesn't depend on real JWT crypto.
vi.mock('@/lib/auth-jwt', () => ({
  createSessionToken: vi.fn(async () => 'mock-token'),
  verifySessionToken: vi.fn(async () => null),
}));

import {
  isPublicApiRoute,
  requireAuth,
  SESSION_COOKIE_NAME,
} from '@/lib/session';
import { verifySessionToken } from '@/lib/auth-jwt';

describe('session — `isPublicApiRoute` exact-match semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('/api/auth is public', () => {
    expect(isPublicApiRoute('/api/auth', 'POST')).toBe(true);
  });

  it('/api/auth/device-token is NOT public (exact match — no prefix)', () => {
    // B12 audit fix: prefix match would have allowed this; it must NOT.
    expect(isPublicApiRoute('/api/auth/device-token', 'POST')).toBe(false);
  });

  it('/api/health is public', () => {
    expect(isPublicApiRoute('/api/health', 'GET')).toBe(true);
  });

  it('/api/payments/callback is public (webhook callback)', () => {
    expect(isPublicApiRoute('/api/payments/callback', 'POST')).toBe(true);
  });

  it('/api/admin/users is NOT public', () => {
    expect(isPublicApiRoute('/api/admin/users', 'GET')).toBe(false);
  });

  it('uses exact match (no prefix) — /api/authors is NOT public even though it starts with /api/auth', () => {
    // Confirms exact match: a path that merely starts with /api/auth is
    // NOT treated as public.
    expect(isPublicApiRoute('/api/authors', 'POST')).toBe(false);
  });

  it('GET /api/products is public (browseable content)', () => {
    expect(isPublicApiRoute('/api/products', 'GET')).toBe(true);
  });

  it('POST /api/products is NOT public (write operations require auth)', () => {
    expect(isPublicApiRoute('/api/products', 'POST')).toBe(false);
  });
});

describe('session — constants', () => {
  it("SESSION_COOKIE_NAME is 'swiftramadan-session'", () => {
    expect(SESSION_COOKIE_NAME).toBe('swiftramadan-session');
  });
});

describe('session — `requireAuth`', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the SessionUser when authenticated (valid token)', async () => {
    // Arrange: make verifySessionToken return a valid payload.
    vi.mocked(verifySessionToken).mockResolvedValueOnce({
      userId: 'u1',
      email: 'a@b.com',
      role: 'customer',
      iat: 1,
      exp: 2,
    });
    const req = new NextRequest('http://localhost/api/cart', {
      method: 'POST',
      headers: { cookie: `${SESSION_COOKIE_NAME}=valid-token` },
    });

    const result = await requireAuth(req);

    // Returns the SessionUser, not a NextResponse.
    expect(result).not.toHaveProperty('status');
    expect(result).toMatchObject({
      userId: 'u1',
      email: 'a@b.com',
      role: 'customer',
    });
  });

  it('returns a 401 response when no cookie is present', async () => {
    const req = new NextRequest('http://localhost/api/cart', {
      method: 'POST',
    });

    const result = await requireAuth(req);

    // Should be a NextResponse-like object with status 401.
    expect(result).not.toMatchObject({ userId: expect.anything() });
    const response = result as Response;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Authentication required');
    expect(body.code).toBe('UNAUTHENTICATED');
  });

  it('returns a 401 response when the token is invalid', async () => {
    // verifySessionToken returns null (mocked at file scope to return null).
    const req = new NextRequest('http://localhost/api/cart', {
      method: 'POST',
      headers: { cookie: `${SESSION_COOKIE_NAME}=invalid-token` },
    });

    const result = await requireAuth(req);
    const response = result as Response;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe('UNAUTHENTICATED');
    // Verify the mock was actually called (confirms the cookie was read).
    expect(verifySessionToken).toHaveBeenCalledWith('invalid-token');
  });
});
