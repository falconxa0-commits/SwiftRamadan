'use client';

import { motion } from 'framer-motion';
import {
  Bike, Star, DollarSign, CheckCircle, ChevronRight,
  Car, Zap, Clock, Heart, FileText, CreditCard, Users,
  MessageSquare, ArrowLeftRight, Settings, HelpCircle,
  LogOut, Wallet, Award, ShieldCheck, Moon, BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { toast } from '@/hooks/use-toast';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function RiderProfileTab() {
  const {
    userName,
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
    showAuth,
    setShowAuth,
    logout,
    setShowOnboarding,
    setOnboardingStep,
    setActiveModal,
  } = useAppStore();

  const displayName = userName || 'Rider';

  const onTimeRate = 98;
  const gratefulCustomers = 9;
  const bonusProgress = 85;
  const bonusTarget = 15000;
  const deliveriesToUnlock = 12;

  const menuItems = [
    { icon: DollarSign, label: 'Earnings History', subtitle: 'View all past earnings', color: 'text-[#13ec13]', action: 'earnings-history' },
    { icon: BarChart3, label: 'Performance Hub', subtitle: 'Detailed metrics & insights', color: 'text-[#3b82f6]', action: 'rider-performance' },
    { icon: CheckCircle, label: 'Delivery History', subtitle: 'Past deliveries & routes', color: 'text-[#3b82f6]', action: 'delivery-history' },
    { icon: Moon, label: 'Prayer Times & Qibla', subtitle: 'Never miss a prayer', color: 'text-[#FFD700]', action: 'prayer-times' },
    { icon: Clock, label: 'Sahur Wake-up Call', subtitle: 'Early morning reminders', color: 'text-cyan-400', action: 'sahur' },
    { icon: FileText, label: 'Documents & Verification', subtitle: 'ID, license & vehicle docs', color: 'text-amber-400', action: 'documents' },
    { icon: CreditCard, label: 'Payment Setup', subtitle: riderBankName ? `${riderBankName} ****${riderAccountNumber.slice(-4) || '0000'}` : 'Add bank account', color: 'text-[#3b82f6]', action: 'payment-setup' },
    { icon: Users, label: 'Refer a Driver', subtitle: 'Earn ₦2,000 per referral', color: 'text-cyan-400', action: 'refer' },
    { icon: MessageSquare, label: 'Community Forum', subtitle: 'Connect with other riders', color: 'text-violet-400', action: 'community' },
    { icon: ArrowLeftRight, label: 'Switch Role', subtitle: 'Customer / Vendor / Rider', color: 'text-[#3b82f6]', action: 'switch-role' },
    { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings' },
    { icon: HelpCircle, label: 'Help & Support', subtitle: 'FAQs & contact us', color: 'text-orange-400', action: 'help' },
  ];

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'earnings-history':
        toast({ title: 'Earnings History 💰', description: 'Viewing your earnings history' });
        break;
      case 'rider-performance':
        setActiveModal('rider-performance');
        break;
      case 'delivery-history':
        toast({ title: 'Delivery History 📦', description: 'Viewing delivery history' });
        break;
      case 'prayer-times':
        setActiveModal('prayer-times');
        break;
      case 'sahur':
        setActiveModal('sahur');
        break;
      case 'documents': {
        const isVerified = riderLicenseNumber.length > 0;
        toast({
          title: isVerified ? 'Documents Verified ✅' : 'Verification Pending ⏳',
          description: isVerified
            ? 'All your documents are up to date'
            : 'Some documents still need verification. Complete your profile to unlock all features.',
        });
        break;
      }
      case 'payment-setup':
        setShowOnboarding(true);
        setOnboardingStep(2);
        break;
      case 'refer':
        setActiveModal('refer');
        break;
      case 'community':
        setActiveModal('community');
        break;
      case 'switch-role':
        setShowAuth('role');
        break;
      case 'settings':
        toast({ title: 'Settings ⚙️', description: 'App preferences panel coming soon!' });
        break;
      case 'help':
        setActiveModal('community');
        break;
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged out', description: 'You have been signed out. See you soon! 👋' });
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

  // Circular progress SVG for on-time rate
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (onTimeRate / 100) * circumference;

  return (
    <motion.main
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex-1 overflow-y-auto pb-32 px-4 pt-4 bg-[#05070A]"
    >
      {/* ─── 1. Profile Header ─── */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#3b82f6]/20 flex items-center justify-center border-2 border-[#3b82f6]/40">
            <Bike className="w-8 h-8 text-[#3b82f6]" />
          </div>
          {/* Online/Offline dot */}
          <span className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-[#05070A] ${
            riderOnline ? 'bg-[#13ec13] animate-pulse' : 'bg-white/30'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-lg font-extrabold truncate">{displayName}</h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* Status indicator */}
            <span className={`size-2 rounded-full ${riderOnline ? 'bg-[#13ec13]' : 'bg-white/30'}`} />
            <span className={`text-xs font-bold ${riderOnline ? 'text-[#13ec13]' : 'text-white/40'}`}>
              {riderOnline ? 'Online' : 'Offline'}
            </span>
            <span className="text-white/20 text-xs">•</span>
            {/* Elite Rider badge */}
            <span className="material-symbols-outlined text-[#FFD700] text-sm">workspace_premium</span>
            <span className="text-[#FFD700] text-xs font-bold">Elite Rider</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700]" />
            <span className="text-[#FFD700] text-sm font-bold">{riderRating}</span>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. Stats Grid ─── */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 text-center">
          <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-5 h-5 text-[#13ec13]" />
          </div>
          <p className="text-white text-sm font-extrabold">{formatNaira(riderEarnings)}</p>
          <p className="text-white/40 text-[10px] mt-0.5">Today&apos;s Earnings</p>
        </div>
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 text-center">
          <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <p className="text-white text-xl font-extrabold">{riderCompletedToday}</p>
          <p className="text-white/40 text-[10px] mt-0.5">Completed Today</p>
        </div>
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 text-center">
          <div className="w-10 h-10 bg-[#FFD700]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-[#FFD700]" />
          </div>
          <p className="text-white text-xl font-extrabold">{riderRating}</p>
          <p className="text-white/40 text-[10px] mt-0.5">Rating</p>
        </div>
      </motion.div>

      {/* ─── 3. Vehicle Info Card ─── */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-extrabold flex items-center gap-2">
              {riderVehicleType.toLowerCase().includes('car') || riderVehicleType.toLowerCase().includes('auto')
                ? <Car className="w-4 h-4 text-[#3b82f6]" />
                : riderVehicleType.toLowerCase().includes('bicycle') || riderVehicleType.toLowerCase().includes('bike') || riderVehicleType.toLowerCase().includes('cycle')
                  ? <Bike className="w-4 h-4 text-[#3b82f6]" />
                  : <Zap className="w-4 h-4 text-[#3b82f6]" />
              }
              Vehicle Info
            </h3>
            <button
              onClick={() => {
                setShowOnboarding(true);
                setOnboardingStep(0);
              }}
              className="text-[#3b82f6] text-xs font-bold hover:text-[#3b82f6]/80 transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-white/30 text-[10px] font-medium uppercase tracking-wider">Type</p>
              <p className="text-white text-sm font-bold mt-0.5">{riderVehicleType || '—'}</p>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-medium uppercase tracking-wider">Plate No.</p>
              <p className="text-white text-sm font-bold mt-0.5 font-mono">{riderPlateNumber || '—'}</p>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-medium uppercase tracking-wider">Color</p>
              <p className="text-white text-sm font-bold mt-0.5">{riderVehicleColor || '—'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 4. Performance Section ─── */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-sm font-extrabold flex items-center gap-2">
            <Award className="w-4 h-4 text-[#FFD700]" />
            Performance
          </h3>
          <button
            onClick={() => setActiveModal('rider-performance')}
            className="flex items-center gap-1 text-[#3b82f6] text-xs font-bold hover:text-[#3b82f6]/80 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            View All
          </button>
        </div>

        {/* Ramadan Bonus Progress */}
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-bold">Ramadan Bonus Progress</span>
            <span className="text-[#FFD700] text-xs font-bold">{bonusProgress}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-3 mb-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#3b82f6] to-[#FFD700] h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${bonusProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-[10px]">{deliveriesToUnlock} more deliveries to unlock</p>
            <p className="text-[#FFD700] text-xs font-bold">₦{bonusTarget.toLocaleString()}</p>
          </div>
        </div>

        {/* On-Time Rate & Grateful Customers */}
        <div className="grid grid-cols-2 gap-3">
          {/* On-Time Rate with circular progress */}
          <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className="relative shrink-0">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r={radius} fill="none"
                  stroke="#3b82f6" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-extrabold">{onTimeRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-white text-sm font-bold">On-time</p>
              <p className="text-white/40 text-[10px]">Rate</p>
            </div>
          </div>

          {/* Grateful Customers */}
          <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <Heart className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <p className="text-white text-xl font-extrabold">{gratefulCustomers}</p>
              <p className="text-white/40 text-[10px]">Grateful customers</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 5. Menu Items ─── */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="space-y-2">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={i}
                variants={staggerItem}
                onClick={() => handleMenuClick(item.action)}
                className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors w-full text-left"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-white/40 text-xs truncate">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
              </motion.button>
            );
          })}

          {/* Logout */}
          <motion.button
            variants={staggerItem}
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-colors w-full text-left"
          >
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-red-500 font-bold text-sm">Logout</p>
              <p className="text-white/40 text-xs">Sign out of your account</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-500/30 shrink-0" />
          </motion.button>
        </div>
      </motion.div>

      {/* ─── 6. Quick Actions ─── */}
      <motion.div variants={staggerItem} className="pb-4">
        <div className="flex items-center gap-3">
          {/* Go Online / Go Offline Toggle */}
          <button
            onClick={handleToggleOnline}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
              riderOnline
                ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                : 'bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 shadow-lg shadow-[#3b82f6]/20'
            }`}
          >
            <Zap className="w-4 h-4" />
            {riderOnline ? 'Go Offline' : 'Go Online'}
          </button>

          {/* Cash Out */}
          <button
            onClick={() => toast({ title: 'Cash Out 💵', description: `Withdrawing ${formatNaira(riderEarnings)} to your bank account` })}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-[#1A1D26] border border-white/5 text-[#13ec13] hover:border-[#13ec13]/20 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Cash Out
          </button>
        </div>
      </motion.div>
    </motion.main>
  );
}
