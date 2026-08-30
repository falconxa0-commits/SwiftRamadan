'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useOnboarding } from '@/lib/store-selectors';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  TrendingUp,
  ShieldCheck,
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
import { colors as C } from '@/lib/design-tokens';
import Image from 'next/image';

/* ══════════════════════════════════════════════════════════════════
   WELCOME SCREEN — AURORA LUXE PREMIUM ENTRY POINT
   OLED black canvas · Royal Purple + Gold accents · Emerald success
   Sky delivery. Parallax hero, staggered entrance, glass cards.
   ══════════════════════════════════════════════════════════════════ */

/* ─────────────── Palette (sourced from design tokens) ─────────────── */
const AURORA = {
  bg: C.surface.base,           // OLED black
  emerald: C.customer.primary,  // halal / food / success
  gold: C.vendor.primary,       // premium moments
  violet: C.ai.primary,        // AI / intelligence
  sky: C.rider.primary,        // delivery
  coral: '#FB7185',            // alerts / sadaqah (no token)
  textSecondary: C.text.secondary,
  textMuted: C.text.tertiary,
} as const;

/* Dark ink used on top of gold-gradient buttons for AA contrast */
const INK = '#1A1206';

/* ─────────────── Motion variants for staggered entrance ─────────────── */
const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
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
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <motion.div
        initial={{ y: '100%', opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 240, ease: EASE }}
        className="relative w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl overflow-hidden aurora-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top aurora glow + grabber */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 blur-[80px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${AURORA.gold}40, transparent 70%)` }}
        />
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        <div className="relative p-5 sm:p-6 pt-3">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
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
                  <p className="text-[11px] font-medium" style={{ color: AURORA.textMuted }}>Sign up to order, track & save</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-3 mb-6">
              {[
                { icon: Zap, text: 'Iftar-precision delivery before Maghrib', color: AURORA.gold },
                { icon: Users, text: 'Community group buys & bulk savings', color: AURORA.emerald },
                { icon: Heart, text: 'Charity & Sadaqah built right in', color: AURORA.coral },
              ].map(({ icon: Ic, text, color }) => (
                <div key={text}
                  className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl"
                  style={{ background: `${color}10`, border: `1px solid ${color}1A` }}>
                  <div className="icon-tile w-9 h-9" style={{ background: `${color}18` }}>
                    <Ic className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-sm" style={{ color: AURORA.textSecondary }}>{text}</span>
                </div>
              ))}
            </motion.div>

            <motion.button
              variants={itemVariants}
              onClick={onGetStarted}
              className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform gold-gradient"
              style={{ color: INK, boxShadow: '0 8px 32px rgba(245,196,81,0.25)' }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              variants={itemVariants}
              onClick={onSignIn}
              className="w-full h-12 mt-3 rounded-xl text-sm font-medium hover:text-white/80 transition-colors"
              style={{ color: AURORA.textMuted }}
            >
              Already have an account? <span className="font-bold" style={{ color: AURORA.gold }}>Sign In</span>
            </motion.button>
          </motion.div>
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
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-4 sm:px-5 mt-5">
      <AnimatePresence mode="wait">
        <motion.button
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.02, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.6, ease: EASE }}
          onClick={onTap}
          className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] rounded-2xl sm:rounded-3xl overflow-hidden glass-card block text-left"
        >
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url("${heroSlides[currentSlide].image}")` }}
          />
          {/* Cinematic gradient — deeper for OLED contrast */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(6,7,11,0.92) 0%, rgba(6,7,11,0.40) 45%, rgba(6,7,11,0.85) 100%)',
          }} />
          {/* Aurora tint overlay — purple + emerald mesh */}
          <div className="absolute inset-0 opacity-70 pointer-events-none" style={{
            background: `radial-gradient(circle at 100% 0%, ${AURORA.emerald}22, transparent 50%), radial-gradient(circle at 0% 100%, ${AURORA.violet}22, transparent 55%)`,
          }} />

          {heroSlides[currentSlide].badge && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
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

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <h2 className="text-white text-lg sm:text-2xl font-extrabold leading-tight tracking-tight">
              {heroSlides[currentSlide].title}
            </h2>
            <div className="flex items-center gap-1.5 mt-2">
              <Zap className="w-3.5 h-3.5" style={{ color: AURORA.emerald }} />
              <span className="text-xs sm:text-sm font-semibold" style={{ color: AURORA.emerald }}>
                {heroSlides[currentSlide].subtitle}
              </span>
            </div>
          </div>
        </motion.button>
      </AnimatePresence>

      <div className="flex justify-center gap-1.5 mt-3">
        {heroSlides.map((_, i) => (
          <button
            key={`slide-${i}`}
            onClick={() => setCurrentSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === currentSlide ? 28 : 6,
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
      className="min-w-[180px] sm:min-w-[200px] max-w-[200px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer glass-card"
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
      <div className="p-3 sm:p-3.5">
        <h4 className="text-white font-bold text-xs sm:text-sm truncate">{sale.name}</h4>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-black text-sm" style={{ color: AURORA.emerald }}>{formatNaira(sale.salePrice)}</span>
          <span className="text-[10px] line-through" style={{ color: AURORA.textMuted }}>{formatNaira(sale.originalPrice)}</span>
        </div>
        <div className="mt-2">
          <div className="w-full bg-white/5 rounded-full h-1">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${sale.claimed}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE }}
              className="h-1 rounded-full"
              style={{ background: `linear-gradient(90deg, ${AURORA.gold}, ${AURORA.emerald})` }}
            />
          </div>
          <p className="text-[9px] mt-1" style={{ color: AURORA.textMuted }}>{sale.claimed}% claimed</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Meal Card ─────────────── */
function MealCard({ meal, onTap }: { meal: typeof trendingMeals[0]; onTap: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, ease: EASE }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="flex gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl cursor-pointer glass-card"
    >
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-center bg-no-repeat bg-cover shrink-0"
        style={{
          backgroundImage: `url("${meal.image}")`,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-white font-bold text-sm sm:text-base truncate">{meal.name}</h4>
            <span className="font-black text-sm whitespace-nowrap" style={{ color: AURORA.emerald }}>
              {formatNaira(meal.price)}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs leading-relaxed mt-1 line-clamp-2" style={{ color: AURORA.textMuted }}>
            {meal.description}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="soft-chip">
            <Clock className="w-2.5 h-2.5" />
            {meal.deliveryTime}
          </span>
          <span className="soft-chip" style={{ color: AURORA.gold, borderColor: `${AURORA.gold}30` }}>
            <Star className="w-2.5 h-2.5 fill-current" />
            {meal.rating}
          </span>
          <span className="text-[10px]" style={{ color: AURORA.textMuted }}>({meal.reviews})</span>
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
      className="min-w-[150px] sm:min-w-[170px] max-w-[170px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer glass-card"
    >
      <div className="relative">
        <div
          className="w-full aspect-square bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url("${retailer.image}")` }}
        />
        {retailer.verified && (
          <div className="absolute top-2 right-2">
            <div className="icon-tile w-6 h-6" style={{ background: `${AURORA.emerald}25`, border: `1px solid ${AURORA.emerald}50` }}>
              <BadgeCheck className="w-3.5 h-3.5" style={{ color: AURORA.emerald }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-3.5">
        <h4 className="text-white font-bold text-xs sm:text-sm truncate">{retailer.name}</h4>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px]" style={{ color: AURORA.textMuted }}>{retailer.category}</span>
          <span className="text-[10px]" style={{ color: AURORA.textMuted }}>•</span>
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: AURORA.textMuted }}>
            <Clock className="w-2.5 h-2.5" />{retailer.deliveryTime}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3 h-3 fill-current" style={{ color: AURORA.gold }} />
          <span className="text-[10px] font-bold text-white/80">{retailer.rating}</span>
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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="icon-tile w-8 h-8 sm:w-9 sm:h-9" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="text-white text-base sm:text-lg font-bold tracking-tight heading-accent">{title}</h3>
      </div>
      {action && (
        <button onClick={action.onTap}
          className="text-[11px] sm:text-xs font-bold flex items-center gap-0.5 transition-colors hover:opacity-80"
          style={{ color: AURORA.gold }}>
          {action.label}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN WELCOME SCREEN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function WelcomeScreen() {
  const { setShowWelcome, setShowAuth } = useOnboarding();
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parallax for hero aurora orbs — driven by inner scroll container
  const { scrollY } = useScroll({ container: scrollRef });
  const orbY1 = useTransform(scrollY, [0, 400], [0, -80]);
  const orbY2 = useTransform(scrollY, [0, 400], [0, 60]);
  const orbY3 = useTransform(scrollY, [0, 400], [0, -40]);
  const heroTextY = useTransform(scrollY, [0, 300], [0, -30]);
  const heroTextOpacity = useTransform(scrollY, [0, 200], [1, 0.55]);

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
      style={{ background: AURORA.bg }}
    >
      {/* ═══ Top Navigation Bar ═══ */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
        className="sticky top-0 z-50 glass-effect"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, ${AURORA.gold}20, ${AURORA.emerald}10)`,
                border: `1px solid ${AURORA.gold}33`,
              }}
            >
              <Image src="/swiftramadan-logo.png" alt="SwiftRamadan" fill className="object-cover" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.18em] uppercase text-gradient-aurora">SwiftRamadan</span>
              <span className="text-[8px] sm:text-[9px] font-medium" style={{ color: AURORA.textMuted }}>Lagos • 2026</span>
            </div>
          </div>

          {/* Sign In / Get Started */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignIn}
              className="px-4 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:bg-white/5"
              style={{ color: AURORA.textSecondary }}
            >
              Sign In
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleGetStarted}
              className="px-4 sm:px-5 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 gold-gradient"
              style={{ color: INK, boxShadow: '0 4px 16px rgba(245,196,81,0.25)' }}
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ═══ Scrollable Content ═══ */}
      <div ref={scrollRef} className="h-full overflow-y-auto pb-40 no-scrollbar">
        {/* ─────────────── HERO SECTION (parallax) ─────────────── */}
        <section className="relative aurora-hero overflow-hidden">
          {/* Aurora drift orbs — parallaxed via scroll */}
          <motion.div style={{ y: orbY1 }}
            className="absolute -top-10 -left-10 w-56 h-56 sm:w-72 sm:h-72 rounded-full blur-[60px] aurora-drift pointer-events-none"
            aria-hidden
          >
            <div className="w-full h-full" style={{ background: `radial-gradient(circle, ${AURORA.emerald}30, transparent 70%)` }} />
          </motion.div>
          <motion.div style={{ y: orbY2 }}
            className="absolute top-10 -right-10 w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-[70px] aurora-drift pointer-events-none"
            aria-hidden
          >
            <div className="w-full h-full" style={{ background: `radial-gradient(circle, ${AURORA.violet}28, transparent 70%)`, animationDelay: '-4s' }} />
          </motion.div>
          <motion.div style={{ y: orbY3 }}
            className="absolute -bottom-20 left-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-[80px] aurora-drift pointer-events-none"
            aria-hidden
          >
            <div className="w-full h-full" style={{ background: `radial-gradient(circle, ${AURORA.gold}22, transparent 70%)`, animationDelay: '-8s' }} />
          </motion.div>

          <motion.div
            style={{ y: heroTextY, opacity: heroTextOpacity }}
            className="relative px-4 sm:px-5 pt-10 sm:pt-14 pb-8 sm:pb-10"
          >
            {/* Beta badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45, ease: EASE }}
              className="flex justify-center mb-5"
            >
              <span className="beta-badge">
                <Sparkles className="w-2.5 h-2.5" />
                Aurora Edition • Lagos
              </span>
            </motion.div>

            {/* Brand title — confident, large */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
              className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gradient-aurora"
            >
              SwiftRamadan
            </motion.h1>

            {/* Value prop */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.55, ease: EASE }}
              className="text-center text-sm sm:text-base mt-4 max-w-md mx-auto"
              style={{ color: AURORA.textSecondary }}
            >
              Iftar &amp; Sahur delivered with care — fresh meals, premium dates, and group-buy savings, all before Maghrib.
            </motion.p>

            {/* Hero CTAs — bigger, more prominent */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54, duration: 0.55, ease: EASE }}
              className="flex flex-col sm:flex-row items-center gap-2.5 mt-7 sm:mt-8 max-w-sm sm:max-w-md mx-auto"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={handleGetStarted}
                className="w-full sm:w-auto sm:flex-1 h-13 sm:h-14 px-6 rounded-2xl sm:rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 gold-gradient green-glow"
                style={{ color: INK }}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <button
                onClick={handleSignIn}
                className="w-full sm:w-auto sm:flex-1 h-13 sm:h-14 rounded-2xl text-sm sm:text-base font-semibold glass-card hover:bg-white/[0.06] transition-colors"
                style={{ color: AURORA.textSecondary }}
              >
                Sign In
              </button>
            </motion.div>

            {/* Hero mini stats — elegant */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.72, duration: 0.5 }}
              className="flex items-center justify-center gap-6 sm:gap-10 mt-8 sm:mt-10"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <span className="text-lg sm:text-2xl font-extrabold text-gradient-aurora">{stat.value}</span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1" style={{ color: AURORA.textMuted }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ─────────────── SEARCH BAR ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="px-4 sm:px-5 pt-6">
          <motion.button
            variants={itemVariants}
            onClick={handleItemTap}
            className="w-full flex items-center gap-3 rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-3.5 sm:py-4 glass-card hover:bg-white/[0.05] transition-colors"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: AURORA.textMuted }} />
            <span className="text-sm sm:text-base" style={{ color: AURORA.textMuted }}>Search Jollof, Dates, Iftar meals...</span>
            <span className="ml-auto text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded soft-chip">⌘K</span>
          </motion.button>
        </motion.section>

        {/* ─────────────── HERO BANNER CAROUSEL ─────────────── */}
        <HeroBanner onTap={handleItemTap} />

        {/* ─────────────── CATEGORIES ROW ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="px-4 sm:px-5 pt-10 sm:pt-12">
          <motion.div variants={itemVariants}>
            <SectionHeading icon={ShoppingBag} title="Browse Categories" accent={AURORA.emerald} />
          </motion.div>
          <motion.div variants={itemVariants} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {categories.map((cat) => {
              const cfg = categoryIcons[cat.name] || { icon: ShoppingBag, color: AURORA.emerald };
              const Icon = cfg.icon;
              const isSelected = activeCategory === cat.name;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setActiveCategory(isSelected ? null : cat.name)}
                  className="flex flex-col items-center gap-2 min-w-[72px] sm:min-w-[80px]"
                >
                  <div
                    className="icon-tile w-14 h-14 sm:w-16 sm:h-16 transition-all duration-300"
                    style={{
                      background: isSelected ? `${cfg.color}22` : `${cfg.color}0E`,
                      border: isSelected ? `1.5px solid ${cfg.color}66` : `1px solid ${cfg.color}22`,
                      boxShadow: isSelected ? `0 0 22px ${cfg.color}35` : 'none',
                    }}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-colors" style={{ color: isSelected ? cfg.color : `${cfg.color}B0` }} />
                  </div>
                  <span
                    className="text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors"
                    style={{ color: isSelected ? '#fff' : AURORA.textMuted }}
                  >
                    {cat.name}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.section>

        {/* ─────────────── FLASH SALES ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="pt-10 sm:pt-12">
          <motion.div variants={itemVariants} className="px-4 sm:px-5">
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
              <span className="text-[10px] sm:text-xs" style={{ color: AURORA.textMuted }}>Limited-time deals, refreshed hourly</span>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 sm:px-5 pb-2">
            {flashSales.map((sale) => (
              <FlashDealCard key={sale.id} sale={sale} onTap={handleItemTap} />
            ))}
          </motion.div>
        </motion.section>

        {/* ─────────────── CATEGORY HUB (responsive grid) ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="px-4 sm:px-5 pt-10 sm:pt-12">
          <motion.div variants={itemVariants}>
            <SectionHeading icon={Package} title="Shop by Hub" accent={AURORA.violet} />
          </motion.div>
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
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
                  whileHover={{ y: -3 }}
                  onClick={handleItemTap}
                  className="relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer glass-card"
                >
                  <div
                    className="w-full aspect-[16/9] bg-center bg-no-repeat bg-cover"
                    style={{ backgroundImage: `url("${item.image}")` }}
                  />
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, transparent 25%, rgba(6,7,11,0.92) 100%)',
                  }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="soft-chip" style={{
                        color,
                        background: `${color}1A`,
                        borderColor: `${color}40`,
                      }}>
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-xs sm:text-sm">{item.name}</h4>
                    <span className="text-[10px] sm:text-xs" style={{ color: AURORA.textMuted }}>{item.subtitle}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* ─────────────── TRENDING MEALS (responsive: stack → grid) ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="px-4 sm:px-5 pt-10 sm:pt-12">
          <motion.div variants={itemVariants}>
            <SectionHeading
              icon={Zap}
              title={`${activeCategory || 'Trending'} Meals`}
              accent={AURORA.gold}
              action={{ label: 'See All', onTap: handleItemTap }}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col md:grid md:grid-cols-2 gap-3 sm:gap-4">
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onTap={handleItemTap} />
            ))}
            {filteredMeals.length === 0 && (
              <div className="py-12 text-center glass-card rounded-2xl md:col-span-2">
                <p className="text-sm" style={{ color: AURORA.textMuted }}>No meals found in this category</p>
              </div>
            )}
          </motion.div>
        </motion.section>

        {/* ─────────────── POPULAR RETAILERS ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="pt-10 sm:pt-12">
          <motion.div variants={itemVariants} className="px-4 sm:px-5">
            <SectionHeading
              icon={ShoppingBag}
              title="Popular Stores"
              accent={AURORA.emerald}
              action={{ label: 'See All', onTap: handleItemTap }}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 sm:px-5 pb-2">
            {popularRetailers.map((retailer) => (
              <RetailerCard key={retailer.id} retailer={retailer} onTap={handleItemTap} />
            ))}
          </motion.div>
        </motion.section>

        {/* ─────────────── WHY SWIFTRAMADAN (responsive grid) ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="px-4 sm:px-5 pt-10 sm:pt-12">
          <motion.div variants={itemVariants}>
            <SectionHeading icon={Sparkles} title="Why SwiftRamadan" accent={AURORA.violet} />
          </motion.div>
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {whySwiftRamadan.map(({ icon: Ic, title, desc, color }) => (
              <motion.div
                key={title}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -3 }}
                className="aurora-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl"
              >
                <div className="icon-tile w-10 h-10 sm:w-11 sm:h-11 mb-3" style={{
                  background: `linear-gradient(135deg, ${color}25, ${color}08)`,
                  border: `1px solid ${color}30`,
                }}>
                  <Ic className="w-5 h-5" style={{ color }} />
                </div>
                <h4 className="text-white text-sm sm:text-base font-bold">{title}</h4>
                <p className="text-[11px] sm:text-xs mt-1" style={{ color: AURORA.textMuted }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ─────────────── SOCIAL PROOF (elegant) ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={containerVariants} className="px-4 sm:px-5 pt-8 sm:pt-10">
          <motion.div variants={itemVariants} className="flex items-center justify-around py-6 sm:py-8 px-4 rounded-2xl sm:rounded-3xl aurora-card relative overflow-hidden">
            {/* Decorative shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px shimmer-line" />
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center gap-1.5 relative">
                <span className="text-xl sm:text-3xl font-black text-gradient-aurora">{stat.value}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: AURORA.textMuted }}>
                  {stat.label}
                </span>
                {i < stats.length - 1 && (
                  <div className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-px h-10 sm:h-12 bg-white/[0.08]" />
                )}
              </div>
            ))}
          </motion.div>
          {/* Trust micro-bar */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-[10px] sm:text-xs"
            style={{ color: AURORA.textMuted }}
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: AURORA.emerald }} />
              100% Halal verified
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" style={{ color: AURORA.sky }} />
              Iftar-precision delivery
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: AURORA.gold }} />
              #1 in Lagos 2026
            </span>
          </motion.div>
        </motion.section>

        {/* ─────────────── BOTTOM CTA SECTION (premium, generous) ─────────────── */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={containerVariants} className="px-4 sm:px-5 pt-10 sm:pt-12 pb-10 sm:pb-12">
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center aurora-card">
            {/* Decorative top glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-52 h-28 blur-[70px] pointer-events-none"
              style={{ background: `radial-gradient(circle, ${AURORA.gold}45, transparent 70%)` }}
            />
            <div className="absolute -bottom-12 right-0 w-44 h-28 blur-[60px] pointer-events-none"
              style={{ background: `radial-gradient(circle, ${AURORA.emerald}35, transparent 70%)` }}
            />

            <motion.span
              variants={itemVariants}
              className="relative text-sm sm:text-base font-light"
              style={{ color: AURORA.gold, fontFamily: 'var(--font-arabic), "Amiri", serif' }}
            >
              ٱلسَّلَامُ عَلَيْكُمْ
            </motion.span>
            <motion.h2 variants={itemVariants} className="relative text-white text-2xl sm:text-3xl md:text-4xl font-extrabold mt-3 tracking-tight">
              Ready to elevate your Ramadan?
            </motion.h2>
            <motion.p variants={itemVariants} className="relative text-sm sm:text-base mt-3 max-w-md mx-auto" style={{ color: AURORA.textSecondary }}>
              Join thousands of Lagos families enjoying Iftar &amp; Sahur delivered with care.
            </motion.p>

            <motion.div variants={itemVariants} className="relative flex flex-col gap-2.5 mt-6 max-w-sm mx-auto">
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                onClick={handleGetStarted}
                className="w-full h-14 sm:h-16 rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 gold-gradient green-glow"
                style={{ color: INK }}
              >
                Begin Your Journey
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <button
                onClick={handleSignIn}
                className="w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-medium transition-colors hover:text-white/80"
                style={{ color: AURORA.textMuted }}
              >
                Already part of the family? <span className="font-bold" style={{ color: AURORA.gold }}>Sign In</span>
              </button>
            </motion.div>
          </motion.div>
        </motion.section>
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
            style={{ color: INK }}
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
