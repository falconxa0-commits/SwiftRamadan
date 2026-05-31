'use client';

import { Star, Clock, ChevronRight, Zap, BadgeCheck } from 'lucide-react';
import { heroSlides, categories, ramadanBox, trendingMeals, formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function HomeTab() {
  const { setActiveModal } = useAppStore();

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Hero Carousel */}
      <div className="flex overflow-x-auto pb-4 pt-4 no-scrollbar">
        <div className="flex items-stretch px-4 gap-4">
          {heroSlides.map((slide) => (
            <div key={slide.id} className="flex h-full flex-1 flex-col gap-3 rounded-2xl min-w-[300px]">
              <div
                className="relative w-full aspect-[16/9] bg-center bg-no-repeat bg-cover rounded-2xl overflow-hidden border border-white/5"
                style={{ backgroundImage: `url("${slide.image}")` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent" />
                {slide.badge && (
                  <div className="absolute top-3 left-3 gold-gradient px-3 py-1 rounded-full flex items-center gap-1 gold-glow">
                    <Star className="w-3 h-3 text-black fill-black" />
                    <span className="text-black text-[10px] font-bold uppercase tracking-wider">{slide.badge}</span>
                  </div>
                )}
              </div>
              <div className="px-1">
                <p className="text-white text-lg font-bold leading-tight">{slide.title}</p>
                <p className="text-[#13ec13]/80 text-sm font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {slide.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Circles */}
      <div className="px-4 py-4">
        <div className="flex w-full overflow-x-auto gap-6 pb-2 no-scrollbar">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className={`w-16 h-16 bg-[#1A1D26] border-2 ${cat.active ? 'border-[#13ec13]' : 'border-white/10'} rounded-full flex items-center justify-center p-1 ${cat.active ? 'green-glow' : ''}`}>
                <div
                  className="w-full h-full bg-center bg-no-repeat bg-cover rounded-full"
                  style={{ backgroundImage: `url("${cat.image}")` }}
                />
              </div>
              <p className={`text-[11px] font-bold whitespace-nowrap ${cat.active ? 'text-white/90' : 'text-white/60'}`}>{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Ramadan Box */}
      <div className="px-4 my-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#1A1D26] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#13ec13]/5 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FFD700]/5 blur-[80px]" />
          <div className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-[#13ec13]/10 text-[#13ec13] border border-[#13ec13]/20 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3">
                  Editor&apos;s Choice
                </span>
                <h3 className="text-3xl font-black text-white leading-[1.1] tracking-tight">
                  The Ultimate<br />Ramadan Box
                </h3>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[10px] font-medium line-through">{formatNaira(ramadanBox.originalPrice)}</p>
                <p className="text-[#13ec13] text-2xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(19,236,19,0.3)]">
                  {formatNaira(ramadanBox.salePrice)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {ramadanBox.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square bg-center bg-no-repeat bg-cover rounded-2xl border border-white/10"
                  style={{ backgroundImage: `url("${img}")` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 mb-8 bg-black/30 p-3 rounded-xl border border-white/5">
              <BadgeCheck className="w-5 h-5 text-[#FFD700] shrink-0" />
              <p className="text-white/80 text-xs font-semibold">{ramadanBox.contents} Included</p>
            </div>

            <button
              onClick={() => setActiveModal('product')}
              className="w-full bg-[#13ec13] py-4 rounded-2xl text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-[#13ec13]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              PRE-ORDER FOR IFTAR
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trending Iftar */}
      <div className="px-4 py-4 flex justify-between items-end">
        <h3 className="text-white text-xl font-black tracking-tight">Trending Iftar</h3>
        <span className="text-[#13ec13] text-xs font-extrabold uppercase tracking-wider cursor-pointer">See All</span>
      </div>
      <div className="px-4 space-y-4">
        {trendingMeals.map((meal) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: meal.id * 0.1 }}
            className="flex gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
            onClick={() => setActiveModal('product')}
          >
            <div
              className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0 border border-white/10"
              style={{ backgroundImage: `url("${meal.image}")` }}
            />
            <div className="flex flex-col justify-between flex-1">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-bold text-base">{meal.name}</h4>
                  <span className="text-[#13ec13] font-black">{formatNaira(meal.price)}</span>
                </div>
                <p className="text-white/40 text-[11px] leading-relaxed mt-1">{meal.description}</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-white/50 font-bold bg-white/5 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {meal.deliveryTime}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#FFD700] font-bold">
                  <Star className="w-3 h-3 fill-[#FFD700]" />
                  {meal.rating}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
