'use client';

import {
  Store,
  ChevronRight,
  BarChart3,
  Wallet,
  UtensilsCrossed,
  Clock,
  Moon,
  Users,
  ArrowLeftRight,
  Settings,
  HelpCircle,
  LogOut,
  TrendingUp,
  MapPin,
  Edit3,
  Package,
  Star,
} from 'lucide-react';
import { useAppStore, useVendor, useNavigation, useOnboarding, useAuth } from '@/lib/store-selectors';
import { formatNaira, vendorSalesInsights } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const menuItems = [
  { icon: BarChart3, label: 'Sales Insights', subtitle: 'View analytics & trends', color: 'text-[#F5C451]', action: 'vendor-insights' },
  { icon: Wallet, label: 'Payment & Payouts', subtitle: 'Bank details & withdrawals', color: 'text-emerald-400', action: 'payment-payouts' },
  { icon: UtensilsCrossed, label: 'Menu Management', subtitle: 'Edit items & prices', color: 'text-orange-400', action: 'menu-management' },
  { icon: Clock, label: 'Business Hours', subtitle: 'Set availability', color: 'text-cyan-400', action: 'business-hours' },
  { icon: Moon, label: 'Prayer Times', subtitle: 'Ramadan prayer schedule', color: 'text-violet-400', action: 'prayer-times' },
  { icon: Users, label: 'Community Forum', subtitle: 'Connect with vendors', color: 'text-pink-400', action: 'community' },
  { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#F5C451]', action: 'switch-role' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings' },
  { icon: HelpCircle, label: 'Help & Support', subtitle: 'Get assistance', color: 'text-blue-400', action: 'community' },
];

export default function VendorProfileTab() {
  const {
    vendorStoreName,
    vendorBusinessCategory,
    vendorBusinessAddress,
    vendorOnline,
    setVendorOnline,
    vendorBalance,
    vendorPendingSettlement,
    vendorTotalEarnings,
    vendorOpenTime,
    vendorCloseTime,
  } = useVendor();
  const { setActiveModal, setActiveTab } = useNavigation();
  const { setShowOnboarding, setOnboardingStep } = useOnboarding();
  const { setShowAuth, logout } = useAuth();

  const { toast } = useToast();

  const storeName = vendorStoreName || 'My Store';

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'vendor-insights':
        setActiveModal('vendor-insights');
        break;
      case 'payment-payouts':
        setShowOnboarding(true);
        setOnboardingStep(2);
        break;
      case 'menu-management':
        setActiveTab('vendor-store');
        break;
      case 'business-hours':
        toast({
          title: 'Business Hours 🕐',
          description: `Current hours: ${vendorOpenTime || '08:00'} - ${vendorCloseTime || '22:00'}`,
        });
        break;
      case 'prayer-times':
        setActiveModal('prayer-times');
        break;
      case 'community':
        setActiveModal('community');
        break;
      case 'switch-role':
        setShowAuth('role');
        break;
      case 'settings':
        useAppStore.getState().setActiveModal('settings');
        break;
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged out', description: 'You have been signed out. See you soon! 👋' });
  };

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Profile Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-[#F5C451]/40 bg-[#F5C451]/15 gold-glow">
            <Store className="w-8 h-8 text-[#F5C451]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-xl font-bold">{storeName}</h2>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  vendorOnline ? 'bg-[#10E07A] shadow-[0_0_8px_rgba(16,224,122,0.5)]' : 'bg-white/30'
                }`}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#F5C451] text-[10px] font-bold bg-[#F5C451]/10 px-2 py-0.5 rounded-full border border-[#F5C451]/20">
                {vendorBusinessCategory || 'General'}
              </span>
            </div>
            <p className="text-white/40 text-xs mt-1">Ramadan 2026 Vendor</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mt-5">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5"
          >
            <p className="text-[#10E07A] text-lg font-black">{formatNaira(vendorBalance)}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Available</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5"
          >
            <p className="text-[#F5C451] text-lg font-black">{formatNaira(vendorTotalEarnings)}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Ramadan Revenue</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5"
          >
            <p className="text-orange-400 text-lg font-black">{formatNaira(vendorPendingSettlement)}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Pending</p>
          </motion.div>
        </div>
      </div>

      {/* Store Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-4 mt-5"
      >
        <div className="bg-[#1A1D26] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm">Store Information</h3>
            <button
              onClick={() => {
                setShowOnboarding(true);
                setOnboardingStep(0);
              }}
              aria-label="Edit Store"
              className="flex items-center gap-1 text-[#F5C451] text-xs font-bold hover:opacity-80 transition-opacity"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Store
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Store className="w-4 h-4 text-[#F5C451] mt-0.5 shrink-0" />
              <div>
                <p className="text-white/40 text-[10px] uppercase font-bold">Store Name</p>
                <p className="text-white text-sm font-medium">{storeName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="w-4 h-4 text-[#F5C451] mt-0.5 shrink-0" />
              <div>
                <p className="text-white/40 text-[10px] uppercase font-bold">Business Category</p>
                <p className="text-white text-sm font-medium">{vendorBusinessCategory || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#F5C451] mt-0.5 shrink-0" />
              <div>
                <p className="text-white/40 text-[10px] uppercase font-bold">Business Address</p>
                <p className="text-white text-sm font-medium">{vendorBusinessAddress || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mt-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-sm font-extrabold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F5C451]" />
            Performance Highlights
          </h3>
          <button
            onClick={() => setActiveModal('vendor-insights')}
            aria-label="View Full Insights"
            className="text-[#F5C451] text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            View Full Insights <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5">
            <Star className="w-5 h-5 text-[#F5C451] mb-2" />
            <p className="text-white text-sm font-bold">{vendorSalesInsights.topSellingItem}</p>
            <p className="text-white/40 text-[10px] mt-0.5">Top Selling Item</p>
          </div>
          <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5">
            <Clock className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-white text-sm font-bold">{vendorSalesInsights.peakHour}</p>
            <p className="text-white/40 text-[10px] mt-0.5">Peak Hour</p>
          </div>
          <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5">
            <Users className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-white text-sm font-bold">{vendorSalesInsights.customerRetention}%</p>
            <p className="text-white/40 text-[10px] mt-0.5">Customer Retention</p>
          </div>
          <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5">
            <Wallet className="w-5 h-5 text-orange-400 mb-2" />
            <p className="text-white text-sm font-bold">{formatNaira(vendorSalesInsights.avgOrderValue)}</p>
            <p className="text-white/40 text-[10px] mt-0.5">Avg Order Value</p>
          </div>
        </div>
      </motion.div>

      {/* Menu Items */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-4 mt-6"
      >
        <div className="space-y-2">
          {menuItems.map((menuItem) => {
            const Icon = menuItem.icon;
            return (
              <motion.button
                key={menuItem.action}
                variants={item}
                onClick={() => handleMenuClick(menuItem.action)}
                className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors w-full text-left"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${menuItem.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{menuItem.label}</p>
                  <p className="text-white/40 text-xs">{menuItem.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </motion.button>
            );
          })}

          {/* Logout */}
          <motion.button
            variants={item}
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-colors w-full text-left"
          >
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-red-400 font-bold text-sm">Logout</p>
              <p className="text-white/30 text-xs">Sign out of your account</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400/30" />
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-6 mb-6"
      >
        <div className="flex gap-3">
          <button
            onClick={() => {
              setVendorOnline(!vendorOnline);
              toast({
                title: vendorOnline ? 'You\'re Offline 🟠' : 'You\'re Online! 🟢',
                description: vendorOnline
                  ? 'Your store is no longer accepting orders'
                  : 'Your store is now accepting orders',
              });
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
              vendorOnline
                ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                : 'bg-[#F5C451] text-[#05070A] hover:bg-[#FFE033] gold-glow'
            }`}
          >
            {vendorOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white/40" />
                Go Offline
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#05070A]" />
                Go Online
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vendor-earnings')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-[#F5C451]/10 border border-[#F5C451]/20 text-[#F5C451] hover:bg-[#F5C451]/20 transition-all"
          >
            <Wallet className="w-4 h-4" />
            Withdraw Funds
          </button>
        </div>
      </motion.div>
    </main>
  );
}
