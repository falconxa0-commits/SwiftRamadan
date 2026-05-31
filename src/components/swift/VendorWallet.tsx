'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, Building2, History, ChevronRight, Wallet } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { vendorTransactions, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type TxFilter = 'all' | 'completed' | 'processing' | 'refunded';

export default function VendorWallet() {
  const { vendorBalance, vendorPendingSettlement, vendorTotalEarnings } = useAppStore();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<TxFilter>('all');

  const filterChips: { id: TxFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'processing', label: 'Processing' },
    { id: 'refunded', label: 'Refunded' },
  ];

  const filteredTransactions = vendorTransactions.filter((tx) => {
    if (activeFilter === 'all') return true;
    return tx.status === activeFilter;
  });

  const getTxIcon = (type: string, status: string) => {
    if (type === 'credit' && status === 'completed') {
      return (
        <div className="w-9 h-9 rounded-xl bg-[#13ec13]/20 flex items-center justify-center border border-[#13ec13]/20">
          <ArrowDownLeft className="w-4 h-4 text-[#13ec13]" />
        </div>
      );
    }
    if (status === 'processing') {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
          <Building2 className="w-4 h-4 text-blue-400" />
        </div>
      );
    }
    if (status === 'refunded') {
      return (
        <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/20">
          <History className="w-4 h-4 text-red-400" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
        <Wallet className="w-4 h-4 text-white/40" />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-2">
      {/* Premium Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gold-gradient p-6"
      >
        {/* Ramadan Crescent Decoration */}
        <div className="absolute top-4 right-4 opacity-10">
          <span className="material-symbols-outlined text-white text-7xl">nights_stay</span>
        </div>
        <div className="absolute bottom-0 right-8 opacity-5">
          <span className="material-symbols-outlined text-white text-9xl">mosque</span>
        </div>

        <div className="relative z-10">
          <p className="text-[#05070A]/60 text-xs font-bold uppercase tracking-widest">Available Balance</p>
          <p className="text-[#05070A] text-3xl font-black mt-1">{formatNaira(vendorBalance).replace('₦', '₦')}</p>
          <div className="flex items-center gap-2 mt-4">
            <p className="text-[#05070A]/50 text-xs font-semibold">{formatNaira(vendorBalance).replace('₦', '₦')} available</p>
          </div>
          <button
            onClick={() => toast({ title: 'Withdrawal Initiated 💰', description: `${formatNaira(vendorBalance)} will be sent to your bank account` })}
            className="mt-4 px-6 py-2.5 rounded-xl bg-[#05070A] text-[#FFD700] text-xs font-bold hover:bg-[#05070A]/90 active:scale-[0.98] transition-all"
          >
            Withdraw
          </button>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[#FFD700] text-sm">pending</span>
          </div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Pending Settlements</p>
          <p className="text-white font-black text-lg mt-0.5">{formatNaira(vendorPendingSettlement)}</p>
        </div>
        <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4">
          <div className="w-8 h-8 rounded-lg bg-[#13ec13]/20 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[#13ec13] text-sm">trending_up</span>
          </div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Ramadan Earnings</p>
          <p className="text-[#13ec13] font-black text-lg mt-0.5">{formatNaira(vendorTotalEarnings)}</p>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm">Transaction History</h3>
          <button className="text-[#FFD700] text-xs font-bold flex items-center gap-1">
            See All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === chip.id
                  ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                  : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <p className="text-white/20 text-sm">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1D26]/60 border border-white/5 hover:border-white/10 transition-all"
              >
                {getTxIcon(tx.type, tx.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{tx.reference}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${
                    tx.type === 'credit' ? 'text-[#13ec13]' : tx.type === 'refund' ? 'text-red-400' : 'text-white/60'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                  </p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${
                    tx.status === 'completed' ? 'text-[#13ec13]/60' : tx.status === 'processing' ? 'text-blue-400/60' : 'text-red-400/60'
                  }`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Bank Account Quick Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">GT Bank **** 8291</p>
              <p className="text-white/30 text-xs">Primary account</p>
            </div>
          </div>
          <button
            onClick={() => toast({ title: 'Bank Settings', description: 'Manage your bank accounts' })}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-[#FFD700] text-xs font-bold border border-white/5 hover:bg-white/10 transition-all"
          >
            Change
          </button>
        </div>
      </motion.div>
    </div>
  );
}
