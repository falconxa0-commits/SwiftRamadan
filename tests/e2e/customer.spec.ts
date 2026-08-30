import { test, expect } from '@playwright/test';
import { seedAuthState, waitForAppShell } from './helpers';

/**
 * CUSTOMER JOURNEY — 10 E2E tests
 *
 * Covers the public home page, customer tab navigation, search, product
 * details, cart, checkout, prayer-times modal, community forum and
 * settings.
 */

test.describe('Customer Journey', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthState(page, 'customer');
  });

  test('should load home page', async ({ page }) => {
    await page.goto('/');
    // The persisted metadata title contains "SwiftRamadan"
    await expect(page).toHaveTitle(/SwiftRamadan/i);
  });

  test('should navigate to explore tab', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Click the "Explore" tab in the bottom nav
    const exploreBtn = page.getByRole('button', { name: 'Explore', exact: true });
    await exploreBtn.click();
    await page.waitForTimeout(400);

    // ExploreTab renders a distinctive h1
    await expect(page.getByRole('heading', { name: /What do you need today/i })).toBeVisible({ timeout: 8_000 });
  });

  test('should open search overlay', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Click the search bar (customer-only)
    await page.getByText(/Search Jollof, groceries, or boxes/i).click();
    await page.waitForTimeout(400);

    // SearchOverlay input has placeholder "Search Jollof, Groceries, or Boxes..."
    await expect(page.getByPlaceholder(/Search Jollof, Groceries, or Boxes/i)).toBeVisible({ timeout: 8_000 });
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Wait for HomeTab trending meals to render, then click the first one
    const firstMeal = page.getByText('Jollof Rice & Chicken').first();
    await firstMeal.waitFor({ state: 'visible', timeout: 10_000 });
    await firstMeal.click();
    await page.waitForTimeout(500);

    // ProductDetailModal shows "Product Details" h2
    await expect(page.getByRole('heading', { name: /Product Details/i })).toBeVisible({ timeout: 8_000 });
  });

  test('should add item to cart', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Open product detail for the first meal
    const firstMeal = page.getByText('Jollof Rice & Chicken').first();
    await firstMeal.waitFor({ state: 'visible', timeout: 10_000 });
    await firstMeal.click();
    await page.waitForTimeout(500);

    // Click ADD TO CART
    const addToCartBtn = page.getByRole('button', { name: /ADD TO CART/i }).first();
    await addToCartBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await addToCartBtn.click();
    await page.waitForTimeout(500);

    // The top-bar cart icon should now show a count badge (e.g., "1")
    const cartBtn = page.getByRole('button', { name: 'Cart' }).first();
    await expect(cartBtn).toBeVisible();
    // A small badge with the count appears near the cart icon
    await expect(cartBtn.locator('span').filter({ hasText: /^\d+$/ })).toHaveText(/\d+/);
  });

  test('should view cart', async ({ page }) => {
    // Seed with an item already in the cart
    await seedAuthState(page, 'customer', {
      cartItems: [{
        id: 1,
        name: 'Jollof Rice & Chicken',
        price: 4500,
        image: '/images/meals/meal-jollof.png',
        quantity: 1,
      }],
      cartCount: 1,
    });

    await page.goto('/');
    await waitForAppShell(page);

    // Navigate to cart tab
    await page.getByRole('button', { name: 'Cart', exact: true }).click();
    await page.waitForTimeout(400);

    // CartTab renders an h1 "Your Cart"
    await expect(page.getByRole('heading', { name: /Your Cart/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('should open checkout', async ({ page }) => {
    await seedAuthState(page, 'customer', {
      cartItems: [{
        id: 1,
        name: 'Jollof Rice & Chicken',
        price: 4500,
        image: '/images/meals/meal-jollof.png',
        quantity: 1,
      }],
      cartCount: 1,
    });

    await page.goto('/');
    await waitForAppShell(page);

    // Go to cart tab
    await page.getByRole('button', { name: 'Cart', exact: true }).click();
    await page.waitForTimeout(400);

    // Click the Checkout button
    const checkoutBtn = page.getByRole('button', { name: /^Checkout/i }).first();
    await checkoutBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await checkoutBtn.click();
    await page.waitForTimeout(500);

    // CheckoutModal renders an h2 "Checkout"
    await expect(page.getByRole('heading', { name: /^Checkout$/i })).toBeVisible({ timeout: 8_000 });
  });

  test('should see prayer times modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Go to Profile tab and tap "Prayer Times"
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForTimeout(400);

    const prayerBtn = page.getByText('Prayer Times').first();
    await prayerBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await prayerBtn.click();
    await page.waitForTimeout(500);

    // PrayerTimesModal renders h2 "Prayer Times"
    await expect(page.getByRole('heading', { name: /^Prayer Times$/i })).toBeVisible({ timeout: 8_000 });
  });

  test('should view community forum', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Go to Profile tab and tap SwiftCommunity
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForTimeout(400);

    const communityBtn = page.getByText('SwiftCommunity').first();
    await communityBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await communityBtn.click();
    await page.waitForTimeout(500);

    // CommunityForum renders h2 "SwiftCommunity"
    await expect(page.getByRole('heading', { name: /SwiftCommunity/i })).toBeVisible({ timeout: 8_000 });
  });

  test('should open settings', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Go to Profile tab and tap Settings
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForTimeout(400);

    const settingsBtn = page.getByText('Settings', { exact: false }).first();
    await settingsBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await settingsBtn.click();
    await page.waitForTimeout(500);

    // SettingsModal renders h2 "Settings"
    await expect(page.getByRole('heading', { name: /^Settings$/i })).toBeVisible({ timeout: 8_000 });
  });
});
