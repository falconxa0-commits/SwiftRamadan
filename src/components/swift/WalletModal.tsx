'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Wallet, ArrowDownLeft, ArrowUpRight, RotateCcw,
  Gift, Clock, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────────
interface WalletTransaction {
  id: string;
  userId: string;
  type: string; // topup | payment | refund | payout | cashback
  amount: number; // kobo (positive = credit, negative = debit)
  balance: number; // kobo
  description: string;
  reference: string;
  createdAt: string;
}

// ── Helper ───────────────────────────────────────────────────────────────────
const koboToNaira = (k: number) => Math.round(k / 100);

// ── Transaction icon / color map ─────────────────────────────────────────────
const txnMeta: Record<string, { icon: typeof ArrowDownLeft; color: string; label: string }> = {
  topup:    { icon: ArrowDownLeft,  color: 'text-[var(--sr-customer)]', label: 'Top Up' },
  payment:  { icon: ArrowUpRight,   color: 'text-red-400',   label: 'Payment' },
  refund:   { icon: RotateCcw,      color: 'text-[var(--sr-customer)]', label: 'Refund' },
  payout:   { icon: ArrowUpRight,   color: 'text-red-400',   label: 'Payout' },
  cashback: { icon: Gift,           color: 'text-[var(--sr-customer)]', label: 'Cashback' },
};

function TxnIcon({ type }: { type: string }) {
  const meta = txnMeta[type] || txnMeta.payment;
  const Icon = meta.icon;
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
      meta.color === 'text-[var(--sr-customer)]'
        ? 'bg-[var(--sr-customer)]/10 border-[var(--sr-customer)]/20'
        : 'bg-red-400/10 border-red-400/20'
    }`}>
      <Icon className={`w-5 h-5 ${meta.color}`} />
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

// ── Component ────────────────────────────────────────────────────────────────
export default function WalletModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const { toast } = useToast();
  const isOpen = activeModal === 'wallet';

  // State
  const [walletBalance, setWalletBalance] = useState<number>(0); // kobo
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'topup' | 'history'>('balance');
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // ── Fetch balance ──────────────────────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'balance', userId: userEmail }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.balance ?? 0);
      }
    } catch {
      // silent — will show stale or zero
    }
  }, [userEmail]);

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (page: number = 1) => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `/api/wallet/history?userId=${encodeURIComponent(userEmail)}&page=${page}&limit=20`
      );
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions ?? []);
        setHistoryTotalPages(data.totalPages ?? 1);
      }
    } catch {
      // silent
    }
  }, [userEmail]);

  // ── On mount / open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([fetchBalance(), fetchHistory(1)]).finally(() => setLoading(false));
  }, [isOpen, fetchBalance, fetchHistory]);

  // ── Handle top-up ──────────────────────────────────────────────────────────
  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount' });
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'topup', userId: userEmail, amount }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Top-Up Initiated!',
          description: `Reference: ${data.reference}. You'll be redirected to complete payment.`,
        });
        // If checkout URL is provided, open it
        if (data.checkoutUrl) {
          window.open(data.checkoutUrl, '_blank');
        }
        setTopupAmount('');
        // Refresh balance
        await fetchBalance();
      } else {
        toast({
          title: 'Top-Up Failed',
          description: data.message || 'Could not process top-up. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // ── Close handler ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setActiveModal(null);
    setActiveTab('balance');
    setTopupAmount('');
  };

  // ── Tabs config ────────────────────────────────────────────────────────────
  const tabs: { id: 'balance' | 'topup' | 'history'; label: string }[] = [
    { id: 'balance', label: 'Balance' },
    { id: 'topup', label: 'Top Up' },
    { id: 'history', label: 'History' },
  ];

  const presetAmounts = [1000, 2000, 5000, 10000];

  // ── Render ─────────────────────────────────────────────────────────────────
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

          {/* Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--sr-customer)]/20 flex items-center justify-center border border-[var(--sr-customer)]/30">
                    <Wallet className="w-5 h-5 text-[var(--sr-customer)]" />
                  </div>
                  <h2 className="text-white text-lg font-bold">Swift Wallet</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex px-4 pb-3 gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] border border-[var(--sr-customer)]/20'
                        : 'bg-white/5 text-white/65 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Loading skeleton */}
              {loading ? (
                <div className="mt-6 space-y-4">
                  <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                </div>
              ) : (
                <>
                  {/* ═══════════════════ BALANCE TAB ═══════════════════ */}
                  {activeTab === 'balance' && (
                    <div className="mt-4 space-y-4">
                      {/* Wallet Balance Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D26] to-[#0F1117] border border-white/10 p-6"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--sr-customer)]/10 blur-[60px]" />
                        <div className="relative z-10 flex flex-col items-center">
                          {/* Wallet icon with green accent glow */}
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-[var(--sr-customer)]/30 blur-xl rounded-full" />
                            <div className="relative w-16 h-16 rounded-full bg-[var(--sr-customer)]/20 flex items-center justify-center border border-[var(--sr-customer)]/30">
                              <Wallet className="w-8 h-8 text-[var(--sr-customer)]" />
                            </div>
                          </div>
                          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Wallet Balance</p>
                          <p className="text-[var(--sr-customer)] text-4xl font-black mt-1">
                            {formatNaira(koboToNaira(walletBalance))}
                          </p>
                          <p className="text-white/60 text-xs mt-1">Available for orders & payments</p>
                        </div>
                      </motion.div>

                      {/* Quick Action Buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        <button
                          onClick={() => setActiveTab('topup')}
                          className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-[var(--sr-customer)]/5 border border-[var(--sr-customer)]/20 hover:bg-[var(--sr-customer)]/10 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[var(--sr-customer)]/20 flex items-center justify-center">
                            <ArrowDownLeft className="w-5 h-5 text-[var(--sr-customer)]" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-bold text-sm">Top Up</p>
                            <p className="text-white/65 text-[10px]">Add funds</p>
                          </div>
                        </button>
                        <button
                          onClick={() => { setActiveTab('history'); fetchHistory(1); }}
                          className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white/60" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-bold text-sm">History</p>
                            <p className="text-white/65 text-[10px]">Transactions</p>
                          </div>
                        </button>
                      </motion.div>

                      {/* Recent Transactions Preview */}
                      {transactions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-bold text-sm">Recent Activity</h4>
                            <button
                              onClick={() => { setActiveTab('history'); fetchHistory(1); }}
                              className="text-[var(--sr-customer)] text-xs font-bold flex items-center gap-1"
                            >
                              View All <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {transactions.slice(0, 3).map(txn => {
                              const isCredit = txn.amount >= 0;
                              const displayAmount = koboToNaira(Math.abs(txn.amount));
                              return (
                                <div
                                  key={txn.id}
                                  className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1D26]/40 border border-white/5"
                                >
                                  <TxnIcon type={txn.type} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{txn.description || (txnMeta[txn.type]?.label || 'Transaction')}</p>
                                    <p className="text-white/60 text-[10px]">{formatDate(txn.createdAt)}</p>
                                  </div>
                                  <p className={`font-bold text-sm ${isCredit ? 'text-[var(--sr-customer)]' : 'text-red-400'}`}>
                                    {isCredit ? '+' : '-'}{formatNaira(displayAmount)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {transactions.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center py-8"
                        >
                          <Wallet className="w-12 h-12 text-white/10 mx-auto mb-3" />
                          <p className="text-white/60 text-sm">No transactions yet</p>
                          <p className="text-white/20 text-xs mt-1">Top up your wallet to get started</p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* ═══════════════════ TOP UP TAB ═══════════════════ */}
                  {activeTab === 'topup' && (
                    <div className="mt-4 space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h4 className="text-white font-bold text-sm mb-3">Amount to Top Up</h4>
                        <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-5">
                          {/* Amount input */}
                          <div className="mb-4">
                            <label className="text-white/65 text-xs font-bold uppercase tracking-widest block mb-2">Amount (Naira)</label>
                            <div className="flex items-center gap-2 bg-[#0F1117] rounded-xl border border-white/5 focus-within:border-[var(--sr-customer)]/30 transition-all px-4 py-3">
                              <span className="text-white/65 text-lg font-bold">₦</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={topupAmount}
                                onChange={e => setTopupAmount(e.target.value)}
                                placeholder="0"
                                className="flex-1 bg-transparent text-white text-lg font-bold focus:outline-none placeholder:text-white/20"
                              />
                            </div>
                          </div>

                          {/* Preset amounts */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {presetAmounts.map(amt => (
                              <button
                                key={amt}
                                onClick={() => setTopupAmount(String(amt))}
                                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                  topupAmount === String(amt)
                                    ? 'bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] border border-[var(--sr-customer)]/20'
                                    : 'bg-white/5 text-white/65 border border-white/5 hover:bg-white/10'
                                }`}
                              >
                                {formatNaira(amt)}
                              </button>
                            ))}
                          </div>

                          {/* Preview */}
                          {topupAmount && parseFloat(topupAmount) > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 pt-4 border-t border-white/5 space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-white/65 text-xs">Top-up amount</span>
                                <span className="text-white font-bold text-sm">{formatNaira(parseFloat(topupAmount))}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/65 text-xs">New balance</span>
                                <span className="text-[var(--sr-customer)] font-bold text-sm">
                                  {formatNaira(koboToNaira(walletBalance) + parseFloat(topupAmount))}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* Top Up Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <button
                          onClick={handleTopup}
                          disabled={processing || !topupAmount || parseFloat(topupAmount) <= 0}
                          className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
                            processing || !topupAmount || parseFloat(topupAmount) <= 0
                              ? 'bg-white/5 text-white/20 cursor-not-allowed'
                              : 'bg-[var(--sr-customer)] text-[#05070A] hover:bg-[var(--sr-customer)]/90'
                          }`}
                        >
                          {processing ? (
                            <span className="flex items-center justify-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-[#05070A]/20 border-t-[#05070A] rounded-full"
                              />
                              Processing...
                            </span>
                          ) : (
                            'Top Up Wallet'
                          )}
                        </button>

                        {/* Paystack notice */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                          <ShieldCheck className="w-3.5 h-3.5 text-white/20" />
                          <p className="text-white/20 text-[10px]">Powered by Paystack</p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ═══════════════════ HISTORY TAB ═══════════════════ */}
                  {activeTab === 'history' && (
                    <div className="mt-4 space-y-3">
                      {transactions.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12"
                        >
                          <Clock className="w-12 h-12 text-white/10 mx-auto mb-3" />
                          <p className="text-white/60 text-sm">No transactions found</p>
                          <p className="text-white/20 text-xs mt-1">Your transaction history will appear here</p>
                        </motion.div>
                      ) : (
                        <>
                          {transactions.map((txn, i) => {
                            const isCredit = txn.amount >= 0;
                            const displayAmount = koboToNaira(Math.abs(txn.amount));
                            const meta = txnMeta[txn.type] || txnMeta.payment;
                            return (
                              <motion.div
                                key={txn.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-[#1A1D26]/40 border border-white/5 hover:bg-[#1A1D26]/60 transition-colors"
                              >
                                <TxnIcon type={txn.type} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">
                                    {txn.description || meta.label}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-white/60 text-[10px]">{formatDate(txn.createdAt)}</span>
                                    {txn.reference && (
                                      <span className="text-white/15 text-[10px] truncate">• {txn.reference}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={`font-bold text-sm ${isCredit ? 'text-[var(--sr-customer)]' : 'text-red-400'}`}>
                                    {isCredit ? '+' : '-'}{formatNaira(displayAmount)}
                                  </p>
                                  <p className="text-white/20 text-[10px]">
                                    Bal: {formatNaira(koboToNaira(txn.balance))}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}

                          {/* Pagination */}
                          {historyTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 pt-4">
                              <button
                                onClick={() => {
                                  const prev = Math.max(1, historyPage - 1);
                                  setHistoryPage(prev);
                                  fetchHistory(prev);
                                }}
                                disabled={historyPage <= 1}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  historyPage <= 1
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                                }`}
                              >
                                Previous
                              </button>
                              <span className="text-white/60 text-xs">
                                Page {historyPage} of {historyTotalPages}
                              </span>
                              <button
                                onClick={() => {
                                  const next = Math.min(historyTotalPages, historyPage + 1);
                                  setHistoryPage(next);
                                  fetchHistory(next);
                                }}
                                disabled={historyPage >= historyTotalPages}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  historyPage >= historyTotalPages
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
