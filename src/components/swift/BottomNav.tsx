'use client';

import { useAppStore, type TabId } from '@/lib/store';
import { Home, Compass, ShoppingCart, ClipboardList, Percent, User, Bike, Wallet, Store, Map, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavTab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const customerTabs: NavTab[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'offers', label: 'Offers', icon: Percent },
  { id: 'profile', label: 'Profile', icon: User },
];

const riderTabs: NavTab[] = [
  { id: 'rider-dashboard', label: 'Home', icon: Home },
  { id: 'rider-deliveries', label: 'Map', icon: Map },
  { id: 'rider-earnings', label: 'Earnings', icon: Wallet },
  { id: 'rider-profile', label: 'Profile', icon: User },
];

const vendorTabs: NavTab[] = [
  { id: 'vendor-dashboard', label: 'Orders', icon: ClipboardList },
  { id: 'vendor-store', label: 'Menu', icon: Store },
  { id: 'vendor-earnings', label: 'Wallet', icon: Wallet },
  { id: 'vendor-profile', label: 'Profile', icon: Settings },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, cartCount, userRole } = useAppStore();

  const tabs = userRole === 'rider' ? riderTabs : userRole === 'vendor' ? vendorTabs : customerTabs;
  const accentColor = userRole === 'rider' ? '#3b82f6' : userRole === 'vendor' ? '#FFD700' : '#13ec13';

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-lg glass-effect h-16 sm:h-20 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-between px-4 sm:px-8 border border-white/10 nav-glow z-50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-0.5 relative"
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 w-6 h-1 rounded-full"
                style={{ backgroundColor: accentColor }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative">
              <Icon
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${
                  isActive ? '' : 'text-white/30'
                }`}
                style={isActive ? { color: accentColor } : undefined}
              />
              {tab.id === 'cart' && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 size-3.5 sm:size-4 bg-[#13ec13] text-[#05070A] text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span
              className={`text-[8px] sm:text-[10px] font-bold tracking-wider ${
                isActive ? '' : 'text-white/30'
              }`}
              style={isActive ? { color: accentColor } : undefined}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
