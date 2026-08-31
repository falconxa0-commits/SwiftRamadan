'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf, TreePine, Droplets, Recycle, Share2, Lightbulb, TrendingUp } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { ecoImpactData, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const statsGrid = [
  { label: 'Eco Orders', value: ecoImpactData.ecoOrders.toString(), icon: Recycle, color: 'text-[var(--sr-customer)]', bgColor: 'bg-[var(--sr-customer)]/10', borderColor: 'border-[var(--sr-customer)]/20' },
  { label: 'Amount Donated', value: formatNaira(ecoImpactData.amountDonated), icon: TrendingUp, color: 'text-[var(--sr-vendor)]', bgColor: 'bg-[var(--sr-vendor)]/10', borderColor: 'border-[var(--sr-vendor)]/20' },
  { label: 'Trees Equivalent', value: ecoImpactData.treesEquivalent.toString(), icon: TreePine, color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/20' },
  { label: 'Plastic Avoided', value: ecoImpactData.plasticAvoided, icon: Recycle, color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', borderColor: 'border-cyan-400/20' },
  { label: 'Water Saved', value: ecoImpactData.waterSaved, icon: Droplets, color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20' },
];

const comparisonBars = [
  { label: 'CO₂ Saved', yours: 8.2, average: 3.5, unit: 'kg', color: 'bg-[var(--sr-customer)]' },
  { label: 'Eco Orders', yours: 15, average: 6, unit: '', color: 'bg-[var(--sr-vendor)]' },
  { label: 'Trees Equivalent', yours: 2, average: 0.8, unit: '', color: 'bg-green-400' },
];

const ecoTips = [
  { id: 1, title: 'Choose eco-packaging', description: 'Opt for minimal packaging to reduce waste by up to 40%' },
  { id: 2, title: 'Group your orders', description: 'Consolidate deliveries to reduce carbon emissions per order' },
  { id: 3, title: 'Support local vendors', description: 'Local sourcing reduces transport distance and supports community' },
];

export default function EcoImpactReport() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();

  const isOpen = activeModal === 'eco-impact';

  const handleShare = () => {
    toast({ title: 'Impact Shared! 🌱', description: 'Your eco impact report has been shared' });
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
            onClick={() => setActiveModal(null)}
          />

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--sr-customer)]/10 flex items-center justify-center border border-[var(--sr-customer)]/20">
                    <Leaf className="w-4 h-4 text-[var(--sr-customer)]" />
                  </div>
                  <h2 className="text-white text-lg font-bold">Your Eco Impact</h2>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-8">
              {/* Main Stat Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--sr-surface-elevated)] to-[var(--sr-surface-raised)] border border-white/10 p-6 text-center"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--sr-customer)]/10 blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-600/5 blur-[60px]" />
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--sr-customer)]/10 flex items-center justify-center border border-[var(--sr-customer)]/20 mb-4 green-glow">
                    <TreePine className="w-8 h-8 text-[var(--sr-customer)]" />
                  </div>
                  <p className="text-white/65 text-xs mb-1">Total CO₂ Saved This Ramadan</p>
                  <h3 className="text-[var(--sr-customer)] text-4xl font-black">{ecoImpactData.co2Saved}</h3>
                  <p className="text-white/60 text-xs mt-2">That&apos;s equivalent to charging 1,000 smartphones! 📱</p>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="mt-6">
                <h4 className="text-white font-bold text-sm mb-3">Impact Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {statsGrid.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4"
                      >
                        <div className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center border ${stat.borderColor} mb-2.5`}>
                          <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                        </div>
                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-white/60 text-[11px] mt-0.5">{stat.label}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Comparison Bars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Your Impact vs Average</h4>
                <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4 space-y-5">
                  {comparisonBars.map((bar) => {
                    const maxVal = Math.max(bar.yours, bar.average);
                    const yourPct = (bar.yours / maxVal) * 100;
                    const avgPct = (bar.average / maxVal) * 100;
                    return (
                      <div key={bar.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60 text-xs font-semibold">{bar.label}</span>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-[var(--sr-customer)] font-bold">You: {bar.yours}{bar.unit}</span>
                            <span className="text-white/60">Avg: {bar.average}{bar.unit}</span>
                          </div>
                        </div>
                        {/* Your bar */}
                        <div className="relative w-full bg-white/5 rounded-full h-3 mb-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${yourPct}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`${bar.color} h-3 rounded-full`}
                          />
                        </div>
                        {/* Average bar */}
                        <div className="relative w-full bg-white/5 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${avgPct}%` }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="bg-white/20 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3 sm:gap-4 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 bg-[var(--sr-customer)] rounded-full" />
                      <span className="text-white/60 text-[10px]">You</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 bg-white/20 rounded-full" />
                      <span className="text-white/60 text-[10px]">Average User</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tips Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">3 Ways to Reduce Your Footprint</h4>
                <div className="space-y-3">
                  {ecoTips.map((tip, i) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      className="bg-[var(--sr-surface-elevated)] rounded-xl border border-white/5 p-3 sm:p-4 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--sr-customer)]/10 flex items-center justify-center border border-[var(--sr-customer)]/20 shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4 text-[var(--sr-customer)]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{tip.title}</p>
                        <p className="text-white/65 text-xs mt-0.5">{tip.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Share Impact Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6"
              >
                <button
                  onClick={handleShare}
                  className="w-full py-4 rounded-2xl bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-black text-base tracking-wide hover:brightness-110 transition-all green-glow flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Share2 className="w-5 h-5" />
                  Share Your Impact
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
