import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { readFileSync } from 'node:fs';
import { seedAuthState, waitForAppShell } from './helpers';

/**
 * ADMIN JOURNEY — 15 E2E tests
 *
 * The SwiftRamadan store's `userRole` union only allows
 * `'customer' | 'vendor' | 'rider'` — there is no `'admin'` role
 * (see `src/lib/store.ts`). The `AdminDashboard` component
 * (`src/components/swift/AdminDashboard.tsx`) is dead code: it is
 * never imported by `src/app/page.tsx` or anywhere else in the app.
 *
 * The admin API endpoints under `/api/admin/*` are real but require
 * authentication (the Next.js middleware in `src/middleware.ts`
 * rejects any request without a valid session cookie with 401). Some
 * routes additionally call `requireAdmin()` which would 403 a
 * non-admin caller, but the middleware 401 short-circuits first.
 *
 * This spec verifies the admin surface is unreachable from both the
 * UI (no admin rendering for any role) and the API (all admin
 * endpoints 401 without a session cookie).
 */

const ADMIN_API_ROUTES = [
  { path: '/api/admin/users', method: 'GET' as const, label: 'view users list' },
  { path: '/api/admin/orders', method: 'GET' as const, label: 'view orders list' },
  { path: '/api/admin/vendors', method: 'GET' as const, label: 'view vendors' },
  { path: '/api/admin/disputes', method: 'GET' as const, label: 'view disputes' },
  { path: '/api/admin/finance', method: 'GET' as const, label: 'view finance dashboard' },
  { path: '/api/admin/content', method: 'GET' as const, label: 'view content management' },
  { path: '/api/admin/metrics', method: 'GET' as const, label: 'view metrics' },
  { path: '/api/admin/dashboard', method: 'GET' as const, label: 'view admin dashboard' },
];

const ADMIN_API_PUT_ROUTES = [
  { path: '/api/admin/users', body: { userId: 'usr-001', action: 'ban' }, label: 'open user detail' },
  { path: '/api/admin/orders', body: { orderId: 'ord-a1b2c3d4e5f6', action: 'cancel' }, label: 'open order detail' },
  { path: '/api/admin/disputes', body: { disputeId: 'dsp-001', action: 'resolve' }, label: 'open dispute detail' },
  { path: '/api/admin/vendors', body: { vendorId: 'vnd-005', action: 'approve' }, label: 'approve payout' },
  { path: '/api/admin/content', body: { itemId: 'feat-004', action: 'toggle' }, label: 'moderate content' },
];

test.describe('Admin Journey', () => {
  // ──────────────────────────────────────────────────────────────
  // API auth tests — every admin endpoint must 401 an unauthenticated
  // request. The middleware in `src/middleware.ts` enforces this for
  // any path that isn't in `isPublicApiRoute(...)`; `/api/admin/*` is
  // not on that list.
  // ──────────────────────────────────────────────────────────────

  for (const route of ADMIN_API_ROUTES) {
    test(`should respond 401 for ${route.method} ${route.path} (${route.label})`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(401);
      const body = await response.json().catch(() => ({}));
      // The middleware returns `{ success: false, message: 'Authentication required' }`
      expect(body.success).toBeFalsy();
    });
  }

  for (const route of ADMIN_API_PUT_ROUTES) {
    test(`should respond 401 for PUT ${route.path} (${route.label})`, async ({ request }) => {
      const response = await request.put(route.path, { data: route.body });
      expect(response.status()).toBe(401);
      const body = await response.json().catch(() => ({}));
      expect(body.success).toBeFalsy();
    });
  }

  // ──────────────────────────────────────────────────────────────
  // UI dead-code verification — the AdminDashboard component is
  // never imported by `src/app/page.tsx`, so the "Admin Panel"
  // heading must not render for any of the three real user roles.
  // We iterate all three roles in a single test to keep the test
  // count at the 15-test target while still covering customer,
  // vendor, and rider.
  // ──────────────────────────────────────────────────────────────

  test('should NOT render AdminDashboard for any user role (customer / vendor / rider)', async ({ page }) => {
    // Customer
    await seedAuthState(page, 'customer');
    await page.goto('/');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { name: /^Admin Panel$/i })).toHaveCount(0);

    // Vendor — re-seed via the page init script and reload.
    await seedAuthState(page, 'vendor');
    await page.goto('/');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { name: /^Admin Panel$/i })).toHaveCount(0);

    // Rider
    await seedAuthState(page, 'rider');
    await page.goto('/');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { name: /^Admin Panel$/i })).toHaveCount(0);
  });

  // ──────────────────────────────────────────────────────────────
  // Dead-code structural verification — the AdminDashboard file
  // exists on disk (it's a real component) but is not imported by
  // the main page entrypoint, confirming it's unreachable.
  // ──────────────────────────────────────────────────────────────

  test('AdminDashboard component file exists but is dead code (not imported by page.tsx)', () => {
    const componentPath = resolvePath(
      process.cwd(),
      'src/components/swift/AdminDashboard.tsx',
    );
    const pagePath = resolvePath(process.cwd(), 'src/app/page.tsx');

    // 1. The AdminDashboard component file exists.
    expect(existsSync(componentPath)).toBe(true);

    // 2. The main page entrypoint must NOT import AdminDashboard.
    const pageSource = readFileSync(pagePath, 'utf8');
    expect(pageSource).not.toMatch(/AdminDashboard/);

    // 3. The Zustand store must NOT include 'admin' in the userRole
    //    union — `userRole: 'customer' | 'vendor' | 'rider'`. We verify
    //    by reading the store source and asserting no 'admin' literal
    //    appears in the userRole type alias.
    const storePath = resolvePath(process.cwd(), 'src/lib/store.ts');
    const storeSource = readFileSync(storePath, 'utf8');
    // The userRole union line should be exactly:
    //   userRole: 'customer' | 'vendor' | 'rider';
    expect(storeSource).toMatch(/userRole:\s*'customer'\s*\|\s*'vendor'\s*\|\s*'rider'/);
    // And it must NOT include 'admin'.
    expect(storeSource).not.toMatch(/userRole:\s*'customer'\s*\|\s*'vendor'\s*\|\s*'rider'\s*\|\s*'admin'/);
  });
});
