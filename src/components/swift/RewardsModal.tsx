'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Trophy, Flame, ChevronRight, Gift, Zap, Sparkles, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { loyaltyRewards, loyaltyTiers, pointEarningActivities, loyaltyData } from '@/lib/data';
import LoyaltySpinWheel from './LoyaltySpinWheel';
import { useToast } from '@/hooks/use-toast';

export default function RewardsModal() {
  const {
    activeModal,
    setActiveModal,
    hasanatPoints,
    setHasanatPoints,
    loyaltyTier,
    dailyStreak,
    claimDailyPoints,
    lastSpinDate,
    spinStreak,
  } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'rewards';

  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [showSpinWheel, setShowSpinWheel] = useState(false);

  const currentTierData = loyaltyTiers.find(t => t.id === loyaltyTier) || loyaltyTiers[2];
  const nextTierIndex = loyaltyTiers.findIndex(t => t.id === loyaltyTier) + 1;
  const nextTier = nextTierIndex < loyaltyTiers.length ? loyaltyTiers[nextTierIndex] : null;
  const progressToNext = nextTier
    ? Math.min(((hasanatPoints - currentTierData.minPoints) / (nextTier.minPoints - currentTierData.minPoints)) * 100, 100)
    : 100;

  const handleClaimDaily = () => {
    claimDailyPoints();
    setDailyClaimed(true);
    toast({ title: 'Points Claimed! 🎉', description: `+50 Hasanat Points! Day ${dailyStreak + 1} streak` });
  };

  const handleRedeem = (reward: typeof loyaltyRewards[0]) => {
    if (hasanatPoints < reward.points) {
      toast({ title: 'Not Enough Points', description: `You need ${reward.points - hasanatPoints} more points` });
      return;
    }
    setRedeemingId(reward.id);
    setTimeout(() => {
      setHasanatPoints(hasanatPoints - reward.points);
      setRedeemingId(null);
      toast({ title: 'Redeemed! 🎁', description: `${reward.name} for ${reward.points.toLocaleString()} points` });
    }, 600);
  };

  const handleClose = () => {
    setActiveModal(null);
    setDailyClaimed(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5C451]/20 flex items-center justify-center border border-[#F5C451]/30">
                    <Trophy className="w-5 h-5 text-[#F5C451]" />
                  </div>
                  <h2 className="text-white text-lg font-bold">SwiftRewards</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Current Tier Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D26] to-[#0F1117] border border-white/10 p-6 mt-4"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C451]/10 blur-[60px]" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#10E07A]/10 blur-[40px]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Current Tier</p>
                      <h3 className="text-xl font-black mt-1" style={{ color: currentTierData.color }}>
                        {currentTierData.name}
                      </h3>
                    </div>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ borderColor: currentTierData.color + '40', background: currentTierData.color + '15' }}>
                      <Star className="w-8 h-8" style={{ color: currentTierData.color }} fill={currentTierData.color} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#F5C451] text-2xl font-black">{hasanatPoints.toLocaleString()}</span>
                    <span className="text-white/40 text-xs">Hasanat Points</span>
                  </div>
                  {nextTier && (
                    <>
                      <div className="w-full bg-white/5 rounded-full h-3 mt-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressToNext}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-3 rounded-full"
                          style={{ background: `linear-gradient(90deg, ${currentTierData.color}, ${nextTier.color})` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-white/30 text-[10px]">{currentTierData.minPoints.toLocaleString()} pts</span>
                        <span className="text-white/30 text-[10px]">{nextTier.minPoints.toLocaleString()} pts to {nextTier.name}</span>
                      </div>
                    </>
                  )}
                  {currentTierData.benefits.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                      {currentTierData.benefits.slice(0, 3).map((b) => (
                        <div key={b} className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-[#10E07A] shrink-0" />
                          <span className="text-white/60 text-xs">{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Daily Streak Claim */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064e3b]/40 to-[#05070A] border border-[#10E07A]/20 p-5">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#10E07A]/10 blur-[40px]" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-5 h-5 text-orange-400" />
                        <span className="text-white font-bold text-sm">Day {dailyStreak} Streak</span>
                      </div>
                      <p className="text-white/40 text-xs">Log in daily to build your streak and earn bonus points</p>
                    </div>
                    <button
                      onClick={handleClaimDaily}
                      disabled={dailyClaimed}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                        dailyClaimed
                          ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                          : 'bg-[#10E07A] text-[#05070A] hover:bg-[#10E07A]/90'
                      }`}
                    >
                      {dailyClaimed ? 'Claimed ✓' : 'Claim 50 pts'}
                    </button>
                  </div>
                  {/* Streak Dots */}
                  <div className="flex gap-2 mt-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={`streak-${i}`}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                          i < dailyStreak ? 'bg-[#10E07A]' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Daily Spin & Win */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4"
              >
                <button
                  onClick={() => setShowSpinWheel(true)}
                  className="w-full relative overflow-hidden rounded-2xl border text-left transition-all active:scale-[0.98] hover:border-[#F5C451]/50"
                  style={{
                    background: 'linear-gradient(135deg, #1A1D26, #0F1117)',
                    borderColor: 'rgba(245,196,81,0.2)',
                  }}
                >
                  {/* Glow effects */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#F5C451]/10 blur-[40px]" />
                  <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-[#10E07A]/10 blur-[30px]" />

                  <div className="relative z-10 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#F5C451]/30"
                          style={{ background: 'linear-gradient(135deg, #F5C451/20, #F5C451/10)' }}>
                          <span className="text-2xl">🎰</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">Daily Spin & Win</span>
                            {(() => {
                              const today = new Date().toISOString().split('T')[0];
                              const canSpinNow = lastSpinDate !== today;
                              return canSpinNow ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10E07A]/20 text-[#10E07A] border border-[#10E07A]/30">
                                  FREE SPIN
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/5">
                                  SPUN TODAY
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-white/40 text-xs mt-0.5">
                            {lastSpinDate !== new Date().toISOString().split('T')[0]
                              ? 'Spin the wheel for free rewards!'
                              : 'Come back tomorrow for another spin'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#F5C451]/60 shrink-0" />
                    </div>
                    {spinStreak > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span className="text-white/50 text-[10px] font-semibold">{spinStreak} day spin streak</span>
                        {spinStreak >= 3 && (
                          <span className="text-[#A78BFA] text-[10px] font-bold ml-1">• 2x bonus active!</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              </motion.div>

              {/* How to Earn Points */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#10E07A]" />
                  How to Earn Points
                </h4>
                <div className="space-y-2">
                  {pointEarningActivities.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className="flex items-center gap-3 bg-[#1A1D26] rounded-xl border border-white/5 p-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#10E07A]/10 flex items-center justify-center border border-[#10E07A]/20 shrink-0">
                        <span className="material-symbols-outlined text-[#10E07A] text-lg">{activity.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{activity.activity}</p>
                      </div>
                      <span className="text-[#F5C451] text-xs font-bold shrink-0">+{activity.points}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Tier Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#F5C451]" />
                  Tier Benefits
                </h4>
                <div className="space-y-3">
                  {loyaltyTiers.map((tier) => {
                    const isCurrentTier = tier.id === loyaltyTier;
                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl p-4 border transition-all ${
                          isCurrentTier
                            ? 'bg-[#1A1D26] border-2'
                            : 'bg-[#1A1D26]/40 border border-white/5'
                        }`}
                        style={isCurrentTier ? { borderColor: tier.color + '60' } : {}}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center border shrink-0"
                            style={{
                              borderColor: tier.color + '40',
                              background: tier.color + '15',
                            }}
                          >
                            <Star className="w-5 h-5" style={{ color: tier.color }} fill={tier.color} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm" style={{ color: tier.color }}>{tier.name}</h5>
                              {isCurrentTier && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tier.color + '20', color: tier.color }}>
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-white/30 text-[10px]">{tier.minPoints.toLocaleString()} - {tier.maxPoints.toLocaleString()} pts</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                        </div>
                        <div className="space-y-1.5">
                          {tier.benefits.map((b) => (
                            <div key={b} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full shrink-0" style={{ background: tier.color }} />
                              <span className="text-white/50 text-xs">{b}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Redeem Rewards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 mb-4"
              >
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#F5C451]" />
                  Redeem Rewards
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {loyaltyRewards.map((reward, i) => {
                    const canAfford = hasanatPoints >= reward.points;
                    const isRedeeming = redeemingId === reward.id;
                    return (
                      <motion.button
                        key={reward.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: isRedeeming ? 0.95 : 1 }}
                        transition={{ delay: 0.55 + i * 0.05 }}
                        onClick={() => handleRedeem(reward)}
                        className={`bg-[#1A1D26] rounded-2xl p-4 border text-left transition-all ${
                          canAfford
                            ? 'border-[#10E07A]/20 hover:border-[#10E07A]/40 active:scale-[0.98]'
                            : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#F5C451]/10 flex items-center justify-center border border-[#F5C451]/20 mb-3">
                          <span className="material-symbols-outlined text-[#F5C451] text-xl">{reward.icon}</span>
                        </div>
                        <p className="text-white font-bold text-xs mb-1 leading-tight">{reward.name}</p>
                        <p className="text-white/30 text-[10px] mb-2 line-clamp-2">{reward.description}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#F5C451]" fill="#F5C451" />
                          <span className="text-[#F5C451] text-xs font-black">{reward.points.toLocaleString()}</span>
                        </div>
                        {!canAfford && (
                          <p className="text-white/20 text-[9px] mt-1">Need {(reward.points - hasanatPoints).toLocaleString()} more</p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}

      {/* Spin Wheel Overlay */}
      <AnimatePresence>
        {showSpinWheel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoyaltySpinWheel onClose={() => setShowSpinWheel(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
