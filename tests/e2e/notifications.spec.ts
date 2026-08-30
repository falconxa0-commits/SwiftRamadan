import { test, expect } from '@playwright/test';
import { seedAuthState, waitForAppShell } from './helpers';

/**
 * NOTIFICATIONS — 5 E2E tests
 *
 * The NotificationCenter is a slide-in panel mounted by `src/app/page.tsx`
 * when `showNotifications` is true (toggled by the bell icon button in
 * the top app bar). It fetches `/api/notifications` on open and falls
 * back to a hardcoded list on network failure. We use `page.route()` to
 * mock the API so the panel always shows a deterministic set of
 * unread + read notifications.
 */

/** Mock the /api/notifications GET response with a fixed payload. */
async function mockNotifications(page: import('@playwright/test').Page, unreadCount: number) {
  await page.route('**/api/notifications', async (route) => {
    const notifications = [
      { id: 1, title: 'Order Confirmed!', message: 'Your Ramadan Family Box is being prepared.', time: '2 min ago', read: false, type: 'order' },
      { id: 2, title: 'Flash Sale Alert', message: '30% off all Dates & Fruit Boxes - 1 hour left!', time: '15 min ago', read: false, type: 'promo' },
      { id: 3, title: 'Iftar Reminder', message: 'Maghrib is at 6:45 PM. Order your Iftar now!', time: '1 hr ago', read: unreadCount < 3, type: 'reminder' },
      { id: 4, title: 'SwiftRewards', message: "You've earned 500 points from your last order!", time: '3 hrs ago', read: true, type: 'reward' },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ notifications, unreadCount }),
    });
  });
}

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthState(page, 'customer');
  });

  test('should open notification center', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // Click the bell icon (aria-label="Notifications") in the top bar.
    const bell = page.getByRole('button', { name: 'Notifications' }).first();
    await bell.click();
    await page.waitForTimeout(500);

    // NotificationCenter renders an h2 "Notifications".
    await expect(page.getByRole('heading', { name: /^Notifications$/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should show notification badge', async ({ page }) => {
    await mockNotifications(page, 3);

    await page.goto('/');
    await waitForAppShell(page);

    // Open the notification center.
    await page.getByRole('button', { name: 'Notifications' }).first().click();
    await page.waitForTimeout(800);

    // The header h2 "Notifications" should be accompanied by an
    // unread-count badge (a small green pill with the number 3).
    const badge = page.locator('span').filter({ hasText: /^3$/ }).first();
    await expect(badge).toBeVisible({ timeout: 10_000 });
  });

  test('should mark notifications as read', async ({ page }) => {
    await mockNotifications(page, 2);

    await page.goto('/');
    await waitForAppShell(page);

    // Open the notification center.
    await page.getByRole('button', { name: 'Notifications' }).first().click();
    await page.waitForTimeout(800);

    // The "Mark all read" button is rendered when unreadCount > 0.
    const markAllRead = page.getByRole('button', { name: /Mark all read/i }).first();
    await expect(markAllRead).toBeVisible({ timeout: 10_000 });
    await markAllRead.click();
    await page.waitForTimeout(500);

    // After marking all as read, the unread badge (a small green
    // pill containing a digit) must be gone — the component hides
    // the badge when unreadCount is 0.
    await expect(page.locator('span').filter({ hasText: /^[1-9]\d*$/ }).first()).toHaveCount(0);

    // The "Mark all read" button is also hidden when there's
    // nothing left to mark.
    await expect(markAllRead).toHaveCount(0);
  });

  test('should clear notifications', async ({ page }) => {
    await mockNotifications(page, 3);

    await page.goto('/');
    await waitForAppShell(page);

    // Open the notification center.
    await page.getByRole('button', { name: 'Notifications' }).first().click();
    await page.waitForTimeout(800);

    // The panel lists notifications. Clicking one marks that single
    // notification as read (the local `unreadCount` derived value
    // decrements from 3 to 2).
    const firstNotif = page.getByText('Order Confirmed!').first();
    await firstNotif.waitFor({ state: 'visible', timeout: 10_000 });
    await firstNotif.click();
    await page.waitForTimeout(400);

    // After clicking one notification, the unread-count badge
    // decrements from 3 to 2.
    const badge = page.locator('span').filter({ hasText: /^2$/ }).first();
    await expect(badge).toBeVisible({ timeout: 5_000 });
  });

  test('should close notification center', async ({ page }) => {
    await mockNotifications(page, 0);

    await page.goto('/');
    await waitForAppShell(page);

    // Open the notification center.
    await page.getByRole('button', { name: 'Notifications' }).first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: /^Notifications$/i })).toBeVisible({ timeout: 10_000 });

    // Click the close (X) button inside the panel header.
    // The X button is the only button inside the panel header that
    // is purely an icon — we locate it by its parent (the panel
    // header) and click the last button in that row.
    const notifHeading = page.getByRole('heading', { name: /^Notifications$/i });
    const panelHeader = notifHeading.locator('xpath=ancestor::div[contains(@class,"border-b")]');
    const closeBtn = panelHeader.locator('button').last();
    await closeBtn.click();
    await page.waitForTimeout(700);

    // The Notifications h2 must be gone after closing.
    await expect(page.getByRole('heading', { name: /^Notifications$/i })).toHaveCount(0);
  });
});
