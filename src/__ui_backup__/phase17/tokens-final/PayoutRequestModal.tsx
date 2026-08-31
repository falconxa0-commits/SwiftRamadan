'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowDownLeft,
  Building2,
  Wallet,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { useUserEmail, useVendor } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────── Types ──────────────────── */

interface PayoutRequestModalProps {
  onClose: () => void;
  role: 'vendor' | 'rider';
}

type PayoutStep = 'form' | 'success';

interface RiderPayoutData {
  availableBalance: number;
  todaysEarnings: number;
  totalEarnings: number;
  totalWithdrawn: number;
  weeklyEarnings: Array<{ day: string; amount: number }>;
  bankDetails: {
    bankName: string | null;
    accountNumber: string | null;
  };
  hasBankDetails: boolean;
}

interface VendorPayoutData {
  balance: number;
  pendingSettlement: number;
  totalEarnings: number;
  todayRevenue: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
  }>;
}

/* ─────────────── Confetti Particle ─────────────── */

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 400 + 100;
  const randomRotate = Math.random() * 720 - 360;
  const size = Math.random() * 8 + 4;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x: randomX, y: randomY, rotate: randomRotate, scale: 0.3 }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="absolute rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: '50%',
        top: '30%',
      }}
    />
  );
}

const confettiColors = ['#F5C451', '#10E07A', '#38BDF8', '#FF6B6B', '#A855F7', '#FFD700'];

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function PayoutRequestModal({ onClose, role }: PayoutRequestModalProps) {
  const userEmail = useUserEmail();
  const {
    vendorBalance,
    setVendorBalance,
    vendorPendingSettlement,
    setVendorPendingSettlement,
    vendorTotalEarnings,
    setVendorTotalEarnings,
  } = useVendor();
  const { toast } = useToast();

  const [step, setStep] = useState<PayoutStep>('form');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Rider data
  const [riderData, setRiderData] = useState<RiderPayoutData | null>(null);

  // Vendor data
  const [vendorData, setVendorData] = useState<VendorPayoutData | null>(null);

  // Success state
  const [successAmount, setSuccessAmount] = useState(0);
  const [successReference, setSuccessReference] = useState('');
  const [successBankDisplay, setSuccessBankDisplay] = useState('');

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'rider') {
        const res = await fetch('/api/rider/payout');
        const json = await res.json();
        if (json.success && json.data) {
          setRiderData(json.data as RiderPayoutData);
        } else {
          setError(json.message || 'Failed to load rider data');
        }
      } else {
        const res = await fetch(`/api/vendor?email=${encodeURIComponent(userEmail || 'sani@swiftramadan.app')}`);
        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data as VendorPayoutData;
          setVendorData(data);
          setVendorBalance(data.balance);
          setVendorPendingSettlement(data.pendingSettlement);
          setVendorTotalEarnings(data.totalEarnings);
        } else {
          setError(json.message || 'Failed to load vendor data');
        }
      }
    } catch (err) {
      console.error('[PayoutRequestModal] fetch error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [role, userEmail, setVendorBalance, setVendorPendingSettlement, setVendorTotalEarnings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Derived values ── */
  const availableBalance = role === 'rider'
    ? (riderData?.availableBalance ?? 0)
    : (vendorData?.balance ?? vendorBalance);

  const pendingAmount = role === 'rider' ? 0 : (vendorData?.pendingSettlement ?? vendorPendingSettlement);
  const totalEarned = role === 'rider'
    ? (riderData?.totalEarnings ?? 0)
    : (vendorData?.totalEarnings ?? vendorTotalEarnings);
  const totalWithdrawn = riderData?.totalWithdrawn ?? 0;
  const todayEarnings = role === 'rider' ? (riderData?.todaysEarnings ?? 0) : (vendorData?.todayRevenue ?? 0);

  const bankDisplay = role === 'rider'
    ? (riderData?.hasBankDetails ? `${riderData.bankDetails.bankName} **** ${riderData.bankDetails.accountNumber?.slice(-4)}` : null)
    : 'GT Bank **** 8291';

  const hasBank = role === 'rider' ? (riderData?.hasBankDetails ?? false) : true;

  const weeklyEarnings = riderData?.weeklyEarnings ?? [];
  const maxWeeklyAmount = Math.max(...weeklyEarnings.map((d) => d.amount), 1);

  /* ── Handle payout ── */
  const handleSubmit = async () => {
    const amount = payoutAmount
      ? parseInt(payoutAmount.replace(/[^0-9]/g, ''), 10)
      : availableBalance;

    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid payout amount' });
      return;
    }
    if (amount > availableBalance) {
      toast({ title: 'Insufficient Balance', description: 'Amount exceeds available balance' });
      return;
    }
    if (!hasBank) {
      toast({ title: 'No Bank Account', description: 'Please add bank details in settings first', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let res: Response;
      if (role === 'rider') {
        res = await fetch('/api/rider/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        });
      } else {
        res = await fetch('/api/vendor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'withdraw', email: userEmail, amount }),
        });
      }

      const json = await res.json();
      if (json.success) {
        setSuccessAmount(amount);
        setSuccessReference(json.data?.reference || `PO-${Date.now()}`);
        setSuccessBankDisplay(bankDisplay || 'Your bank account');
        // Optimistically deduct
        if (role === 'vendor') {
          setVendorBalance(Math.max(0, vendorBalance - amount));
        }
        if (role === 'rider' && riderData) {
          setRiderData({
            ...riderData,
            availableBalance: Math.max(0, riderData.availableBalance - amount),
            totalWithdrawn: riderData.totalWithdrawn + amount,
          });
        }
        setStep('success');
      } else {
        toast({
          title: 'Payout Failed',
          description: json.message || 'Could not submit payout request',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Payout Failed',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Quick % button handler ── */
  const handleQuickPercent = (pct: number) => {
    const amt = Math.floor((availableBalance * pct) / 100);
    setPayoutAmount(amt.toString());
  };

  /* ── Animation variants ── */
  const overlayVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const contentVariants = {
    hidden: { y: '100%' },
    show: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { y: '100%', transition: { duration: 0.2 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const isGold = role === 'vendor';
  const accentColor = isGold ? '#F5C451' : '#38BDF8';
  const accentBg = isGold ? 'bg-[var(--sr-vendor)]' : 'bg-[var(--sr-rider)]';
  const accentText = isGold ? 'text-[var(--sr-vendor)]' : 'text-[var(--sr-rider)]';
  const accentBg20 = isGold ? 'bg-[var(--sr-vendor)]/20' : 'bg-[var(--sr-rider)]/20';
  const accentBorder20 = isGold ? 'border-[var(--sr-vendor)]/20' : 'border-[var(--sr-rider)]/20';
  const accentBg10 = isGold ? 'bg-[var(--sr-vendor)]/10' : 'bg-[var(--sr-rider)]/10';
  const accentBorder30 = isGold ? 'border-[var(--sr-vendor)]/30' : 'border-[var(--sr-rider)]/30';
  const gradientClass = isGold
    ? 'gold-gradient'
    : 'bg-gradient-to-br from-[var(--sr-rider)]/20 via-[var(--sr-rider)]/5 to-[#1A1D26]';

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="fixed inset-0 bg-[var(--sr-surface-base)] z-[100] flex flex-col"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${accentBg20} flex items-center justify-center border ${accentBorder20}`}>
              <Wallet className={`w-5 h-5 ${accentText}`} />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">Request Payout</h2>
              <p className="text-white/60 text-xs">
                {role === 'rider' ? 'Rider Earnings' : 'Vendor Earnings'} → Bank Account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="px-4 py-5 space-y-5"
              >
                {/* Balance Card */}
                <motion.div variants={staggerItem} className={`relative overflow-hidden rounded-2xl p-6 ${gradientClass} ${isGold ? '' : 'border ' + accentBorder20}`}>
                  {/* Decorative blurs */}
                  <div className={`absolute top-0 right-0 w-48 h-48 ${accentBg10} blur-[80px]`} />
                  <div className={`absolute bottom-0 left-0 w-32 h-32 ${accentBg10} blur-[60px]`} />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className={`w-5 h-5 ${accentText}`} />
                      <span className={`${accentText} text-xs font-bold uppercase tracking-widest`}>
                        Available Balance
                      </span>
                    </div>
                    {loading ? (
                      <div className="mt-1 h-9 w-40 bg-white/10 rounded-lg animate-pulse" />
                    ) : (
                      <p className="text-white text-3xl font-black mt-1">{formatNaira(availableBalance)}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <TrendingUp className="w-3.5 h-3.5 text-[var(--sr-customer)]" />
                      <span className="text-[var(--sr-customer)] text-xs font-bold">
                        +{formatNaira(todayEarnings)} today
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Stats Grid 2x2 */}
                <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4">
                    <div className={`w-8 h-8 rounded-lg ${accentBg20} flex items-center justify-center mb-2 border ${accentBorder20}`}>
                      <Wallet className={`w-4 h-4 ${accentText}`} />
                    </div>
                    <p className="text-white/65 text-[10px] uppercase tracking-widest font-bold">Available</p>
                    {loading ? (
                      <div className="mt-0.5 h-5 w-20 bg-white/5 rounded animate-pulse" />
                    ) : (
                      <p className="text-white font-black text-lg mt-0.5">{formatNaira(availableBalance)}</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--sr-rider)]/20 flex items-center justify-center mb-2 border border-[var(--sr-rider)]/20">
                      <Clock className="w-4 h-4 text-[var(--sr-rider)]" />
                    </div>
                    <p className="text-white/65 text-[10px] uppercase tracking-widest font-bold">
                      {role === 'rider' ? 'Withdrawn' : 'Pending'}
                    </p>
                    {loading ? (
                      <div className="mt-0.5 h-5 w-20 bg-white/5 rounded animate-pulse" />
                    ) : (
                      <p className="text-[var(--sr-rider)] font-black text-lg mt-0.5">
                        {formatNaira(role === 'rider' ? totalWithdrawn : pendingAmount)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--sr-customer)]/20 flex items-center justify-center mb-2 border border-[var(--sr-customer)]/20">
                      <TrendingUp className="w-4 h-4 text-[var(--sr-customer)]" />
                    </div>
                    <p className="text-white/65 text-[10px] uppercase tracking-widest font-bold">Total Earned</p>
                    {loading ? (
                      <div className="mt-0.5 h-5 w-20 bg-white/5 rounded animate-pulse" />
                    ) : (
                      <p className="text-[var(--sr-customer)] font-black text-lg mt-0.5">{formatNaira(totalEarned)}</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--sr-vendor)]/20 flex items-center justify-center mb-2 border border-[var(--sr-vendor)]/20">
                      <ArrowDownLeft className="w-4 h-4 text-[var(--sr-vendor)]" />
                    </div>
                    <p className="text-white/65 text-[10px] uppercase tracking-widest font-bold">
                      {role === 'rider' ? 'Today' : 'Revenue'}
                    </p>
                    {loading ? (
                      <div className="mt-0.5 h-5 w-20 bg-white/5 rounded animate-pulse" />
                    ) : (
                      <p className="text-[var(--sr-vendor)] font-black text-lg mt-0.5">{formatNaira(todayEarnings)}</p>
                    )}
                  </div>
                </motion.div>

                {/* Weekly Earnings Mini Chart (rider only) */}
                {role === 'rider' && weeklyEarnings.length > 0 && (
                  <motion.div variants={staggerItem} className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-white/65" />
                      <h3 className="text-white text-sm font-bold">Weekly Earnings</h3>
                    </div>
                    <div className="flex items-end gap-2 h-20">
                      {weeklyEarnings.map((day, i) => {
                        const pct = maxWeeklyAmount > 0 ? (day.amount / maxWeeklyAmount) * 100 : 0;
                        const isToday = i === weeklyEarnings.length - 1;
                        return (
                          <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full relative" style={{ height: '64px' }}>
                              <div
                                className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${
                                  isToday
                                    ? 'bg-gradient-to-t from-[var(--sr-rider)] to-[var(--sr-rider)]/60'
                                    : 'bg-white/10'
                                }`}
                                style={{ height: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                            <span className={`text-[9px] font-bold ${isToday ? 'text-[var(--sr-rider)]' : 'text-white/60'}`}>
                              {day.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Amount Input Section */}
                <motion.div variants={staggerItem} className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4">
                  <h3 className="text-white text-sm font-bold mb-3">Payout Amount</h3>

                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg font-bold">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={`Up to ${formatNaira(availableBalance)}`}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={loading || availableBalance === 0}
                      className="w-full bg-[var(--sr-surface-base)]/50 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-lg font-bold placeholder:text-white/20 focus:border-[var(--sr-rider)]/30 focus:outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  {/* Quick % buttons */}
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((pct) => {
                      const amt = Math.floor((availableBalance * pct) / 100);
                      return (
                        <button
                          key={pct}
                          onClick={() => handleQuickPercent(pct)}
                          disabled={loading || availableBalance === 0}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30 ${
                            payoutAmount === amt.toString()
                              ? `${accentBg20} ${accentText} border ${accentBorder30}`
                              : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                          }`}
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Bank Account Section */}
                <motion.div variants={staggerItem} className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4">
                  <h3 className="text-white text-sm font-bold mb-3">Destination Account</h3>
                  {hasBank ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--sr-rider)]/20 flex items-center justify-center border border-[var(--sr-rider)]/20">
                        <Building2 className="w-5 h-5 text-[var(--sr-rider)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{bankDisplay}</p>
                        <p className="text-white/60 text-[10px]">Primary account</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[var(--sr-customer)]" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <p className="text-red-400 text-xs font-bold">No bank account configured</p>
                        <p className="text-white/60 text-[10px]">Add your bank details in settings to receive payouts</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Error State */}
                {error && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-red-400 text-xs">{error}</p>
                  </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className={`w-8 h-8 ${accentText} animate-spin mb-2`} />
                    <p className="text-white/65 text-xs">Loading your earnings data...</p>
                  </div>
                )}

                {/* Confirm Button */}
                {!loading && (
                  <motion.div variants={staggerItem}>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || availableBalance === 0 || !hasBank}
                      className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                        isGold
                          ? 'bg-[var(--sr-vendor)] text-[var(--sr-surface-base)] hover:bg-[var(--sr-vendor)]/90'
                          : 'bg-[var(--sr-rider)] text-[var(--sr-surface-base)] hover:bg-[var(--sr-rider)]/90'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5" />
                          Confirm Payout
                        </>
                      )}
                    </button>
                    <p className="text-white/20 text-[10px] text-center mt-2">
                      Funds arrive within 24 hours to your bank account
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ──────── SUCCESS STATE ──────── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="px-4 py-10 flex flex-col items-center text-center relative"
              >
                {/* Confetti */}
                {confettiColors.map((color, i) => (
                  <ConfettiParticle key={i} delay={i * 0.12} color={color} />
                ))}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                  className={`w-20 h-20 rounded-full ${accentBg20} flex items-center justify-center mb-6 ${isGold ? 'gold-glow' : ''}`}
                >
                  <CheckCircle2 className={`w-10 h-10 ${accentText}`} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-2xl font-black mb-2"
                >
                  Payout Requested! 🎉
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/50 text-sm mb-8 max-w-xs"
                >
                  {formatNaira(successAmount)} will arrive in {successBankDisplay} within 24 hours
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full max-w-xs bg-[var(--sr-surface-raised)] border border-white/5 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white/65 text-xs">Amount</span>
                    <span className="text-white font-bold">{formatNaira(successAmount)}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/65 text-xs">Reference</span>
                    <span className="text-white/60 text-xs font-mono">{successReference}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/65 text-xs">Destination</span>
                    <span className="text-white/60 text-xs">{successBankDisplay}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/65 text-xs">Status</span>
                    <span className="text-[var(--sr-rider)] text-xs font-bold">Processing</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/65 text-xs">ETA</span>
                    <span className="text-white/60 text-xs">Within 24 hours</span>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  className={`mt-8 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
                    isGold
                      ? 'bg-[var(--sr-vendor)] text-[var(--sr-surface-base)] hover:bg-[var(--sr-vendor)]/90'
                      : 'bg-[var(--sr-rider)] text-[var(--sr-surface-base)] hover:bg-[var(--sr-rider)]/90'
                  }`}
                >
                  Done
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
