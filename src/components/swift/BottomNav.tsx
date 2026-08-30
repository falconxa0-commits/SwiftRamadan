'use client';

import { type TabId } from '@/lib/store';
import { useNavigation, useCartCount, useUserRole } from '@/lib/store-selectors';
import { Home, Compass, ShoppingCart, ClipboardList, Percent, User, Bike, Wallet, Store, Map, Settings, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics';

interface NavTab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const customerTabs: NavTab[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'reels', label: 'Reels', icon: Clapperboard },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'offers', label: 'Offers', icon: Percent },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'profile', label: 'Profile', icon: User },
];

const riderTabs: NavTab[] = [
  { id: 'rider-dashboard', label: 'Home', icon: Home },
  { id: 'rider-deliveries', label: 'Map', icon: Map },
  { id: 'rider-earnings', label: 'Earnings', icon: Wallet },
  { id: 'rider-profile', label: 'Profile', icon: User },
];

const vendorTabs: NavTab[] = [
  { id: 'vendor-dashboard', label: 'Home', icon: Home },
  { id: 'vendor-store', label: 'Menu', icon: Store },
  { id: 'vendor-earnings', label: 'Wallet', icon: Wallet },
  { id: 'vendor-profile', label: 'Profile', icon: Settings },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useNavigation();
  const cartCount = useCartCount();
  const userRole = useUserRole();

  const tabs = userRole === 'rider' ? riderTabs : userRole === 'vendor' ? vendorTabs : customerTabs;
  const accentColor = userRole === 'rider' ? '#38BDF8' : userRole === 'vendor' ? '#F5C451' : '#10E07A';
  const isCompact = tabs.length > 6; // tighter sizing when 7 tabs

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 w-[96%] sm:w-[92%] max-w-lg glass-effect h-16 sm:h-[72px] rounded-[1.75rem] sm:rounded-[2rem] flex items-center justify-between px-1.5 sm:px-2 border border-white/10 nav-glow z-50 [bottom:calc(0.75rem+env(safe-area-inset-bottom))] sm:[bottom:calc(1.25rem+env(safe-area-inset-bottom))]"
      aria-label="Primary"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              track('tab_switch', { tab: tab.id });
            }}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-2xl transition-colors duration-200"
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active pill background */}
            {isActive && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-1 rounded-2xl"
                style={{
                  background: `linear-gradient(180deg, ${accentColor}22 0%, ${accentColor}0A 100%)`,
                  border: `1px solid ${accentColor}33`,
                }}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
              />
            )}

            {/* Top accent dot */}
            {isActive && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute top-0.5 w-1 h-1 rounded-full"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}

            <div className="relative">
              <Icon
                className={`${isCompact ? 'w-[17px] h-[17px] sm:w-[19px] sm:h-[19px]' : 'w-[18px] h-[18px] sm:w-5 sm:h-5'} transition-all duration-200 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
                style={isActive ? { color: accentColor, filter: `drop-shadow(0 0 6px ${accentColor}80)` } : { color: 'rgba(255,255,255,0.32)' }}
              />
              {tab.id === 'cart' && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[var(--sr-customer)] text-[#04140C] text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(16,224,122,0.6)]">
                  {cartCount}
                </span>
              )}
            </div>
            <span
              className={`${isCompact ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'} font-bold tracking-wide transition-colors duration-200 ${
                isActive ? '' : 'text-white/32'
              }`}
              style={isActive ? { color: accentColor } : undefined}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
