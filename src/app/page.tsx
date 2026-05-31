'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import BottomNav from '@/components/swift/BottomNav';
import WelcomeScreen from '@/components/swift/WelcomeScreen';
import HomeTab from '@/components/swift/HomeTab';
import ExploreTab from '@/components/swift/ExploreTab';
import CartTab from '@/components/swift/CartTab';
import OrdersTab from '@/components/swift/OrdersTab';
import OffersTab from '@/components/swift/OffersTab';
import ProfileTab from '@/components/swift/ProfileTab';
import AIChatWidget from '@/components/swift/AIChatWidget';
import NotificationCenter from '@/components/swift/NotificationCenter';
import ProductDetailModal from '@/components/swift/ProductDetailModal';
import SearchOverlay from '@/components/swift/SearchOverlay';
import AuthScreen from '@/components/swift/AuthScreen';
import PrayerTimesModal from '@/components/swift/PrayerTimesModal';
import SahurWakeUpModal from '@/components/swift/SahurWakeUpModal';
import GroupBuyModal from '@/components/swift/GroupBuyModal';
import VoiceShoppingModal from '@/components/swift/VoiceShoppingModal';
import GiftCardModal from '@/components/swift/GiftCardModal';
import MosqueSadaqahModal from '@/components/swift/MosqueSadaqahModal';
import ReferEarnModal from '@/components/swift/ReferEarnModal';
import CharityZakatModal from '@/components/swift/CharityZakatModal';
import PartyBulkModal from '@/components/swift/PartyBulkModal';
import RecipesModal from '@/components/swift/RecipesModal';
import CheckoutModal from '@/components/swift/CheckoutModal';
import RewardsModal from '@/components/swift/RewardsModal';
import BNPLModal from '@/components/swift/BNPLModal';
import DeliveryLocationMap from '@/components/swift/DeliveryLocationMap';
import LiveTrackingMap from '@/components/swift/LiveTrackingMap';
import CommunityForum from '@/components/swift/CommunityForum';
import ArtisanMarketHub from '@/components/swift/ArtisanMarketHub';
import EcoImpactReport from '@/components/swift/EcoImpactReport';
import VendorDashboard from '@/components/swift/VendorDashboard';
import VendorWallet from '@/components/swift/VendorWallet';
import VendorStoreTab from '@/components/swift/VendorStoreTab';
import VendorSalesInsights from '@/components/swift/VendorSalesInsights';
import RiderDashboard from '@/components/swift/RiderDashboard';
import RiderEarningsHub from '@/components/swift/RiderEarningsHub';
import RiderDeliveryMap from '@/components/swift/RiderDeliveryMap';
import NewDeliveryRequestModal from '@/components/swift/NewDeliveryRequestModal';
import { Search, ShoppingBag, MapPin, User, Bell, Bike, Store } from 'lucide-react';

const customerTabs: Record<string, React.ComponentType> = {
  home: HomeTab,
  explore: ExploreTab,
  cart: CartTab,
  orders: OrdersTab,
  offers: OffersTab,
  profile: ProfileTab,
};

const riderTabs: Record<string, React.ComponentType> = {
  'rider-dashboard': RiderDashboard,
  'rider-earnings': RiderEarningsHub,
  'rider-deliveries': RiderDeliveryMap,
  'rider-profile': ProfileTab,
};

const vendorTabs: Record<string, React.ComponentType> = {
  'vendor-dashboard': VendorDashboard,
  'vendor-orders': VendorDashboard,
  'vendor-earnings': VendorWallet,
  'vendor-store': VendorStoreTab,
};

export default function Home() {
  const { activeTab, showWelcome, cartCount, userRole, userName, vendorStoreName, riderOnline, vendorOnline } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const allTabs = { ...customerTabs, ...riderTabs, ...vendorTabs };
  const ActiveTabComponent = allTabs[activeTab] || HomeTab;

  const isRider = userRole === 'rider';
  const isVendor = userRole === 'vendor';

  const displayName = isVendor ? vendorStoreName : (userName || 'Bolaji');
  const greeting = isRider ? 'Salam, Rider' : isVendor ? displayName : `Salam, ${displayName.split(' ')[0]}`;
  const subtitle = isRider ? (riderOnline ? 'Online • Lagos' : 'Offline') : isVendor ? (vendorOnline ? 'Online • Ramadan 2026' : 'Offline') : 'Lekki Phase 1, Lagos';

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-[#05070A]">
      {/* Top App Bar */}
      <div className="sticky top-0 z-50 glass-effect border-b border-white/5">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-11 shrink-0 rounded-full flex items-center justify-center border ${
              isRider
                ? 'bg-[#3b82f6]/20 border-[#3b82f6]/30'
                : isVendor
                  ? 'bg-[#FFD700]/20 border-[#FFD700]/30'
                  : 'bg-[#13ec13]/20 border-[#13ec13]/30 green-glow'
            }`}>
              {isRider ? (
                <Bike className="w-5 h-5 text-[#3b82f6]" />
              ) : isVendor ? (
                <Store className="w-5 h-5 text-[#FFD700]" />
              ) : (
                <User className="w-5 h-5 text-[#13ec13]" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-base font-bold leading-tight tracking-tight">{greeting}</h2>
              <div className="flex items-center gap-1">
                {(isRider || isVendor) && (
                  <span className={`w-2 h-2 rounded-full ${riderOnline || vendorOnline ? 'bg-[#13ec13]' : 'bg-white/30'}`} />
                )}
                {!isRider && !isVendor && <MapPin className="w-3 h-3 text-[#13ec13]" />}
                <span className="text-white/50 text-[11px] font-medium">{subtitle}</span>
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
            {!isRider && !isVendor && (
              <button
                onClick={() => useAppStore.getState().setActiveTab('cart')}
                className="flex size-11 items-center justify-center rounded-full bg-[#1A1D26] border border-white/10 relative"
              >
                <ShoppingBag className="w-5 h-5 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 bg-[#13ec13] text-[#05070A] text-[8px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            {isRider && (
              <button
                onClick={() => useAppStore.getState().setActiveModal('new-delivery')}
                className="flex size-11 items-center justify-center rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30"
              >
                <Bike className="w-5 h-5 text-[#3b82f6]" />
              </button>
            )}
          </div>
        </div>
        {/* Search bar - only for customers */}
        {!isRider && !isVendor && (
          <div className="px-4 py-3">
            <button
              onClick={() => useAppStore.getState().setShowSearch(true)}
              className="flex w-full items-center rounded-full h-12 bg-[#1A1D26] border border-white/5 focus-within:border-[#13ec13]/30 transition-all duration-300"
            >
              <Search className="w-5 h-5 text-[#13ec13]/70 ml-4 shrink-0" />
              <span className="flex-1 text-left text-white/30 text-sm px-4 pl-2">Search Jollof, Groceries, or Boxes...</span>
            </button>
          </div>
        )}
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

      {/* Search Overlay */}
      <SearchOverlay />

      {/* Auth Screen Overlay */}
      <AuthScreen />

      {/* App Modals */}
      <PrayerTimesModal />
      <SahurWakeUpModal />
      <GroupBuyModal />
      <VoiceShoppingModal />
      <GiftCardModal />
      <MosqueSadaqahModal />
      <ReferEarnModal />
      <CharityZakatModal />
      <PartyBulkModal />
      <RecipesModal />
      <CheckoutModal />
      <RewardsModal />
      <BNPLModal />
      <DeliveryLocationMap />
      <LiveTrackingMap />
      <CommunityForum />
      <ArtisanMarketHub />
      <EcoImpactReport />
      <VendorSalesInsights />
      <NewDeliveryRequestModal />

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#05070A] to-transparent pointer-events-none z-40" />
    </div>
  );
}
