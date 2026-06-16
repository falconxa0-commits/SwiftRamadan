'use client';

import {
  User, Settings, CreditCard, Bell, Heart, Shield, Leaf, ChevronRight,
  Award, Gift, Users, MapPin, X, Bike, Store, ArrowLeftRight, Palette,
  MessageSquare, LogOut, Moon, BarChart3, Package, TrendingUp, Zap,
  Navigation, DollarSign, Star, ToggleLeft, ToggleRight, Fingerprint,
  Lock, Globe, Eye, Map,
} from 'lucide-react';
import { loyaltyData, charityItems, formatNaira, vendorSalesInsights, ecoImpactData } from '@/lib/data';
import { useAppStore, type TabId } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/* ──────────────── Role Config ──────────────── */

const ROLE_ACCENT = {
  customer: '#13ec13',
  vendor: '#FFD700',
  rider: '#3b82f6',
} as const;

const ROLE_DEFAULT_TAB: Record<string, TabId> = {
  customer: 'home',
  vendor: 'vendor-dashboard',
  rider: 'rider-dashboard',
};

/* ──────────────── Menu Items per Role ──────────────── */

const customerMenu = [
  { icon: CreditCard, label: 'Pay Small-Small (BNPL)', subtitle: 'Buy now, pay later', color: 'text-[#13ec13]', action: 'bnpl' },
  { icon: Gift, label: 'SwiftRewards', subtitle: '', color: 'text-[#FFD700]', action: 'rewards' },
  { icon: Users, label: 'Refer & Earn', subtitle: 'Get ₦2,000 per referral', color: 'text-cyan-400', action: 'refer' },
  { icon: Heart, label: 'Charity & Zakat', subtitle: 'Make a difference', color: 'text-rose-400', action: 'charity' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-emerald-400', action: 'eco-impact' },
  { icon: Palette, label: 'Artisan Market', subtitle: 'Local crafts & goods', color: 'text-orange-400', action: 'artisan-market' },
  { icon: MessageSquare, label: 'SwiftCommunity', subtitle: 'Discussion & reviews', color: 'text-violet-400', action: 'community' },
  { icon: MapPin, label: 'Delivery Location', subtitle: 'Set on map', color: 'text-purple-400', action: 'delivery-location' },
  { icon: Moon, label: 'Prayer Times', subtitle: 'Salah & Qibla', color: 'text-teal-400', action: 'prayer-times' },
  { icon: Bell, label: 'Notifications', subtitle: '', color: 'text-amber-400', action: 'notifications' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-blue-400', action: 'security' },
  { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#13ec13]', action: 'switch-role' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings' },
];

const vendorMenu = [
  { icon: BarChart3, label: 'Sales Insights', subtitle: 'View analytics & trends', color: 'text-[#FFD700]', action: 'vendor-insights' },
  { icon: Package, label: 'Quick Stock Control', subtitle: 'Manage inventory', color: 'text-emerald-400', action: 'vendor-stock' },
  { icon: TrendingUp, label: 'Dynamic Pricing', subtitle: 'Optimize your prices', color: 'text-cyan-400', action: 'vendor-pricing' },
  { icon: Gift, label: 'SwiftRewards', subtitle: '', color: 'text-[#FFD700]', action: 'rewards' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-emerald-400', action: 'eco-impact' },
  { icon: MessageSquare, label: 'SwiftCommunity', subtitle: 'Connect with vendors', color: 'text-violet-400', action: 'community' },
  { icon: Moon, label: 'Prayer Times', subtitle: 'Salah & Qibla', color: 'text-teal-400', action: 'prayer-times' },
  { icon: Bell, label: 'Notifications', subtitle: '', color: 'text-amber-400', action: 'notifications' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-blue-400', action: 'security' },
  { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#FFD700]', action: 'switch-role' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings' },
];

const riderMenu = [
  { icon: BarChart3, label: 'Performance Hub', subtitle: 'Track your metrics', color: 'text-[#3b82f6]', action: 'rider-performance' },
  { icon: Navigation, label: 'AI Smart Route', subtitle: 'Optimized deliveries', color: 'text-cyan-400', action: 'rider-smart-route' },
  { icon: Zap, label: 'Power Finder', subtitle: 'Find charging stations', color: 'text-[#FFD700]', action: 'rider-power-finder' },
  { icon: Users, label: 'Refer a Driver', subtitle: 'Earn ₦2,000 per referral', color: 'text-cyan-400', action: 'refer' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-emerald-400', action: 'eco-impact' },
  { icon: Moon, label: 'Prayer Times', subtitle: 'Salah & Qibla', color: 'text-teal-400', action: 'prayer-times' },
  { icon: Bell, label: 'Notifications', subtitle: '', color: 'text-amber-400', action: 'notifications' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-blue-400', action: 'security' },
  { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#3b82f6]', action: 'switch-role' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings' },
];

/* ──────────────── Modal Content Interface ──────────────── */

interface ModalContent {
  title: string;
  content: React.ReactNode;
}

/* ──────────────── Switch Role Modal Card ──────────────── */

const roleCards = [
  {
    role: 'customer' as const,
    icon: User,
    title: 'Customer',
    description: 'Order iftar meals, groceries & more',
    accent: '#13ec13',
    bgClass: 'bg-[#13ec13]/10 border-[#13ec13]/30',
    iconColor: 'text-[#13ec13]',
  },
  {
    role: 'vendor' as const,
    icon: Store,
    title: 'Vendor',
    description: 'Manage your store & accept orders',
    accent: '#FFD700',
    bgClass: 'bg-[#FFD700]/10 border-[#FFD700]/30',
    iconColor: 'text-[#FFD700]',
  },
  {
    role: 'rider' as const,
    icon: Bike,
    title: 'Rider',
    description: 'Deliver orders & earn money',
    accent: '#3b82f6',
    bgClass: 'bg-[#3b82f6]/10 border-[#3b82f6]/30',
    iconColor: 'text-[#3b82f6]',
  },
];

/* ──────────────── Toggle Switch Component ──────────────── */

function ToggleSwitch({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-[#13ec13]' : 'bg-white/10'}`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   ProfileTab Component
   ════════════════════════════════════════════════════════════════ */

export default function ProfileTab() {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>({ title: '', content: null });
  const [showSwitchRole, setShowSwitchRole] = useState(false);

  // Settings toggles
  const [settingsState, setSettingsState] = useState({
    notifications: true,
    darkMode: true,
    locationServices: true,
    biometric: true,
    twoFactor: true,
  });

  const { toast } = useToast();
  const {
    userName, userArea, logout, setShowAuth,
    hasanatPoints, loyaltyTier, userRole, setUserRole, setActiveTab,
    vendorStoreName, vendorBusinessCategory, vendorOnline, vendorBalance,
    vendorTotalEarnings, vendorPendingSettlement,
    riderOnline, riderEarnings, riderCompletedToday, riderRating, riderVehicleType,
    orders, cartItems, referralCount,
  } = useAppStore();

  const accent = ROLE_ACCENT[userRole];
  const currentMenu = userRole === 'vendor' ? vendorMenu : userRole === 'rider' ? riderMenu : customerMenu;

  // Update rewards subtitle dynamically
  const menuWithDynamicSubtitles = currentMenu.map(item => {
    if (item.action === 'rewards') return { ...item, subtitle: `${hasanatPoints.toLocaleString()} points` };
    if (item.action === 'notifications') return { ...item, subtitle: `${useAppStore.getState().unreadCount} unread` };
    return item;
  });

  /* ── Display values per role ── */
  const displayName = userRole === 'vendor'
    ? (vendorStoreName || 'My Store')
    : (userName || 'Guest');

  const displayArea = userRole === 'vendor'
    ? (vendorBusinessCategory || 'General')
    : (userArea || 'Lagos, Nigeria');

  /* ── Handlers ── */

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'bnpl':
        useAppStore.getState().setActiveModal('bnpl');
        break;
      case 'refer':
        useAppStore.getState().setActiveModal('refer');
        break;
      case 'charity':
        useAppStore.getState().setActiveModal('charity');
        break;
      case 'rewards':
        useAppStore.getState().setActiveModal('rewards');
        break;
      case 'eco-impact':
        useAppStore.getState().setActiveModal('eco-impact');
        break;
      case 'artisan-market':
        useAppStore.getState().setActiveModal('artisan-market');
        break;
      case 'community':
        useAppStore.getState().setActiveModal('community');
        break;
      case 'delivery-location':
        useAppStore.getState().setActiveModal('delivery-location');
        break;
      case 'prayer-times':
        useAppStore.getState().setActiveModal('prayer');
        break;
      case 'vendor-insights':
        useAppStore.getState().setActiveModal('vendor-insights');
        break;
      case 'vendor-stock':
        useAppStore.getState().setActiveModal('vendor-stock');
        break;
      case 'vendor-pricing':
        useAppStore.getState().setActiveModal('vendor-pricing');
        break;
      case 'rider-performance':
        useAppStore.getState().setActiveModal('rider-performance');
        break;
      case 'rider-smart-route':
        useAppStore.getState().setActiveModal('rider-smart-route');
        break;
      case 'rider-power-finder':
        useAppStore.getState().setActiveModal('rider-power-finder');
        break;
      case 'switch-role':
        setShowSwitchRole(true);
        break;
      case 'notifications':
        toast({ title: 'Notifications 🔔', description: 'Tap the bell icon in the top right to see your notifications' });
        break;
      case 'security':
        setModalContent({
          title: 'Security & Privacy',
          content: (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-[#13ec13]" />
                  <div>
                    <p className="text-white font-bold text-sm">Biometric Login</p>
                    <p className="text-white/40 text-xs">Use fingerprint or Face ID</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settingsState.biometric}
                  onToggle={() => {
                    setSettingsState(s => ({ ...s, biometric: !s.biometric }));
                    toast({ title: settingsState.biometric ? 'Biometric Disabled' : 'Biometric Enabled', description: settingsState.biometric ? 'Password login required' : 'You can now use fingerprint/Face ID' });
                  }}
                  label="Biometric Login"
                />
              </div>
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#13ec13]" />
                  <div>
                    <p className="text-white font-bold text-sm">Two-Factor Auth</p>
                    <p className="text-white/40 text-xs">Extra security for your account</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settingsState.twoFactor}
                  onToggle={() => {
                    setSettingsState(s => ({ ...s, twoFactor: !s.twoFactor }));
                    toast({ title: settingsState.twoFactor ? '2FA Disabled' : '2FA Enabled', description: settingsState.twoFactor ? 'Less secure - consider re-enabling' : 'Your account is more secure now' });
                  }}
                  label="Two-Factor Auth"
                />
              </div>
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-[#13ec13]" />
                  <div>
                    <p className="text-white font-bold text-sm">Data Encryption</p>
                    <p className="text-white/40 text-xs">End-to-end encryption</p>
                  </div>
                </div>
                <span className="text-[#13ec13] text-xs font-bold">Active</span>
              </div>
            </div>
          ),
        });
        setShowModal(true);
        break;
      case 'settings':
        setModalContent({
          title: 'Settings',
          content: (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-white font-bold text-sm">Language</p>
                    <p className="text-white/40 text-xs">English (US)</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-white font-bold text-sm">Notifications</p>
                    <p className="text-white/40 text-xs">Push & Email</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settingsState.notifications}
                  onToggle={() => {
                    setSettingsState(s => ({ ...s, notifications: !s.notifications }));
                    toast({ title: settingsState.notifications ? 'Notifications Off' : 'Notifications On', description: settingsState.notifications ? 'You won\'t receive push alerts' : 'You\'ll receive push & email alerts' });
                  }}
                  label="Notifications"
                />
              </div>
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-white font-bold text-sm">Dark Mode</p>
                    <p className="text-white/40 text-xs">Always on</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settingsState.darkMode}
                  onToggle={() => {
                    setSettingsState(s => ({ ...s, darkMode: !s.darkMode }));
                    toast({ title: 'Dark Mode', description: 'Dark mode is always on in SwiftRamadan' });
                  }}
                  label="Dark Mode"
                />
              </div>
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Map className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-white font-bold text-sm">Location Services</p>
                    <p className="text-white/40 text-xs">While using the app</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settingsState.locationServices}
                  onToggle={() => {
                    setSettingsState(s => ({ ...s, locationServices: !s.locationServices }));
                    toast({ title: settingsState.locationServices ? 'Location Off' : 'Location On', description: settingsState.locationServices ? 'Some features may be limited' : 'Location access enabled' });
                  }}
                  label="Location Services"
                />
              </div>
            </div>
          ),
        });
        setShowModal(true);
        break;
    }
  };

  const handleSwitchRole = (newRole: 'customer' | 'vendor' | 'rider') => {
    setUserRole(newRole);
    setActiveTab(ROLE_DEFAULT_TAB[newRole]);
    setShowSwitchRole(false);
    const roleName = newRole.charAt(0).toUpperCase() + newRole.slice(1);
    toast({
      title: `Switched to ${roleName} mode ✨`,
      description: `You're now using SwiftRamadan as a ${roleName.toLowerCase()}`,
    });
  };

  const handleCharityClick = (item: typeof charityItems[0]) => {
    if (item.amount > 0) {
      useAppStore.getState().addToCart({
        id: 500 + item.id,
        name: `Donation: ${item.name}`,
        price: item.amount,
        image: '',
      });
      toast({ title: `${item.name} 💚`, description: `Donation of ${formatNaira(item.amount)} added to cart` });
    } else {
      toast({ title: 'Zakat Calculator 🧮', description: 'Calculate your Zakat based on your assets' });
    }
  };

  const handleLogout = () => {
    logout();
  };

  /* ══════════════════════ RENDER ══════════════════════ */

  return (
    <main className="flex-1 overflow-y-auto pb-32">

      {/* ─── Profile Header ─── */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-4">
          {userRole === 'vendor' ? (
            /* Vendor Header */
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-[#FFD700]/40 bg-[#FFD700]/15"
              style={{ boxShadow: '0 0 20px #FFD70015' }}>
              <Store className="w-8 h-8 text-[#FFD700]" />
            </div>
          ) : userRole === 'rider' ? (
            /* Rider Header */
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-[#3b82f6]/40 bg-[#3b82f6]/15"
                style={{ boxShadow: '0 0 20px #3b82f615' }}>
                <Bike className="w-8 h-8 text-[#3b82f6]" />
              </div>
              <span className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-[#05070A] ${
                riderOnline ? 'bg-[#13ec13] animate-pulse' : 'bg-white/30'
              }`} />
            </div>
          ) : (
            /* Customer Header */
            <div className="w-16 h-16 bg-[#13ec13]/20 rounded-full flex items-center justify-center border border-[#13ec13]/30 green-glow">
              <User className="w-8 h-8 text-[#13ec13]" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-xl font-bold">{displayName}</h2>
              {userRole === 'vendor' && (
                <span className={`w-2.5 h-2.5 rounded-full ${vendorOnline ? 'bg-[#13ec13] shadow-[0_0_8px_rgba(19,236,19,0.5)]' : 'bg-white/30'}`} />
              )}
            </div>

            {userRole === 'vendor' ? (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#FFD700] text-[10px] font-bold bg-[#FFD700]/10 px-2 py-0.5 rounded-full border border-[#FFD700]/20">
                    {vendorBusinessCategory || 'General'}
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-1">
                  {vendorOnline ? '🟢 Online' : '⚫ Offline'} • Ramadan 2026
                </p>
              </>
            ) : userRole === 'rider' ? (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`size-2 rounded-full ${riderOnline ? 'bg-[#13ec13]' : 'bg-white/30'}`} />
                  <span className={`text-xs font-bold ${riderOnline ? 'text-[#13ec13]' : 'text-white/40'}`}>
                    {riderOnline ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-white/20 text-xs">•</span>
                  <span className="material-symbols-outlined text-[#FFD700] text-sm">workspace_premium</span>
                  <span className="text-[#FFD700] text-xs font-bold">Elite Rider</span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">{riderVehicleType || 'Motorcycle'}</p>
              </>
            ) : (
              <>
                <p className="text-white/50 text-sm">{displayArea}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Award className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
                  <span className="text-[#FFD700] text-xs font-bold">{loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1)} Member</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => useAppStore.getState().setShowOnboarding(true)}
            className="w-10 h-10 bg-[#1A1D26] rounded-xl flex items-center justify-center border border-white/10"
          >
            <Settings className="w-5 h-5 text-white/50" />
          </button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-3">
          {userRole === 'vendor' ? (
            <>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[#13ec13] text-lg font-black">{formatNaira(vendorBalance)}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Revenue</p>
              </div>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[#FFD700] text-lg font-black">{vendorSalesInsights.todayOrders}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Orders Today</p>
              </div>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <p className="text-cyan-400 text-lg font-black">{formatNaira(vendorSalesInsights.avgOrderValue)}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Avg Order</p>
              </div>
            </>
          ) : userRole === 'rider' ? (
            <>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <div className="w-8 h-8 bg-[#13ec13]/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <DollarSign className="w-4 h-4 text-[#13ec13]" />
                </div>
                <p className="text-[#13ec13] text-lg font-black">{formatNaira(riderEarnings)}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase mt-0.5">Earnings Today</p>
              </div>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <div className="w-8 h-8 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Zap className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <p className="text-[#3b82f6] text-lg font-black">{riderCompletedToday}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase mt-0.5">Completed</p>
              </div>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <div className="w-8 h-8 bg-[#FFD700]/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Star className="w-4 h-4 text-[#FFD700]" />
                </div>
                <p className="text-[#FFD700] text-lg font-black">{riderRating}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase mt-0.5">Rating</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[#13ec13] text-xl font-black">{hasanatPoints.toLocaleString()}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase">Points</p>
              </div>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[#FFD700] text-xl font-black">{orders.length}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase">Orders</p>
              </div>
              <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
                <p className="text-white text-xl font-black">{referralCount}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase">Referrals</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Eco Impact ─── */}
      <div className="px-4 mt-6">
        <button
          onClick={() => handleMenuClick('eco-impact')}
          className="w-full text-left"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 to-[#05070A] border border-emerald-500/20 p-5 hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px]" />
            <div className="flex items-center gap-3 mb-3">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Eco Impact</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-white text-lg font-black">{ecoImpactData.co2Saved}</p>
                <p className="text-white/40 text-[10px]">CO₂ Saved</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-black">{ecoImpactData.ecoOrders}</p>
                <p className="text-white/40 text-[10px]">Eco Orders</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-black">₦3K</p>
                <p className="text-white/40 text-[10px]">Donated</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* ─── Menu Items ─── */}
      <div className="px-4 mt-6">
        <div className="space-y-2">
          {menuWithDynamicSubtitles.map((item, i) => {
            const Icon = item.icon;
            const isSwitchRole = item.action === 'switch-role';
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleMenuClick(item.action)}
                className={`flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border transition-colors w-full text-left ${
                  isSwitchRole
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-white/40 text-xs">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ─── Logout Button ─── */}
      <div className="px-4 mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-colors w-full text-left"
        >
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-red-400 font-bold text-sm">Log Out</p>
            <p className="text-red-400/40 text-xs">Sign out of your account</p>
          </div>
        </button>
      </div>

      {/* ─── Charity Quick Actions (Customer only) ─── */}
      {userRole === 'customer' && (
        <div className="px-4 mt-6 mb-6">
          <h3 className="text-white text-lg font-extrabold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Give Back This Ramadan
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {charityItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => handleCharityClick(item)}
                className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 cursor-pointer hover:border-white/10 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#FFD700] text-2xl mb-2">{item.icon}</span>
                <p className="text-white font-bold text-sm">{item.name}</p>
                <p className="text-white/40 text-[10px] mt-0.5">{item.description}</p>
                {item.amount > 0 && (
                  <p className="text-[#13ec13] text-xs font-bold mt-2">From {formatNaira(item.amount)}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Detail Modal (Settings / Security) ─── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[70]"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[70vh] bg-[#0F1117] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="text-white font-bold">{modalContent.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {modalContent.content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Switch Role Modal ─── */}
      <AnimatePresence>
        {showSwitchRole && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[90] backdrop-blur-sm"
              onClick={() => setShowSwitchRole(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0F1117] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div>
                  <h2 className="text-white text-lg font-bold">Switch Role</h2>
                  <p className="text-white/40 text-xs mt-0.5">Choose how you want to use SwiftRamadan</p>
                </div>
                <button
                  onClick={() => setShowSwitchRole(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Role Cards */}
              <div className="p-5 space-y-3">
                {roleCards.map((card, i) => {
                  const Icon = card.icon;
                  const isActive = userRole === card.role;
                  return (
                    <motion.button
                      key={card.role}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleSwitchRole(card.role)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        isActive
                          ? 'bg-white/5 border-white/20'
                          : 'bg-[#1A1D26]/40 border-white/5 hover:border-white/15 hover:bg-[#1A1D26]/80'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${card.bgClass}`}
                        style={{ boxShadow: isActive ? `0 0 20px ${card.accent}20` : 'none' }}>
                        <Icon className={`w-7 h-7 ${card.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-base">{card.title}</p>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">{card.description}</p>
                      </div>
                      {!isActive && (
                        <ChevronRight className="w-5 h-5 text-white/20 shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom safe area */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}
