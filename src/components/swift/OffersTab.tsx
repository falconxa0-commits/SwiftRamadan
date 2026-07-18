'use client';

import { Timer, Star, Gift, Crown, ChevronRight, TrendingUp, Zap, Copy, Check, Users, Heart, CreditCard, Sparkles } from 'lucide-react';
import { flashSales, loyaltyTiers, giftCardTemplates, groupBuyDeals, formatNaira } from '@/lib/data';
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
      className="min-w-[220px] glass-card rounded-2xl overflow-hidden hover:border-white/15 transition-colors"
    >
      <div
        className="w-full aspect-square bg-center bg-no-repeat bg-cover relative cursor-pointer"
        style={{ backgroundImage: `url("${sale.image}")` }}
        onClick={handleViewDetails}
      >
        <div className="absolute top-2 left-2 bg-[#FB7185] text-white text-[10px] font-bold px-2 py-1 rounded-full">
          -{sale.discount}%
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1118] via-transparent to-transparent opacity-60" />
      </div>
      <div className="p-3">
        <p className="text-white font-bold text-sm tracking-tight">{sale.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#10E07A] font-black text-sm">{formatNaira(sale.salePrice)}</span>
          <span className="text-white/30 text-xs line-through">{formatNaira(sale.originalPrice)}</span>
        </div>
        {/* Real Countdown */}
        <div className="flex items-center gap-1 mt-2">
          <Timer className="w-3 h-3 text-[#FB7185]" />
          <div className="flex gap-1">
            <span className="bg-[#FB7185]/20 text-[#FB7185] text-[10px] font-bold px-1.5 py-0.5 rounded">{pad(countdown.hours)}</span>
            <span className="text-[#FB7185] text-[10px]">:</span>
            <span className="bg-[#FB7185]/20 text-[#FB7185] text-[10px] font-bold px-1.5 py-0.5 rounded">{pad(countdown.minutes)}</span>
            <span className="text-[#FB7185] text-[10px]">:</span>
            <span className="bg-[#FB7185]/20 text-[#FB7185] text-[10px] font-bold px-1.5 py-0.5 rounded">{pad(countdown.seconds)}</span>
          </div>
          {isExpired && <span className="text-[#FB7185] text-[10px] font-bold ml-1">ENDED</span>}
        </div>
        {/* Claimed progress */}
        <div className="mt-2">
          <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
            <div
              className="bg-gradient-to-r from-[#F5C451] to-[#10E07A] h-1.5 rounded-full transition-all"
              style={{ width: `${sale.claimed}%` }}
            />
          </div>
          <p className="text-white/30 text-[9px]">{sale.claimed}% claimed</p>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAddToCart()}
            disabled={isExpired}
            className="flex-1 bg-[#10E07A]/10 border border-[#10E07A]/20 text-[#10E07A] py-2 rounded-lg text-xs font-bold hover:bg-[#10E07A]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            + Cart
          </button>
          <button
            onClick={handleViewDetails}
            className="px-3 bg-white/5 border border-white/10 text-white/60 py-2 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors active:scale-95"
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* Active coupons data — fallback only (used when API has not loaded yet) */
const ACTIVE_COUPONS_FALLBACK = [
  { code: 'RAMADAN', discount: '10% off', desc: 'Ramadan Special — min ₦5,000', color: '#10E07A' },
  { code: 'IFTAR', discount: '10% off', desc: 'Iftar Deal — meals only', color: '#F5C451' },
  { code: 'SWIFT25', discount: '25% off', desc: 'Swift25 Bonus — min ₦10,000', color: '#A78BFA' },
  { code: 'SAHUR', discount: '15% off', desc: 'Sahur Special — dawn meals', color: '#38BDF8' },
];

/* Limited-time offers (static curated) — fallback only */
const LIMITED_OFFERS_FALLBACK = [
  { id: 1, title: 'Family Iftar Bundle', desc: 'Feeds 4-6 people', price: 12500, originalPrice: 18000, image: '/images/flash-sales/flash-iftar-bundle.png', tag: 'Family' },
  { id: 2, title: 'Sahur Power Pack', desc: 'High-protein dawn meal', price: 4500, originalPrice: 6500, image: '/images/meals/meal-suya.png', tag: 'Sahur' },
  { id: 3, title: 'Date Lovers Box', desc: 'Premium Medjool dates', price: 8000, originalPrice: 11000, image: '/images/flash-sales/flash-dates.png', tag: 'Premium' },
  { id: 4, title: 'Refreshing Drinks Set', desc: 'Hibiscus + Zobo combo', price: 3500, originalPrice: 5000, image: '/images/flash-sales/flash-zobo-kunu.png', tag: 'Drinks' },
];

interface ApiCoupon {
  id: string;
  code: string;
  discountLabel: string;
  description: string;
  color: string;
  minOrder: number;
  value: number;
  couponType: string;
  usesLeft: number;
}

interface ApiOffer {
  id: string;
  type: string;
  title: string;
  description: string;
  image: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
}

export default function OffersTab() {
  const { setActiveModal, hasanatPoints, swiftPoints, loyaltyTier, dailyStreak, claimDailyPoints } = useAppStore();
  const { toast } = useToast();
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [apiCoupons, setApiCoupons] = useState<ApiCoupon[] | null>(null);
  const [apiOffers, setApiOffers] = useState<ApiOffer[] | null>(null);

  // Fetch coupons + curated offers from /api/offers
  useEffect(() => {
    let cancelled = false;
    const fetchOffers = async () => {
      try {
        const res = await fetch('/api/offers');
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.coupons)) setApiCoupons(data.coupons);
        if (Array.isArray(data.offers)) setApiOffers(data.offers);
      } catch {
        // keep fallbacks
      }
    };
    fetchOffers();
    return () => { cancelled = true; };
  }, []);

  // Normalize API coupons to the same shape as the fallback list
  const coupons = (apiCoupons && apiCoupons.length > 0)
    ? apiCoupons.map(c => ({
        code: c.code,
        discount: c.discountLabel,
        desc: c.description,
        color: c.color,
      }))
    : ACTIVE_COUPONS_FALLBACK;

  // Normalize API offers to the same shape as the fallback list
  const limitedOffers = (apiOffers && apiOffers.length > 0)
    ? apiOffers.map((o, idx) => ({
        id: idx + 1,
        title: o.title,
        desc: o.description,
        price: o.salePrice,
        originalPrice: o.originalPrice,
        image: o.image,
        tag: o.type === 'flash-sale' ? 'Flash' : 'Ramadan',
      }))
    : LIMITED_OFFERS_FALLBACK;

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

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard may be unavailable in sandboxed environments — still flip UI state
    }
    setCopiedCode(code);
    toast({ title: 'Coupon Copied! 📋', description: `${code} — paste at checkout to apply` });
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleReferEarn = () => {
    setActiveModal('refer');
  };

  const handleCharity = () => {
    setActiveModal('charity');
  };

  const handleBNPL = () => {
    setActiveModal('bnpl');
  };

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight heading-accent">Offers &amp; Rewards</h1>
        <p className="text-white/50 text-sm mt-1">Flash sales, loyalty perks &amp; more</p>
      </div>

      {/* Daily Check-in — aurora-card */}
      <div className="px-5 mt-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleClaimDaily}
          disabled={dailyClaimed}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-colors text-left active:scale-[0.99] ${
            dailyClaimed
              ? 'bg-[#10E07A]/5 border-[#10E07A]/10'
              : 'aurora-card border-[#F5C451]/20 hover:border-[#F5C451]/40 cursor-pointer'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center icon-tile ${
            dailyClaimed ? 'bg-[#10E07A]/10' : 'bg-[#F5C451]/10'
          }`}>
            <Zap className={`w-6 h-6 relative z-10 ${dailyClaimed ? 'text-[#10E07A]' : 'text-[#F5C451]'}`} />
          </div>
          <div className="flex-1">
            <p className={`font-bold text-sm tracking-tight ${dailyClaimed ? 'text-[#10E07A]' : 'text-white'}`}>
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
            <span className="bg-[#F5C451] text-[#06070B] text-[10px] font-black px-3 py-1.5 rounded-full uppercase gold-glow">
              Claim
            </span>
          )}
        </motion.button>
      </div>

      {/* Loyalty Card — premium-card */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={handleRedeemPoints}
        className="px-5 mt-4 w-full text-left"
      >
        <div className="relative overflow-hidden rounded-2xl premium-card p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C451]/10 blur-[60px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#F5C451]/15 flex items-center justify-center border border-[#F5C451]/30 icon-tile">
                <Crown className="w-4 h-4 text-[#F5C451] fill-[#F5C451] relative z-10" />
              </div>
              <span className="text-[#F5C451] text-xs font-black uppercase tracking-widest">{currentTierInfo.name} Member</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs">Hasanat Points</p>
                <p className="text-white text-3xl font-black tracking-tight">{hasanatPoints.toLocaleString()}</p>
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
                  <span className="text-[#F5C451]/60">{currentTierInfo.name}</span>
                  <span className="text-[#F5C451]/60">{nextTierInfo.name} - {nextTierInfo.minPoints.toLocaleString()} pts</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden">
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
                <div key={benefit} className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-[#F5C451] fill-[#F5C451]" />
                  <p className="text-white/60 text-xs">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.button>

      {/* Flash Sales — aurora-card hero */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FB7185]/15 flex items-center justify-center border border-[#FB7185]/30 icon-tile">
              <Timer className="w-4 h-4 text-[#FB7185] relative z-10" />
            </div>
            <h3 className="text-white text-lg font-extrabold heading-accent">Flash Sales</h3>
          </div>
          <span className="soft-chip text-[#FB7185] border-[#FB7185]/30 bg-[#FB7185]/10">
            <span className="size-1.5 rounded-full bg-[#FB7185] pulse-soft" />
            LIVE
          </span>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {flashSales.map((sale) => (
            <FlashSaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      </div>

      {/* Active Coupons */}
      <div className="px-5 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#10E07A]/15 flex items-center justify-center border border-[#10E07A]/30 icon-tile">
            <Gift className="w-4 h-4 text-[#10E07A] relative z-10" />
          </div>
          <h3 className="text-white text-lg font-extrabold heading-accent">Active Coupons</h3>
        </div>
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const isCopied = copiedCode === coupon.code;
            return (
              <div key={coupon.code} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 icon-tile border"
                  style={{ backgroundColor: `${coupon.color}15`, borderColor: `${coupon.color}30` }}
                >
                  <span className="relative z-10 text-xs font-black" style={{ color: coupon.color }}>
                    {coupon.discount}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-sm font-mono tracking-wider">{coupon.code}</p>
                    <span className="soft-chip">{coupon.discount}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{coupon.desc}</p>
                </div>
                <button
                  onClick={() => handleCopyCoupon(coupon.code)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 ${
                    isCopied
                      ? 'bg-[#10E07A]/15 border border-[#10E07A]/30 text-[#10E07A]'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                  aria-label={`Copy coupon ${coupon.code}`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Limited-time offers grid */}
      <div className="px-5 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#A78BFA]/15 flex items-center justify-center border border-[#A78BFA]/30 icon-tile">
            <Sparkles className="w-4 h-4 text-[#A78BFA] relative z-10" />
          </div>
          <h3 className="text-white text-lg font-extrabold heading-accent">Limited-Time Offers</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {limitedOffers.map((offer) => {
            const discount = Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100);
            return (
              <motion.div
                key={offer.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  useAppStore.getState().addToCart({ id: 700 + offer.id, name: offer.title, price: offer.price, image: offer.image });
                  toast({ title: 'Added to Cart! 🛒', description: `${offer.title} added` });
                }}
                className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:border-white/15 transition-colors"
              >
                <div
                  className="w-full aspect-video bg-center bg-cover relative"
                  style={{ backgroundImage: `url("${offer.image}")` }}
                >
                  <span className="absolute top-2 left-2 bg-[#A78BFA] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                  <span className="absolute top-2 right-2 soft-chip bg-black/40">{offer.tag}</span>
                </div>
                <div className="p-3">
                  <p className="text-white text-xs font-bold truncate tracking-tight">{offer.title}</p>
                  <p className="text-white/40 text-[10px]">{offer.desc}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[#10E07A] text-sm font-black">{formatNaira(offer.price)}</span>
                    <span className="text-white/30 text-[10px] line-through">{formatNaira(offer.originalPrice)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Gift Cards */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F5C451]/15 flex items-center justify-center border border-[#F5C451]/30 icon-tile">
              <Gift className="w-4 h-4 text-[#F5C451] relative z-10" />
            </div>
            <h3 className="text-white text-lg font-extrabold heading-accent">Gift Cards</h3>
          </div>
          <button
            onClick={() => {
              useAppStore.getState().setGiftCardStep(0);
              setActiveModal('giftcard');
            }}
            className="text-[#10E07A] text-xs font-bold cursor-pointer hover:text-[#10E07A]/80 transition-colors"
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
                <p className="text-white font-bold text-sm tracking-tight">{card.name}</p>
                <p className="text-white/50 text-[10px]">Customize &amp; Send</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Group Buy Deals Preview */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#10E07A]/15 flex items-center justify-center border border-[#10E07A]/30 icon-tile">
              <TrendingUp className="w-4 h-4 text-[#10E07A] relative z-10" />
            </div>
            <h3 className="text-white text-lg font-extrabold heading-accent">Group Buy Deals</h3>
          </div>
          <button
            onClick={handleGroupBuy}
            className="text-[#10E07A] text-xs font-bold cursor-pointer hover:text-[#10E07A]/80 transition-colors"
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
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex gap-3">
                  <div
                    className="w-16 h-16 rounded-xl bg-center bg-cover shrink-0 border border-white/10"
                    style={{ backgroundImage: `url("${deal.image}")` }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate tracking-tight">{deal.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#10E07A] font-black text-sm">{formatNaira(deal.perPersonPrice)}</span>
                      <span className="text-white/30 text-xs">per person</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-[#10E07A] to-[#F5C451] h-1.5 rounded-full transition-all"
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
                  className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 ${
                    hasJoined
                      ? 'bg-[#10E07A]/10 border border-[#10E07A]/20 text-[#10E07A]'
                      : 'bg-[#10E07A] text-[#06070B] hover:bg-[#10E07A]/90 green-glow'
                  }`}
                >
                  {hasJoined ? '✓ Joined - View Details' : 'Join Group Buy'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Refer & Earn CTA — aurora-card */}
      <div className="px-5 mt-6">
        <button
          onClick={handleReferEarn}
          className="w-full text-left active:scale-[0.99] transition-transform"
        >
          <div className="relative overflow-hidden rounded-2xl aurora-card p-5 hover:border-white/15 transition-colors">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#38BDF8]/10 blur-[44px] pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/15 flex items-center justify-center border border-[#38BDF8]/30 icon-tile shrink-0">
                <Users className="w-6 h-6 text-[#38BDF8] relative z-10" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm tracking-tight">Refer &amp; Earn</p>
                <p className="text-white/50 text-xs mt-0.5">Get ₦2,000 per friend who joins SwiftRamadan</p>
              </div>
              <span className="bg-[#38BDF8] text-[#06070B] text-[10px] font-black px-3 py-1.5 rounded-full">
                ₦2,000
              </span>
              <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
            </div>
          </div>
        </button>
      </div>

      {/* Charity / Zakat CTA — aurora-card */}
      <div className="px-5 mt-3">
        <button
          onClick={handleCharity}
          className="w-full text-left active:scale-[0.99] transition-transform"
        >
          <div className="relative overflow-hidden rounded-2xl aurora-card p-5 hover:border-white/15 transition-colors">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#FB7185]/10 blur-[44px] pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FB7185]/15 flex items-center justify-center border border-[#FB7185]/30 icon-tile shrink-0">
                <Heart className="w-6 h-6 text-[#FB7185] relative z-10" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm tracking-tight">Charity &amp; Zakat</p>
                <p className="text-white/50 text-xs mt-0.5">Give back this Ramadan — donations &amp; Zakat calculator</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
            </div>
          </div>
        </button>
      </div>

      {/* BNPL Promo Banner — premium-card */}
      <div className="px-5 mt-3 mb-6">
        <button
          onClick={handleBNPL}
          className="w-full text-left active:scale-[0.99] transition-transform"
        >
          <div className="relative overflow-hidden rounded-2xl premium-card p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10E07A]/10 blur-[60px]" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#10E07A]/15 flex items-center justify-center border border-[#10E07A]/30 icon-tile shrink-0">
                <CreditCard className="w-6 h-6 text-[#10E07A] relative z-10" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm tracking-tight">Pay Small-Small</p>
                  <span className="beta-badge">BNPL</span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">Split your order into 3 interest-free payments</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
            </div>
          </div>
        </button>
      </div>
    </main>
  );
}
