'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Star,
  Zap,
  ArrowRight,
  Search,
  ChevronRight,
  Flame,
  Users,
  Sparkles,
  ShoppingBag,
  Heart,
  X,
  Utensils,
  Moon,
  CupSoda,
  ShoppingCart,
  Pill,
  Package,
  BadgeCheck,
  Leaf,
  Truck,
  Timer,
} from 'lucide-react';
import {
  categories,
  trendingMeals,
  flashSales,
  popularRetailers,
  categoryHubItems,
  formatNaira,
  heroSlides,
} from '@/lib/data';

/* ══════════════════════════════════════════════════════════════════
   WELCOME SCREEN — MODERN MARKETPLACE LANDING
   Guests can browse foods, drinks, deals before signing up
   ══════════════════════════════════════════════════════════════════ */

/* ─────────────── Category Icon Map ─────────────── */
const categoryIcons: Record<string, { icon: React.ElementType; color: string }> = {
  'Iftar Meals': { icon: Utensils, color: '#D4AF37' },
  'Sahur': { icon: Moon, color: '#8B9DC3' },
  'Dates': { icon: Sparkles, color: '#C5962C' },
  'Drinks': { icon: CupSoda, color: '#E8652D' },
  'Snacks': { icon: Flame, color: '#F59E0B' },
  'Fruits': { icon: Leaf, color: '#13ec13' },
  'Groceries': { icon: ShoppingCart, color: '#3b82f6' },
  'Pharmacy': { icon: Pill, color: '#9B59B6' },
  'Bundles': { icon: Package, color: '#D4AF37' },
};

/* ─────────────── Sign Up Prompt Modal ─────────────── */
function SignUpPrompt({ onClose, onGetStarted }: { onClose: () => void; onGetStarted: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #12151E 0%, #0A0D14 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                  border: '1px solid rgba(212,175,55,0.2)',
                }}
              >
                <ShoppingBag className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">Join SwiftRamadan</h3>
                <p className="text-white/40 text-xs">Sign up to order, track & save</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {[
              { icon: Zap, text: 'Iftar-precision delivery before Maghrib', color: '#D4AF37' },
              { icon: Users, text: 'Community group buys & bulk savings', color: '#13ec13' },
              { icon: Heart, text: 'Charity & Sadaqah built right in', color: '#E8652D' },
            ].map(({ icon: Ic, text, color }) => (
              <div key={text} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}12` }}>
                <Ic className="w-5 h-5 shrink-0" style={{ color }} />
                <span className="text-white/60 text-sm">{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onGetStarted}
            className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)',
              color: '#080B12',
              boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
            }}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              onClose();
              // Will be handled by parent
            }}
            className="w-full h-12 mt-3 rounded-xl text-white/40 text-sm font-medium hover:text-white/60 transition-colors"
          >
            Already have an account? <span className="text-[#D4AF37] font-bold">Sign In</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────── Hero Banner ─────────────── */
function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-4 mt-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5 }}
          className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url("${heroSlides[currentSlide].image}")` }}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(8,11,18,0.85) 0%, rgba(8,11,18,0.4) 50%, rgba(8,11,18,0.7) 100%)',
          }} />

          {heroSlides[currentSlide].badge && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5E6A3)', boxShadow: '0 2px 12px rgba(212,175,55,0.3)' }}>
              <Star className="w-3 h-3 text-[#080B12] fill-[#080B12]" />
              <span className="text-[#080B12] text-[9px] font-black uppercase tracking-wider">{heroSlides[currentSlide].badge}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-white text-lg font-extrabold leading-tight tracking-tight">
              {heroSlides[currentSlide].title}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="w-3 h-3 text-[#13ec13]" />
              <span className="text-[#13ec13]/80 text-xs font-semibold">{heroSlides[currentSlide].subtitle}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-1.5 mt-2.5">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentSlide ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-white/15'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Flash Deal Card ─────────────── */
function FlashDealCard({ sale, onTap }: { sale: typeof flashSales[0]; onTap: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="min-w-[180px] max-w-[180px] rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative">
        <div
          className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url("${sale.image}")` }}
        />
        <div className="absolute top-2 left-2 bg-red-500/90 px-1.5 py-0.5 rounded-md">
          <span className="text-white text-[9px] font-black">-{sale.discount}%</span>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-1">
          <Timer className="w-2.5 h-2.5 text-[#FFD700]" />
          <span className="text-[#FFD700] text-[8px] font-bold">{sale.endsIn}</span>
        </div>
      </div>
      <div className="p-2.5">
        <h4 className="text-white font-bold text-xs truncate">{sale.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#13ec13] font-black text-xs">{formatNaira(sale.salePrice)}</span>
          <span className="text-white/25 text-[9px] line-through">{formatNaira(sale.originalPrice)}</span>
        </div>
        <div className="mt-1.5">
          <div className="w-full bg-white/5 rounded-full h-1">
            <div className="bg-[#FFD700] h-1 rounded-full" style={{ width: `${sale.claimed}%` }} />
          </div>
          <p className="text-white/25 text-[8px] mt-0.5">{sale.claimed}% claimed</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Meal Card ─────────────── */
function MealCard({ meal, onTap }: { meal: typeof trendingMeals[0]; onTap: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="flex gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-white/[0.03]"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0"
        style={{
          backgroundImage: `url("${meal.image}")`,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-white font-bold text-sm truncate">{meal.name}</h4>
            <span className="text-[#13ec13] font-black text-xs whitespace-nowrap">{formatNaira(meal.price)}</span>
          </div>
          <p className="text-white/35 text-[10px] leading-relaxed mt-0.5 line-clamp-2">{meal.description}</p>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="flex items-center gap-1 text-[9px] text-white/40 font-bold bg-white/5 px-1.5 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5" />
            {meal.deliveryTime}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-[#FFD700] font-bold">
            <Star className="w-2.5 h-2.5 fill-[#FFD700]" />
            {meal.rating}
          </span>
          <span className="text-[9px] text-white/25">({meal.reviews})</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Retailer Card ─────────────── */
function RetailerCard({ retailer, onTap }: { retailer: typeof popularRetailers[0]; onTap: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="min-w-[150px] max-w-[150px] rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-full aspect-square bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url("${retailer.image}")` }}
      />
      <div className="p-2.5">
        <div className="flex items-center gap-1">
          <h4 className="text-white font-bold text-[11px] truncate">{retailer.name}</h4>
          {retailer.verified && <BadgeCheck className="w-3 h-3 text-[#13ec13] shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/35 text-[9px]">{retailer.category}</span>
          <span className="text-white/20 text-[9px]">•</span>
          <span className="text-white/35 text-[9px] flex items-center gap-0.5">
            <Clock className="w-2 h-2" />{retailer.deliveryTime}
          </span>
        </div>
        <div className="flex items-center gap-0.5 mt-1">
          <Star className="w-2.5 h-2.5 text-[#FFD700] fill-[#FFD700]" />
          <span className="text-white/50 text-[9px] font-bold">{retailer.rating}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN WELCOME SCREEN COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function WelcomeScreen() {
  const { setShowWelcome, setShowAuth } = useAppStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = useCallback(() => {
    setShowWelcome(false);
    setShowAuth('role');
  }, [setShowWelcome, setShowAuth]);

  const handleSignIn = useCallback(() => {
    setShowWelcome(false);
    setShowAuth('login');
  }, [setShowWelcome, setShowAuth]);

  const handleItemTap = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const filteredMeals = useMemo(() => {
    if (!activeCategory) return trendingMeals;
    return trendingMeals.filter(m => m.category === activeCategory);
  }, [activeCategory]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: '#080B12' }}
    >
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 30% at 50% -5%, rgba(212,175,55,0.05) 0%, transparent 70%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 40% 40% at 80% 80%, rgba(19,236,19,0.03) 0%, transparent 60%)',
      }} />

      {/* ═══ Top Navigation Bar ═══ */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(8,11,18,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#D4AF37]/20 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))' }}
            >
              <img src="/swiftramadan-logo.png" alt="SwiftRamadan" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em]">SwiftRamadan</span>
              <span className="text-white/20 text-[8px] font-medium">Lagos &bull; 2026</span>
            </div>
          </div>

          {/* Sign In / Get Started */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignIn}
              className="px-4 h-9 rounded-xl text-white/50 text-xs font-semibold hover:text-white/70 hover:bg-white/5 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="px-4 h-9 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-[0.97] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #E8D48B)',
                color: '#080B12',
                boxShadow: '0 2px 12px rgba(212,175,55,0.2)',
              }}
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ Scrollable Content ═══ */}
      <div ref={scrollRef} className="h-full overflow-y-auto pb-32 no-scrollbar">
        {/* ── Search Bar ── */}
        <div className="px-4 pt-3 pb-1">
          <button
            onClick={handleItemTap}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Search className="w-4 h-4 text-white/25" />
            <span className="text-white/25 text-sm">Search Jollof, Dates, Iftar meals...</span>
            <span className="ml-auto text-[9px] text-white/15 font-mono bg-white/5 px-1.5 py-0.5 rounded">⌘K</span>
          </button>
        </div>

        {/* ── Hero Banner Carousel ── */}
        <HeroBanner />

        {/* ── Categories Row ── */}
        <div className="px-4 pt-5 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-base font-bold tracking-tight">Browse Categories</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const cfg = categoryIcons[cat.name] || { icon: ShoppingBag, color: '#13ec13' };
              const Icon = cfg.icon;
              const isSelected = activeCategory === cat.name;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(isSelected ? null : cat.name)}
                  className="flex flex-col items-center gap-2 min-w-[68px]"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: isSelected ? `${cfg.color}20` : `${cfg.color}08`,
                      border: isSelected ? `1.5px solid ${cfg.color}50` : `1px solid ${cfg.color}15`,
                      boxShadow: isSelected ? `0 0 16px ${cfg.color}15` : 'none',
                    }}
                  >
                    <Icon className="w-6 h-6 transition-colors" style={{ color: isSelected ? cfg.color : `${cfg.color}80` }} />
                  </div>
                  <span className={`text-[9px] font-bold whitespace-nowrap transition-colors ${isSelected ? 'text-white' : 'text-white/40'}`}>
                    {cat.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Flash Sales ── */}
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FFD700]" />
              <h3 className="text-white text-base font-bold tracking-tight">Flash Sales</h3>
              <span className="text-[8px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Live</span>
            </div>
            <button onClick={handleItemTap} className="text-[#D4AF37] text-[10px] font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {flashSales.map((sale) => (
              <FlashDealCard key={sale.id} sale={sale} onTap={handleItemTap} />
            ))}
          </div>
        </div>

        {/* ── Category Hub ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            {categoryHubItems.map((item) => {
              const badgeColors: Record<string, string> = {
                'Popular': '#D4AF37',
                'Group Buy': '#13ec13',
                'Fast': '#3b82f6',
                'New': '#9B59B6',
              };
              const color = badgeColors[item.badge] || '#D4AF37';
              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleItemTap}
                  className="relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-full aspect-[16/9] bg-center bg-no-repeat bg-cover"
                    style={{ backgroundImage: `url("${item.image}")` }}
                  />
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, transparent 30%, rgba(8,11,18,0.9) 100%)',
                  }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                        style={{ color, background: `${color}15`, border: `1px solid ${color}20` }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-xs">{item.name}</h4>
                    <span className="text-white/35 text-[9px]">{item.subtitle}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Trending Meals ── */}
        <div className="px-4 pt-5 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-white text-base font-bold tracking-tight">
                {activeCategory || 'Trending'} Meals
              </h3>
            </div>
            <button onClick={handleItemTap} className="text-[#D4AF37] text-[10px] font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onTap={handleItemTap} />
            ))}
            {filteredMeals.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-white/25 text-sm">No meals found in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Popular Retailers ── */}
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#13ec13]" />
              <h3 className="text-white text-base font-bold tracking-tight">Popular Stores</h3>
            </div>
            <button onClick={handleItemTap} className="text-[#D4AF37] text-[10px] font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {popularRetailers.map((retailer) => (
              <RetailerCard key={retailer.id} retailer={retailer} onTap={handleItemTap} />
            ))}
          </div>
        </div>

        {/* ── Why SwiftRamadan ── */}
        <div className="px-4 pt-5 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-white text-base font-bold tracking-tight">Why SwiftRamadan</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, title: 'Iftar Precision', desc: 'Meals before Maghrib', color: '#D4AF37' },
              { icon: Truck, title: 'Live Tracking', desc: 'Kitchen to doorstep', color: '#3b82f6' },
              { icon: Users, title: 'Group Buys', desc: 'Bulk savings together', color: '#13ec13' },
              { icon: Heart, title: 'Sadaqah Built In', desc: 'Charity with every order', color: '#E8652D' },
            ].map(({ icon: Ic, title, desc, color }) => (
              <div
                key={title}
                className="p-3.5 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${color}06, ${color}02)`,
                  border: `1px solid ${color}12`,
                }}
              >
                <Ic className="w-5 h-5 mb-2" style={{ color }} />
                <h4 className="text-white text-xs font-bold">{title}</h4>
                <p className="text-white/30 text-[10px] mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Social Proof ── */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-around py-5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(212,175,55,0.08)',
            }}
          >
            {[
              { value: '12K+', label: 'Families' },
              { value: '98%', label: 'On-time' },
              { value: '4.9', label: 'Rating' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-xl font-black" style={{
                  background: 'linear-gradient(135deg, #D4AF37, #F5E6A3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{stat.value}</span>
                <span className="text-white/40 text-[9px] font-bold">{stat.label}</span>
                {i < 2 && <div className="absolute right-0 w-px h-8 bg-white/[0.06]" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA Section ── */}
        <div className="px-4 pt-2 pb-8">
          <div className="relative overflow-hidden rounded-3xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))',
              border: '1px solid rgba(212,175,55,0.1)',
            }}
          >
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 blur-[60px]" style={{ background: 'rgba(212,175,55,0.1)' }} />

            <span className="relative text-[#D4AF37]/50 text-sm font-light">ٱلسَّلَامُ عَلَيْكُمْ</span>
            <h2 className="relative text-white text-2xl font-extrabold mt-2 tracking-tight">
              Ready to elevate your Ramadan?
            </h2>
            <p className="relative text-white/35 text-sm mt-2 max-w-[260px] mx-auto">
              Join thousands of Lagos families enjoying Iftar & Sahur delivered with care.
            </p>

            <div className="relative flex flex-col gap-2.5 mt-5">
              <button
                onClick={handleGetStarted}
                className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)',
                  color: '#080B12',
                  boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
                }}
              >
                Begin Your Journey
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignIn}
                className="w-full h-11 rounded-xl text-white/40 text-sm font-medium hover:text-white/60 transition-colors"
              >
                Already part of the family? <span className="text-[#D4AF37] font-bold">Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Floating Bottom Bar ═══ */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.6, type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
      >
        <div
          className="max-w-lg mx-auto rounded-2xl px-4 py-3 flex items-center justify-between pointer-events-auto"
          style={{
            background: 'rgba(12,15,22,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,175,55,0.12)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.05)',
          }}
        >
          <div>
            <p className="text-white text-xs font-bold">Start ordering now</p>
            <p className="text-white/30 text-[10px]">Free delivery on your first order</p>
          </div>
          <button
            onClick={handleGetStarted}
            className="h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-[0.97] transition-transform shrink-0"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #E8D48B)',
              color: '#080B12',
            }}
          >
            Join Free
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* ═══ Sign Up Prompt Modal ═══ */}
      <AnimatePresence>
        {showPrompt && (
          <SignUpPrompt
            onClose={() => setShowPrompt(false)}
            onGetStarted={handleGetStarted}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
