'use client';

import { useState, useEffect, useMemo } from 'react';
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
import OnboardingFlow from '@/components/swift/OnboardingFlow';
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
import VendorStockControl from '@/components/swift/VendorStockControl';
import VendorPricingModal from '@/components/swift/VendorPricingModal';
import RiderPerformanceHub from '@/components/swift/RiderPerformanceHub';
import RiderSmartRouteModal from '@/components/swift/RiderSmartRouteModal';
import RiderPowerFinderModal from '@/components/swift/RiderPowerFinderModal';
import VendorProfileTab from '@/components/swift/VendorProfileTab';
import RiderDashboard from '@/components/swift/RiderDashboard';
import RiderEarningsHub from '@/components/swift/RiderEarningsHub';
import RiderDeliveryMap from '@/components/swift/RiderDeliveryMap';
import RiderProfileTab from '@/components/swift/RiderProfileTab';
import NewDeliveryRequestModal from '@/components/swift/NewDeliveryRequestModal';
import {
  Search,
  ShoppingBag,
  MapPin,
  User,
  Bell,
  Bike,
  Store,
  BarChart3,
  Package,
  ChevronDown,
  ArrowLeftRight,
} from 'lucide-react';

/* ──────────────────── Tab Mappings per Role ──────────────────── */

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
  'rider-profile': RiderProfileTab,
};

const vendorTabs: Record<string, React.ComponentType> = {
  'vendor-dashboard': VendorDashboard,
  'vendor-store': VendorStoreTab,
  'vendor-earnings': VendorWallet,
  'vendor-profile': VendorProfileTab,
};

/* ──────────────────── Role Config ──────────────────── */

const ROLE_CONFIG = {
  customer: {
    accent: '#13ec13',
    accentLight: 'rgba(19,236,19,0.15)',
    accentMid: 'rgba(19,236,19,0.30)',
    icon: User,
    defaultTab: 'home' as const,
  },
  vendor: {
    accent: '#FFD700',
    accentLight: 'rgba(255,215,0,0.15)',
    accentMid: 'rgba(255,215,0,0.30)',
    icon: Store,
    defaultTab: 'vendor-dashboard' as const,
  },
  rider: {
    accent: '#3b82f6',
    accentLight: 'rgba(59,130,246,0.15)',
    accentMid: 'rgba(59,130,246,0.30)',
    icon: Bike,
    defaultTab: 'rider-dashboard' as const,
  },
} as const;

/* ──────────────────── Page Transition Variants ──────────────────── */

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function Home() {
  const {
    activeTab,
    showWelcome,
    cartCount,
    userRole,
    userName,
    vendorStoreName,
    riderOnline,
    vendorOnline,
    isLoggedIn,
    showAuth,
    showOnboarding,
    onboardingComplete,
    setActiveTab,
    setShowAuth,
    userArea,
    riderCompletedToday,
  } = useAppStore();

  const [showNotifications, setShowNotifications] = useState(false);

  // Derived role helpers
  const isRider = userRole === 'rider';
  const isVendor = userRole === 'vendor';
  const isCustomer = userRole === 'customer';
  const roleConfig = ROLE_CONFIG[userRole];
  const accentColor = roleConfig.accent;

  // When role changes, switch to the appropriate default tab
  useEffect(() => {
    if (isRider) {
      setActiveTab('rider-dashboard');
    } else if (isVendor) {
      setActiveTab('vendor-dashboard');
    } else {
      setActiveTab('home');
    }
  }, [userRole, setActiveTab, isRider, isVendor]);

  // If user is not logged in and tries to access main app, redirect to auth
  useEffect(() => {
    if (!isLoggedIn && !showWelcome && !showAuth && !showOnboarding) {
      setShowAuth('login');
    }
  }, [isLoggedIn, showWelcome, showAuth, showOnboarding, setShowAuth]);

  // If user is logged in but hasn't completed onboarding, show onboarding
  useEffect(() => {
    if (isLoggedIn && !onboardingComplete && !showOnboarding && !showAuth) {
      useAppStore.getState().setShowOnboarding(true);
    }
  }, [isLoggedIn, onboardingComplete, showOnboarding, showAuth]);

  // Resolve active tab component based on role
  const tabMap = useMemo(
    () => ({
      ...customerTabs,
      ...riderTabs,
      ...vendorTabs,
    }),
    []
  );

  const ActiveTabComponent = tabMap[activeTab] || HomeTab;

  // ──── Greeting Logic ────
  const firstName = userName?.split(' ')[0] || 'there';
  const greeting = isRider
    ? 'Salam, Rider'
    : isVendor
      ? vendorStoreName || 'Your Store'
      : `Salam, ${firstName}`;

  const subtitle = isRider
    ? riderOnline
      ? `Online • ${riderCompletedToday} deliveries today`
      : 'Offline'
    : isVendor
      ? vendorOnline
        ? 'Online • Ramadan 2026'
        : 'Offline'
      : userArea
        ? `${userArea}, Lagos`
        : 'Lagos, Nigeria';

  const RoleIcon = roleConfig.icon;

  /* ──────────────────── Route: Welcome Screen ──────────────────── */

  if (showWelcome) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="h-screen w-full"
          style={{ background: '#030406' }}
        >
          <WelcomeScreen />
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ──────────────────── Route: Auth Screen (full-screen overlay) ──────────────────── */

  if (showAuth) {
    return (
      <div className="h-screen w-full relative" style={{ background: '#030406' }}>
        {/* Auth is rendered as a full-screen overlay */}
        <AuthScreen />

        {/* All modals still rendered underneath for smooth return */}
        <AllModals />
      </div>
    );
  }

  /* ──────────────────── Route: Onboarding Flow (full-screen) ──────────────────── */

  if (showOnboarding) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="onboarding"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="h-screen w-full"
          style={{ background: '#030406' }}
        >
          <OnboardingFlow />
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ──────────────────── Route: Main App ──────────────────── */

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-[#05070A]">
      {/* ──── Top App Bar ──── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sticky top-0 z-50 glass-effect border-b border-white/5"
      >
        {/* Role accent line */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
            opacity: 0.6,
          }}
        />

        <div className="flex items-center p-4 pb-2 justify-between">
          {/* Left: Avatar + Greeting */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="size-11 shrink-0 rounded-full flex items-center justify-center border"
              style={{
                backgroundColor: roleConfig.accentLight,
                borderColor: roleConfig.accentMid,
                boxShadow: isCustomer ? `0 0 12px ${accentColor}20` : 'none',
              }}
            >
              <RoleIcon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-white text-base font-bold leading-tight tracking-tight truncate">
                {greeting}
              </h2>
              <div className="flex items-center gap-1.5">
                {/* Online/Offline indicator for rider/vendor */}
                {(isRider || isVendor) && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        riderOnline || vendorOnline ? '#13ec13' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                )}
                {/* Location pin for customers */}
                {isCustomer && <MapPin className="w-3 h-3 text-[#13ec13] shrink-0" />}
                <span className="text-white/50 text-[11px] font-medium truncate">{subtitle}</span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-2 shrink-0">
            {/* Role Switcher Button */}
            <button
              onClick={() => setShowAuth('role')}
              className="flex size-9 items-center justify-center rounded-full bg-[#1A1D26] border border-white/10 hover:border-white/20 transition-colors"
              title="Switch role"
            >
              <ArrowLeftRight className="w-4 h-4 text-white/60" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="flex size-11 items-center justify-center rounded-full bg-[#1A1D26] border border-white/10 relative"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 size-2 bg-[#FFD700] rounded-full border border-[#05070A]" />
            </button>

            {/* Customer: Cart icon */}
            {isCustomer && (
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

            {/* Rider: New Delivery Request */}
            {isRider && (
              <button
                onClick={() => useAppStore.getState().setActiveModal('new-delivery')}
                className="flex size-11 items-center justify-center rounded-full border"
                style={{
                  backgroundColor: roleConfig.accentLight,
                  borderColor: roleConfig.accentMid,
                }}
              >
                <Package className="w-5 h-5" style={{ color: accentColor }} />
              </button>
            )}

            {/* Vendor: Insights Button */}
            {isVendor && (
              <button
                onClick={() => useAppStore.getState().setActiveModal('vendor-insights')}
                className="flex size-11 items-center justify-center rounded-full border"
                style={{
                  backgroundColor: roleConfig.accentLight,
                  borderColor: roleConfig.accentMid,
                }}
              >
                <BarChart3 className="w-5 h-5" style={{ color: accentColor }} />
              </button>
            )}
          </div>
        </div>

        {/* Search bar - only for customers */}
        <AnimatePresence>
          {isCustomer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3">
                <button
                  onClick={() => useAppStore.getState().setShowSearch(true)}
                  className="flex w-full items-center rounded-full h-12 bg-[#1A1D26] border border-white/5 focus-within:border-[#13ec13]/30 transition-all duration-300"
                >
                  <Search className="w-5 h-5 text-[#13ec13]/70 ml-4 shrink-0" />
                  <span className="flex-1 text-left text-white/30 text-sm px-4 pl-2">
                    Search Jollof, Groceries, or Boxes...
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rider: Online/Offline Toggle Bar */}
        <AnimatePresence>
          {isRider && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between p-3 bg-[#1A1D26] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4" style={{ color: accentColor }} />
                    <span className="text-white text-sm font-medium">
                      {riderOnline ? 'You are Online' : 'You are Offline'}
                    </span>
                  </div>
                  <button
                    onClick={() => useAppStore.getState().setRiderOnline(!riderOnline)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                      riderOnline ? 'bg-[#13ec13]' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{ x: riderOnline ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vendor: Online/Offline Toggle Bar */}
        <AnimatePresence>
          {isVendor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between p-3 bg-[#1A1D26] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4" style={{ color: accentColor }} />
                    <span className="text-white text-sm font-medium">
                      {vendorOnline ? 'Store is Open' : 'Store is Closed'}
                    </span>
                  </div>
                  <button
                    onClick={() => useAppStore.getState().setVendorOnline(!vendorOnline)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                      vendorOnline ? 'bg-[#FFD700]' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{ x: vendorOnline ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ──── Tab Content with Ultra-Smooth Transitions ──── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-1 flex flex-col overflow-y-auto"
        >
          <ActiveTabComponent />
        </motion.div>
      </AnimatePresence>

      {/* ──── Floating Bottom Navigation ──── */}
      <BottomNav />

      {/* ──── AI Chat Widget (customers only) ──── */}
      {isCustomer && <AIChatWidget />}

      {/* ──── Notification Center ──── */}
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* ──── Search Overlay (customers only) ──── */}
      {isCustomer && <SearchOverlay />}

      {/* ──── Product Detail Modal ──── */}
      <ProductDetailModal />

      {/* ──── All App Modals ──── */}
      <AllModals />

      {/* ──── Bottom gradient fade ──── */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#05070A] to-transparent pointer-events-none z-40" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ALL MODALS - Extracted for reuse across routes
   ══════════════════════════════════════════════════════════════════ */

function AllModals() {
  return (
    <>
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
      <VendorStockControl />
      <VendorPricingModal />
      <RiderPerformanceHub />
      <RiderSmartRouteModal />
      <RiderPowerFinderModal />
    </>
  );
}
