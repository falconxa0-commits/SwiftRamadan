import { test, expect } from '@playwright/test';
import { seedAuthState, waitForAppShell, openModalViaStore } from './helpers';

/**
 * VENDOR JOURNEY — 10 E2E tests
 *
 * Covers the vendor dashboard, store/menu tab, wallet, add-product modal,
 * orders filter, stock control, dynamic pricing, sales insights, profile
 * and payout modal.
 */

test.describe('Vendor Journey', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthState(page, 'vendor', {
      vendorStoreName: 'Test Store',
      vendorBusinessCategory: 'Iftar Meals',
    });
  });

  test('should load vendor dashboard (after login)', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // VendorDashboard renders h1 with the store name
    await expect(page.getByRole('heading', { name: /Test Store/i }).first()).toBeVisible({ timeout: 12_000 });
  });

  test('should view store tab', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.waitForTimeout(500);

    // VendorStoreTab renders an h2 "Menu Items"
    await expect(page.getByRole('heading', { name: /Menu Items/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should view wallet', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await page.getByRole('button', { name: 'Wallet', exact: true }).click();
    await page.waitForTimeout(500);

    // VendorWallet renders an "Available Balance" label
    await expect(page.getByText(/Available Balance/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should open add product modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Navigate to store tab
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.waitForTimeout(500);

    // Click "Add New Product" CTA
    const addBtn = page.getByRole('button', { name: /Add New Product/i }).first();
    await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await addBtn.click();
    await page.waitForTimeout(500);

    // VendorAddProductModal renders h2 "Add Product"
    await expect(page.getByRole('heading', { name: /^Add Product$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should view orders', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // The dashboard shows an "Active Requests" section + filter tabs
    await page.getByText('Incoming', { exact: true }).first().waitFor({ state: 'visible', timeout: 10_000 });

    // Click the Processing filter — this should reveal "Processing Orders" h3
    await page.getByText('Processing', { exact: true }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /Processing Orders/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should view stock control', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Navigate to store tab
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.waitForTimeout(500);

    // Click "Stock Control"
    const stockBtn = page.getByText('Stock Control', { exact: false }).first();
    await stockBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await stockBtn.click();
    await page.waitForTimeout(500);

    // VendorStockControl modal renders h2 "Stock Control"
    await expect(page.getByRole('heading', { name: /^Stock Control$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should open pricing modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // The Dynamic Pricing modal isn't reachable from the vendor UI directly
    // (it lives behind the customer profile's menu); open it via the store.
    await openModalViaStore(page, 'vendor-pricing');
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /^Dynamic Pricing$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should view sales insights', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // The dashboard top-right has a "Sales insights" button (aria-label)
    const insightsBtn = page.getByRole('button', { name: /Sales insights/i }).first();
    await insightsBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await insightsBtn.click();
    await page.waitForTimeout(500);

    // VendorSalesInsights modal renders h2 "Sales Insights"
    await expect(page.getByRole('heading', { name: /^Sales Insights$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should view profile', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Navigate to vendor profile tab
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForTimeout(500);

    // VendorProfileTab renders h2 with the store name
    await expect(page.getByRole('heading', { name: /Test Store/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should open payout modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Global PayoutModal is reachable via the store (UI only exposes it
    // through the customer ProfileTab). Verify it renders with the right
    // title for a vendor.
    await openModalViaStore(page, 'payout');
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /^Payout$/i })).toBeVisible({ timeout: 10_000 });
  });
});
