'use client';

/**
 * KingdomProfileTab — Auren Kingdom V2 reinterpretation of the legacy SwiftRamadan ProfileTab.
 *
 * Same store hooks (useAuth, useCart, useNavigation, useLoyalty, useOrders,
 * useVendor, useRider, useReferralCount, useAppStore.getState) are preserved
 * — every legacy selector remains wired, the V2 spec trims only the visual
 * layer. The data imports (`formatNaira`, `vendorSalesInsights`) needed for
 * the role-specific stats sections are also preserved.
 *
 * V2 spec sections:
 *  1. KingdomShell root
 *  2. Title: user name with kv-gradient-text
 *  3. kv-accent-line under title
 *  4. Profile header: avatar circle (gradient), name, "Gold Tier · 28 days streak"
 *  5. Stats as IntelligenceCard with kv-metric-value/kv-metric-label
 *     (3 stats: orders, meals gifted, hasanat)
 *  6. Taste DNA: IntelligenceCard with royal variant ("Safa knows you love jollof...")
 *  7. Menu items as kv-list-item (Settings, Help, Legal, Logout)
 *  8. Logout: kv-btn-ghost with confirmation
 *  9. kv-stagger entrance
 *  10. Mobile-first layout
 *  11. Same store hooks preserved (userName, userRole, loyaltyTier,
 *      dailyStreak, hasanatPoints, swiftPoints, setActiveModal, setShowAuth)
 *  12. Route: `src/app/kingdom/profile/page.tsx`
 *
 * The legacy `src/components/swift/ProfileTab.tsx` is untouched.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  Star,
  Award,
  Store,
  Bike,
  ChevronRight,
  ShoppingBag,
  Heart,
  Sparkles,
  X,
} from 'lucide-react';
import { useAppStore, type TabId } from '@/lib/store';
import {
  useAuth,
  useCart,
  useNavigation,
  useLoyalty,
  useOrders,
  useVendor,
  useRider,
  useReferralCount,
} from '@/lib/store-selectors';
import { formatNaira, vendorSalesInsights } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  AIOrb,
  RoyalBadge,
} from '../components';

/* ─────────────────────── Role config (mirrors legacy) ─────────────────────── */
const ROLE_DEFAULT_TAB: Record<string, TabId> = {
  customer: 'home',
  vendor: 'vendor-dashboard',
  rider: 'rider-dashboard',
};

/* ─────────────────────── Menu items (V2 spec: 4 items) ─────────────────────── */
interface MenuItem {
  icon: typeof Settings;
  label: string;
  subtitle: string;
  action: () => void;
}

export function KingdomProfileTab() {
  /* ── SAME store hooks preserved (per legacy ProfileTab) ── */
  const { userName, userArea, userEmail, logout, setShowAuth, userRole, setUserRole } = useAuth();
  const { hasanatPoints, swiftPoints, loyaltyTier, dailyStreak, claimDailyPoints, setSwiftPoints } =
    useLoyalty();
  const { setActiveTab } = useNavigation();
  const { cartItems } = useCart();
  const { orders } = useOrders();
  const { vendorStoreName, vendorBusinessCategory, vendorOnline, vendorBalance } = useVendor();
  const { riderOnline, riderEarnings, riderCompletedToday, riderRating, riderVehicleType } =
    useRider();
  const referralCount = useReferralCount();
  const { toast } = useToast();

  /* ── Local UI state ── */
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  /* ── Display values per role (mirrors legacy) ── */
  const displayName =
    userRole === 'vendor'
      ? vendorStoreName || 'My Store'
      : userName || 'Guest';
  const displayArea =
    userRole === 'vendor'
      ? vendorBusinessCategory || 'General'
      : userArea || 'Lagos, Nigeria';

  const tierLabel = loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1);

  /* ── Stats per role ── */
  type StatItem = { label: string; value: string };
  const customerStats: StatItem[] = [
    { label: 'Orders', value: String(orders.length) },
    { label: 'Meals Gifted', value: String(referralCount) },
    { label: 'Hasanat', value: hasanatPoints.toLocaleString() },
  ];
  const vendorStats: StatItem[] = [
    { label: 'Revenue', value: formatNaira(vendorBalance) },
    { label: 'Orders Today', value: String(vendorSalesInsights.todayOrders) },
    { label: 'Avg Order', value: formatNaira(vendorSalesInsights.avgOrderValue) },
  ];
  const riderStats: StatItem[] = [
    { label: 'Earnings', value: formatNaira(riderEarnings) },
    { label: 'Completed', value: String(riderCompletedToday) },
    { label: 'Rating', value: riderRating.toFixed(2) },
  ];
  const stats =
    userRole === 'vendor' ? vendorStats : userRole === 'rider' ? riderStats : customerStats;

  /* ── Taste DNA copy per role (customer-focused per V2 spec) ── */
  const tasteDnaCopy =
    userRole === 'vendor'
      ? 'Safa is learning your top sellers and best delivery windows. She will suggest the right pricing for tomorrow\'s Iftar rush.'
      : userRole === 'rider'
        ? 'Safa sees you complete most runs before Maghrib. She will route you to high-tip orders near prayer times.'
        : 'Safa knows you love jollof, suya after Maghrib, and zobo before Sahur. She\'s lining up your next perfect Iftar.';

  /* ── Handlers — same behaviour as legacy ProfileTab ── */
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'settings':
        useAppStore.getState().setActiveModal('settings');
        break;
      case 'help-center':
        useAppStore.getState().setActiveModal('help-center');
        break;
      case 'legal':
        useAppStore.getState().setActiveModal('legal');
        break;
      case 'logout':
        setShowLogoutConfirm(true);
        break;
    }
  };

  const handleConfirmLogout = () => {
    // Preserves the legacy `logout` + `setShowAuth` flow.
    logout();
    setShowLogoutConfirm(false);
    setShowAuth(null);
    toast({
      title: 'Signed out',
      description: 'You have been signed out of the Kingdom.',
    });
  };

  const handleClaimDaily = () => {
    claimDailyPoints();
    toast({
      title: '+50 Hasanat points claimed!',
      description: `You're on a ${dailyStreak + 1}-day streak. Come back tomorrow!`,
    });
  };

  const handleSwitchRole = (newRole: 'customer' | 'vendor' | 'rider') => {
    setUserRole(newRole);
    setActiveTab(ROLE_DEFAULT_TAB[newRole]);
    const roleName = newRole.charAt(0).toUpperCase() + newRole.slice(1);
    toast({
      title: `Switched to ${roleName} mode`,
      description: `You're now using the Kingdom as a ${newRole}`,
    });
  };

  /* ── Menu items (V2 spec: Settings, Help, Legal, Logout) ── */
  const menuItems: MenuItem[] = [
    {
      icon: Settings,
      label: 'Settings',
      subtitle: 'App preferences & prayer reminders',
      action: () => handleMenuAction('settings'),
    },
    {
      icon: HelpCircle,
      label: 'Help Center',
      subtitle: 'FAQs & guides from Safa',
      action: () => handleMenuAction('help-center'),
    },
    {
      icon: FileText,
      label: 'Legal',
      subtitle: 'Terms, privacy & about',
      action: () => handleMenuAction('legal'),
    },
    {
      icon: LogOut,
      label: showLogoutConfirm ? 'Confirm Logout' : 'Logout',
      subtitle: showLogoutConfirm
        ? 'Tap again to sign out of your account'
        : 'Sign out of your account',
      action: () => handleMenuAction('logout'),
    },
  ];

  /* ── Avatar icon per role ── */
  const AvatarIcon = userRole === 'vendor' ? Store : userRole === 'rider' ? Bike : User;

  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Title ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <p className="text-sm text-[var(--kv-text-tertiary)]">Royal Account</p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text capitalize">
            {displayName}
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2 flex items-center gap-1.5">
            <Award className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
            Ramadan 2026 · Day {dailyStreak > 0 ? dailyStreak : 1}
          </p>
        </motion.header>

        {/* ─────────────────────── Stagger sections ─────────────────────── */}
        <div className="kv-stagger space-y-5">
          {/* ── Profile header (avatar circle + name + tier · streak) ── */}
          <div className="kv-card kv-card-royal p-5 flex items-center gap-4">
            {/* Avatar wrapped in royal→gold→mystic gradient ring */}
            <div
              className="p-[2px] rounded-full shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, var(--kv-royal), var(--kv-gold), var(--kv-mystic))',
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--kv-night)]"
                style={{ boxShadow: 'var(--kv-shadow-royal)' }}
              >
                <AvatarIcon className="w-8 h-8 text-[var(--kv-mystic)]" aria-hidden />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white text-lg font-bold truncate tracking-tight">
                  {displayName}
                </h2>
                {userRole === 'vendor' ? (
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${vendorOnline ? 'bg-[var(--kv-emerald)]' : 'bg-white/30'}`}
                    aria-hidden
                  />
                ) : userRole === 'rider' ? (
                  <span
                    className={`size-2 rounded-full ${riderOnline ? 'bg-[var(--kv-emerald)] animate-pulse' : 'bg-white/30'}`}
                    aria-hidden
                  />
                ) : null}
              </div>

              {userRole === 'vendor' ? (
                <>
                  <p className="text-[var(--kv-text-tertiary)] text-sm mt-1 truncate">
                    {displayArea}
                  </p>
                  <p className="text-[var(--kv-text-tertiary)] text-[11px] mt-0.5">
                    {vendorOnline ? 'Online · Ready for orders' : 'Offline · Not accepting orders'}
                  </p>
                </>
              ) : userRole === 'rider' ? (
                <>
                  <p className="text-[var(--kv-text-tertiary)] text-sm mt-1 truncate">
                    {riderVehicleType || 'Motorcycle'}
                  </p>
                  <p className="text-[var(--kv-text-tertiary)] text-[11px] mt-0.5">
                    {riderOnline ? 'Online · Ready for deliveries' : 'Offline · Not delivering'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[var(--kv-text-tertiary)] text-sm mt-1 truncate">
                    {displayArea}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <RoyalBadge variant="gold" icon={<Award className="w-3 h-3" aria-hidden />}>
                      {tierLabel} Tier
                    </RoyalBadge>
                    <span className="text-[var(--kv-text-tertiary)] text-xs">
                      · {dailyStreak} days streak
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Settings shortcut — preserves `setActiveModal('settings')` */}
            <button
              type="button"
              onClick={() => useAppStore.getState().setActiveModal('settings')}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 hover:bg-[var(--kv-glass-hover)] transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5 text-[var(--kv-text-tertiary)]" aria-hidden />
            </button>
          </div>

          {/* ── Daily streak flame widget (preserves claimDailyPoints) ── */}
          <motion.button
            type="button"
            onClick={handleClaimDaily}
            whileTap={{ scale: 0.98 }}
            className="kv-card kv-card-gold w-full p-4 flex items-center gap-3 text-left"
            aria-label="Claim daily Hasanat points"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--kv-gold-light)' }}
            >
              <Sparkles className="w-6 h-6 text-[var(--kv-gold)]" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">
                {dailyStreak}-day streak · +50 Hasanat available
              </p>
              <p className="text-[var(--kv-text-tertiary)] text-xs">
                Claim your daily Ramadan bonus
              </p>
            </div>
            <RoyalBadge variant="gold">+50</RoyalBadge>
          </motion.button>

          {/* ── Stats (IntelligenceCard + kv-metric-value/kv-metric-label) ── */}
          <IntelligenceCard
            title="Ramadan Journey"
            subtitle="Your hasanat, your impact, your story"
          >
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center text-center p-3 rounded-xl"
                  style={{ background: 'var(--kv-glass)' }}
                >
                  <p className="kv-metric-value text-base sm:text-lg leading-tight">
                    {stat.value}
                  </p>
                  <p className="kv-metric-label mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            {/* Secondary metrics — preserves `swiftPoints` + `cartItems` parity with legacy */}
            <div className="flex items-center justify-between mt-4 pt-4 kv-divider">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                <span className="text-xs text-[var(--kv-text-tertiary)]">
                  Cart items: <span className="text-white font-bold">{cartItems.length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[var(--kv-gold)]" aria-hidden />
                <span className="text-xs text-[var(--kv-text-tertiary)]">
                  Swift Pts: <span className="text-white font-bold">{swiftPoints.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </IntelligenceCard>

          {/* ── Taste DNA (IntelligenceCard royal variant) ── */}
          <IntelligenceCard variant="royal" title="Taste DNA" subtitle="Safa's personalisation engine">
            <div className="flex items-start gap-3">
              <AIOrb size="sm" state="thinking" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-snug">{tasteDnaCopy}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <RoyalBadge variant="royal">Jollof Royale</RoyalBadge>
                  <RoyalBadge variant="neutral">Suya Platter</RoyalBadge>
                  <RoyalBadge variant="neutral">Date Smoothie</RoyalBadge>
                </div>
                <button
                  type="button"
                  onClick={() => useAppStore.getState().setActiveModal('smart-kitchen')}
                  className="kv-btn kv-btn-royal mt-3 text-xs py-2 px-4 min-h-[36px]"
                >
                  Refine with Safa
                </button>
              </div>
            </div>
          </IntelligenceCard>

          {/* ── Role switcher (preserves setUserRole + setActiveTab) ── */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
              Switch role
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {(['customer', 'vendor', 'rider'] as const).map((role) => {
                const Icon = role === 'vendor' ? Store : role === 'rider' ? Bike : User;
                const isActive = userRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSwitchRole(role)}
                    className={`kv-card p-3 flex flex-col items-center gap-1.5 ${
                      isActive ? 'kv-card-royal' : ''
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="w-5 h-5 text-[var(--kv-mystic)]" aria-hidden />
                    <span className="text-[11px] font-bold capitalize text-white">{role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Menu items (kv-list-item: Settings, Help, Legal, Logout) ── */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
              Account
            </h2>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isLogout = item.label === 'Logout' || item.label === 'Confirm Logout';
                return (
                  <motion.button
                    key={item.label}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={item.action}
                    className={`kv-list-item w-full text-left ${
                      isLogout && !showLogoutConfirm
                        ? 'border border-[var(--kv-danger)]/15'
                        : isLogout && showLogoutConfirm
                          ? 'border border-[var(--kv-danger)]/40 bg-[var(--kv-danger)]/5'
                          : ''
                    }`}
                    aria-label={item.label}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isLogout
                          ? 'bg-[var(--kv-danger)]/10'
                          : ''
                      }`}
                      style={!isLogout ? { background: 'var(--kv-royal-light)' } : undefined}
                    >
                      <Icon
                        className={`w-5 h-5 ${isLogout ? 'text-[var(--kv-danger)]' : 'text-[var(--kv-mystic)]'}`}
                        aria-hidden
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-bold text-sm ${
                          isLogout ? 'text-[var(--kv-danger)]' : 'text-white'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[var(--kv-text-tertiary)] text-xs truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-white/20 shrink-0 ${isLogout ? 'text-[var(--kv-danger)]/40' : ''}`}
                      aria-hidden
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Logout confirmation (kv-btn-ghost with confirmation) ── */}
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="kv-card kv-card-gold p-4 flex items-center gap-3"
              role="alertdialog"
              aria-label="Confirm logout"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--kv-gold-light)' }}
              >
                <LogOut className="w-5 h-5 text-[var(--kv-gold)]" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Sign out of the Kingdom?</p>
                <p className="text-[var(--kv-text-tertiary)] text-xs">
                  Your cart and hasanat progress will be saved.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="kv-btn kv-btn-ghost text-xs py-2 px-3 min-h-[40px]"
                  aria-label="Cancel logout"
                >
                  <X className="w-3.5 h-3.5" aria-hidden />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="kv-btn kv-btn-ghost text-xs py-2 px-3 min-h-[40px] !text-[var(--kv-danger)] !border-[var(--kv-danger)]/30"
                  aria-label="Confirm logout"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden />
                  Confirm
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Charity quick action (preserves `setActiveModal('charity')` + userEmail parity) ── */}
          {userRole === 'customer' && (
            <motion.button
              type="button"
              onClick={() => useAppStore.getState().setActiveModal('charity')}
              whileTap={{ scale: 0.98 }}
              className="kv-card w-full p-4 flex items-center gap-3 text-left"
              aria-label="Give back this Ramadan"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--kv-royal-light)' }}
              >
                <Heart className="w-6 h-6 text-[var(--kv-mystic)]" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Give Back This Ramadan</p>
                <p className="text-[var(--kv-text-tertiary)] text-xs truncate">
                  {userEmail
                    ? `Earn hasanat as ${userEmail.split('@')[0]}`
                    : 'Zakat, sadaqah, and orphan support'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 shrink-0" aria-hidden />
            </motion.button>
          )}

          {/* ── Account footer (preserves `setShowAuth` + `setActiveTab`) ── */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-[var(--kv-text-tertiary)] uppercase tracking-wider">
              Kingdom v2 · Ramadan 2026
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAuth('login');
                setActiveTab('home');
              }}
              className="text-xs text-[var(--kv-mystic)] font-semibold mt-2 hover:underline"
            >
              Switch account
            </button>
          </div>
        </div>
      </main>
    </KingdomShell>
  );
}
