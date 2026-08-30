'use client';

import {
  User, Settings, CreditCard, Bell, Heart, Shield, Leaf, ChevronRight,
  Award, Gift, Users, MapPin, X, Bike, Store, ArrowLeftRight, Palette,
  MessageSquare, LogOut, Moon, BarChart3, Package, TrendingUp, Zap,
  Navigation, DollarSign, Star, Fingerprint,
  Lock, Globe, Eye, Map, ChefHat, CalendarDays, Flame, Trophy,
  HelpCircle, FileText, Sparkles, Loader2, Tag,
  Wallet, Banknote, Headphones,
} from 'lucide-react';
import { charityItems, formatNaira, vendorSalesInsights, ecoImpactData } from '@/lib/data';
import { useAppStore, type TabId } from '@/lib/store';
import { useAuth, useCart, useNavigation, useLoyalty, useOrders, useVendor, useRider, useReferralCount } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ──────────────── Cooking Journey types ──────────────── */

interface CookingAchievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

interface CookingStats {
  totalSessions?: number;
  completedSessions?: number;
  totalCookTimeMins?: number;
  liveAIUses?: number;
  achievements?: CookingAchievement[];
}

/* ──────────────── Role Config ──────────────── */

const ROLE_ACCENT = {
  customer: '#10E07A',
  vendor: '#F5C451',
  rider: '#38BDF8',
} as const;

const ROLE_DEFAULT_TAB: Record<string, TabId> = {
  customer: 'home',
  vendor: 'vendor-dashboard',
  rider: 'rider-dashboard',
};

/* ──────────────── Menu Items per Role ──────────────── */

const customerMenu = [
  { icon: ChefHat, label: 'Smart Kitchen', subtitle: 'Live AI cooking coach', color: 'text-[#10E07A]', action: 'smart-kitchen', section: 'SMART KITCHEN' },
  { icon: CalendarDays, label: 'Meal Planner', subtitle: 'Plan your Iftar & Sahur week', color: 'text-[#A78BFA]', action: 'meal-planner', section: 'SMART KITCHEN' },
  { icon: CreditCard, label: 'Pay Small-Small (BNPL)', subtitle: 'Buy now, pay later', color: 'text-[#10E07A]', action: 'bnpl', section: 'REWARDS & GIVING' },
  { icon: Wallet, label: 'My Wallet', subtitle: 'Balance & top-up', color: 'text-[#10E07A]', action: 'wallet', section: 'REWARDS & GIVING' },
  { icon: Gift, label: 'SwiftRewards', subtitle: '', color: 'text-[#F5C451]', action: 'rewards', section: 'REWARDS & GIVING' },
  { icon: Users, label: 'Refer & Earn', subtitle: 'Get ₦2,000 per referral', color: 'text-[#38BDF8]', action: 'refer', section: 'REWARDS & GIVING' },
  { icon: Heart, label: 'Charity & Zakat', subtitle: 'Make a difference', color: 'text-[#FB7185]', action: 'charity', section: 'REWARDS & GIVING' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-[#10E07A]', action: 'eco-impact', section: 'REWARDS & GIVING' },
  { icon: Palette, label: 'Artisan Market', subtitle: 'Local crafts & goods', color: 'text-[#F5C451]', action: 'artisan-market', section: 'REWARDS & GIVING' },
  { icon: MessageSquare, label: 'SwiftCommunity', subtitle: 'Discussion & reviews', color: 'text-[#A78BFA]', action: 'community', section: 'REWARDS & GIVING' },
  { icon: MapPin, label: 'Delivery Location', subtitle: 'Set on map', color: 'text-[#A78BFA]', action: 'delivery-location', section: 'ACCOUNT' },
  { icon: Moon, label: 'Prayer Times', subtitle: 'Salah & Qibla', color: 'text-[#38BDF8]', action: 'prayer-times', section: 'ACCOUNT' },
  { icon: Bell, label: 'Notifications', subtitle: '', color: 'text-[#F5C451]', action: 'notifications', section: 'ACCOUNT' },
  { icon: Headphones, label: 'Support', subtitle: 'Get help & tickets', color: 'text-[#38BDF8]', action: 'support', section: 'SUPPORT' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-[#38BDF8]', action: 'security', section: 'SUPPORT' },
  { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#10E07A]', action: 'switch-role', section: 'SUPPORT' },
  { icon: User, label: 'Edit Profile', subtitle: 'Update your personal info', color: 'text-[#10E07A]', action: 'edit-profile', section: 'SUPPORT' },
  { icon: HelpCircle, label: 'Help Center', subtitle: 'FAQs & guides', color: 'text-[#10E07A]', action: 'help-center', section: 'SUPPORT' },
  { icon: FileText, label: 'Legal', subtitle: 'Terms, privacy & about', color: 'text-[#A78BFA]', action: 'legal', section: 'SUPPORT' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings', section: 'SUPPORT' },
];

const vendorMenu = [
  { icon: ChefHat, label: 'Smart Kitchen', subtitle: 'Live AI cooking coach', color: 'text-[#10E07A]', action: 'smart-kitchen', section: 'SMART KITCHEN' },
  { icon: CalendarDays, label: 'Meal Planner', subtitle: 'Plan your Iftar & Sahur week', color: 'text-[#A78BFA]', action: 'meal-planner', section: 'SMART KITCHEN' },
  { icon: BarChart3, label: 'Sales Insights', subtitle: 'View analytics & trends', color: 'text-[#F5C451]', action: 'vendor-insights', section: 'REWARDS & GIVING' },
  { icon: Package, label: 'Quick Stock Control', subtitle: 'Manage inventory', color: 'text-[#10E07A]', action: 'vendor-stock', section: 'REWARDS & GIVING' },
  { icon: TrendingUp, label: 'Dynamic Pricing', subtitle: 'Optimize your prices', color: 'text-[#38BDF8]', action: 'vendor-pricing', section: 'REWARDS & GIVING' },
  { icon: Banknote, label: 'Payouts', subtitle: 'Withdraw to bank', color: 'text-[#F5C451]', action: 'payout', section: 'REWARDS & GIVING' },
  { icon: Wallet, label: 'My Wallet', subtitle: 'Balance & top-up', color: 'text-[#10E07A]', action: 'wallet', section: 'REWARDS & GIVING' },
  { icon: Shield, label: 'KYC Verification', subtitle: 'Verify your identity', color: 'text-[#38BDF8]', action: 'kyc', section: 'REWARDS & GIVING' },
  { icon: Gift, label: 'SwiftRewards', subtitle: '', color: 'text-[#F5C451]', action: 'rewards', section: 'REWARDS & GIVING' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-[#10E07A]', action: 'eco-impact', section: 'REWARDS & GIVING' },
  { icon: MessageSquare, label: 'SwiftCommunity', subtitle: 'Connect with vendors', color: 'text-[#A78BFA]', action: 'community', section: 'REWARDS & GIVING' },
  { icon: Moon, label: 'Prayer Times', subtitle: 'Salah & Qibla', color: 'text-[#38BDF8]', action: 'prayer-times', section: 'ACCOUNT' },
  { icon: Bell, label: 'Notifications', subtitle: '', color: 'text-[#F5C451]', action: 'notifications', section: 'ACCOUNT' },
  { icon: Headphones, label: 'Support', subtitle: 'Get help & tickets', color: 'text-[#38BDF8]', action: 'support', section: 'SUPPORT' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-[#38BDF8]', action: 'security', section: 'SUPPORT' },
  { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#F5C451]', action: 'switch-role', section: 'SUPPORT' },
  { icon: User, label: 'Edit Profile', subtitle: 'Update your personal info', color: 'text-[#10E07A]', action: 'edit-profile', section: 'SUPPORT' },
  { icon: HelpCircle, label: 'Help Center', subtitle: 'FAQs & guides', color: 'text-[#10E07A]', action: 'help-center', section: 'SUPPORT' },
  { icon: FileText, label: 'Legal', subtitle: 'Terms, privacy & about', color: 'text-[#A78BFA]', action: 'legal', section: 'SUPPORT' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings', section: 'SUPPORT' },
];

const riderMenu = [
  { icon: ChefHat, label: 'Smart Kitchen', subtitle: 'Live AI cooking coach', color: 'text-[#10E07A]', action: 'smart-kitchen', section: 'SMART KITCHEN' },
  { icon: CalendarDays, label: 'Meal Planner', subtitle: 'Plan your Iftar & Sahur week', color: 'text-[#A78BFA]', action: 'meal-planner', section: 'SMART KITCHEN' },
  { icon: BarChart3, label: 'Performance Hub', subtitle: 'Track your metrics', color: 'text-[#38BDF8]', action: 'rider-performance', section: 'REWARDS & GIVING' },
  { icon: Navigation, label: 'AI Smart Route', subtitle: 'Optimized deliveries', color: 'text-[#38BDF8]', action: 'rider-smart-route', section: 'REWARDS & GIVING' },
  { icon: Zap, label: 'Power Finder', subtitle: 'Find charging stations', color: 'text-[#F5C451]', action: 'rider-power-finder', section: 'REWARDS & GIVING' },
  { icon: Banknote, label: 'Payouts', subtitle: 'Withdraw to bank', color: 'text-[#38BDF8]', action: 'payout', section: 'REWARDS & GIVING' },
  { icon: Wallet, label: 'My Wallet', subtitle: 'Balance & top-up', color: 'text-[#10E07A]', action: 'wallet', section: 'REWARDS & GIVING' },
  { icon: Shield, label: 'KYC Verification', subtitle: 'Verify your identity', color: 'text-[#38BDF8]', action: 'kyc', section: 'REWARDS & GIVING' },
  { icon: Users, label: 'Refer a Driver', subtitle: 'Earn ₦2,000 per referral', color: 'text-[#38BDF8]', action: 'refer', section: 'REWARDS & GIVING' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-[#10E07A]', action: 'eco-impact', section: 'REWARDS & GIVING' },
  { icon: Moon, label: 'Prayer Times', subtitle: 'Salah & Qibla', color: 'text-[#38BDF8]', action: 'prayer-times', section: 'ACCOUNT' },
  { icon: Bell, label: 'Notifications', subtitle: '', color: 'text-[#F5C451]', action: 'notifications', section: 'ACCOUNT' },
  { icon: Headphones, label: 'Support', subtitle: 'Get help & tickets', color: 'text-[#38BDF8]', action: 'support', section: 'SUPPORT' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-[#38BDF8]', action: 'security', section: 'SUPPORT' },
  { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#38BDF8]', action: 'switch-role', section: 'SUPPORT' },
  { icon: User, label: 'Edit Profile', subtitle: 'Update your personal info', color: 'text-[#10E07A]', action: 'edit-profile', section: 'SUPPORT' },
  { icon: HelpCircle, label: 'Help Center', subtitle: 'FAQs & guides', color: 'text-[#10E07A]', action: 'help-center', section: 'SUPPORT' },
  { icon: FileText, label: 'Legal', subtitle: 'Terms, privacy & about', color: 'text-[#A78BFA]', action: 'legal', section: 'SUPPORT' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings', section: 'SUPPORT' },
];

/* Order in which menu sections render */
const MENU_SECTION_ORDER = ['SMART KITCHEN', 'REWARDS & GIVING', 'ACCOUNT', 'SUPPORT'] as const;

/* Loyalty tier → pill styling */
const TIER_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: '0 0 12px rgba(245,158,11,0.25)' },
  silver: { bg: 'bg-slate-300/10', border: 'border-slate-300/30', text: 'text-slate-200', glow: '0 0 12px rgba(226,232,240,0.18)' },
  gold: { bg: 'bg-[#F5C451]/10', border: 'border-[#F5C451]/40', text: 'text-[#F5C451]', glow: '0 0 14px rgba(245,196,81,0.35)' },
  platinum: { bg: 'bg-[#A78BFA]/10', border: 'border-[#A78BFA]/40', text: 'text-[#A78BFA]', glow: '0 0 14px rgba(167,139,250,0.35)' },
};

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
    accent: '#10E07A',
    bgClass: 'bg-[#10E07A]/10 border-[#10E07A]/30',
    iconColor: 'text-[#10E07A]',
  },
  {
    role: 'vendor' as const,
    icon: Store,
    title: 'Vendor',
    description: 'Manage your store & accept orders',
    accent: '#F5C451',
    bgClass: 'bg-[#F5C451]/10 border-[#F5C451]/30',
    iconColor: 'text-[#F5C451]',
  },
  {
    role: 'rider' as const,
    icon: Bike,
    title: 'Rider',
    description: 'Deliver orders & earn money',
    accent: '#38BDF8',
    bgClass: 'bg-[#38BDF8]/10 border-[#38BDF8]/30',
    iconColor: 'text-[#38BDF8]',
  },
];

/* ──────────────── Toggle Switch Component ──────────────── */

function ToggleSwitch({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-[#10E07A]' : 'bg-white/10'}`}
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

  // Loyalty redemption
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const { toast } = useToast();
  const { userName, userArea, userEmail, logout, setShowAuth, userRole, setUserRole } = useAuth();
  const { hasanatPoints, swiftPoints, loyaltyTier, dailyStreak, claimDailyPoints, setSwiftPoints } = useLoyalty();
  const { setActiveTab } = useNavigation();
  const { cartItems } = useCart();
  const { orders } = useOrders();
  const { vendorStoreName, vendorBusinessCategory, vendorOnline, vendorBalance, vendorTotalEarnings, vendorPendingSettlement } = useVendor();
  const { riderOnline, riderEarnings, riderCompletedToday, riderRating, riderVehicleType } = useRider();
  const referralCount = useReferralCount();

  /* ── Cooking Journey state (ref-guarded fetch, no setState in effect body) ── */
  const [cookingStats, setCookingStats] = useState<CookingStats | null>(null);
  const [cookingLoading, setCookingLoading] = useState(true);
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/cooking-sessions?email=' + encodeURIComponent(userEmail || 'guest'))
      .then(r => r.json())
      .then((data: CookingStats) => {
        setCookingStats(data);
        setCookingLoading(false);
      })
      .catch(() => {
        setCookingStats(null);
        setCookingLoading(false);
      });
  }, [userEmail]);

  const tierStyle = TIER_STYLES[loyaltyTier] || TIER_STYLES.bronze;

  const handleClaimDaily = () => {
    claimDailyPoints();
    toast({ title: '🎁 +50 Hasanat points claimed!', description: `You're on a ${dailyStreak + 1}-day streak. Come back tomorrow!` });
  };

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
      case 'smart-kitchen':
        useAppStore.getState().setActiveModal('smart-kitchen');
        break;
      case 'meal-planner':
        useAppStore.getState().setActiveModal('meal-planner');
        break;
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
        useAppStore.getState().setActiveModal('prayer-times');
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
      case 'wallet':
        useAppStore.getState().setActiveModal('wallet');
        break;
      case 'payout':
        useAppStore.getState().setActiveModal('payout');
        break;
      case 'kyc':
        useAppStore.getState().setActiveModal('kyc');
        break;
      case 'support':
        useAppStore.getState().setActiveModal('support');
        break;
      case 'switch-role':
        setShowSwitchRole(true);
        break;
      case 'edit-profile':
        useAppStore.getState().setActiveModal('edit-profile');
        break;
      case 'help-center':
        useAppStore.getState().setActiveModal('help-center');
        break;
      case 'legal':
        useAppStore.getState().setActiveModal('legal');
        break;
      case 'notifications':
        toast({ title: 'Notifications 🔔', description: 'Tap the bell icon in the top right to see your notifications' });
        break;
      case 'security':
        setModalContent({
          title: 'Security & Privacy',
          content: (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 glass-card rounded-xl">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-[#10E07A]" />
                  <div>
                    <p className="text-white font-bold text-sm">Biometric Login</p>
                    <p className="text-white/65 text-xs">Use fingerprint or Face ID</p>
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
              <div className="flex justify-between items-center p-3 glass-card rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#10E07A]" />
                  <div>
                    <p className="text-white font-bold text-sm">Two-Factor Auth</p>
                    <p className="text-white/65 text-xs">Extra security for your account</p>
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
              <div className="flex justify-between items-center p-3 glass-card rounded-xl">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-[#10E07A]" />
                  <div>
                    <p className="text-white font-bold text-sm">Data Encryption</p>
                    <p className="text-white/65 text-xs">End-to-end encryption</p>
                  </div>
                </div>
                <span className="text-[#10E07A] text-xs font-bold">Active</span>
              </div>
            </div>
          ),
        });
        setShowModal(true);
        break;
      case 'settings':
        useAppStore.getState().setActiveModal('settings');
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

  /* ── Loyalty Redemption ── */
  const REWARDS = [
    { id: 'free-delivery', label: 'Free Delivery',  cost: 500,  icon: '🛵', accent: '#10E07A' },
    { id: 'ngn-500',       label: '₦500 Off',        cost: 1000, icon: '💸', accent: '#F5C451' },
    { id: 'ngn-1000',      label: '₦1000 Off',       cost: 2000, icon: '💰', accent: '#A78BFA' },
    { id: 'ngn-2500',      label: '₦2500 Off',       cost: 5000, icon: '🏆', accent: '#38BDF8' },
  ];

  const handleRedeem = async (rewardId: string, label: string, cost: number) => {
    if (!userEmail) {
      toast({ title: 'Sign in required', description: 'Please sign in to redeem points.', variant: 'destructive' });
      return;
    }
    if (swiftPoints < cost) {
      toast({
        title: 'Not enough points',
        description: `You need ${cost.toLocaleString()} swift points but have ${swiftPoints.toLocaleString()}.`,
        variant: 'destructive',
      });
      return;
    }

    setRedeeming(rewardId);
    try {
      const res = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, rewardType: rewardId }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data?.success && data.coupon?.code) {
        setSwiftPoints(data.remainingPoints ?? Math.max(0, swiftPoints - cost));
        toast({
          title: `Coupon ${data.coupon.code} created! 🎁`,
          description: `Use at checkout for ${label}.`,
        });
      } else {
        toast({
          title: 'Redemption failed',
          description: data?.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      // Fallback: optimistic deduct + local coupon code
      const fallbackCode = `REDEM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setSwiftPoints(Math.max(0, swiftPoints - cost));
      toast({
        title: `Coupon ${fallbackCode} created! 🎁`,
        description: `Use at checkout for ${label}.`,
      });
    } finally {
      setRedeeming(null);
    }
  };

  /* ══════════════════════ RENDER ══════════════════════ */

  return (
    <main className="flex-1 overflow-y-auto pb-32">

      {/* ─── Profile Header (premium-card with aurora mesh) ─── */}
      <div className="px-5 pt-6 pb-2">
        <div className="relative overflow-hidden rounded-3xl premium-card">
          <div className="absolute inset-0 aurora-hero opacity-60 pointer-events-none" />
          <div className="relative p-5 flex items-center gap-3 sm:gap-4">
            {/* Avatar wrapped in a emerald→gold→violet gradient ring */}
            <div
              className="p-[2px] rounded-full shrink-0"
              style={{ background: 'linear-gradient(135deg, #10E07A, #F5C451, #A78BFA)' }}
            >
              {userRole === 'vendor' ? (
                /* Vendor Header */
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#06070B] border border-[#F5C451]/30"
                  style={{ boxShadow: '0 0 20px rgba(245,196,81,0.18)' }}>
                  <Store className="w-8 h-8 text-[#F5C451]" />
                </div>
              ) : userRole === 'rider' ? (
                /* Rider Header */
                <div className="relative">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#06070B] border border-[#38BDF8]/30"
                    style={{ boxShadow: '0 0 20px rgba(56,189,248,0.18)' }}>
                    <Bike className="w-8 h-8 text-[#38BDF8]" />
                  </div>
                  <span className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-[#06070B] ${
                    riderOnline ? 'bg-[#10E07A] animate-pulse' : 'bg-white/30'
                  }`} />
                </div>
              ) : (
                /* Customer Header */
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#06070B] border border-[#10E07A]/30 green-glow">
                  <User className="w-8 h-8 text-[#10E07A]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white text-xl font-bold truncate tracking-tight">{displayName}</h2>
                <span className="beta-badge">Beta</span>
                {userRole === 'vendor' && (
                  <span className={`w-2.5 h-2.5 rounded-full ${vendorOnline ? 'bg-[#10E07A] shadow-[0_0_8px_rgba(16,224,122,0.5)]' : 'bg-white/30'}`} />
                )}
              </div>

              {userRole === 'vendor' ? (
                <>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[#F5C451] text-[10px] font-bold bg-[#F5C451]/10 px-2 py-0.5 rounded-full border border-[#F5C451]/20">
                      {vendorBusinessCategory || 'General'}
                    </span>
                    <span className="text-white/60 text-xs">•</span>
                    <span className="text-white/50 text-xs">{vendorOnline ? '🟢 Online' : '⚫ Offline'}</span>
                  </div>
                  <p className="text-white/65 text-[11px] mt-0.5">Ramadan 2026</p>
                </>
              ) : userRole === 'rider' ? (
                <>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`size-2 rounded-full ${riderOnline ? 'bg-[#10E07A]' : 'bg-white/30'}`} />
                    <span className={`text-xs font-bold ${riderOnline ? 'text-[#10E07A]' : 'text-white/65'}`}>
                      {riderOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className="text-white/20 text-xs">•</span>
                    <span className="text-[#F5C451] text-xs font-bold">⭐ Elite Rider</span>
                  </div>
                  <p className="text-white/50 text-[11px] mt-0.5">{riderVehicleType || 'Motorcycle'}</p>
                </>
              ) : (
                <>
                  <p className="text-white/50 text-sm">{displayArea}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}
                      style={{ boxShadow: tierStyle.glow }}
                    >
                      <Award className="w-3 h-3" />
                      {loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1)} Member
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => useAppStore.getState().setActiveModal('settings')}
              className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors shrink-0 active:scale-95"
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {userRole === 'vendor' ? (
            <>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-[#10E07A] text-lg font-black">{formatNaira(vendorBalance)}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase mt-1">Revenue</p>
              </div>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-[#F5C451] text-lg font-black">{vendorSalesInsights.todayOrders}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase mt-1">Orders Today</p>
              </div>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-[#38BDF8] text-lg font-black">{formatNaira(vendorSalesInsights.avgOrderValue)}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase mt-1">Avg Order</p>
              </div>
            </>
          ) : userRole === 'rider' ? (
            <>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <div className="w-8 h-8 bg-[#10E07A]/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <DollarSign className="w-4 h-4 text-[#10E07A]" />
                </div>
                <p className="text-[#10E07A] text-lg font-black">{formatNaira(riderEarnings)}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase mt-0.5">Earnings Today</p>
              </div>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <div className="w-8 h-8 bg-[#38BDF8]/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Zap className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <p className="text-[#38BDF8] text-lg font-black">{riderCompletedToday}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase mt-0.5">Completed</p>
              </div>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <div className="w-8 h-8 bg-[#F5C451]/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Star className="w-4 h-4 text-[#F5C451]" />
                </div>
                <p className="text-[#F5C451] text-lg font-black">{riderRating}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase mt-0.5">Rating</p>
              </div>
            </>
          ) : (
            <>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-[#F5C451] text-xl font-black">{hasanatPoints.toLocaleString()}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase">Hasanat Pts</p>
              </div>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-[#10E07A] text-xl font-black">{swiftPoints.toLocaleString()}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase">Swift Pts</p>
              </div>
              <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className={`w-4 h-4 ${dailyStreak >= 3 ? 'text-orange-500' : 'text-orange-400'}`} />
                  <p className={`text-xl font-black ${dailyStreak >= 3 ? 'text-orange-500' : 'text-orange-400'}`}>{dailyStreak}</p>
                </div>
                <p className="text-white/65 text-[10px] font-bold uppercase">Day Streak</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Daily Streak flame widget (banner) ─── */}
      <div className="px-5 mt-3">
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-950/40 via-[#0F1118] to-[#0F1118] p-3 sm:p-4 flex items-center gap-3">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/15 blur-[40px] pointer-events-none" />
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${dailyStreak >= 3 ? 'bg-orange-500/20' : 'bg-orange-500/10'}`}>
            <Flame className={`w-6 h-6 ${dailyStreak >= 3 ? 'text-orange-500 animate-pulse' : 'text-orange-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-sm">
                {dailyStreak}-day streak
              </p>
              {dailyStreak >= 3 && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/30">
                  🔥 On fire!
                </span>
              )}
            </div>
            <p className="text-white/50 text-xs mt-0.5">Claim your daily Hasanat bonus</p>
          </div>
          <button
            onClick={handleClaimDaily}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#F5C451] to-[#10E07A] text-[#06070B] text-xs font-extrabold hover:opacity-90 transition-opacity shrink-0 active:scale-95"
          >
            +50
          </button>
        </div>
      </div>

      {/* ─── My Cooking Journey (achievement showcase) ─── */}
      <div className="px-5 mt-6">
        <div className="relative overflow-hidden rounded-2xl border border-[#10E07A]/20 bg-[#0F1118] p-5 aurora-soft">
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#10E07A]/10 blur-[44px] pointer-events-none" />
          {/* Header row */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#10E07A]/15 flex items-center justify-center border border-[#10E07A]/30 icon-tile">
                <ChefHat className="w-5 h-5 text-[#10E07A] relative z-10" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-sm leading-tight heading-accent">My Cooking Journey</h3>
                <p className="text-white/65 text-[11px] leading-tight">Smart Kitchen achievements</p>
              </div>
            </div>
            <button
              onClick={() => useAppStore.getState().setActiveModal('smart-kitchen')}
              className="text-[#10E07A] text-xs font-bold hover:underline shrink-0"
            >
              View Smart Kitchen →
            </button>
          </div>

          {cookingLoading ? (
            /* Loading skeleton */
            <div className="relative space-y-3 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div className="h-16 bg-white/5 rounded-xl" />
                <div className="h-16 bg-white/5 rounded-xl" />
                <div className="h-16 bg-white/5 rounded-xl" />
              </div>
              <div className="flex gap-2 overflow-hidden">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-14 h-14 rounded-full bg-white/5 shrink-0" />
                ))}
              </div>
              <div className="h-2 bg-white/5 rounded-full" />
            </div>
          ) : cookingStats && (cookingStats.totalSessions ?? 0) > 0 ? (
            <div className="relative space-y-4">
              {/* 3-stat row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div className="glass-card rounded-xl p-3 text-center">
                  <p className="text-[#10E07A] text-lg font-black">{cookingStats.totalSessions ?? 0}</p>
                  <p className="text-white/65 text-[10px] font-bold uppercase">Sessions Cooked</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <p className="text-[#A78BFA] text-lg font-black">{cookingStats.liveAIUses ?? 0}</p>
                  <p className="text-white/65 text-[10px] font-bold uppercase">Live AI Sessions</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <p className="text-[#F5C451] text-lg font-black">{cookingStats.totalCookTimeMins ?? 0}<span className="text-xs">m</span></p>
                  <p className="text-white/65 text-[10px] font-bold uppercase">Total Cook Time</p>
                </div>
              </div>

              {/* Achievement badges (horizontal scroll) */}
              {(() => {
                const unlocked = (cookingStats.achievements ?? []).filter(a => a.unlocked);
                const total = (cookingStats.achievements ?? []).length || 8;
                return (
                  <>
                    {unlocked.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                        {unlocked.map(a => (
                          <div key={a.id} className="flex flex-col items-center gap-1 shrink-0 w-16">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F5C451]/20 to-[#10E07A]/15 border border-[#F5C451]/40 flex items-center justify-center text-2xl"
                              style={{ boxShadow: '0 0 12px rgba(245,196,81,0.18)' }}>
                              <span>{a.icon}</span>
                            </div>
                            <p className="text-white/70 text-[9px] font-bold text-center leading-tight">{a.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/60 text-[11px] font-bold flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-[#F5C451]" />
                          Achievements unlocked
                        </span>
                        <span className="text-white font-extrabold text-xs">{unlocked.length} / {total}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#10E07A] to-[#F5C451] transition-all"
                          style={{ width: `${(unlocked.length / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* Empty / error state */
            <div className="relative text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-[#10E07A]/10 border border-[#10E07A]/30 flex items-center justify-center mx-auto mb-3 icon-tile">
                <ChefHat className="w-7 h-7 text-[#10E07A] relative z-10" />
              </div>
              <p className="text-white/70 text-sm font-bold">No cooking sessions yet</p>
              <p className="text-white/65 text-xs mt-1">Cook with Chef Safa to unlock achievements</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Eco Impact ─── */}
      <div className="px-5 mt-6">
        <button
          onClick={() => handleMenuClick('eco-impact')}
          className="w-full text-left"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 to-[#06070B] border border-emerald-500/20 p-5 hover:border-emerald-500/30 transition-colors aurora-soft">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px]" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 icon-tile">
                <Leaf className="w-5 h-5 text-emerald-400 relative z-10" />
              </div>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Eco Impact</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-white text-lg font-black">{ecoImpactData.co2Saved}</p>
                <p className="text-white/65 text-[10px]">CO₂ Saved</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-black">{ecoImpactData.ecoOrders}</p>
                <p className="text-white/65 text-[10px]">Eco Orders</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-black">₦3K</p>
                <p className="text-white/65 text-[10px]">Donated</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* ─── Loyalty Redemption (Customer only) ─── */}
      {userRole === 'customer' && (
        <div className="px-5 mt-6">
          <div className="relative overflow-hidden rounded-2xl border border-[#F5C451]/25 bg-gradient-to-br from-[#F5C451]/[0.08] via-[#0F1118] to-[#0F1118] p-5 aurora-soft">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#F5C451]/15 blur-[44px] pointer-events-none" />
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F5C451]/15 flex items-center justify-center border border-[#F5C451]/30 icon-tile">
                  <Gift className="w-5 h-5 text-[#F5C451] relative z-10" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-sm leading-tight heading-accent">Redeem Points</h3>
                  <p className="text-white/65 text-[11px] leading-tight">Turn Swift Points into coupons</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#10E07A] text-lg font-black leading-tight">{swiftPoints.toLocaleString()}</p>
                <p className="text-white/65 text-[10px] font-bold uppercase leading-tight">Swift Pts</p>
              </div>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REWARDS.map(reward => {
                const affordable = swiftPoints >= reward.cost;
                const isRedeeming = redeeming === reward.id;
                return (
                  <motion.button
                    key={reward.id}
                    whileTap={{ scale: 0.96 }}
                    disabled={!affordable || isRedeeming}
                    onClick={() => handleRedeem(reward.id, reward.label, reward.cost)}
                    className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                      affordable
                        ? 'bg-white/[0.03] border-white/10 hover:border-[#F5C451]/40'
                        : 'bg-white/[0.01] border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-2xl">{reward.icon}</span>
                      {affordable ? (
                        <Tag className="w-3.5 h-3.5" style={{ color: reward.accent }} />
                      ) : (
                        <span className="text-[9px] text-white/60 font-bold uppercase">Locked</span>
                      )}
                    </div>
                    <p className="text-white font-bold text-xs">{reward.label}</p>
                    <p className="text-[#F5C451] text-[10px] font-bold mt-0.5">{reward.cost.toLocaleString()} pts</p>
                    {isRedeeming && (
                      <div className="absolute inset-0 bg-[#06070B]/70 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-[#F5C451] animate-spin" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Menu Items (grouped by section) ─── */}
      <div className="px-5 mt-6">
        <div className="space-y-5">
          {MENU_SECTION_ORDER.map((section) => {
            const sectionItems = menuWithDynamicSubtitles.filter(i => i.section === section);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section} className="space-y-2">
                <p className="text-white/60 text-[10px] font-extrabold tracking-widest px-1">{section}</p>
                {sectionItems.map((item, i) => {
                  const Icon = item.icon;
                  const isSwitchRole = item.action === 'switch-role';
                  return (
                    <motion.button
                      key={`${section}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleMenuClick(item.action)}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-colors w-full text-left hover:bg-white/5 active:scale-[0.99] ${
                        isSwitchRole
                          ? 'aurora-card border-white/10 hover:border-white/20'
                          : 'glass-card border-white/[0.07] hover:border-white/15'
                      }`}
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 icon-tile">
                        <Icon className={`w-5 h-5 ${item.color} relative z-10`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{item.label}</p>
                        {item.subtitle && <p className="text-white/65 text-xs truncate">{item.subtitle}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Logout Button ─── */}
      <div className="px-5 mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#FB7185]/5 rounded-2xl border border-[#FB7185]/10 hover:border-[#FB7185]/20 transition-colors w-full text-left active:scale-[0.99]"
        >
          <div className="w-10 h-10 bg-[#FB7185]/10 rounded-xl flex items-center justify-center shrink-0 icon-tile">
            <LogOut className="w-5 h-5 text-[#FB7185] relative z-10" />
          </div>
          <div className="flex-1">
            <p className="text-[#FB7185] font-bold text-sm">Log Out</p>
            <p className="text-[#FB7185]/40 text-xs">Sign out of your account</p>
          </div>
        </button>
      </div>

      {/* ─── Charity Quick Actions (Customer only) ─── */}
      {userRole === 'customer' && (
        <div className="px-5 mt-6 mb-6">
          <h3 className="text-white text-lg font-extrabold mb-4 flex items-center gap-2 heading-accent">
            <Heart className="w-5 h-5 text-[#FB7185]" />
            Give Back This Ramadan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {charityItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => handleCharityClick(item)}
                className="glass-card rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-white/15 transition-colors text-left active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[#F5C451] text-2xl mb-2">{item.icon}</span>
                <p className="text-white font-bold text-sm">{item.name}</p>
                <p className="text-white/65 text-[10px] mt-0.5">{item.description}</p>
                {item.amount > 0 && (
                  <p className="text-[#10E07A] text-xs font-bold mt-2">From {formatNaira(item.amount)}</p>
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
              className="fixed bottom-0 left-0 right-0 max-h-[70vh] bg-[#0F1118] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/10"
            >
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/5">
                <h2 className="text-white font-bold tracking-tight">{modalContent.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
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
              className="fixed bottom-0 left-0 right-0 bg-[#0F1118] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div>
                  <h2 className="text-white text-lg font-bold tracking-tight">Switch Role</h2>
                  <p className="text-white/65 text-xs mt-0.5">Choose how you want to use SwiftRamadan</p>
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
                      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all text-left ${
                        isActive
                          ? 'bg-white/5 border-white/20'
                          : 'glass-card border-white/[0.07] hover:border-white/15'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${card.bgClass} icon-tile`}
                        style={{ boxShadow: isActive ? `0 0 20px ${card.accent}20` : 'none' }}>
                        <Icon className={`w-7 h-7 ${card.iconColor} relative z-10`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-base">{card.title}</p>
                          {isActive && (
                            <span className="soft-chip">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-white/65 text-xs mt-0.5">{card.description}</p>
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
