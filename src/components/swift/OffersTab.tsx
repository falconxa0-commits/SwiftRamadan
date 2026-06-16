'use client';

import { Timer, Star, Gift, Crown, ChevronRight, TrendingUp, ShoppingCart, Zap } from 'lucide-react';
import { flashSales, loyaltyData, loyaltyTiers, giftCardTemplates, groupBuyDeals, formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(endTime: Date): CountdownTime {
  const calculate = () => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState<CountdownTime>(calculate);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculate());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

function FlashSaleCard({ sale }: { sale: typeof flashSales[0] }) {
  const { addToCart, setSelectedProduct, setActiveModal } = useAppStore();
  const { toast } = useToast();

  // Calculate end time from endsIn string
  const endsInMap: Record<string, number> = {
    '2h 15m': 2 * 60 + 15,
    '1h 45m': 1 * 60 + 45,
    '3h 30m': 3 * 60 + 30,
  };
  const minutes = endsInMap[sale.endsIn] || 120;
  const endTime = new Date(Date.now() + minutes * 60 * 1000);

  const countdown = useCountdown(endTime);

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    addToCart({
      id: sale.id + 200,
      name: sale.name,
      price: sale.salePrice,
      image: sale.image,
    });
    toast({ title: 'Added to Cart! 🛒', description: `${sale.name} - ${sale.discount}% off!` });
  };

  const handleViewDetails = () => {
    setSelectedProduct(sale.id + 200);
    setActiveModal('product');
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const isExpired = countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-w-[220px] bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
    >
      <div
        className="w-full aspect-square bg-center bg-no-repeat bg-cover relative cursor-pointer"
        style={{ backgroundImage: `url("${sale.image}")` }}
        onClick={handleViewDetails}
      >
        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
          -{sale.discount}%
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D26] via-transparent to-transparent opacity-60" />
      </div>
      <div className="p-3">
        <p className="text-white font-bold text-sm">{sale.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#13ec13] font-black text-sm">{formatNaira(sale.salePrice)}</span>
          <span className="text-white/30 text-xs line-through">{formatNaira(sale.originalPrice)}</span>
        </div>
        {/* Real Countdown */}
        <div className="flex items-center gap-1 mt-2">
          <Timer className="w-3 h-3 text-red-400" />
          <div className="flex gap-1">
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">{pad(countdown.hours)}</span>
            <span className="text-red-400 text-[10px]">:</span>
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">{pad(countdown.minutes)}</span>
            <span className="text-red-400 text-[10px]">:</span>
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">{pad(countdown.seconds)}</span>
          </div>
          {isExpired && <span className="text-red-400 text-[10px] font-bold ml-1">ENDED</span>}
        </div>
        {/* Claimed progress */}
        <div className="mt-2">
          <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
            <div
              className="bg-[#FFD700] h-1.5 rounded-full transition-all"
              style={{ width: `${sale.claimed}%` }}
            />
          </div>
          <p className="text-white/30 text-[9px]">{sale.claimed}% claimed</p>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAddToCart()}
            disabled={isExpired}
            className="flex-1 bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] py-2 rounded-lg text-xs font-bold hover:bg-[#13ec13]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Cart
          </button>
          <button
            onClick={handleViewDetails}
            className="px-3 bg-white/5 border border-white/10 text-white/60 py-2 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OffersTab() {
  const { setActiveModal, hasanatPoints, swiftPoints, loyaltyTier, dailyStreak, claimDailyPoints } = useAppStore();
  const { toast } = useToast();
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Get current tier info
  const currentTierInfo = loyaltyTiers.find(t => t.id === loyaltyTier) || loyaltyTiers[2]; // default gold
  const nextTierInfo = loyaltyTiers.find(t => t.minPoints > hasanatPoints);
  const tierProgress = nextTierInfo
    ? Math.round(((hasanatPoints - currentTierInfo.minPoints) / (nextTierInfo.minPoints - currentTierInfo.minPoints)) * 100)
    : 100;

  const handleGiftCardClick = (_card: typeof giftCardTemplates[0]) => {
    useAppStore.getState().setGiftCardStep(0);
    setActiveModal('giftcard');
  };

  const handleGroupBuy = () => {
    setActiveModal('groupBuy');
  };

  const handleRedeemPoints = () => {
    setActiveModal('rewards');
  };

  const handleClaimDaily = () => {
    if (dailyClaimed) return;
    claimDailyPoints();
    setDailyClaimed(true);
    toast({ title: 'Daily Points Claimed! ✨', description: `+50 Hasanat Points! Streak: ${dailyStreak + 1} days` });
  };

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold">Offers & Rewards</h1>
        <p className="text-white/50 text-sm">Flash sales, loyalty perks & more</p>
      </div>

      {/* Daily Check-in */}
      <div className="px-4 mt-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleClaimDaily}
          disabled={dailyClaimed}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-colors text-left ${
            dailyClaimed
              ? 'bg-[#13ec13]/5 border-[#13ec13]/10'
              : 'bg-[#1A1D26] border-[#FFD700]/20 hover:border-[#FFD700]/40 cursor-pointer'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            dailyClaimed ? 'bg-[#13ec13]/10' : 'bg-[#FFD700]/10'
          }`}>
            <Zap className={`w-6 h-6 ${dailyClaimed ? 'text-[#13ec13]' : 'text-[#FFD700]'}`} />
          </div>
          <div className="flex-1">
            <p className={`font-bold text-sm ${dailyClaimed ? 'text-[#13ec13]' : 'text-white'}`}>
              {dailyClaimed ? '✓ Claimed Today!' : 'Claim Daily Points'}
            </p>
            <p className="text-white/40 text-xs">
              {dailyClaimed
                ? `Streak: ${dailyStreak + 1} days - Come back tomorrow!`
                : `+50 pts • ${dailyStreak} day streak • Streak bonuses available!`
              }
            </p>
          </div>
          {!dailyClaimed && (
            <span className="bg-[#FFD700] text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase">
              Claim
            </span>
          )}
        </motion.button>
      </div>

      {/* Loyalty Card */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={handleRedeemPoints}
        className="px-4 mt-4 w-full text-left"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D26] to-black border border-[#FFD700]/20 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/10 blur-[60px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
              <span className="text-[#FFD700] text-xs font-black uppercase tracking-widest">{currentTierInfo.name} Member</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs">Hasanat Points</p>
                <p className="text-white text-3xl font-black">{hasanatPoints.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs">Swift Points</p>
                <p className="text-white/80 text-lg font-bold">{swiftPoints.toLocaleString()}</p>
              </div>
            </div>
            {/* Progress to next tier */}
            {nextTierInfo && (
              <>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#FFD700]/60">{currentTierInfo.name}</span>
                  <span className="text-[#FFD700]/60">{nextTierInfo.name} - {nextTierInfo.minPoints.toLocaleString()} pts</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 mb-4">
                  <motion.div
                    className="gold-gradient h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(tierProgress, 100)}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              {currentTierInfo.benefits.slice(0, 3).map((benefit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
                  <p className="text-white/60 text-xs">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.button>

      {/* Flash Sales */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-red-400" />
            <h3 className="text-white text-lg font-extrabold">Flash Sales</h3>
          </div>
          <span className="text-red-400 text-xs font-bold animate-pulse">LIVE</span>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {flashSales.map((sale) => (
            <FlashSaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      </div>

      {/* Gift Cards */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#FFD700]" />
            <h3 className="text-white text-lg font-extrabold">Gift Cards</h3>
          </div>
          <button
            onClick={() => {
              useAppStore.getState().setGiftCardStep(0);
              setActiveModal('giftcard');
            }}
            className="text-[#13ec13] text-xs font-bold cursor-pointer hover:text-[#13ec13]/80 transition-colors"
          >
            Design Yours
          </button>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
          {giftCardTemplates.map((card) => (
            <button
              key={card.id}
              onClick={() => handleGiftCardClick(card)}
              className={`min-w-[180px] h-28 rounded-2xl bg-gradient-to-br ${card.color} p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform border border-white/10 active:scale-[0.98]`}
            >
              <span className="material-symbols-outlined text-white/80 text-2xl">{card.icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{card.name}</p>
                <p className="text-white/50 text-[10px]">Customize & Send</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Group Buy Deals Preview */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#13ec13]" />
            <h3 className="text-white text-lg font-extrabold">Group Buy Deals</h3>
          </div>
          <button
            onClick={handleGroupBuy}
            className="text-[#13ec13] text-xs font-bold cursor-pointer hover:text-[#13ec13]/80 transition-colors"
          >
            See All
          </button>
        </div>
        <div className="space-y-3">
          {groupBuyDeals.slice(0, 2).map((deal) => {
            const slotsFilled = deal.filledSlots;
            const slotsTotal = deal.totalSlots;
            const fillPercent = Math.round((slotsFilled / slotsTotal) * 100);
            const { groupBuySlots, joinGroupBuy } = useAppStore.getState();
            const slotState = groupBuySlots[deal.id];
            const hasJoined = slotState?.joined || false;
            const currentFilled = slotState?.filled || deal.filledSlots;

            return (
              <motion.div
                key={deal.id}
                className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5"
              >
                <div className="flex gap-3">
                  <div
                    className="w-16 h-16 rounded-xl bg-center bg-cover shrink-0 border border-white/10"
                    style={{ backgroundImage: `url("${deal.image}")` }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{deal.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#13ec13] font-black text-sm">{formatNaira(deal.perPersonPrice)}</span>
                      <span className="text-white/30 text-xs">per person</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div
                          className="bg-[#13ec13] h-1.5 rounded-full transition-all"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                      <p className="text-white/30 text-[9px] mt-0.5">{currentFilled}/{slotsTotal} slots filled</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!hasJoined) {
                      joinGroupBuy(deal.id, deal.totalSlots);
                      toast({ title: 'Joined Group Buy! 🎉', description: `You've joined ${deal.name}` });
                    } else {
                      handleGroupBuy();
                    }
                  }}
                  className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    hasJoined
                      ? 'bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13]'
                      : 'bg-[#13ec13] text-black hover:bg-[#13ec13]/90'
                  }`}
                >
                  {hasJoined ? '✓ Joined - View Details' : 'Join Group Buy'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Group Buy CTA */}
      <div className="px-4 mt-6 mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-[#1A1D26] border border-[#13ec13]/10 p-5">
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#13ec13]/5 blur-[40px]" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#13ec13]" />
            </div>
            <div>
              <p className="text-white font-bold">Group Buy: Split & Save</p>
              <p className="text-white/40 text-xs">Join community bulk orders for wholesale prices</p>
            </div>
          </div>
          <button
            onClick={handleGroupBuy}
            className="w-full bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#13ec13]/20 transition-colors"
          >
            Join a Group Buy
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
