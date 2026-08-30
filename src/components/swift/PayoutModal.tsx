'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, ArrowUpRight, CheckCircle, Clock, XCircle, Loader2, X, Building2, ChevronRight } from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface Payout {
  id: string;
  reference: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
}

const koboToNaira = (k: number) => Math.round(k / 100);
const nairaToKobo = (n: number) => Math.round(n * 100);

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    icon: <Clock className="w-3 h-3" />,
  },
  processing: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  completed: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  failed: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    icon: <XCircle className="w-3 h-3" />,
  },
  rejected: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function PayoutModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const userRole = useAppStore(s => s.userRole);
  const vendorBalance = useAppStore(s => s.vendorBalance);
  const riderEarnings = useAppStore(s => s.riderEarnings);
  const { toast } = useToast();
  const isOpen = activeModal === 'payout';

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const walletBalance = userRole === 'vendor' ? vendorBalance : riderEarnings;

  const fetchPayouts = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', userId: userEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen) {
      fetchPayouts();
    }
  }, [isOpen, fetchPayouts]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid payout amount', variant: 'destructive' });
      return;
    }
    if (parsedAmount > koboToNaira(walletBalance)) {
      toast({ title: 'Insufficient balance', description: 'Amount exceeds your wallet balance', variant: 'destructive' });
      return;
    }
    if (!bankName.trim()) {
      toast({ title: 'Bank name required', description: 'Please enter your bank name', variant: 'destructive' });
      return;
    }
    if (!accountNumber.trim() || accountNumber.length !== 10) {
      toast({ title: 'Invalid account number', description: 'Account number must be 10 digits', variant: 'destructive' });
      return;
    }
    if (!accountName.trim()) {
      toast({ title: 'Account name required', description: 'Please enter the account name', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          userId: userEmail,
          amount: nairaToKobo(parsedAmount),
          bankName,
          accountNumber,
          accountName,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Payout Requested! 🎉',
          description: `${formatNaira(parsedAmount)} payout to ${bankName} has been submitted`,
        });
        setAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        setActiveTab('history');
        fetchPayouts();
      } else {
        toast({
          title: 'Payout Failed',
          description: data.message || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Could not submit payout request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveModal(null);
  };

  const maskAccount = (acc: string) => {
    if (acc.length <= 4) return acc;
    return `****${acc.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#05070A] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/5"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center border border-green-500/30">
                    <Banknote className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-white text-lg font-bold">Payout</h2>
                    <p className="text-white/65 text-xs">Withdraw to your bank account</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Wallet Balance */}
              <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-xs">Available Balance</p>
                    <p className="text-white text-2xl font-bold mt-1">{formatNaira(koboToNaira(walletBalance))}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex px-4 gap-1 mb-3">
                <button
                  onClick={() => setActiveTab('request')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'request'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                  }`}
                >
                  Request
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'history'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6">
              <AnimatePresence mode="wait">
                {activeTab === 'request' ? (
                  <motion.div
                    key="request"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 pt-4"
                  >
                    {/* Amount Input */}
                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Amount (₦)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg font-bold">₦</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-lg font-bold placeholder:text-white/20 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                        />
                      </div>
                      {amount && parseFloat(amount) > koboToNaira(walletBalance) && (
                        <p className="text-red-400 text-xs mt-1">Exceeds available balance</p>
                      )}
                    </div>

                    {/* Bank Name Input */}
                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Bank Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Access Bank"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                        />
                      </div>
                    </div>

                    {/* Account Number Input */}
                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setAccountNumber(val);
                        }}
                        placeholder="10-digit account number"
                        maxLength={10}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all tracking-wider"
                      />
                      {accountNumber.length > 0 && accountNumber.length !== 10 && (
                        <p className="text-yellow-400/70 text-xs mt-1">{10 - accountNumber.length} more digit{10 - accountNumber.length !== 1 ? 's' : ''} needed</p>
                      )}
                    </div>

                    {/* Account Name Input */}
                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Account Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Name on the account"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !amount || !bankName || !accountNumber || accountNumber.length !== 10 || !accountName}
                      className="w-full mt-4 py-4 rounded-xl bg-green-500 text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          Request Payout
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4"
                  >
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                        <p className="text-white/65 text-sm">Loading payout history...</p>
                      </div>
                    ) : payouts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                          <Banknote className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-white/65 text-sm">No payout history yet</p>
                        <p className="text-white/25 text-xs">Your payout requests will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {payouts.map((payout) => {
                          const config = statusConfig[payout.status] || statusConfig.pending;
                          return (
                            <motion.div
                              key={payout.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/65 text-[10px] font-mono truncate">{payout.reference}</p>
                                  <p className="text-white font-bold text-lg mt-0.5">{formatNaira(koboToNaira(payout.amount))}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${config.bg} ${config.text}`}>
                                  {config.icon}
                                  <span className="capitalize">{payout.status}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-3.5 h-3.5 text-white/60" />
                                  <span className="text-white/50 text-xs">{payout.bankName} • {maskAccount(payout.accountNumber)}</span>
                                </div>
                                <span className="text-white/60 text-xs">{formatDate(payout.createdAt)}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
