'use client';

import { useAppStore, type TabId } from '@/lib/store';
import { Home, Compass, ShoppingCart, ClipboardList, Percent, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'offers', label: 'Offers', icon: Percent },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, cartCount } = useAppStore();

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
                className="absolute -top-1 w-6 h-1 bg-[#13ec13] rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative">
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${isActive ? 'text-[#13ec13]' : 'text-white/30'}`} />
              {tab.id === 'cart' && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 size-3.5 sm:size-4 bg-[#13ec13] text-[#05070A] text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className={`text-[8px] sm:text-[10px] font-bold tracking-wider ${isActive ? 'text-[#13ec13]' : 'text-white/30'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
