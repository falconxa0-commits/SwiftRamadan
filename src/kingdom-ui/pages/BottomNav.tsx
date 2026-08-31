'use client';

/**
 * KingdomBottomNav — Auren Kingdom V2 primary navigation bar.
 *
 * Wraps the shared `RoyalNavigation` component from `kingdom-ui/components`
 * and adapts it to the live store (role + active tab + cart count).
 *
 * - Role-appropriate tabs (customer / vendor / rider)
 * - Active state via `useAppStore` (useNavigation)
 * - Cart count badge on the cart tab (driven by `useCartCount`)
 * - 56px touch targets (built into RoyalNavigation)
 * - Safe-area-inset aware (built into RoyalNavigation)
 *
 * The legacy `src/components/swift/BottomNav.tsx` is untouched.
 */

import { type TabId } from '@/lib/store';
import {
  useNavigation,
  useCartCount,
  useUserRole,
} from '@/lib/store-selectors';
import { track } from '@/lib/analytics';
import {
  Home,
  Compass,
  ShoppingCart,
  ClipboardList,
  Percent,
  User,
  Map,
  Wallet,
  Store,
  Settings,
  Clapperboard,
} from 'lucide-react';
import { RoyalNavigation } from '../components';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const customerTabs: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'reels', label: 'Reels', icon: Clapperboard },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'offers', label: 'Offers', icon: Percent },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'profile', label: 'Profile', icon: User },
];

const riderTabs: NavItem[] = [
  { id: 'rider-dashboard', label: 'Home', icon: Home },
  { id: 'rider-deliveries', label: 'Map', icon: Map },
  { id: 'rider-earnings', label: 'Earnings', icon: Wallet },
  { id: 'rider-profile', label: 'Profile', icon: User },
];

const vendorTabs: NavItem[] = [
  { id: 'vendor-dashboard', label: 'Home', icon: Home },
  { id: 'vendor-store', label: 'Menu', icon: Store },
  { id: 'vendor-earnings', label: 'Wallet', icon: Wallet },
  { id: 'vendor-profile', label: 'Profile', icon: Settings },
];

export function KingdomBottomNav() {
  const { activeTab, setActiveTab } = useNavigation();
  const cartCount = useCartCount();
  const userRole = useUserRole();

  const baseTabs: NavItem[] =
    userRole === 'rider' ? riderTabs : userRole === 'vendor' ? vendorTabs : customerTabs;

  // Inject live cart count badge onto the customer cart tab.
  const items: NavItem[] = baseTabs.map((tab) =>
    tab.id === 'cart' ? { ...tab, badge: cartCount } : tab,
  );

  const handleChange = (id: string) => {
    setActiveTab(id as TabId);
    track('tab_switch', { tab: id });
  };

  return (
    <RoyalNavigation
      items={items}
      active={activeTab}
      onChange={handleChange}
    />
  );
}
