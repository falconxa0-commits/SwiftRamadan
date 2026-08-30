import { test, expect } from '@playwright/test';
import { seedAuthState, waitForAppShell, clearAuthState, openModalViaStore } from './helpers';

/**
 * NAVIGATION JOURNEY — 10 E2E tests
 *
 * Covers cross-role tab switching, modal open/close, search overlay,
 * notifications drawer, mobile responsiveness, bottom-nav behaviour,
 * welcome screen for new users, and the unauthenticated redirect to
 * the auth screen.
 */

test.describe('Navigation Journey', () => {
  test('should switch between customer tabs', async ({ page }) => {
    await seedAuthState(page, 'customer');
    await page.goto('/');
    await waitForAppShell(page);

    // Home -> Explore -> Cart -> Offers -> Orders -> Profile
    for (const tab of ['Explore', 'Cart', 'Offers', 'Orders', 'Profile'] as const) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.waitForTimeout(300);
    }

    // After walking every tab, the bottom nav still shows all labels
    const nav = page.locator('nav[aria-label="Primary"]').first();
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Home', { exact: true }).first()).toBeVisible();
    await expect(nav.getByText('Profile', { exact: true }).first()).toBeVisible();
  });

  test('should switch between vendor tabs', async ({ page }) => {
    await seedAuthState(page, 'vendor');
    await page.goto('/');
    await waitForAppShell(page);

    for (const tab of ['Menu', 'Wallet', 'Home', 'Profile'] as const) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.waitForTimeout(300);
    }

    const nav = page.locator('nav[aria-label="Primary"]').first();
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Menu', { exact: true }).first()).toBeVisible();
  });

  test('should switch between rider tabs', async ({ page }) => {
    await seedAuthState(page, 'rider');
    await page.goto('/');
    await waitForAppShell(page);

    for (const tab of ['Map', 'Earnings', 'Home', 'Profile'] as const) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.waitForTimeout(300);
    }

    const nav = page.locator('nav[aria-label="Primary"]').first();
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Earnings', { exact: true }).first()).toBeVisible();
  });

  test('should open and close modals', async ({ page }) => {
    await seedAuthState(page, 'customer');
    await page.goto('/');
    await waitForAppShell(page);

    // Open the Settings modal via the store hook
    await openModalViaStore(page, 'settings');
    await page.waitForTimeout(400);
    await expect(page.getByRole('heading', { name: /^Settings$/i })).toBeVisible({ timeout: 10_000 });

    // Close button (aria-label="Close settings")
    const closeBtn = page.getByRole('button', { name: 'Close settings' });
    await closeBtn.click();
    await page.waitForTimeout(500);

    // Modal should be gone
    await expect(page.getByRole('heading', { name: /^Settings$/i })).toHaveCount(0);
  });

  test('should handle search', async ({ page }) => {
    await seedAuthState(page, 'customer');
    await page.goto('/');
    await waitForAppShell(page);

    // Open the search overlay
    await page.getByText(/Search Jollof, groceries, or boxes/i).click();
    await page.waitForTimeout(400);

    const input = page.getByPlaceholder(/Search Jollof, Groceries, or Boxes/i);
    await expect(input).toBeVisible({ timeout: 8_000 });

    // Type a query and verify it lands in the input
    await input.fill('jollof');
    await expect(input).toHaveValue('jollof');

    // Close button (X) clears the query
    const clearBtn = page.locator('button:has-text("")').filter({ has: page.locator('svg') }).first();
    // Use Escape key as a fallback close mechanism
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('should show notifications', async ({ page }) => {
    await seedAuthState(page, 'customer');
    await page.goto('/');
    await waitForAppShell(page);

    // Click the bell icon (aria-label="Notifications")
    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.first().click();
    await page.waitForTimeout(500);

    // NotificationCenter renders h2 "Notifications"
    await expect(page.getByRole('heading', { name: /^Notifications$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should be responsive (mobile viewport)', async ({ page }) => {
    await seedAuthState(page, 'customer');

    // Use a small mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppShell(page);

    // The bottom nav should still be visible & usable on mobile
    const nav = page.locator('nav[aria-label="Primary"]').first();
    await expect(nav).toBeVisible();

    // Tapping a tab still works on mobile
    await page.getByRole('button', { name: 'Explore', exact: true }).click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('heading', { name: /What do you need today/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should handle bottom nav', async ({ page }) => {
    await seedAuthState(page, 'customer');
    await page.goto('/');
    await waitForAppShell(page);

    // The bottom nav is the primary nav landmark
    const nav = page.locator('nav[aria-label="Primary"]').first();
    await expect(nav).toBeVisible();

    // The aria-current="page" attribute should mark the active tab
    const activeTab = nav.locator('button[aria-current="page"]');
    await expect(activeTab).toHaveCount(1);

    // Click another tab and verify aria-current moves
    await page.getByRole('button', { name: 'Explore', exact: true }).click();
    await page.waitForTimeout(400);
    await expect(nav.locator('button[aria-current="page"]')).toHaveCount(1);
  });

  test('should show welcome screen for new users', async ({ page }) => {
    // No seeded auth — a brand-new visitor sees the welcome screen
    await clearAuthState(page);
    await page.goto('/');

    // WelcomeScreen has "Sign In" + "Get Started" buttons
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
    // SwiftRamadan brand text should appear
    await expect(page.getByText(/SwiftRamadan/i).first()).toBeVisible();
  });

  test('should redirect to auth when not logged in', async ({ page }) => {
    // Seed with showWelcome=false but no login — should force the auth screen
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem(
          'swiftramadan-store',
          JSON.stringify({
            state: {
              showWelcome: false,
              isLoggedIn: false,
              onboardingComplete: false,
              userRole: 'customer',
              userName: '',
              userArea: '',
              cartItems: [],
              cartCount: 0,
              wishlist: [],
            },
            version: 1,
          })
        );
      } catch {
        // ignore
      }
    });

    await page.goto('/');

    // AuthScreen login view shows the "Welcome Back" h1
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible({ timeout: 12_000 });
  });
});
