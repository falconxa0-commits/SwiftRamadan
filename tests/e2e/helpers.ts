/**
 * Shared E2E test helpers — SwiftRamadan
 *
 * The app uses a Zustand store persisted to localStorage under the key
 * `swiftramadan-store`. By seeding that key before the page loads we can
 * bypass the Welcome / Auth / Onboarding flows and start directly inside
 * the main app as a customer, vendor, or rider.
 */

import type { Page } from '@playwright/test';

export type Role = 'customer' | 'vendor' | 'rider';

interface SeedState {
  showWelcome: boolean;
  isLoggedIn: boolean;
  onboardingComplete: boolean;
  userRole: Role;
  userName: string;
  userArea: string;
  vendorStoreName?: string;
  vendorBusinessCategory?: string;
  riderOnline?: boolean;
  riderVehicleType?: string;
  cartItems?: unknown[];
  cartCount?: number;
}

const STORAGE_KEY = 'swiftramadan-store';

function buildPersistedState(state: SeedState) {
  return {
    state: {
      // Persisted fields (see `partialize` in src/lib/store.ts)
      showWelcome: state.showWelcome,
      cartItems: state.cartItems ?? [],
      cartCount: state.cartCount ?? 0,
      wishlist: [],
      isLoggedIn: state.isLoggedIn,
      userName: state.userName,
      userAvatar: '',
      userRole: state.userRole,
      userArea: state.userArea,
      onboardingComplete: state.onboardingComplete,
      hasanatPoints: 0,
      swiftPoints: 0,
      loyaltyTier: 'bronze',
      dailyStreak: 0,
      orders: [],
      deliveryAddress: '',
      groupBuySlots: {},
      referralCode: '',
      referralCount: 0,
      sahurAlarmTime: '04:30',
      sahurAlarmEnabled: false,
      riderOnline: state.riderOnline ?? false,
      vendorOnline: false,
      vendorStoreName: state.vendorStoreName ?? '',
      vendorBusinessCategory: state.vendorBusinessCategory ?? '',
      riderVehicleType: state.riderVehicleType ?? '',
      riderPlateNumber: '',
      customerDietaryPrefs: [],
      customerFavoriteCategories: [],
      lastSpinDate: '',
      spinStreak: 0,
      pendingRewards: [],
    },
    version: 1,
  };
}

/** Inject auth state into localStorage before the page loads. */
export async function seedAuthState(page: Page, role: Role, overrides: Partial<SeedState> = {}) {
  const base: SeedState = {
    showWelcome: false,
    isLoggedIn: true,
    onboardingComplete: true,
    userRole: role,
    userName:
      role === 'customer' ? 'Test Customer'
        : role === 'vendor' ? 'Test Vendor'
          : 'Test Rider',
    userArea: 'Lagos',
    ...(role === 'vendor' ? { vendorStoreName: 'Test Store', vendorBusinessCategory: 'Iftar Meals' } : {}),
    ...(role === 'rider' ? { riderOnline: false, riderVehicleType: 'Motorcycle' } : {}),
    ...overrides,
  };

  const payload = buildPersistedState(base);

  await page.addInitScript((args: { key: string; value: unknown }) => {
    try {
      window.localStorage.setItem(args.key, JSON.stringify(args.value));
    } catch {
      // ignore — some test contexts may block localStorage
    }
  }, { key: STORAGE_KEY, value: payload });
}

/** Clear all SwiftRamadan-related localStorage entries. */
export async function clearAuthState(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem('swiftramadan-store');
      window.localStorage.removeItem('swiftramadan-theme');
      window.localStorage.removeItem('search-history');
    } catch {
      // ignore
    }
  });
}

/**
 * Wait for the main app shell to be visible (top header with role accent).
 * The header is rendered for every authenticated role.
 */
export async function waitForAppShell(page: Page, opts: { timeout?: number } = {}) {
  const timeout = opts.timeout ?? 15_000;
  await page.waitForLoadState('domcontentloaded', { timeout });
  // The header has the greeting text — wait for it to appear.
  await page.locator('header').first().waitFor({ state: 'visible', timeout });
}

/**
 * Open a global modal by setting `activeModal` on the Zustand store.
 * Requires the dev-only `window.__swiftramadanStore` hook exposed in
 * `src/lib/store.ts`. Use this for modals that aren't directly triggered
 * by an obvious UI button (e.g., the global PayoutModal from a rider
 * context).
 */
export async function openModalViaStore(page: Page, modal: string) {
  await page.waitForFunction(
    (m: string) => !!(window as unknown as { __swiftramadanStore?: unknown }).__swiftramadanStore,
    modal,
    { timeout: 10_000 }
  );
  await page.evaluate((m: string) => {
    const w = window as unknown as {
      __swiftramadanStore?: {
        getState: () => { setActiveModal: (m: string | null) => void };
      };
    };
    w.__swiftramadanStore?.getState().setActiveModal(m);
  }, modal);
}

