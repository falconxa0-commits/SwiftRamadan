'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  useAppStore,
  useActiveTab,
  useCartCount,
  useIsLoggedIn,
  useUserName,
  useUserRole,
  useUserArea,
  useNavigation,
  useOnboarding,
  useVendor,
  useRider,
} from '@/lib/store-selectors';
import {
  getTabDirection,
  createDirectionalVariants,
  springConfig,
  screenVariants,
  screenTransition,
} from '@/components/swift/PageTransition';
import BottomNav from '@/components/swift/BottomNav';
import WelcomeScreen from '@/components/swift/WelcomeScreen';
import HomeTab from '@/components/swift/HomeTab';
import ExploreTab from '@/components/swift/ExploreTab';
import CartTab from '@/components/swift/CartTab';
import OrdersTab from '@/components/swift/OrdersTab';
import OffersTab from '@/components/swift/OffersTab';
import ProfileTab from '@/components/swift/ProfileTab';
import ReelsTab from '@/components/swift/ReelsTab';
import SafaAIAssistant from '@/components/swift/SafaAIAssistant';
import AIAgentButton from '@/components/swift/AIAgentButton';
import NotificationCenter from '@/components/swift/NotificationCenter';
import ModalErrorBoundary from '@/components/swift/ModalErrorBoundary';
import SearchOverlay from '@/components/swift/SearchOverlay';
import AuthScreen from '@/components/swift/AuthScreen';
import OnboardingFlow from '@/components/swift/OnboardingFlow';
import VendorDashboard from '@/components/swift/VendorDashboard';
import VendorWallet from '@/components/swift/VendorWallet';
import VendorStoreTab from '@/components/swift/VendorStoreTab';
import VendorProfileTab from '@/components/swift/VendorProfileTab';
import RiderDashboard from '@/components/swift/RiderDashboard';
import RiderEarningsHub from '@/components/swift/RiderEarningsHub';
import RiderDeliveryMap from '@/components/swift/RiderDeliveryMap';
import RiderProfileTab from '@/components/swift/RiderProfileTab';
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
  ArrowLeftRight,
} from 'lucide-react';

/* ──────────────────── Dynamic Modal Imports (code-split, ssr: false) ──────────────────── */
/* Each modal becomes its own lazy chunk — kept out of the initial page bundle.
   AllModals() still renders all 44, so they activate when activeModal matches. */
const ProductDetailModal = dynamic(() => import('@/components/swift/ProductDetailModal').then(m => m.default), { ssr: false });
const PrayerTimesModal = dynamic(() => import('@/components/swift/PrayerTimesModal').then(m => m.default), { ssr: false });
const SahurWakeUpModal = dynamic(() => import('@/components/swift/SahurWakeUpModal').then(m => m.default), { ssr: false });
const GroupBuyModal = dynamic(() => import('@/components/swift/GroupBuyModal').then(m => m.default), { ssr: false });
const VoiceShoppingModal = dynamic(() => import('@/components/swift/VoiceShoppingModal').then(m => m.default), { ssr: false });
const GiftCardModal = dynamic(() => import('@/components/swift/GiftCardModal').then(m => m.default), { ssr: false });
const MosqueSadaqahModal = dynamic(() => import('@/components/swift/MosqueSadaqahModal').then(m => m.default), { ssr: false });
const ReferEarnModal = dynamic(() => import('@/components/swift/ReferEarnModal').then(m => m.default), { ssr: false });
const CharityZakatModal = dynamic(() => import('@/components/swift/CharityZakatModal').then(m => m.default), { ssr: false });
const PartyBulkModal = dynamic(() => import('@/components/swift/PartyBulkModal').then(m => m.default), { ssr: false });
const RecipesModal = dynamic(() => import('@/components/swift/RecipesModal').then(m => m.default), { ssr: false });
const VisualSearchModal = dynamic(() => import('@/components/swift/VisualSearchModal').then(m => m.default), { ssr: false });
const AIRecipeGeneratorModal = dynamic(() => import('@/components/swift/AIRecipeGeneratorModal').then(m => m.default), { ssr: false });
const TrendingModal = dynamic(() => import('@/components/swift/TrendingModal').then(m => m.default), { ssr: false });
const CheckoutModal = dynamic(() => import('@/components/swift/CheckoutModal').then(m => m.default), { ssr: false });
const RewardsModal = dynamic(() => import('@/components/swift/RewardsModal').then(m => m.default), { ssr: false });
const BNPLModal = dynamic(() => import('@/components/swift/BNPLModal').then(m => m.default), { ssr: false });
const DeliveryLocationMap = dynamic(() => import('@/components/swift/DeliveryLocationMap').then(m => m.default), { ssr: false });
const RealTimeTrackingModal = dynamic(() => import('@/components/swift/RealTimeTrackingModal').then(m => m.default), { ssr: false });
const LiveTrackingMap = dynamic(() => import('@/components/swift/LiveTrackingMap').then(m => m.default), { ssr: false });
const SmartKitchenHub = dynamic(() => import('@/components/swift/SmartKitchenHub').then(m => m.default), { ssr: false });
const CommunityForum = dynamic(() => import('@/components/swift/CommunityForum').then(m => m.default), { ssr: false });
const MealPlannerModal = dynamic(() => import('@/components/swift/MealPlannerModal').then(m => m.default), { ssr: false });
const ArtisanMarketHub = dynamic(() => import('@/components/swift/ArtisanMarketHub').then(m => m.default), { ssr: false });
const EcoImpactReport = dynamic(() => import('@/components/swift/EcoImpactReport').then(m => m.default), { ssr: false });
const VendorSalesInsights = dynamic(() => import('@/components/swift/VendorSalesInsights').then(m => m.default), { ssr: false });
const VendorStockControl = dynamic(() => import('@/components/swift/VendorStockControl').then(m => m.default), { ssr: false });
const VendorPricingModal = dynamic(() => import('@/components/swift/VendorPricingModal').then(m => m.default), { ssr: false });
const VendorAddProductModal = dynamic(() => import('@/components/swift/VendorAddProductModal').then(m => m.default), { ssr: false });
const RiderPerformanceHub = dynamic(() => import('@/components/swift/RiderPerformanceHub').then(m => m.default), { ssr: false });
const RiderSmartRouteModal = dynamic(() => import('@/components/swift/RiderSmartRouteModal').then(m => m.default), { ssr: false });
const RiderPowerFinderModal = dynamic(() => import('@/components/swift/RiderPowerFinderModal').then(m => m.default), { ssr: false });
const NewDeliveryRequestModal = dynamic(() => import('@/components/swift/NewDeliveryRequestModal').then(m => m.default), { ssr: false });
const ChatModal = dynamic(() => import('@/components/swift/ChatModal').then(m => m.default), { ssr: false });
const RateDeliveryModal = dynamic(() => import('@/components/swift/RateDeliveryModal').then(m => m.default), { ssr: false });
const SettingsModal = dynamic(() => import('@/components/swift/SettingsModal').then(m => m.default), { ssr: false });
const EditProfileModal = dynamic(() => import('@/components/swift/EditProfileModal').then(m => m.default), { ssr: false });
const HelpCenterModal = dynamic(() => import('@/components/swift/HelpCenterModal').then(m => m.default), { ssr: false });
const LegalPagesModal = dynamic(() => import('@/components/swift/LegalPagesModal').then(m => m.default), { ssr: false });
const SafaAgentHub = dynamic(() => import('@/components/swift/SafaAgentHub').then(m => m.default), { ssr: false });
const WalletModal = dynamic(() => import('@/components/swift/WalletModal').then(m => m.default), { ssr: false });
const PayoutModal = dynamic(() => import('@/components/swift/PayoutModal').then(m => m.default), { ssr: false });
const KYCModal = dynamic(() => import('@/components/swift/KYCModal').then(m => m.default), { ssr: false });
const SupportModal = dynamic(() => import('@/components/swift/SupportModal').then(m => m.default), { ssr: false });

/* ──────────────────── Tab Mappings per Role ──────────────────── */

const customerTabs: Record<string, React.ComponentType> = {
  home: HomeTab,
  explore: ExploreTab,
  reels: ReelsTab,
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
    accent: '#10E07A',
    accentLight: 'rgba(16,224,122,0.14)',
    accentMid: 'rgba(16,224,122,0.30)',
    icon: User,
    defaultTab: 'home' as const,
  },
  vendor: {
    accent: '#F5C451',
    accentLight: 'rgba(245,196,81,0.14)',
    accentMid: 'rgba(245,196,81,0.30)',
    icon: Store,
    defaultTab: 'vendor-dashboard' as const,
  },
  rider: {
    accent: '#38BDF8',
    accentLight: 'rgba(56,189,248,0.14)',
    accentMid: 'rgba(56,189,248,0.30)',
    icon: Bike,
    defaultTab: 'rider-dashboard' as const,
  },
} as const;

/* ──────────────────── Page Transition Variants ──────────────────── */

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function Home() {
  const activeTab = useActiveTab();
  const cartCount = useCartCount();
  const userRole = useUserRole();
  const userName = useUserName();
  const isLoggedIn = useIsLoggedIn();
  const userArea = useUserArea();

  const { setActiveTab } = useNavigation();
  const { showWelcome, showAuth, showOnboarding, onboardingComplete, setShowAuth } = useOnboarding();
  const { vendorStoreName, vendorOnline } = useVendor();
  const { riderOnline, riderCompletedToday } = useRider();

  const [showNotifications, setShowNotifications] = useState(false);

  // Tab direction tracking for directional transitions
  const prevTabRef = useRef<string>(activeTab);
  const [tabDirection, setTabDirection] = useState<1 | -1>(1);

  // Detect tab direction change (forward vs back)
  useEffect(() => {
    const direction = getTabDirection(prevTabRef.current, activeTab);
    setTabDirection(direction);
    prevTabRef.current = activeTab;
  }, [activeTab]);

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
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={screenTransition}
          className="h-screen w-full aurora-app-bg"
        >
          <WelcomeScreen />
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ──────────────────── Route: Auth Screen (full-screen overlay) ──────────────────── */

  if (showAuth) {
    return (
      <div className="h-screen w-full relative aurora-app-bg">
        {/* Auth is rendered as a full-screen overlay */}
        <AuthScreen />

        {/* All modals still rendered underneath for smooth return */}
        <ModalErrorBoundary name="AllModals">
          <AllModals />
        </ModalErrorBoundary>
      </div>
    );
  }

  /* ──────────────────── Route: Onboarding Flow (full-screen) ──────────────────── */

  if (showOnboarding) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="onboarding"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={screenTransition}
          className="h-screen w-full aurora-app-bg"
        >
          <OnboardingFlow />
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ──────────────────── Route: Main App ──────────────────── */

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden aurora-app-bg">
      {/* ──── Top App Bar ──── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="sticky top-0 z-50 glass-effect"
      >
        {/* Role accent line — refined aurora gradient */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 35%, ${accentColor} 65%, transparent 100%)`,
            opacity: 0.7,
          }}
        />

        <div className="flex items-center px-5 pt-4 pb-2 justify-between gap-3">
          {/* Left: Avatar + Greeting */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="size-11 shrink-0 rounded-2xl flex items-center justify-center border relative overflow-hidden"
              style={{
                backgroundColor: roleConfig.accentLight,
                borderColor: roleConfig.accentMid,
                boxShadow: isCustomer ? `0 0 16px ${accentColor}25` : 'none',
              }}
            >
              <RoleIcon className="w-5 h-5 relative z-10" style={{ color: accentColor }} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-white text-base font-bold leading-tight tracking-tight truncate">
                  {greeting}
                </h2>
                <span className="beta-badge shrink-0">Beta</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Online/Offline indicator for rider/vendor */}
                {(isRider || isVendor) && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        riderOnline || vendorOnline ? '#10E07A' : 'rgba(255,255,255,0.3)',
                      boxShadow: riderOnline || vendorOnline ? '0 0 8px #10E07A' : 'none',
                    }}
                  />
                )}
                {/* Location pin for customers */}
                {isCustomer && <MapPin className="w-3 h-3 text-[#10E07A] shrink-0" />}
                <span className="text-white/55 text-[11px] font-medium truncate">{subtitle}</span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-2 shrink-0">
            {/* Role Switcher Button */}
            <button
              onClick={() => setShowAuth('role')}
              className="flex size-10 items-center justify-center rounded-2xl bg-[#0F1118] border border-white/8 hover:border-white/15 hover:bg-[#161924] transition-all active:scale-95"
              title="Switch role"
              aria-label="Switch role"
            >
              <ArrowLeftRight className="w-4 h-4 text-white/65" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="flex size-11 items-center justify-center rounded-2xl bg-[#0F1118] border border-white/8 hover:border-white/15 hover:bg-[#161924] transition-all active:scale-95 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2.5 right-2.5 size-2 bg-[#F5C451] rounded-full border border-[#06070B] shadow-[0_0_8px_#F5C451]" />
            </button>

            {/* Customer: Cart icon */}
            {isCustomer && (
              <button
                onClick={() => useAppStore.getState().setActiveTab('cart')}
                className="flex size-11 items-center justify-center rounded-2xl bg-[#0F1118] border border-white/8 hover:border-white/15 hover:bg-[#161924] transition-all active:scale-95 relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#10E07A] text-[#04140C] text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,224,122,0.5)]">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Rider: New Delivery Request */}
            {isRider && (
              <button
                onClick={() => useAppStore.getState().setActiveModal('new-delivery')}
                className="flex size-11 items-center justify-center rounded-2xl border active:scale-95 transition-all"
                style={{
                  backgroundColor: roleConfig.accentLight,
                  borderColor: roleConfig.accentMid,
                }}
                aria-label="New delivery"
              >
                <Package className="w-5 h-5" style={{ color: accentColor }} />
              </button>
            )}

            {/* Vendor: Insights Button */}
            {isVendor && (
              <button
                onClick={() => useAppStore.getState().setActiveModal('vendor-insights')}
                className="flex size-11 items-center justify-center rounded-2xl border active:scale-95 transition-all"
                style={{
                  backgroundColor: roleConfig.accentLight,
                  borderColor: roleConfig.accentMid,
                }}
                aria-label="Insights"
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
              <div className="px-5 py-3">
                <button
                  onClick={() => useAppStore.getState().setShowSearch(true)}
                  className="flex w-full items-center rounded-2xl h-12 bg-[#0F1118] border border-white/8 hover:border-[#10E07A]/25 focus-within:border-[#10E07A]/40 transition-all duration-300 group"
                >
                  <Search className="w-5 h-5 text-[#10E07A]/80 ml-4 shrink-0 group-hover:text-[#10E07A] transition-colors" />
                  <span className="flex-1 text-left text-white/40 text-sm px-3 pl-3">
                    Search Jollof, groceries, or boxes...
                  </span>
                  <kbd className="mr-3 text-[10px] text-white/30 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">⌘K</kbd>
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
              <div className="px-5 pb-3">
                <div className="flex items-center justify-between p-3.5 glass-card rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: roleConfig.accentLight }}>
                      <Bike className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <span className="text-white text-sm font-semibold">
                      {riderOnline ? 'You are Online' : 'You are Offline'}
                    </span>
                  </div>
                  <button
                    onClick={() => useAppStore.getState().setRiderOnline(!riderOnline)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                      riderOnline ? 'bg-[#10E07A]' : 'bg-white/10'
                    }`}
                    aria-label="Toggle online"
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
              <div className="px-5 pb-3">
                <div className="flex items-center justify-between p-3.5 glass-card rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: roleConfig.accentLight }}>
                      <Store className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <span className="text-white text-sm font-semibold">
                      {vendorOnline ? 'Store is Open' : 'Store is Closed'}
                    </span>
                  </div>
                  <button
                    onClick={() => useAppStore.getState().setVendorOnline(!vendorOnline)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                      vendorOnline ? 'bg-[#F5C451]' : 'bg-white/10'
                    }`}
                    aria-label="Toggle store"
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
      </motion.header>

      {/* ──── Tab Content with Directional Spring Transitions ──── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={createDirectionalVariants(tabDirection)}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={springConfig}
          className={`flex-1 flex flex-col ${activeTab === 'reels' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          <ActiveTabComponent />
        </motion.div>
      </AnimatePresence>

      {/* ──── Floating Bottom Navigation ──── */}
      <BottomNav />

      {/* ──── Notification Center ──── */}
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* ──── Search Overlay (customers only) ──── */}
      {isCustomer && <SearchOverlay />}

      {/* ──── AI Agent Floating Button (all roles) ──── */}
      <AIAgentButton />

      {/* ──── All App Modals ──── */}
      <ModalErrorBoundary name="AllModals">
        <AllModals />
      </ModalErrorBoundary>

      {/* ──── Bottom gradient fade ──── */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#06070B] to-transparent pointer-events-none z-40" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ALL MODALS - Extracted for reuse across routes
   ══════════════════════════════════════════════════════════════════ */

function AllModals() {
  return (
    <>
      <ProductDetailModal />
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
      <VisualSearchModal />
      <AIRecipeGeneratorModal />
      <TrendingModal />
      <CheckoutModal />
      <RewardsModal />
      <BNPLModal />
      <DeliveryLocationMap />
      <RealTimeTrackingModal />
      <LiveTrackingMap />
      <SmartKitchenHub />
      <CommunityForum />
      <MealPlannerModal />
      <ArtisanMarketHub />
      <EcoImpactReport />
      <VendorSalesInsights />
      <NewDeliveryRequestModal />
      <VendorStockControl />
      <VendorPricingModal />
      <VendorAddProductModal />
      <RiderPerformanceHub />
      <RiderSmartRouteModal />
      <RiderPowerFinderModal />
      <ChatModal />
      <RateDeliveryModal />
      <SettingsModal />
      <EditProfileModal />
      <HelpCenterModal />
      <LegalPagesModal />
      <SafaAgentHub />
      <WalletModal />
      <PayoutModal />
      <KYCModal />
      <SupportModal />
    </>
  );
}
