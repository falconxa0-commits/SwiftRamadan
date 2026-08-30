import { test, expect } from '@playwright/test';
import { seedAuthState, waitForAppShell, openModalViaStore } from './helpers';

/**
 * RIDER JOURNEY — 10 E2E tests
 *
 * Covers the rider dashboard, online toggle, earnings hub, delivery map,
 * profile, smart route / power finder / performance / new delivery
 * modals, and the global payout modal.
 */

test.describe('Rider Journey', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthState(page, 'rider', {
      userName: 'Test Rider',
      riderOnline: false,
      riderVehicleType: 'Motorcycle',
    });
  });

  test('should load rider dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // RiderDashboard shows either "Welcome, Rider!" (new rider) or the
    // rider name h2. Verify something rider-specific is on screen.
    const welcome = page.getByRole('heading', { name: /Welcome, Rider/i });
    const riderName = page.getByRole('heading', { name: /Test Rider/i });
    await expect(welcome.or(riderName).first()).toBeVisible({ timeout: 12_000 });
  });

  test('should toggle online status', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // The top header shows "You are Offline" before toggling
    await expect(page.getByText(/You are Offline/i).first()).toBeVisible({ timeout: 10_000 });

    // Click the toggle button (aria-label="Toggle online")
    const toggle = page.getByRole('button', { name: 'Toggle online' });
    await toggle.first().click();
    await page.waitForTimeout(400);

    // After toggling, it should say "You are Online"
    await expect(page.getByText(/You are Online/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('should view earnings hub', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await page.getByRole('button', { name: 'Earnings', exact: true }).click();
    await page.waitForTimeout(500);

    // RiderEarningsHub renders an "Earnings Breakdown" h3 (or onboarding h3)
    const breakdown = page.getByRole('heading', { name: /Earnings Breakdown/i });
    const startEarning = page.getByRole('heading', { name: /Start Earning/i });
    await expect(breakdown.or(startEarning).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should view delivery map', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await page.waitForTimeout(500);

    // RiderDeliveryMap renders "No Active Delivery" when no delivery is set
    await expect(page.getByRole('heading', { name: /No Active Delivery/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should view profile', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForTimeout(500);

    // RiderProfileTab renders the rider's name as h2
    await expect(page.getByRole('heading', { name: /Test Rider/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should open smart route modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // RiderSmartRouteModal isn't reachable from the rider UI directly;
    // open it via the store hook.
    await openModalViaStore(page, 'rider-smart-route');
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /^AI Smart Route$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should open power finder modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await openModalViaStore(page, 'rider-power-finder');
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /^Power Finder$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should view performance hub', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Go to rider profile tab and click "Performance Hub" menu item
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForTimeout(500);

    const perfBtn = page.getByText('Performance Hub', { exact: false }).first();
    await perfBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await perfBtn.click();
    await page.waitForTimeout(500);

    // RiderPerformanceHub modal renders h2 "Performance Hub"
    await expect(page.getByRole('heading', { name: /^Performance Hub$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should see new delivery request', async ({ page }) => {
    // Seed with riderOnline=true so the "New Delivery Request" CTA appears
    await seedAuthState(page, 'rider', {
      userName: 'Test Rider',
      riderOnline: true,
      riderVehicleType: 'Motorcycle',
    });

    await page.goto('/');
    await waitForAppShell(page);

    // Click the "New Delivery Request" CTA on the dashboard
    const cta = page.getByRole('heading', { name: /New Delivery Request/i }).first();
    await cta.waitFor({ state: 'visible', timeout: 10_000 });
    await cta.click();
    await page.waitForTimeout(500);

    // NewDeliveryRequestModal renders h2 "New Delivery Request"
    await expect(page.getByRole('heading', { name: /^New Delivery Request$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should open payout modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Global PayoutModal is reachable via the store hook (the rider UI
    // only shows "Cash Out" toasts, not the full modal).
    await openModalViaStore(page, 'payout');
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /^Payout$/i })).toBeVisible({ timeout: 10_000 });
  });
});
