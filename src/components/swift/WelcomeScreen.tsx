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
   WELCOME SCREEN — AURORA LUXE MARKETPLACE LANDING
   Guests can browse foods, drinks, deals before signing up.
   Aurora Luxe design language: deep midnight + emerald/gold/violet
   mesh auroras, glass cards, soft chips, gradient text.
   ══════════════════════════════════════════════════════════════════ */

/* ─────────────── Aurora Palette Tokens ─────────────── */
const AURORA = {
  bg: '#06070B',
  surface1: '#0F1118',
  surface2: '#161924',
  surface3: '#1F2330',
  emerald: '#10E07A',
  gold: '#F5C451',
  violet: '#A78BFA',
  coral: '#FB7185',
  sky: '#38BDF8',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.40)',
} as const;

/* ─────────────── Category Icon Map ─────────────── */
const categoryIcons: Record<string, { icon: React.ElementType; color: string }> = {
  'Iftar Meals': { icon: Utensils, color: AURORA.gold },
  'Sahur': { icon: Moon, color: AURORA.violet },
  'Dates': { icon: Sparkles, color: AURORA.gold },
  'Drinks': { icon: CupSoda, color: AURORA.coral },
  'Snacks': { icon: Flame, color: AURORA.gold },
  'Fruits': { icon: Leaf, color: AURORA.emerald },
  'Groceries': { icon: ShoppingCart, color: AURORA.sky },
  'Pharmacy': { icon: Pill, color: AURORA.violet },
  'Bundles': { icon: Package, color: AURORA.gold },
};

/* ─────────────── Sign Up Prompt Modal ─────────────── */
function SignUpPrompt({ onClose, onGetStarted, onSignIn }: {
  onClose: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="relative w-full max-w-lg rounded-t-[2rem] overflow-hidden aurora-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top aurora glow + grabber */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 blur-[80px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${AURORA.gold}40, transparent 70%)` }}
        />
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        <div className="relative p-6 pt-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="icon-tile w-12 h-12"
                style={{
                  background: `linear-gradient(135deg, ${AURORA.gold}25, ${AURORA.emerald}12)`,
                  border: `1px solid ${AURORA.gold}40`,
                }}
              >
                <ShoppingBag className="w-6 h-6" style={{ color: AURORA.gold }} />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold tracking-tight">Join SwiftRamadan</h3>
                <p className="text-[10px] font-medium" style={{ color: AURORA.textMuted }}>Sign up to order, track & save</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {[
              { icon: Zap, text: 'Iftar-precision delivery before Maghrib', color: AURORA.gold },
              { icon: Users, text: 'Community group buys & bulk savings', color: AURORA.emerald },
              { icon: Heart, text: 'Charity & Sadaqah built right in', color: AURORA.coral },
            ].map(({ icon: Ic, text, color }) => (
              <div key={text}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: `${color}10`, border: `1px solid ${color}1A` }}>
                <div className="icon-tile w-8 h-8" style={{ background: `${color}18` }}>
                  <Ic className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-sm" style={{ color: AURORA.textSecondary }}>{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onGetStarted}
            className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform gold-gradient"
            style={{ color: '#1A1206', boxShadow: '0 8px 32px rgba(245,196,81,0.25)' }}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onSignIn}
            className="w-full h-12 mt-3 rounded-xl text-sm font-medium hover:text-white/80 transition-colors"
            style={{ color: AURORA.textMuted }}
          >
            Already have an account? <span className="font-bold" style={{ color: AURORA.gold }}>Sign In</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────── Hero Banner Carousel ─────────────── */
function HeroBanner({ onTap }: { onTap: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-5 mt-4">
      <AnimatePresence mode="wait">
        <motion.button
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5 }}
          onClick={onTap}
          className="relative w-full aspect-[2/1] rounded-3xl overflow-hidden glass-card block text-left"
        >
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url("${heroSlides[currentSlide].image}")` }}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(6,7,11,0.88) 0%, rgba(6,7,11,0.35) 50%, rgba(6,7,11,0.78) 100%)',
          }} />
          {/* Aurora tint overlay */}
          <div className="absolute inset-0 opacity-60 pointer-events-none" style={{
            background: `radial-gradient(circle at 100% 0%, ${AURORA.emerald}22, transparent 50%), radial-gradient(circle at 0% 100%, ${AURORA.violet}18, transparent 55%)`,
          }} />

          {heroSlides[currentSlide].badge && (
            <div className="absolute top-3 left-3">
              <span className="soft-chip" style={{
                background: `linear-gradient(135deg, ${AURORA.gold}30, ${AURORA.emerald}20)`,
                borderColor: `${AURORA.gold}55`,
                color: AURORA.gold,
              }}>
                <Star className="w-3 h-3 fill-current" />
                {heroSlides[currentSlide].badge}
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-white text-lg font-extrabold leading-tight tracking-tight">
              {heroSlides[currentSlide].title}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Zap className="w-3 h-3" style={{ color: AURORA.emerald }} />
              <span className="text-xs font-semibold" style={{ color: AURORA.emerald }}>
                {heroSlides[currentSlide].subtitle}
              </span>
            </div>
          </div>
        </motion.button>
      </AnimatePresence>

      <div className="flex justify-center gap-1.5 mt-3">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === currentSlide ? 24 : 6,
              background: i === currentSlide
                ? `linear-gradient(90deg, ${AURORA.emerald}, ${AURORA.gold})`
                : 'rgba(255,255,255,0.15)',
            }}
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
      className="min-w-[180px] max-w-[180px] rounded-2xl overflow-hidden cursor-pointer glass-card"
    >
      <div className="relative">
        <div
          className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url("${sale.image}")` }}
        />
        <div className="absolute top-2 left-2">
          <span className="soft-chip" style={{
            background: `${AURORA.coral}20`,
            borderColor: `${AURORA.coral}55`,
            color: AURORA.coral,
          }}>
            <Flame className="w-3 h-3" />
            -{sale.discount}%
          </span>
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="soft-chip backdrop-blur-md" style={{
            background: 'rgba(0,0,0,0.55)',
            borderColor: `${AURORA.gold}40`,
            color: AURORA.gold,
          }}>
            <Timer className="w-2.5 h-2.5" />
            {sale.endsIn}
          </span>
        </div>
      </div>
      <div className="p-2.5">
        <h4 className="text-white font-bold text-xs truncate">{sale.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-black text-xs" style={{ color: AURORA.emerald }}>{formatNaira(sale.salePrice)}</span>
          <span className="text-[9px] line-through" style={{ color: AURORA.textMuted }}>{formatNaira(sale.originalPrice)}</span>
        </div>
        <div className="mt-1.5">
          <div className="w-full bg-white/5 rounded-full h-1">
            <div className="h-1 rounded-full" style={{
              width: `${sale.claimed}%`,
              background: `linear-gradient(90deg, ${AURORA.gold}, ${AURORA.emerald})`,
            }} />
          </div>
          <p className="text-[8px] mt-0.5" style={{ color: AURORA.textMuted }}>{sale.claimed}% claimed</p>
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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="flex gap-3 p-3 rounded-2xl cursor-pointer glass-card"
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
            <span className="font-black text-xs whitespace-nowrap" style={{ color: AURORA.emerald }}>
              {formatNaira(meal.price)}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: AURORA.textMuted }}>
            {meal.description}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="soft-chip">
            <Clock className="w-2.5 h-2.5" />
            {meal.deliveryTime}
          </span>
          <span className="soft-chip" style={{ color: AURORA.gold, borderColor: `${AURORA.gold}30` }}>
            <Star className="w-2.5 h-2.5 fill-current" />
            {meal.rating}
          </span>
          <span className="text-[9px]" style={{ color: AURORA.textMuted }}>({meal.reviews})</span>
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
      className="min-w-[150px] max-w-[150px] rounded-2xl overflow-hidden cursor-pointer glass-card"
    >
      <div className="relative">
        <div
          className="w-full aspect-square bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url("${retailer.image}")` }}
        />
        {retailer.verified && (
          <div className="absolute top-2 right-2">
            <div className="icon-tile w-5 h-5" style={{ background: `${AURORA.emerald}25`, border: `1px solid ${AURORA.emerald}50` }}>
              <BadgeCheck className="w-3 h-3" style={{ color: AURORA.emerald }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h4 className="text-white font-bold text-[11px] truncate">{retailer.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px]" style={{ color: AURORA.textMuted }}>{retailer.category}</span>
          <span className="text-[9px]" style={{ color: AURORA.textMuted }}>•</span>
          <span className="flex items-center gap-0.5 text-[9px]" style={{ color: AURORA.textMuted }}>
            <Clock className="w-2 h-2" />{retailer.deliveryTime}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <Star className="w-2.5 h-2.5 fill-current" style={{ color: AURORA.gold }} />
          <span className="text-[9px] font-bold text-white/70">{retailer.rating}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Section Heading ─────────────── */
function SectionHeading({ icon: Icon, title, accent = AURORA.emerald, action }: {
  icon: React.ElementType;
  title: string;
  accent?: string;
  action?: { label: string; onTap: () => void };
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div className="icon-tile w-7 h-7" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <h3 className="text-white text-base font-bold tracking-tight heading-accent">{title}</h3>
      </div>
      {action && (
        <button onClick={action.onTap}
          className="text-[10px] font-bold flex items-center gap-0.5 transition-colors hover:opacity-80"
          style={{ color: AURORA.gold }}>
          {action.label}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
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
    setShowAuth('signup');
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

  const whySwiftRamadan = [
    { icon: Clock, title: 'Iftar Precision', desc: 'Meals before Maghrib', color: AURORA.gold },
    { icon: Truck, title: 'Live Tracking', desc: 'Kitchen to doorstep', color: AURORA.sky },
    { icon: Users, title: 'Group Buys', desc: 'Bulk savings together', color: AURORA.emerald },
    { icon: Heart, title: 'Sadaqah Built In', desc: 'Charity with every order', color: AURORA.coral },
  ];

  const stats = [
    { value: '12K+', label: 'Families' },
    { value: '98%', label: 'On-time' },
    { value: '4.9', label: 'Rating' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-[100] overflow-hidden"
    >
      {/* ═══ Top Navigation Bar ═══ */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="sticky top-0 z-50 glass-effect"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${AURORA.gold}20, ${AURORA.emerald}10)`,
                border: `1px solid ${AURORA.gold}33`,
              }}
            >
              <img src="/swiftramadan-logo.png" alt="SwiftRamadan" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-gradient-aurora">SwiftRamadan</span>
              <span className="text-[8px] font-medium" style={{ color: AURORA.textMuted }}>Lagos • 2026</span>
            </div>
          </div>

          {/* Sign In / Get Started */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignIn}
              className="px-4 h-9 rounded-xl text-xs font-semibold transition-all hover:bg-white/5"
              style={{ color: AURORA.textSecondary }}
            >
              Sign In
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleGetStarted}
              className="px-4 h-9 rounded-xl text-xs font-bold flex items-center gap-1.5 gold-gradient"
              style={{ color: '#1A1206', boxShadow: '0 4px 16px rgba(245,196,81,0.25)' }}
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ═══ Scrollable Content ═══ */}
      <div ref={scrollRef} className="h-full overflow-y-auto pb-40 no-scrollbar">
        {/* ─────────────── HERO SECTION ─────────────── */}
        <section className="relative aurora-hero overflow-hidden">
          {/* Aurora drift orbs */}
          <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full blur-[60px] aurora-drift pointer-events-none"
            style={{ background: `radial-gradient(circle, ${AURORA.emerald}30, transparent 70%)` }} />
          <div className="absolute top-10 -right-10 w-64 h-64 rounded-full blur-[70px] aurora-drift pointer-events-none"
            style={{ background: `radial-gradient(circle, ${AURORA.violet}28, transparent 70%)`, animationDelay: '-4s' }} />
          <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full blur-[80px] aurora-drift pointer-events-none"
            style={{ background: `radial-gradient(circle, ${AURORA.gold}22, transparent 70%)`, animationDelay: '-8s' }} />

          <div className="relative px-5 pt-8 pb-6">
            {/* Beta badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex justify-center mb-4"
            >
              <span className="beta-badge">
                <Sparkles className="w-2.5 h-2.5" />
                Aurora Edition • Lagos
              </span>
            </motion.div>

            {/* Brand title */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center text-4xl sm:text-5xl font-extrabold tracking-tight text-gradient-aurora"
            >
              SwiftRamadan
            </motion.h1>

            {/* Value prop */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center text-sm mt-3 max-w-md mx-auto"
              style={{ color: AURORA.textSecondary }}
            >
              Iftar & Sahur delivered with care — fresh meals, premium dates, and group-buy savings, all before Maghrib.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-2.5 mt-6 max-w-sm mx-auto"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGetStarted}
                className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 gold-gradient green-glow"
                style={{ color: '#1A1206' }}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <button
                onClick={handleSignIn}
                className="w-full h-12 rounded-2xl text-sm font-semibold glass-card hover:bg-white/[0.06] transition-colors"
                style={{ color: AURORA.textSecondary }}
              >
                Sign In
              </button>
            </motion.div>

            {/* Hero mini stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex items-center justify-center gap-6 mt-6"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <span className="text-base font-extrabold text-gradient-aurora">{stat.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: AURORA.textMuted }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─────────────── SEARCH BAR ─────────────── */}
        <div className="px-5 pt-5">
          <button
            onClick={handleItemTap}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 glass-card hover:bg-white/[0.05] transition-colors"
          >
            <Search className="w-4 h-4" style={{ color: AURORA.textMuted }} />
            <span className="text-sm" style={{ color: AURORA.textMuted }}>Search Jollof, Dates, Iftar meals...</span>
            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded soft-chip">⌘K</span>
          </button>
        </div>

        {/* ─────────────── HERO BANNER CAROUSEL ─────────────── */}
        <HeroBanner onTap={handleItemTap} />

        {/* ─────────────── CATEGORIES ROW ─────────────── */}
        <section className="px-5 pt-8">
          <SectionHeading icon={ShoppingBag} title="Browse Categories" accent={AURORA.emerald} />
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {categories.map((cat) => {
              const cfg = categoryIcons[cat.name] || { icon: ShoppingBag, color: AURORA.emerald };
              const Icon = cfg.icon;
              const isSelected = activeCategory === cat.name;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveCategory(isSelected ? null : cat.name)}
                  className="flex flex-col items-center gap-2 min-w-[70px]"
                >
                  <div
                    className="icon-tile w-14 h-14 transition-all duration-300"
                    style={{
                      background: isSelected ? `${cfg.color}22` : `${cfg.color}0E`,
                      border: isSelected ? `1.5px solid ${cfg.color}66` : `1px solid ${cfg.color}22`,
                      boxShadow: isSelected ? `0 0 18px ${cfg.color}30` : 'none',
                    }}
                  >
                    <Icon className="w-6 h-6 transition-colors" style={{ color: isSelected ? cfg.color : `${cfg.color}B0` }} />
                  </div>
                  <span
                    className="text-[9px] font-bold whitespace-nowrap transition-colors"
                    style={{ color: isSelected ? '#fff' : AURORA.textMuted }}
                  >
                    {cat.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ─────────────── FLASH SALES ─────────────── */}
        <section className="pt-8">
          <div className="px-5">
            <SectionHeading
              icon={Flame}
              title="Flash Sales"
              accent={AURORA.gold}
              action={{ label: 'See All', onTap: handleItemTap }}
            />
            <div className="flex items-center gap-2 mb-3">
              <span className="soft-chip" style={{
                background: `${AURORA.coral}18`,
                borderColor: `${AURORA.coral}40`,
                color: AURORA.coral,
              }}>
                <span className="relative inline-flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full pulse-soft" style={{ background: AURORA.coral }} />
                </span>
                LIVE
              </span>
              <span className="text-[10px]" style={{ color: AURORA.textMuted }}>Limited-time deals, refreshed hourly</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
            {flashSales.map((sale) => (
              <FlashDealCard key={sale.id} sale={sale} onTap={handleItemTap} />
            ))}
          </div>
        </section>

        {/* ─────────────── CATEGORY HUB ─────────────── */}
        <section className="px-5 pt-8">
          <SectionHeading icon={Package} title="Shop by Hub" accent={AURORA.violet} />
          <div className="grid grid-cols-2 gap-3">
            {categoryHubItems.map((item) => {
              const badgeColors: Record<string, string> = {
                'Popular': AURORA.gold,
                'Group Buy': AURORA.emerald,
                'Fast': AURORA.sky,
                'New': AURORA.violet,
              };
              const color = badgeColors[item.badge] || AURORA.gold;
              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleItemTap}
                  className="relative rounded-2xl overflow-hidden cursor-pointer glass-card"
                >
                  <div
                    className="w-full aspect-[16/9] bg-center bg-no-repeat bg-cover"
                    style={{ backgroundImage: `url("${item.image}")` }}
                  />
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, transparent 25%, rgba(6,7,11,0.92) 100%)',
                  }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="soft-chip" style={{
                        color,
                        background: `${color}1A`,
                        borderColor: `${color}40`,
                      }}>
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-xs">{item.name}</h4>
                    <span className="text-[9px]" style={{ color: AURORA.textMuted }}>{item.subtitle}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ─────────────── TRENDING MEALS ─────────────── */}
        <section className="px-5 pt-8">
          <SectionHeading
            icon={Zap}
            title={`${activeCategory || 'Trending'} Meals`}
            accent={AURORA.gold}
            action={{ label: 'See All', onTap: handleItemTap }}
          />
          <div className="flex flex-col gap-2.5">
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onTap={handleItemTap} />
            ))}
            {filteredMeals.length === 0 && (
              <div className="py-10 text-center glass-card rounded-2xl">
                <p className="text-sm" style={{ color: AURORA.textMuted }}>No meals found in this category</p>
              </div>
            )}
          </div>
        </section>

        {/* ─────────────── POPULAR RETAILERS ─────────────── */}
        <section className="pt-8">
          <div className="px-5">
            <SectionHeading
              icon={ShoppingBag}
              title="Popular Stores"
              accent={AURORA.emerald}
              action={{ label: 'See All', onTap: handleItemTap }}
            />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
            {popularRetailers.map((retailer) => (
              <RetailerCard key={retailer.id} retailer={retailer} onTap={handleItemTap} />
            ))}
          </div>
        </section>

        {/* ─────────────── WHY SWIFTRAMADAN ─────────────── */}
        <section className="px-5 pt-8">
          <SectionHeading icon={Sparkles} title="Why SwiftRamadan" accent={AURORA.violet} />
          <div className="grid grid-cols-2 gap-3">
            {whySwiftRamadan.map(({ icon: Ic, title, desc, color }) => (
              <motion.div
                key={title}
                whileTap={{ scale: 0.97 }}
                className="aurora-card p-3.5 rounded-2xl"
              >
                <div className="icon-tile w-9 h-9 mb-2.5" style={{
                  background: `linear-gradient(135deg, ${color}25, ${color}08)`,
                  border: `1px solid ${color}30`,
                }}>
                  <Ic className="w-4 h-4" style={{ color }} />
                </div>
                <h4 className="text-white text-xs font-bold">{title}</h4>
                <p className="text-[10px] mt-0.5" style={{ color: AURORA.textMuted }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─────────────── SOCIAL PROOF ─────────────── */}
        <section className="px-5 pt-6">
          <div className="flex items-center justify-around py-5 rounded-2xl aurora-card relative overflow-hidden">
            {/* Decorative shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px shimmer-line" />
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 relative">
                <span className="text-xl font-black text-gradient-aurora">{stat.value}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: AURORA.textMuted }}>
                  {stat.label}
                </span>
                {i < stats.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-px h-8 bg-white/[0.08]" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────── BOTTOM CTA SECTION ─────────────── */}
        <section className="px-5 pt-6 pb-8">
          <div className="relative overflow-hidden rounded-3xl p-6 text-center aurora-card">
            {/* Decorative top glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-24 blur-[60px] pointer-events-none"
              style={{ background: `radial-gradient(circle, ${AURORA.gold}40, transparent 70%)` }}
            />
            <div className="absolute -bottom-10 right-0 w-40 h-24 blur-[60px] pointer-events-none"
              style={{ background: `radial-gradient(circle, ${AURORA.emerald}35, transparent 70%)` }}
            />

            <span className="relative text-sm font-light" style={{ color: AURORA.gold }}>ٱلسَّلَامُ عَلَيْكُمْ</span>
            <h2 className="relative text-white text-2xl font-extrabold mt-2 tracking-tight">
              Ready to elevate your Ramadan?
            </h2>
            <p className="relative text-sm mt-2 max-w-[280px] mx-auto" style={{ color: AURORA.textSecondary }}>
              Join thousands of Lagos families enjoying Iftar & Sahur delivered with care.
            </p>

            <div className="relative flex flex-col gap-2.5 mt-5 max-w-xs mx-auto">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 gold-gradient green-glow"
                style={{ color: '#1A1206' }}
              >
                Begin Your Journey
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <button
                onClick={handleSignIn}
                className="w-full h-11 rounded-xl text-sm font-medium transition-colors hover:text-white/80"
                style={{ color: AURORA.textMuted }}
              >
                Already part of the family? <span className="font-bold" style={{ color: AURORA.gold }}>Sign In</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ═══ Floating Bottom CTA Bar (mobile-only) ═══ */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.6, type: 'spring', damping: 20 }}
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
      >
        <div className="max-w-lg mx-auto rounded-2xl px-4 py-3 flex items-center justify-between pointer-events-auto glass-effect"
          style={{ border: `1px solid ${AURORA.gold}22`, boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245,196,81,0.06)' }}
        >
          <div>
            <p className="text-white text-xs font-bold">Start ordering now</p>
            <p className="text-[10px]" style={{ color: AURORA.textMuted }}>Free delivery on your first order</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleGetStarted}
            className="h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 gold-gradient"
            style={{ color: '#1A1206' }}
          >
            Join Free
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </motion.div>

      {/* ═══ Sign Up Prompt Modal ═══ */}
      <AnimatePresence>
        {showPrompt && (
          <SignUpPrompt
            onClose={() => setShowPrompt(false)}
            onGetStarted={handleGetStarted}
            onSignIn={handleSignIn}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
