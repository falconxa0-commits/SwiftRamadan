'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Star,
  Zap,
  ArrowRight,
  Flame,
  ShoppingBag,
  Heart,
  Utensils,
  Moon,
  CupSoda,
  ShoppingCart,
  Pill,
  Package,
  BadgeCheck,
  Leaf,
  Truck,
  Users,
  Sparkles,
  ShieldCheck,
  TrendingUp,
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
import { useAppStore } from '@/lib/store';
import { KingdomShell, AIOrb, RoyalBadge } from '../components';

/* ══════════════════════════════════════════════════════════════════
   KINGDOM V2 — WELCOME SCREEN
   Auren Kingdom reinterpretation of the legacy SwiftRamadan welcome.
   Same data + same store hooks, completely different visual system.
   ══════════════════════════════════════════════════════════════════ */

/* ─────────────── Category icon map (mirrors legacy) ─────────────── */
const CATEGORY_ICONS: Record<string, { icon: React.ElementType; tone: string }> = {
  'Iftar Meals': { icon: Utensils, tone: 'var(--kv-gold)' },
  'Sahur': { icon: Moon, tone: 'var(--kv-mystic)' },
  'Dates': { icon: Sparkles, tone: 'var(--kv-gold)' },
  'Drinks': { icon: CupSoda, tone: 'var(--kv-amber)' },
  'Snacks': { icon: Flame, tone: 'var(--kv-gold)' },
  'Fruits': { icon: Leaf, tone: 'var(--kv-emerald)' },
  'Groceries': { icon: ShoppingCart, tone: 'var(--kv-sky)' },
  'Pharmacy': { icon: Pill, tone: 'var(--kv-mystic)' },
  'Bundles': { icon: Package, tone: 'var(--kv-gold)' },
};

const EASE = [0.22, 1, 0.36, 1] as const;

const STATS = [
  { value: '12K+', label: 'Families' },
  { value: '98%', label: 'On-time' },
  { value: '4.9', label: 'Rating' },
];

const WHY = [
  { icon: Clock, title: 'Iftar Precision', desc: 'Meals before Maghrib' },
  { icon: Truck, title: 'Live Tracking', desc: 'Kitchen to doorstep' },
  { icon: Users, title: 'Group Buys', desc: 'Bulk savings together' },
  { icon: Heart, title: 'Sadaqah Built In', desc: 'Charity with every order' },
];

/* ─────────────── Section heading (V2 accent-line) ─────────────── */
function SectionHeading({
  icon: Icon,
  title,
  action,
  tone = 'var(--kv-mystic)',
}: {
  icon: React.ElementType;
  title: string;
  action?: { label: string; onTap: () => void };
  tone?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
          >
            <Icon className="w-4 h-4" style={{ color: tone }} aria-hidden />
          </div>
          <h3 className="text-base font-bold tracking-tight text-white">{title}</h3>
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onTap}
            className="text-xs font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-80"
            style={{ color: 'var(--kv-mystic)' }}
          >
            {action.label}
            <ArrowRight className="w-3 h-3" aria-hidden />
          </button>
        )}
      </div>
      <div className="kv-accent-line mt-3" />
    </div>
  );
}

/* ─────────────── Hero carousel slide ─────────────── */
function HeroCarousel({ onTap }: { onTap: () => void }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((p) => (p + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const slide = heroSlides[current];
  return (
    <div>
      <button
        type="button"
        onClick={onTap}
        aria-label={slide.title}
        className="kv-card relative w-full aspect-[2/1] sm:aspect-[2.4/1] overflow-hidden text-left"
      >
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url("${slide.image}")` }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.40) 45%, rgba(5,5,5,0.88) 100%)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-70 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 100% 0%, rgba(124,58,237,0.18), transparent 50%), radial-gradient(circle at 0% 100%, rgba(192,132,252,0.12), transparent 55%)',
          }}
          aria-hidden
        />
        {slide.badge && (
          <div className="absolute top-3 left-3">
            <RoyalBadge variant="gold" icon={<Star className="w-3 h-3 fill-current" />}>
              {slide.badge}
            </RoyalBadge>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-white text-lg sm:text-2xl font-extrabold leading-tight tracking-tight">
            {slide.title}
          </h2>
          <div className="flex items-center gap-1.5 mt-2">
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--kv-emerald)' }} aria-hidden />
            <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--kv-emerald)' }}>
              {slide.subtitle}
            </span>
          </div>
        </div>
      </button>
      <div className="flex justify-center gap-1.5 mt-3">
        {heroSlides.map((_, i) => (
          <button
            key={`dot-${i}`}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? 28 : 6,
              background:
                i === current
                  ? 'linear-gradient(90deg, var(--kv-royal), var(--kv-mystic))'
                  : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Flash deal card ─────────────── */
function FlashDealCard({ sale, onTap }: { sale: typeof flashSales[0]; onTap: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="kv-card min-w-[180px] max-w-[200px] text-left"
      aria-label={`Flash deal: ${sale.name}`}
    >
      <div className="relative">
        <div
          className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url("${sale.image}")` }}
          aria-hidden
        />
        <div className="absolute top-2 left-2">
          <RoyalBadge variant="gold" icon={<Flame className="w-3 h-3" />}>
            -{sale.discount}%
          </RoyalBadge>
        </div>
      </div>
      <div className="p-3.5">
        <h4 className="text-white font-bold text-xs sm:text-sm truncate">{sale.name}</h4>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-black text-sm" style={{ color: 'var(--kv-emerald)' }}>
            {formatNaira(sale.salePrice)}
          </span>
          <span className="text-[10px] line-through" style={{ color: 'var(--kv-text-tertiary)' }}>
            {formatNaira(sale.originalPrice)}
          </span>
        </div>
        <div className="mt-2">
          <div className="w-full rounded-full h-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${sale.claimed}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE }}
              className="h-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--kv-royal), var(--kv-mystic))' }}
            />
          </div>
          <p className="text-[9px] mt-1" style={{ color: 'var(--kv-text-tertiary)' }}>
            {sale.claimed}% claimed · {sale.endsIn}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

/* ─────────────── Meal card ─────────────── */
function MealCard({ meal, onTap }: { meal: typeof trendingMeals[0]; onTap: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      onClick={onTap}
      className="kv-card flex gap-3 p-3 sm:p-4 text-left w-full"
      aria-label={`${meal.name}, ${meal.deliveryTime}`}
    >
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-center bg-no-repeat bg-cover shrink-0"
        style={{
          backgroundImage: `url("${meal.image}")`,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        aria-hidden
      />
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-white font-bold text-sm sm:text-base truncate">{meal.name}</h4>
            <span className="font-black text-sm whitespace-nowrap" style={{ color: 'var(--kv-emerald)' }}>
              {formatNaira(meal.price)}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs leading-relaxed mt-1 line-clamp-2" style={{ color: 'var(--kv-text-tertiary)' }}>
            {meal.description}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <RoyalBadge variant="neutral" icon={<Clock className="w-2.5 h-2.5" />}>
            {meal.deliveryTime}
          </RoyalBadge>
          <RoyalBadge variant="gold" icon={<Star className="w-2.5 h-2.5 fill-current" />}>
            {meal.rating}
          </RoyalBadge>
          <span className="text-[10px]" style={{ color: 'var(--kv-text-tertiary)' }}>
            ({meal.reviews})
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ─────────────── Retailer card ─────────────── */
function RetailerCard({ retailer, onTap }: { retailer: typeof popularRetailers[0]; onTap: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="kv-card min-w-[150px] max-w-[170px] text-left"
      aria-label={`${retailer.name}, ${retailer.deliveryTime}`}
    >
      <div className="relative">
        <div
          className="w-full aspect-square bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url("${retailer.image}")` }}
          aria-hidden
        />
        {retailer.verified && (
          <div className="absolute top-2 right-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.31)',
              }}
            >
              <BadgeCheck className="w-3.5 h-3.5" style={{ color: 'var(--kv-emerald)' }} aria-hidden />
            </div>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h4 className="text-white font-bold text-xs sm:text-sm truncate">{retailer.name}</h4>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px]" style={{ color: 'var(--kv-text-tertiary)' }}>{retailer.category}</span>
          <span className="text-[10px]" style={{ color: 'var(--kv-text-tertiary)' }}>•</span>
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--kv-text-tertiary)' }}>
            <Clock className="w-2.5 h-2.5" aria-hidden />
            {retailer.deliveryTime}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3 h-3 fill-current" style={{ color: 'var(--kv-gold)' }} aria-hidden />
          <span className="text-[10px] font-bold text-white/80">{retailer.rating}</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ─────────────── Category chip ─────────────── */
function CategoryChip({ name, selected, onClick }: { name: string; selected: boolean; onClick: () => void }) {
  const cfg = CATEGORY_ICONS[name] || { icon: ShoppingBag, tone: 'var(--kv-mystic)' };
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex flex-col items-center gap-2 min-w-[72px]"
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
        style={{
          background: selected ? 'var(--kv-royal-light)' : 'rgba(255,255,255,0.04)',
          border: selected ? '1.5px solid var(--kv-royal-border)' : '1px solid var(--kv-glass-border)',
          boxShadow: selected ? '0 0 22px var(--kv-royal-glow)' : 'none',
        }}
      >
        <Icon className="w-6 h-6" style={{ color: cfg.tone }} aria-hidden />
      </div>
      <span
        className="text-[10px] font-bold whitespace-nowrap transition-colors"
        style={{ color: selected ? '#fff' : 'var(--kv-text-tertiary)' }}
      >
        {name}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN WELCOME SCREEN
   ══════════════════════════════════════════════════════════════════ */
export function KingdomWelcomeScreen() {
  // Use the SAME store hooks as the legacy WelcomeScreen. The legacy
  // pulls these from `useOnboarding()`; here we reach for the same
  // fields directly off the underlying `useAppStore` selectors to keep
  // the V2 file self-contained and free of selector re-renders.
  const setShowWelcome = useAppStore((s) => s.setShowWelcome);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleGetStarted = () => {
    setShowWelcome(false);
    setShowAuth('signup');
  };

  const handleSignIn = () => {
    setShowWelcome(false);
    setShowAuth('login');
  };

  const handleItemTap = () => {
    // V2 keeps the legacy CTA: any featured item tap launches signup.
    handleGetStarted();
  };

  const filteredMeals = activeCategory
    ? trendingMeals.filter((m) => m.category === activeCategory)
    : trendingMeals;

  return (
    <KingdomShell>
      <div className="max-w-md mx-auto px-5 pb-32 pt-6">
        {/* ─────────────── HERO ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="kv-hero-glow text-center pt-10 pb-10"
        >
          <div className="flex justify-center mb-6">
            <AIOrb size="lg" state="idle" />
          </div>
          <RoyalBadge variant="royal" icon={<Sparkles className="w-2.5 h-2.5" />}>
            Auren Kingdom · Aurora Edition
          </RoyalBadge>
          <h1 className="kv-gradient-text text-4xl sm:text-5xl font-extrabold tracking-tight mt-4">
            SwiftRamadan
          </h1>
          <p className="text-sm sm:text-base mt-4 max-w-md mx-auto" style={{ color: 'var(--kv-text-secondary)' }}>
            Iftar &amp; Sahur delivered with care — fresh meals, premium dates, and group-buy savings, all before Maghrib.
          </p>
          <div className="kv-accent-line mx-auto mt-6" />

          {/* Primary CTAs */}
          <div className="flex flex-col gap-3 mt-7 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleGetStarted}
              className="kv-btn kv-btn-royal w-full text-base"
            >
              Begin Your Journey
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleSignIn}
              className="kv-btn kv-btn-ghost w-full text-base"
            >
              I Have an Account
            </button>
          </div>

          {/* Hero stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="kv-gradient-text text-xl sm:text-2xl font-extrabold">{stat.value}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider mt-1"
                  style={{ color: 'var(--kv-text-tertiary)' }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─────────────── HERO CAROUSEL ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="mb-10"
        >
          <HeroCarousel onTap={handleItemTap} />
        </motion.section>

        {/* ─────────────── CATEGORIES ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <SectionHeading icon={ShoppingBag} title="Browse Categories" tone="var(--kv-mystic)" />
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                name={cat.name}
                selected={activeCategory === cat.name}
                onClick={() =>
                  setActiveCategory(activeCategory === cat.name ? null : cat.name)
                }
              />
            ))}
          </div>
        </motion.section>

        {/* ─────────────── FLASH SALES ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <SectionHeading
            icon={Flame}
            title="Flash Sales"
            tone="var(--kv-gold)"
            action={{ label: 'See All', onTap: handleItemTap }}
          />
          <div className="flex items-center gap-2 mb-3">
            <RoyalBadge variant="gold">
              <span
                className="relative inline-flex w-1.5 h-1.5"
                style={{ background: 'var(--kv-gold)', borderRadius: '50%' }}
              />
              LIVE
            </RoyalBadge>
            <span className="text-[10px] sm:text-xs" style={{ color: 'var(--kv-text-tertiary)' }}>
              Limited-time deals, refreshed hourly
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {flashSales.map((sale) => (
              <FlashDealCard key={sale.id} sale={sale} onTap={handleItemTap} />
            ))}
          </div>
        </motion.section>

        {/* ─────────────── CATEGORY HUB ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <SectionHeading icon={Package} title="Shop by Hub" tone="var(--kv-mystic)" />
          <div className="grid grid-cols-2 gap-3">
            {categoryHubItems.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleItemTap}
                className="kv-card relative overflow-hidden text-left"
                aria-label={`${item.name}, ${item.subtitle}`}
              >
                <div
                  className="w-full aspect-[16/9] bg-center bg-no-repeat bg-cover"
                  style={{ backgroundImage: `url("${item.image}")` }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, transparent 25%, rgba(5,5,5,0.92) 100%)' }}
                  aria-hidden
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <RoyalBadge variant="royal">{item.badge}</RoyalBadge>
                  </div>
                  <h4 className="text-white font-bold text-xs sm:text-sm">{item.name}</h4>
                  <span className="text-[10px] sm:text-xs" style={{ color: 'var(--kv-text-tertiary)' }}>
                    {item.subtitle}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ─────────────── TRENDING MEALS ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <SectionHeading
            icon={Zap}
            title={`${activeCategory || 'Trending'} Meals`}
            tone="var(--kv-mystic)"
            action={{ label: 'See All', onTap: handleItemTap }}
          />
          <div className="kv-stagger flex flex-col gap-3">
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onTap={handleItemTap} />
            ))}
            {filteredMeals.length === 0 && (
              <div className="kv-card py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--kv-text-tertiary)' }}>
                  No meals found in this category
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ─────────────── POPULAR RETAILERS ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <SectionHeading
            icon={ShoppingBag}
            title="Popular Stores"
            tone="var(--kv-mystic)"
            action={{ label: 'See All', onTap: handleItemTap }}
          />
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {popularRetailers.map((retailer) => (
              <RetailerCard key={retailer.id} retailer={retailer} onTap={handleItemTap} />
            ))}
          </div>
        </motion.section>

        {/* ─────────────── WHY SWIFTRAMADAN ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <SectionHeading icon={Sparkles} title="Why SwiftRamadan" tone="var(--kv-mystic)" />
          <div className="grid grid-cols-2 gap-3 kv-stagger">
            {WHY.map(({ icon: Ic, title, desc }) => (
              <div key={title} className="kv-card p-4 sm:p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
                >
                  <Ic className="w-5 h-5" style={{ color: 'var(--kv-mystic)' }} aria-hidden />
                </div>
                <h4 className="text-white text-sm sm:text-base font-bold">{title}</h4>
                <p className="text-[11px] sm:text-xs mt-1" style={{ color: 'var(--kv-text-tertiary)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─────────────── SOCIAL PROOF ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <div
            className="kv-card p-5 sm:p-6 flex items-center justify-around relative overflow-hidden"
            style={{ borderColor: 'var(--kv-royal-border)' }}
          >
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center gap-1.5 relative">
                <span className="kv-gradient-text text-xl sm:text-3xl font-black">{stat.value}</span>
                <span
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--kv-text-tertiary)' }}
                >
                  {stat.label}
                </span>
                {i < STATS.length - 1 && (
                  <div
                    className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-px h-10 sm:h-12"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-[10px] sm:text-xs"
            style={{ color: 'var(--kv-text-tertiary)' }}
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--kv-emerald)' }} aria-hidden />
              100% Halal verified
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" style={{ color: 'var(--kv-sky)' }} aria-hidden />
              Iftar-precision delivery
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--kv-gold)' }} aria-hidden />
              #1 in Lagos 2026
            </span>
          </div>
        </motion.section>

        {/* ─────────────── FINAL CTA ─────────────── */}
        <div className="kv-divider mb-8" />
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <div className="kv-card p-6 sm:p-8 text-center relative overflow-hidden" style={{ borderColor: 'var(--kv-royal-border)' }}>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative text-sm sm:text-base font-light"
              style={{ color: 'var(--kv-gold)' }}
            >
              ٱلسَّلَامُ عَلَيْكُمْ
            </motion.span>
            <h2 className="relative text-white text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
              Ready to elevate your Ramadan?
            </h2>
            <p className="relative text-sm sm:text-base mt-3 max-w-md mx-auto" style={{ color: 'var(--kv-text-secondary)' }}>
              Join thousands of Lagos families enjoying Iftar &amp; Sahur delivered with care.
            </p>
            <div className="relative flex flex-col gap-2.5 mt-6 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleGetStarted}
                className="kv-btn kv-btn-royal w-full text-base"
              >
                Begin Your Journey
                <ArrowRight className="w-5 h-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleSignIn}
                className="kv-btn kv-btn-ghost w-full text-sm"
              >
                Already part of the family? <span className="font-bold" style={{ color: 'var(--kv-mystic)' }}>Sign In</span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* ─────────────── FOOTER ─────────────── */}
        <div className="kv-divider mb-6" />
        <p className="text-center text-xs" style={{ color: 'var(--kv-text-muted)' }}>
          SwiftRamadan · Auren Kingdom · Lagos 2026
        </p>
      </div>
    </KingdomShell>
  );
}
