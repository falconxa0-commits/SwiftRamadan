'use client';

import { Timer, Star, Gift, Crown, ChevronRight, TrendingUp } from 'lucide-react';
import { flashSales, loyaltyData, giftCardTemplates, formatNaira } from '@/lib/data';
import { motion } from 'framer-motion';

export default function OffersTab() {
  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold">Offers & Rewards</h1>
        <p className="text-white/50 text-sm">Flash sales, loyalty perks & more</p>
      </div>

      {/* Loyalty Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 mt-4"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D26] to-black border border-[#FFD700]/20 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/10 blur-[60px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
              <span className="text-[#FFD700] text-xs font-black uppercase tracking-widest">{loyaltyData.tier}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs">Points Balance</p>
                <p className="text-white text-3xl font-black">{loyaltyData.points.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs">Next Tier</p>
                <p className="text-white/60 text-sm font-bold">{loyaltyData.nextTierPoints.toLocaleString()} pts</p>
              </div>
            </div>
            {/* Progress */}
            <div className="w-full bg-white/5 rounded-full h-3 mb-4">
              <div
                className="gold-gradient h-3 rounded-full transition-all duration-1000"
                style={{ width: `${loyaltyData.tierProgress}%` }}
              />
            </div>
            <div className="space-y-2">
              {loyaltyData.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
                  <p className="text-white/60 text-xs">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

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
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-w-[220px] bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden cursor-pointer hover:border-white/10 transition-colors"
            >
              <div
                className="w-full aspect-square bg-center bg-no-repeat bg-cover relative"
                style={{ backgroundImage: `url("${sale.image}")` }}
              >
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  -{sale.discount}%
                </div>
              </div>
              <div className="p-3">
                <p className="text-white font-bold text-sm">{sale.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#13ec13] font-black text-sm">{formatNaira(sale.salePrice)}</span>
                  <span className="text-white/30 text-xs line-through">{formatNaira(sale.originalPrice)}</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-white/40 text-[10px]">
                  <Timer className="w-3 h-3" />
                  Ends in {sale.endsIn}
                </div>
              </div>
            </motion.div>
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
          <span className="text-[#13ec13] text-xs font-bold cursor-pointer">Design Yours</span>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
          {giftCardTemplates.map((card) => (
            <div
              key={card.id}
              className={`min-w-[180px] h-28 rounded-2xl bg-gradient-to-br ${card.color} p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform border border-white/10`}
            >
              <span className="material-symbols-outlined text-white/80 text-2xl">{card.icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{card.name}</p>
                <p className="text-white/50 text-[10px]">Customize & Send</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group Buy Teaser */}
      <div className="px-4 mt-8 mb-6">
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
          <button className="w-full bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#13ec13]/20 transition-colors">
            Join a Group Buy
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
