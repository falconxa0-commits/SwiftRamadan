'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Star, Heart, Trophy, Target, TrendingUp, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { riderPerformanceMetrics } from '@/lib/data';

export default function RiderPerformanceHub() {
  const { activeModal, setActiveModal } = useAppStore();
  const isOpen = activeModal === 'rider-performance';

  const m = riderPerformanceMetrics;

  const handleClose = () => {
    setActiveModal(null);
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
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#0F1117] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center border border-[#3b82f6]/20">
                  <BarChart3 className="w-5 h-5 text-[#3b82f6]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Performance Hub</h2>
                  <p className="text-white/40 text-xs mt-0.5">Track your delivery metrics</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Completion Rate */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#13ec13]" />
                    <span className="text-white/40 text-[10px] font-bold uppercase">Completion</span>
                  </div>
                  <p className="text-[#13ec13] text-2xl font-black">{m.completionRate}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-[#13ec13]" />
                    <span className="text-[#13ec13] text-[10px] font-bold">{m.completionTrend}</span>
                  </div>
                </motion.div>

                {/* Rating */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-white/40 text-[10px] font-bold uppercase">Rating</span>
                  </div>
                  <p className="text-[#FFD700] text-2xl font-black">{m.rating}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-[#FFD700]" />
                    <span className="text-[#FFD700] text-[10px] font-bold">{m.ratingTrend}</span>
                  </div>
                </motion.div>

                {/* Compliments */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span className="text-white/40 text-[10px] font-bold uppercase">Compliments</span>
                  </div>
                  <p className="text-rose-400 text-2xl font-black">{m.compliments}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-rose-400" />
                    <span className="text-rose-400 text-[10px] font-bold">{m.complimentsTrend}</span>
                  </div>
                </motion.div>

                {/* Incentive Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-[#3b82f6]" />
                    <span className="text-white/40 text-[10px] font-bold uppercase">Incentive</span>
                  </div>
                  <p className="text-[#3b82f6] text-2xl font-black">{m.incentiveProgress}%</p>
                  <p className="text-white/30 text-[10px] mt-1">{m.incentiveRemaining}</p>
                </motion.div>
              </div>

              {/* Incentive Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 bg-[#1A1D26] rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#FFD700]" />
                    <span className="text-white font-bold text-sm">{m.incentiveGoal}</span>
                  </div>
                  <span className="text-[#3b82f6] text-xs font-bold">{m.incentiveProgress}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.incentiveProgress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-3 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#FFD700]"
                  />
                </div>
                <p className="text-white/30 text-xs mt-2 text-center">{m.incentiveRemaining} to unlock bonus</p>
              </motion.div>

              {/* Top Compliments */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
              >
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  Top Compliments
                </h4>
                <div className="space-y-2">
                  {m.topCompliments.map((compliment, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center border border-[#3b82f6]/20 shrink-0">
                          <span className="material-symbols-outlined text-[#3b82f6] text-lg">{compliment.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">{compliment.title}</p>
                          <p className="text-white/40 text-xs mt-0.5 italic line-clamp-2">&ldquo;{compliment.quote}&rdquo;</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/10 shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
