/**
 * Zustand store unit tests — `src/lib/store.ts`.
 *
 * Verifies the contract documented in the store:
 *  - Initial state (activeTab='home', cartItems=[], isLoggedIn=false, etc.).
 *  - Cart mutation methods (addToCart / removeFromCart / updateQuantity / clearCart).
 *  - The cartCount selector tracks the sum of item quantities (not item count).
 *  - Tab / modal / auth / role setters update the relevant slice.
 *  - Wishlist toggle is idempotent (adds if missing, removes if present).
 *  - The persist layer is configured correctly: key 'swiftramadan-store',
 *    and the `partialize` excludes PII (userEmail / userPhone) and financial
 *    data (vendorBalance / riderEarnings) so it never lands in localStorage.
 *
 * Vitest + jsdom environment (configured in `vitest.config.ts`). The store
 * uses `zustand/middleware`'s `persist`, which stores to localStorage under
 * the `swiftramadan-store` key. We isolate tests by clearing localStorage
 * in `beforeEach` and creating a fresh store instance via `vi.resetModules()`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper: dynamically re-import the store so each test starts from a clean
// slate (zustand persist would otherwise hydrate from localStorage between
// tests, and the singleton would carry state from the previous test).
async function freshStore() {
  vi.resetModules();
  localStorage.clear();
  const mod = await import('@/lib/store');
  return mod.useAppStore;
}

describe('useAppStore (Zustand store)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('has the correct initial state', async () => {
    const useAppStore = await freshStore();
    const s = useAppStore.getState();
    expect(s.activeTab).toBe('home');
    expect(s.cartItems).toEqual([]);
    expect(s.cartCount).toBe(0);
    expect(s.isLoggedIn).toBe(false);
    expect(s.userRole).toBe('customer');
    expect(s.activeModal).toBeNull();
    expect(s.showWelcome).toBe(true);
    expect(s.wishlist).toEqual([]);
  });

  it('addToCart adds a new item and updates cartCount', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().addToCart({
      id: 'p1',
      name: 'Jollof Rice',
      price: 2500,
      image: '/img.jpg',
    });
    const s = useAppStore.getState();
    expect(s.cartItems).toHaveLength(1);
    expect(s.cartItems[0]).toMatchObject({ id: 'p1', quantity: 1 });
    expect(s.cartCount).toBe(1);
  });

  it('addToCart increments quantity when the same item is added again', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    const s = useAppStore.getState();
    expect(s.cartItems).toHaveLength(1);
    expect(s.cartItems[0].quantity).toBe(2);
    expect(s.cartCount).toBe(2);
  });

  it('removeFromCart removes the item by id', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    useAppStore.getState().addToCart({ id: 'p2', name: 'B', price: 200, image: '' });
    useAppStore.getState().removeFromCart('p1');
    const s = useAppStore.getState();
    expect(s.cartItems.find((c) => c.id === 'p1')).toBeUndefined();
    expect(s.cartItems).toHaveLength(1);
    expect(s.cartCount).toBe(1);
  });

  it('updateQuantity updates the quantity for a given item', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    useAppStore.getState().updateQuantity('p1', 5);
    const s = useAppStore.getState();
    expect(s.cartItems[0].quantity).toBe(5);
    expect(s.cartCount).toBe(5);
  });

  it('updateQuantity with qty<=0 removes the item', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    useAppStore.getState().updateQuantity('p1', 0);
    const s = useAppStore.getState();
    expect(s.cartItems).toHaveLength(0);
    expect(s.cartCount).toBe(0);
  });

  it('clearCart empties cartItems and resets cartCount', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    useAppStore.getState().addToCart({ id: 'p2', name: 'B', price: 200, image: '' });
    useAppStore.getState().clearCart();
    const s = useAppStore.getState();
    expect(s.cartItems).toEqual([]);
    expect(s.cartCount).toBe(0);
  });

  it('setActiveTab changes the active tab', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().setActiveTab('cart');
    expect(useAppStore.getState().activeTab).toBe('cart');
  });

  it('setActiveModal changes the active modal', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().setActiveModal('recipes');
    expect(useAppStore.getState().activeModal).toBe('recipes');
    useAppStore.getState().setActiveModal(null);
    expect(useAppStore.getState().activeModal).toBeNull();
  });

  it('setIsLoggedIn sets the login state', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().setIsLoggedIn(true);
    expect(useAppStore.getState().isLoggedIn).toBe(true);
  });

  it('setUserRole sets the role', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().setUserRole('vendor');
    expect(useAppStore.getState().userRole).toBe('vendor');
  });

  it('setUserRole accepts customer / vendor / rider', async () => {
    const useAppStore = await freshStore();
    for (const role of ['customer', 'vendor', 'rider'] as const) {
      useAppStore.getState().setUserRole(role);
      expect(useAppStore.getState().userRole).toBe(role);
    }
  });

  it('cartCount tracks the sum of cartItems quantities (not item count)', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    useAppStore.getState().addToCart({ id: 'p1', name: 'A', price: 100, image: '' });
    useAppStore.getState().addToCart({ id: 'p2', name: 'B', price: 200, image: '' });
    useAppStore.getState().updateQuantity('p2', 4);
    // p1 has qty 2, p2 has qty 4 → cartCount = 6, items = 2
    const s = useAppStore.getState();
    expect(s.cartItems).toHaveLength(2);
    expect(s.cartCount).toBe(6);
  });

  it('toggleWishlist adds when missing and removes when present', async () => {
    const useAppStore = await freshStore();
    useAppStore.getState().toggleWishlist(101);
    expect(useAppStore.getState().wishlist).toContain(101);
    useAppStore.getState().toggleWishlist(101);
    expect(useAppStore.getState().wishlist).not.toContain(101);
  });

  it('setShowWelcome toggles the welcome flag', async () => {
    const useAppStore = await freshStore();
    expect(useAppStore.getState().showWelcome).toBe(true);
    useAppStore.getState().setShowWelcome(false);
    expect(useAppStore.getState().showWelcome).toBe(false);
  });

  it('partialize excludes userEmail / userPhone / financial data (PII never persisted)', async () => {
    const useAppStore = await freshStore();
    // Set values that should NOT be persisted.
    useAppStore.getState().setUserEmail('secret@example.com');
    useAppStore.getState().setUserPhone('+2348012345678');
    useAppStore.getState().setVendorBalance(50000);
    useAppStore.getState().setRiderEarnings(25000);

    // Trigger a persist write by changing a persisted field.
    useAppStore.getState().setIsLoggedIn(true);

    // Wait a tick for zustand persist to flush to localStorage.
    await Promise.resolve();

    const raw = localStorage.getItem('swiftramadan-store');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state).toBeDefined();
    const persisted = parsed.state;

    // Persisted fields:
    expect(persisted.isLoggedIn).toBe(true);

    // Excluded fields (PII + financial):
    expect(persisted).not.toHaveProperty('userEmail');
    expect(persisted).not.toHaveProperty('userPhone');
    expect(persisted).not.toHaveProperty('vendorBalance');
    expect(persisted).not.toHaveProperty('riderEarnings');
    expect(persisted).not.toHaveProperty('vendorPendingSettlement');
    expect(persisted).not.toHaveProperty('vendorTotalEarnings');
    expect(persisted).not.toHaveProperty('vendorBusinessAddress');
  });

  it('persist key is "swiftramadan-store"', async () => {
    const useAppStore = await freshStore();
    // Trigger a write.
    useAppStore.getState().setIsLoggedIn(true);
    await Promise.resolve();
    const keys = Object.keys(localStorage);
    expect(keys).toContain('swiftramadan-store');
  });
});
