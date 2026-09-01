'use client';

/**
 * KingdomRiderProfile — Auren Kingdom V2 reinterpretation of the legacy
 * SwiftRamdan RiderProfileTab component.
 *
 * The legacy `src/components/swift/RiderProfileTab.tsx` (389 LOC) is
 * untouched. This file is a complete visual rewrite using the Kingdom V2
 * design system while preserving EVERY store hook:
 *   - `useRider` (riderOnline, setRiderOnline, riderEarnings,
 *     riderCompletedToday, riderRating, riderVehicleType, riderPlateNumber,
 *     riderVehicleColor, riderBankName, riderAccountNumber, riderLicenseNumber)
 *   - `useAppStore` (direct store access for `setActiveModal`, `setActiveTab`,
 *     `setShowAuth`, `setShowOnboarding`, `setOnboardingStep` — parity with
 *     the V2 dual-access pattern used by MerchantCommandCenter).
 *   - `useAuth` (logout, setShowAuth) — preserves the legacy auth flow.
 *   - `useUserName` — rider display name fallback.
 *
 * V2 spec sections (13 items):
 *  1. KingdomShell root
 *  2. Title: rider name with kv-gradient-text + kv-accent-line
 *  3. Profile Header: Gradient avatar circle + name + "Royal Courier" badge
 *     (kv-badge-gold)
 *  4. Ramadan Impact: IntelligenceCard gold — "Iftars Protected"
 *     (kv-metric-value), "Families Served" (kv-metric-value),
 *     "Community Contribution" (kv-metric-label)
 *  5. Performance: 3 kv-metric cards (Deliveries, Rating, Streak)
 *  6. Vehicle: IntelligenceCard with vehicle details — Type, plate, color,
 *     license — RoyalBadge for each field
 *  7. Bank Details: kv-card with bank name + account
 *  8. Menu: kv-list-item (Settings, Help, Logout)
 *  9. kv-btn-ghost Logout with confirmation
 *  10. kv-stagger entrance
 *  11. Mobile-first layout
 *  12. Same store hooks: useRider, useAppStore
 *  13. Route: `src/app/kingdom/rider/profile/page.tsx`
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bike,
  Car,
  Zap,
  Star,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  X,
  CheckCircle,
  Flame,
  Banknote,
  Moon,
} from 'lucide-react';
import { useAppStore, type TabId } from '@/lib/store';
import {
  useAuth,
  useRider,
  useUserName,
  useNavigation,
  useOnboarding,
} from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  RoyalBadge,
} from '../components';

/* ─────────────────────── Menu items (V2 spec: Settings, Help, Logout) ─────────────────────── */
interface MenuItem {
  icon: typeof Settings;
  label: string;
  subtitle: string;
  action: () => void;
  isLogout?: boolean;
}

/* ─────────────────────── Vehicle field config ─────────────────────── */
interface VehicleField {
  label: string;
  value: string;
  icon: typeof Bike;
}

export function KingdomRiderProfile() {
  /* ── SAME store hooks preserved (per legacy RiderProfileTab) ── */
  const {
    riderOnline,
    setRiderOnline,
    riderEarnings,
    riderCompletedToday,
    riderRating,
    riderVehicleType,
    riderPlateNumber,
    riderVehicleColor,
    riderBankName,
    riderAccountNumber,
    riderLicenseNumber,
  } = useRider();
  const userName = useUserName();
  const { logout, setShowAuth } = useAuth();
  const { setActiveModal } = useNavigation();
  const { setShowOnboarding, setOnboardingStep } = useOnboarding();
  const { toast } = useToast();

  /* ── Direct store access — V2 dual-access pattern ── */
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  /* ── Local UI state ── */
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  /* ── Display values (mirrors legacy) ── */
  const displayName = userName || 'Rider';
  const streak = 28; // Royal Courier streak baseline (legacy local constant)
  const iftarsProtected = riderCompletedToday * 4; // ~4 iftar meals per delivery
  const familiesServed = riderCompletedToday * 3;

  /* ── Vehicle icon selection (mirrors legacy) ── */
  const vehicleLower = riderVehicleType.toLowerCase();
  const VehicleIcon = vehicleLower.includes('car') || vehicleLower.includes('auto')
    ? Car
    : vehicleLower.includes('bicycle') ||
        vehicleLower.includes('bike') ||
        vehicleLower.includes('cycle')
      ? Bike
      : Zap;

  /* ── Vehicle fields (V2 spec #6 — RoyalBadge for each field) ── */
  const vehicleFields: VehicleField[] = [
    { label: 'Type', value: riderVehicleType || 'Motorcycle', icon: VehicleIcon },
    { label: 'Plate', value: riderPlateNumber || '—', icon: Bike },
    { label: 'Color', value: riderVehicleColor || '—', icon: Award },
    { label: 'License', value: riderLicenseNumber || '—', icon: CheckCircle },
  ];

  /* ── Handlers (preserves legacy actions) ── */
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'settings':
        useAppStore.getState().setActiveModal('settings');
        break;
      case 'help':
        useAppStore.getState().setActiveModal('help-center');
        break;
      case 'logout':
        setShowLogoutConfirm(true);
        break;
    }
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setShowAuth(null);
    toast({
      title: 'Logged out',
      description: 'You have been signed out of the Kingdom. See you soon! 👋',
    });
  };

  const handleToggleOnline = () => {
    setRiderOnline(!riderOnline);
    toast({
      title: riderOnline ? "You're Offline" : "You're Online! 🟢",
      description: riderOnline
        ? "You won't receive new delivery requests"
        : "You'll now receive delivery requests",
    });
  };

  const handleEditVehicle = () => {
    setShowOnboarding(true);
    setOnboardingStep(0);
  };

  /* ── Menu items ── */
  const menuItems: MenuItem[] = [
    {
      icon: Settings,
      label: 'Settings',
      subtitle: 'App preferences & prayer reminders',
      action: () => handleMenuAction('settings'),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      subtitle: 'FAQs & contact us',
      action: () => handleMenuAction('help'),
    },
    {
      icon: LogOut,
      label: showLogoutConfirm ? 'Confirm Logout' : 'Logout',
      subtitle: showLogoutConfirm
        ? 'Tap again to sign out of your account'
        : 'Sign out of your account',
      action: () => handleMenuAction('logout'),
      isLogout: true,
    },
  ];

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
          <p className="text-sm text-[var(--kv-text-tertiary)]">Royal Courier</p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text capitalize">
            {displayName}
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2 flex items-center gap-1.5">
            <Award className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
            {riderOnline ? 'Online · Ready for missions' : 'Offline · Resting'}
          </p>
        </motion.header>

        {/* ─────────────────────── Stagger sections ─────────────────────── */}
        <div className="kv-stagger space-y-5">
          {/* ── 3. Profile Header — gradient avatar + name + "Royal Courier" badge ── */}
          <div className="kv-card kv-card-gold p-5 flex items-center gap-4">
            {/* Gradient avatar circle (royal → gold → mystic) */}
            <div
              className="p-[2px] rounded-full shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, var(--kv-royal), var(--kv-gold), var(--kv-mystic))',
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--kv-night)] relative"
                style={{ boxShadow: 'var(--kv-shadow-gold)' }}
              >
                <Bike className="w-8 h-8 text-[var(--kv-gold)]" aria-hidden />
                <span
                  className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-[var(--kv-night)] ${
                    riderOnline ? 'bg-[var(--kv-emerald)] animate-pulse' : 'bg-white/30'
                  }`}
                  aria-hidden
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-white text-lg font-bold truncate tracking-tight">
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <RoyalBadge variant="gold" icon={<Award className="w-3 h-3" aria-hidden />}>
                  Royal Courier
                </RoyalBadge>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[var(--kv-gold)] fill-[var(--kv-gold)]" aria-hidden />
                  <span className="text-[var(--kv-gold)] text-sm font-bold">
                    {riderRating.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[var(--kv-text-tertiary)] text-[11px] mt-1 truncate">
                {riderVehicleType || 'Motorcycle'} · {riderPlateNumber || 'No plate'}
              </p>
            </div>

            {/* Online/Offline toggle */}
            <button
              type="button"
              onClick={handleToggleOnline}
              aria-label={riderOnline ? 'Go Offline' : 'Go Online'}
              className={`kv-btn shrink-0 text-xs py-2 px-3 min-h-[40px] ${
                riderOnline ? 'kv-btn-ghost' : 'kv-btn-royal'
              }`}
            >
              <Zap className="w-3.5 h-3.5" aria-hidden />
              {riderOnline ? 'Offline' : 'Online'}
            </button>
          </div>

          {/* ── 4. Ramadan Impact — IntelligenceCard gold variant ── */}
          <IntelligenceCard
            variant="gold"
            title="Ramadan Impact"
            subtitle="Your deliveries this holy month"
          >
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-4 flex flex-col items-center text-center"
                style={{ background: 'var(--kv-glass)' }}
              >
                <Moon className="w-5 h-5 text-[var(--kv-gold)] mb-1.5" aria-hidden />
                <p className="kv-metric-value text-2xl kv-gradient-gold">
                  {iftarsProtected}
                </p>
                <p className="kv-metric-label mt-1">Iftars Protected</p>
              </div>
              <div
                className="rounded-xl p-4 flex flex-col items-center text-center"
                style={{ background: 'var(--kv-glass)' }}
              >
                <Award className="w-5 h-5 text-[var(--kv-gold)] mb-1.5" aria-hidden />
                <p className="kv-metric-value text-2xl kv-gradient-gold">
                  {familiesServed}
                </p>
                <p className="kv-metric-label mt-1">Families Served</p>
              </div>
            </div>
            <div className="mt-4 pt-4 kv-divider text-center">
              <p className="kv-metric-label">Community Contribution</p>
              <p className="text-white text-sm font-bold mt-1">
                Top 5% Royal Courier in Lagos
              </p>
            </div>
          </IntelligenceCard>

          {/* ── 5. Performance — 3 kv-metric cards (Deliveries, Rating, Streak) ── */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
              Performance
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="kv-card p-3 flex flex-col items-center text-center">
                <CheckCircle className="w-4 h-4 text-[var(--kv-emerald)] mb-1.5" aria-hidden />
                <p className="kv-metric-value text-base sm:text-lg">
                  {riderCompletedToday}
                </p>
                <p className="kv-metric-label mt-1">Deliveries</p>
              </div>
              <div className="kv-card p-3 flex flex-col items-center text-center">
                <Star className="w-4 h-4 text-[var(--kv-gold)] fill-[var(--kv-gold)] mb-1.5" aria-hidden />
                <p className="kv-metric-value text-base sm:text-lg">
                  {riderRating.toFixed(1)}
                </p>
                <p className="kv-metric-label mt-1">Rating</p>
              </div>
              <div className="kv-card p-3 flex flex-col items-center text-center">
                <Flame className="w-4 h-4 text-[var(--kv-amber)] mb-1.5" aria-hidden />
                <p className="kv-metric-value text-base sm:text-lg">{streak}</p>
                <p className="kv-metric-label mt-1">Streak</p>
              </div>
            </div>
            {/* Earnings strip — preserves `riderEarnings` parity with legacy */}
            <div
              className="rounded-xl p-3 mt-2 flex items-center justify-between"
              style={{ background: 'var(--kv-glass)' }}
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                <span className="text-xs text-[var(--kv-text-tertiary)]">
                  Today&apos;s Earnings
                </span>
              </div>
              <span className="text-white font-bold text-sm">
                {formatNaira(riderEarnings)}
              </span>
            </div>
          </div>

          {/* ── 6. Vehicle — IntelligenceCard with RoyalBadge for each field ── */}
          <IntelligenceCard
            variant="royal"
            title="Vehicle Details"
            subtitle="Royal Courier registered transport"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <VehicleIcon className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                <span className="text-white text-sm font-bold">{riderVehicleType || 'Motorcycle'}</span>
              </div>
              <button
                type="button"
                onClick={handleEditVehicle}
                className="text-xs text-[var(--kv-mystic)] font-bold hover:underline"
                aria-label="Edit vehicle info"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {vehicleFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div
                    key={field.label}
                    className="rounded-xl p-3"
                    style={{ background: 'var(--kv-glass)' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="kv-metric-label">{field.label}</span>
                      <RoyalBadge variant="royal">
                        <Icon className="w-2.5 h-2.5" aria-hidden />
                      </RoyalBadge>
                    </div>
                    <p className="text-white text-sm font-bold truncate font-mono">
                      {field.value}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* License verified badge — preserves `riderLicenseNumber` parity */}
            <div className="flex items-center gap-2 mt-3 pt-3 kv-divider">
              <RoyalBadge
                variant={riderLicenseNumber ? 'gold' : 'neutral'}
                icon={<CheckCircle className="w-3 h-3" aria-hidden />}
              >
                {riderLicenseNumber ? 'License Verified' : 'License Pending'}
              </RoyalBadge>
            </div>
          </IntelligenceCard>

          {/* ── 7. Bank Details — kv-card with bank name + account ── */}
          <div className="kv-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
              <h3 className="text-sm font-bold text-white">Bank Details</h3>
            </div>
            {riderBankName && riderAccountNumber ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{riderBankName}</p>
                  <p className="text-[var(--kv-text-tertiary)] text-xs font-mono">
                    {riderAccountNumber.slice(-4).padStart(riderAccountNumber.length, '*')}
                  </p>
                </div>
                <RoyalBadge variant="gold" icon={<CheckCircle className="w-3 h-3" aria-hidden />}>
                  Active
                </RoyalBadge>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[var(--kv-text-tertiary)] text-xs">
                  No bank account on file
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowOnboarding(true);
                    setOnboardingStep(2);
                  }}
                  className="text-xs text-[var(--kv-mystic)] font-bold flex items-center gap-1 shrink-0"
                >
                  Add now <ChevronRight className="w-3 h-3" aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* ── 8. Menu — kv-list-item (Settings, Help, Logout) ── */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
              Account
            </h2>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isLogout = item.isLogout;
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
                        isLogout ? 'bg-[var(--kv-danger)]/10' : ''
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

          {/* ── 9. Logout confirmation — kv-btn-ghost with confirmation ── */}
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
                  Your earnings &amp; rating will be saved.
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

          {/* ── Footer (preserves `setShowAuth` + `setActiveTab` parity) ── */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-[var(--kv-text-tertiary)] uppercase tracking-wider">
              Kingdom V2 · Royal Courier · Ramadan 2026
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAuth('role');
                const riderTab: TabId = 'rider-dashboard';
                setActiveTab(riderTab);
              }}
              className="text-xs text-[var(--kv-mystic)] font-semibold mt-2 hover:underline"
            >
              Switch role
            </button>
          </div>
        </div>
      </main>
    </KingdomShell>
  );
}
