'use client';

/**
 * KingdomHomeTab — Auren Kingdom V2 reinterpretation of the legacy SwiftRamadan HomeTab.
 *
 * Same store hooks (useNavigation, useCart, useSetSelectedProduct, useSetActiveCategory,
 * useActiveCategory, useLastSpinDate, useAppStore.getState) and the same data imports
 * from @/lib/data are preserved. The visual layer is completely replaced with the
 * Kingdom V2 design system (KingdomShell, IntelligenceCard, MissionCard, AIOrb,
 * kv-card / kv-stagger / kv-badge-gold / kv-accent-line).
 *
 * Sections (per V2 spec):
 *  1. KingdomShell root + greeting ("Salam, [name]") with kv-accent-line
 *  2. AI Recommendation — IntelligenceCard (royal) + AIOrb sm ("Safa recommends…")
 *  3. Quick Actions — 4 MissionCard components
 *  4. Categories — horizontal scroll, kv-card items
 *  5. Flash Sales — kv-card with kv-badge-gold discount badges
 *  6. Trending Meals — kv-card with hover lift
 *  7. Community CTA — IntelligenceCard royal variant
 *  8. kv-stagger entrance on every section
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Star,
  Flame,
  Users,
  Gift,
  BookOpen,
  Landmark,
  MapPin,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import {
  categories,
  trendingMeals,
  flashSales,
  quickActions,
  formatNaira,
} from '@/lib/data';
import { useAppStore } from '@/lib/store';
import {
  useNavigation,
  useCart,
  useSetActiveCategory,
  useSetSelectedProduct,
  useActiveCategory,
  useLastSpinDate,
  useUserName,
} from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  MissionCard,
  AIOrb,
  RoyalBadge,
} from '../components';

/* ─────────────────────── Quick action config (mirrors legacy) ─────────────────────── */
const quickActionConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; action: (store: ReturnType<typeof useAppStore.getState>) => void }
> = {
  replay: { icon: RotateCcw, action: (s) => s.setActiveTab('orders') },
  groups: { icon: Users, action: (s) => s.setActiveModal('groupBuy') },
  card_giftcard: { icon: Gift, action: (s) => s.setActiveModal('giftcard') },
  restaurant: { icon: BookOpen, action: (s) => s.setActiveModal('recipes') },
  mosque: { icon: Landmark, action: (s) => s.setActiveModal('mosque') },
  local_shipping: { icon: MapPin, action: (s) => s.setActiveTab('orders') },
};

export function KingdomHomeTab() {
  /* ── SAME store hooks preserved ── */
  const { setActiveModal, setActiveTab } = useNavigation();
  const { addToCart } = useCart();
  const setSelectedProduct = useSetSelectedProduct();
  const setActiveCategory = useSetActiveCategory();
  const activeCategory = useActiveCategory();
  const lastSpinDate = useLastSpinDate();
  const userName = useUserName();
  const { toast } = useToast();

  /* ── Local UI state for category filter chip ── */
  const [filterChipOpen, setFilterChipOpen] = useState(true);

  /* ── Free-spin availability (same logic as legacy) ── */
  const todayKey = new Date().toISOString().split('T')[0];
  const freeSpinAvailable = lastSpinDate !== todayKey;

  /* ── Handlers — same behaviour as legacy HomeTab ── */
  const handleCategoryClick = (category: (typeof categories)[number]) => {
    if (activeCategory === category.name) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category.name);
    }
  };

  const handleMealClick = (id: number) => {
    setSelectedProduct(id);
    setActiveModal('product');
  };

  const handleQuickAdd = (item: { id: number; name: string; price: number; image: string }) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
    toast({ title: 'Added to Cart', description: `${item.name} added to your cart` });
  };

  const handleQuickAction = (action: (typeof quickActions)[number]) => {
    const config = quickActionConfig[action.icon];
    if (config) {
      config.action(useAppStore.getState());
    } else {
      toast({ title: action.name, description: `${action.name} feature coming soon!` });
    }
  };

  /* ── Filtered meals based on active category ── */
  const filteredMeals = activeCategory
    ? trendingMeals.filter((m) => m.category === activeCategory)
    : trendingMeals;

  const greetingName = (userName || 'friend').trim() || 'friend';

  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Greeting ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <p className="text-sm text-[var(--kv-text-tertiary)]">Salam,</p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight capitalize">
              {greetingName}
            </h1>
            <div className="kv-accent-line mt-2" />
            <p className="text-xs text-[var(--kv-text-tertiary)] mt-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[var(--kv-amber)]" aria-hidden />
              Maghrib in 1h 24m
            </p>
          </div>
          <AIOrb size="md" state="idle" />
        </motion.header>

        {/* ─────────────────────── Free Spin Available (preserves useLastSpinDate) ────────── */}
        {freeSpinAvailable && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={() => setActiveModal('rewards')}
            className="kv-card kv-card-gold w-full p-4 flex items-center gap-3 mb-5 text-left active:scale-[0.98] transition-transform"
            aria-label="Claim free spin"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--kv-gold-light)' }}
            >
              <span className="text-xl" aria-hidden>🎰</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-bold">Free Spin Available</p>
              <p className="text-[var(--kv-text-tertiary)] text-xs">
                Spin the royal wheel for Ramadan rewards
              </p>
            </div>
            <RoyalBadge variant="gold">Spin Now</RoyalBadge>
          </motion.button>
        )}

        {/* ─────────────────────── Stagger sections ─────────────────────── */}
        <div className="kv-stagger space-y-5">
          {/* ── AI Recommendation ─ IntelligenceCard + AIOrb sm ── */}
          <IntelligenceCard
            variant="royal"
            title="Safa recommends"
            subtitle="AI · Personalised for Ramadan"
          >
            <div className="flex items-start gap-3">
              <AIOrb size="sm" state="thinking" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-snug">
                  Order{' '}
                  <span className="kv-gradient-text font-bold">Jollof Royale</span>{' '}
                  from Saffran Lagos — it pairs perfectly with your taste DNA and arrives
                  before Maghrib.
                </p>
                <button
                  type="button"
                  onClick={() => handleMealClick(1)}
                  className="kv-btn kv-btn-royal mt-3 text-xs py-2 px-4 min-h-[36px]"
                >
                  Order now
                </button>
              </div>
            </div>
          </IntelligenceCard>

          {/* ── Quick Actions — 4 MissionCard components ── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
              Quick actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.slice(0, 4).map((action) => {
                const config = quickActionConfig[action.icon];
                const Icon = config?.icon || Sparkles;
                return (
                  <MissionCard
                    key={action.id}
                    icon={Icon}
                    title={action.name}
                    description="Tap to launch"
                    action="Open"
                    onAction={() => handleQuickAction(action)}
                  />
                );
              })}
            </div>
          </section>

          {/* ── Categories — horizontal scroll with kv-card items ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                Categories
              </h2>
              {activeCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(null);
                    setFilterChipOpen(false);
                  }}
                  className="text-xs text-[var(--kv-mystic)] font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" aria-hidden /> Clear
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.name || (!activeCategory && cat.id === 1);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={`kv-card p-3 min-w-[88px] snap-start shrink-0 flex flex-col items-center gap-2 ${
                      isActive ? 'kv-card-royal' : ''
                    }`}
                    aria-label={`Filter by ${cat.name}`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-[var(--kv-elevated)]">
                      <div
                        className="w-full h-full bg-center bg-no-repeat bg-cover"
                        style={{ backgroundImage: `url("${cat.image}")` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold whitespace-nowrap text-white">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {activeCategory && filterChipOpen && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl kv-glass border border-white/8">
                <span className="text-[var(--kv-mystic)] text-xs font-bold">
                  Filtered by: {activeCategory}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(null);
                    setFilterChipOpen(false);
                  }}
                  aria-label="Clear filter"
                  className="ml-auto p-0.5 hover:opacity-80"
                >
                  <X className="w-3.5 h-3.5 text-[var(--kv-text-tertiary)]" />
                </button>
              </div>
            )}
          </section>

          {/* ── Flash Sales — kv-card with kv-badge-gold ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[var(--kv-gold)]" aria-hidden />
                Flash Sales
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('offers')}
                className="text-xs text-[var(--kv-mystic)] font-semibold"
              >
                See all
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {flashSales.map((sale) => (
                <div
                  key={sale.id}
                  className="kv-card min-w-[200px] snap-start shrink-0 overflow-hidden cursor-pointer"
                  onClick={() => handleMealClick(sale.id + 200)}
                >
                  <div className="relative">
                    <div
                      className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
                      style={{ backgroundImage: `url("${sale.image}")` }}
                    />
                    <div className="absolute top-2 left-2">
                      <RoyalBadge variant="gold">-{sale.discount}%</RoyalBadge>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
                      <span className="text-[var(--kv-gold)] text-[9px] font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" aria-hidden />
                        {sale.endsIn}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-white font-bold text-sm truncate">{sale.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="kv-gradient-gold font-extrabold text-sm">
                        {formatNaira(sale.salePrice)}
                      </span>
                      <span className="text-[var(--kv-text-tertiary)] text-[10px] line-through">
                        {formatNaira(sale.originalPrice)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="kv-progress" aria-label="Claim progress">
                        <div
                          className="kv-progress-fill"
                          style={{ width: `${sale.claimed}%` }}
                        />
                      </div>
                      <p className="text-[var(--kv-text-tertiary)] text-[9px] font-semibold mt-1">
                        {sale.claimed}% claimed
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd({
                          id: sale.id + 200,
                          name: sale.name,
                          price: sale.salePrice,
                          image: sale.image,
                        });
                      }}
                      className="w-full mt-2 kv-btn kv-btn-ghost text-[10px] py-1.5 min-h-[32px]"
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Trending Meals — kv-card with hover lift ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                {activeCategory ? activeCategory : 'Trending Iftar'}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal('trending')}
                className="text-xs text-[var(--kv-mystic)] font-semibold"
              >
                See all
              </button>
            </div>

            {filteredMeals.length > 0 ? (
              <div className="space-y-3">
                {filteredMeals.map((meal) => (
                  <div
                    key={meal.id}
                    onClick={() => handleMealClick(meal.id)}
                    className="kv-card flex gap-3 p-3 cursor-pointer"
                  >
                    <div
                      className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0 border border-white/10"
                      style={{ backgroundImage: `url("${meal.image}")` }}
                    />
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-white font-bold text-base truncate tracking-tight">
                            {meal.name}
                          </h4>
                          <span className="kv-gradient-gold font-extrabold whitespace-nowrap text-sm">
                            {formatNaira(meal.price)}
                          </span>
                        </div>
                        <p className="text-[var(--kv-text-tertiary)] text-[11px] leading-relaxed mt-1 line-clamp-2">
                          {meal.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="kv-badge-neutral">
                          <Clock className="w-3 h-3" aria-hidden />
                          {meal.deliveryTime}
                        </span>
                        <span className="kv-badge-neutral">
                          <Star
                            className="w-3 h-3 fill-[var(--kv-gold)] text-[var(--kv-gold)]"
                            aria-hidden
                          />
                          {meal.rating}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAdd(meal);
                          }}
                          className="ml-auto kv-btn kv-btn-royal text-[10px] py-1 px-3 min-h-[28px]"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kv-card kv-empty">
                <p className="text-[var(--kv-text-tertiary)] text-sm">
                  No meals found for &quot;{activeCategory}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="kv-btn kv-btn-ghost text-sm py-2 px-4 min-h-[36px]"
                >
                  Clear filter
                </button>
              </div>
            )}
          </section>

          {/* ── Community CTA — IntelligenceCard royal variant ── */}
          <IntelligenceCard
            variant="royal"
            title="Join the Community"
            subtitle="Connect with thousands of Muslims"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--kv-royal-light)' }}
              >
                <Users className="w-6 h-6 text-[var(--kv-mystic)]" aria-hidden />
              </div>
              <p className="text-sm text-white flex-1 leading-snug">
                Break fast together. Share stories. Earn hasanat side by side.
              </p>
              <button
                type="button"
                onClick={() => setActiveModal('community')}
                className="kv-btn kv-btn-royal text-xs py-2 px-4 min-h-[36px] shrink-0"
              >
                Join
              </button>
            </div>
          </IntelligenceCard>
        </div>
      </main>
    </KingdomShell>
  );
}
