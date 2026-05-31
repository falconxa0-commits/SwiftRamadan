'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import BottomNav from '@/components/swift/BottomNav';
import WelcomeScreen from '@/components/swift/WelcomeScreen';
import HomeTab from '@/components/swift/HomeTab';
import ExploreTab from '@/components/swift/ExploreTab';
import OrdersTab from '@/components/swift/OrdersTab';
import OffersTab from '@/components/swift/OffersTab';
import ProfileTab from '@/components/swift/ProfileTab';
import AIChatWidget from '@/components/swift/AIChatWidget';
import NotificationCenter from '@/components/swift/NotificationCenter';
import ProductDetailModal from '@/components/swift/ProductDetailModal';
import { Search, ShoppingBag, MapPin, User, Bell } from 'lucide-react';

const tabComponents: Record<string, React.ComponentType> = {
  home: HomeTab,
  explore: ExploreTab,
  cart: OrdersTab,
  orders: OffersTab,
  profile: ProfileTab,
};

export default function Home() {
  const { activeTab, showWelcome } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const ActiveTabComponent = tabComponents[activeTab] || HomeTab;

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-[#05070A]">
      {/* Top App Bar */}
      <div className="sticky top-0 z-50 glass-effect border-b border-white/5">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 shrink-0 bg-[#13ec13]/20 rounded-full flex items-center justify-center border border-[#13ec13]/30 green-glow">
              <User className="w-5 h-5 text-[#13ec13]" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-base font-bold leading-tight tracking-tight">Salam, Bolaji</h2>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#13ec13]" />
                <span className="text-white/50 text-[11px] font-medium">Lekki Phase 1, Lagos</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="flex size-11 items-center justify-center rounded-full bg-[#1A1D26] border border-white/10 relative"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 size-2 bg-[#FFD700] rounded-full border border-[#05070A]" />
            </button>
            <button className="flex size-11 items-center justify-center rounded-full bg-[#1A1D26] border border-white/10 relative">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 size-2 bg-[#13ec13] rounded-full border border-[#05070A]" />
            </button>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="flex w-full items-center rounded-full h-12 bg-[#1A1D26] border border-white/5 focus-within:border-[#13ec13]/30 transition-all duration-300">
            <Search className="w-5 h-5 text-[#13ec13]/70 ml-4 shrink-0" />
            <input
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-white focus:outline-none border-none bg-transparent h-full placeholder:text-white/30 px-4 pl-2 text-sm font-normal"
              placeholder="Search Jollof, Groceries, or Boxes..."
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="flex-1 flex flex-col overflow-y-auto"
        >
          <ActiveTabComponent />
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Notification Center */}
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Product Detail Modal */}
      <ProductDetailModal />

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#05070A] to-transparent pointer-events-none z-40" />
    </div>
  );
}
