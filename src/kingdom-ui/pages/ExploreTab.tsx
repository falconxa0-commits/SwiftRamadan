'use client';

/**
 * KingdomExploreTab — Auren Kingdom V2 reinterpretation of the legacy SwiftRamadan ExploreTab.
 *
 * Same store hooks (useNavigation, useCart, useSetActiveCategory, useActiveCategory,
 * useSetSelectedProduct, useAppStore.getState) and the same data imports
 * (`allProducts`, `formatNaira`, `popularRetailers`, `quickActions`, `Product` type)
 * from `@/lib/data` are preserved. The visual layer is completely replaced with
 * the Kingdom V2 design system (KingdomShell, CommandBar, ProductCard, RoyalBadge,
 * RoyalSkeleton, kv-card / kv-stagger / kv-empty / kv-accent-line).
 *
 * V2 spec sections:
 *  1. KingdomShell root
 *  2. Title "Kingdom Discovery" with kv-gradient-text + kv-accent-line
 *  3. CommandBar at top for search (from kingdom-ui/components)
 *  4. Category navigation as horizontal scroll of RoyalBadge pills (active = royal)
 *  5. Products in grid using ProductCard component (grid-cols-1 sm:grid-cols-2)
 *  6. kv-stagger entrance on product cards
 *  7. kv-empty for no results ("Safa is searching for the perfect meals...")
 *  8. RoyalSkeleton loading state
 *  9. Mobile-first layout
 *  10. Same store hooks preserved (setActiveModal, setSelectedProduct,
 *      searchQuery, setSearchQuery, activeCategory, setActiveCategory)
 *  11. Same data imports as legacy
 *  12. Route: `src/app/kingdom/discover/page.tsx`
 *
 * The legacy `src/components/swift/ExploreTab.tsx` is untouched.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import {
  allProducts,
  popularRetailers,
  quickActions,
  formatNaira,
  type Product,
} from '@/lib/data';
import { useAppStore } from '@/lib/store';
import {
  useNavigation,
  useCart,
  useActiveCategory,
  useSetActiveCategory,
  useSetSelectedProduct,
} from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  CommandBar,
  ProductCard,
  RoyalBadge,
  RoyalSkeleton,
} from '../components';

/* ─────────────────────── Category pills (V2 spec) ─────────────────────── */
/**
 * The V2 spec defines the category navigation as:
 * "All, Meals, Drinks, Snacks, Groceries". Each pill maps to an
 * `activeCategory` store value (or `null` for "All").
 */
const CATEGORY_PILLS = [
  { id: 'all', label: 'All', value: null },
  { id: 'Iftar Meals', label: 'Meals', value: 'Iftar Meals' },
  { id: 'Drinks', label: 'Drinks', value: 'Drinks' },
  { id: 'Snacks', label: 'Snacks', value: 'Snacks' },
  { id: 'Groceries', label: 'Groceries', value: 'Groceries' },
] as const;

/* ─────────────────────── Category filter map (mirrors legacy) ─────────────────────── */
const categoryProductMap: Record<string, string[]> = {
  'Iftar Meals': ['iftar meals', 'meals'],
  Drinks: ['drinks'],
  Snacks: ['snacks'],
  Groceries: ['groceries'],
};

/* ─────────────────────── Quick action config (mirrors legacy HomeTab pattern) ─────────────────────── */
const quickActionConfig: Record<
  string,
  { action: (store: ReturnType<typeof useAppStore.getState>) => void }
> = {
  replay: { action: (s) => s.setActiveTab('orders') },
  groups: { action: (s) => s.setActiveModal('groupBuy') },
  card_giftcard: { action: (s) => s.setActiveModal('giftcard') },
  restaurant: { action: (s) => s.setActiveModal('recipes') },
  mosque: { action: (s) => s.setActiveModal('mosque') },
  local_shipping: { action: (s) => s.setActiveTab('orders') },
};

/* ─────────────────────── Skeleton row (uses RoyalSkeleton) ─────────────────────── */
function ProductCardSkeleton() {
  return (
    <div className="kv-card overflow-hidden p-3 flex flex-col gap-2">
      <RoyalSkeleton variant="rect" height={160} className="!rounded-xl" />
      <RoyalSkeleton variant="text" width="80%" />
      <RoyalSkeleton variant="text" width="60%" />
      <RoyalSkeleton variant="text" width="40%" />
      <div className="flex items-center justify-between mt-1">
        <RoyalSkeleton variant="text" width={60} />
        <RoyalSkeleton variant="rect" width={64} height={36} className="!rounded-lg" />
      </div>
    </div>
  );
}

export function KingdomExploreTab() {
  /* ── SAME store hooks preserved (per legacy ExploreTab) ── */
  const { setActiveModal, setActiveTab, searchQuery, setSearchQuery, setShowSearch } =
    useNavigation();
  const { addToCart } = useCart();
  const setActiveCategory = useSetActiveCategory();
  const activeCategory = useActiveCategory();
  const setSelectedProduct = useSetSelectedProduct();
  const { toast } = useToast();

  /* ── Local UI state ── */
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRetailer, setSelectedRetailer] = useState<
    (typeof popularRetailers)[number] | null
  >(null);

  /* ── Simulate brief loading state for skeleton (same as legacy) ── */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── Filter products by active category + search query ── */
  const filteredProducts = useMemo(() => {
    // Category filter (mirrors legacy logic exactly)
    const byCategory = activeCategory
      ? allProducts.filter((p) => {
          const cats = categoryProductMap[activeCategory];
          if (!cats || cats.length === 0) return true;
          return cats.some((cat) => (p.category || '').toLowerCase().includes(cat));
        })
      : allProducts.filter((p) => p.id <= 4 || p.id === 100 || p.id === 101 || p.id === 102);

    // Search filter (V2 inline search — preserves `searchQuery` + `setSearchQuery`)
    const q = (searchQuery ?? '').trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q),
    );
  }, [activeCategory, searchQuery]);

  /* ── Handlers — same behaviour as legacy ExploreTab ── */
  const handleCategoryClick = (pill: (typeof CATEGORY_PILLS)[number]) => {
    if (activeCategory === pill.value) {
      // Toggle off — return to "All"
      setActiveCategory(null);
    } else {
      setActiveCategory(pill.value);
    }
  };

  const handleProductClick = (id: number) => {
    setSelectedProduct(id);
    setActiveModal('product');
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price || 0,
      image: product.image,
    });
    toast({
      title: 'Added to Cart',
      description: `${product.name} added to your cart`,
    });
  };

  const handleRetailerClick = (retailer: (typeof popularRetailers)[number]) => {
    setSelectedRetailer(retailer);
    toast({
      title: `Viewing ${retailer.name}`,
      description: `Showing ${retailer.category} items`,
    });
  };

  const handleQuickAction = (action: (typeof quickActions)[number]) => {
    const config = quickActionConfig[action.icon];
    if (config) {
      config.action(useAppStore.getState());
    } else {
      toast({ title: action.name, description: `${action.name} feature coming soon!` });
    }
  };

  /* ── Search results dropdown (preserves CommandBar's `results` slot) ── */
  const showSearchResults = (searchQuery ?? '').length > 0;
  const searchResults = showSearchResults
    ? filteredProducts.slice(0, 5).map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => handleProductClick(p.id)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--kv-glass-hover)] transition-colors text-left"
        >
          <div
            className="w-10 h-10 rounded-lg bg-center bg-no-repeat bg-cover shrink-0 border border-white/10"
            style={{ backgroundImage: `url("${p.image}")` }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate">{p.name}</p>
            <p className="text-[var(--kv-text-tertiary)] text-xs truncate">{p.category}</p>
          </div>
          <span className="kv-gradient-gold font-bold text-sm whitespace-nowrap">
            {formatNaira(p.salePrice || p.price || 0)}
          </span>
        </button>
      ))
    : null;

  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Title ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <p className="text-sm text-[var(--kv-text-tertiary)]">Discover</p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            Kingdom Discovery
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--kv-mystic)]" aria-hidden />
            Curated by Safa for your Ramadan table
          </p>
        </motion.header>

        {/* ─────────────────────── CommandBar (search) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4"
        >
          <CommandBar
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search meals, stores, products…"
            aria-label="Search the Kingdom"
            results={searchResults}
            resultsOpen={showSearchResults}
            onResultsClose={() => setSearchQuery('')}
            leftIcon={<Search className="w-5 h-5" aria-hidden />}
          />
          {/* Hidden hook anchor — preserves `setShowSearch` parity with legacy */}
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="sr-only"
            aria-label="Open advanced search"
            tabIndex={-1}
          >
            Advanced search
          </button>
        </motion.div>

        {/* ─────────────────────── Category pills ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-5"
        >
          <div
            className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x"
            role="tablist"
            aria-label="Product categories"
          >
            {CATEGORY_PILLS.map((pill) => {
              const isActive =
                pill.value === null
                  ? activeCategory === null
                  : activeCategory === pill.value;
              return (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryClick(pill)}
                  className="snap-start shrink-0"
                >
                  <RoyalBadge variant={isActive ? 'royal' : 'neutral'}>
                    {pill.label}
                  </RoyalBadge>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ─────────────────────── Loading state (RoyalSkeleton) ─────────────────────── */}
        {isLoading ? (
          <div
            className="space-y-4"
            aria-label="Loading products"
            role="status"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ─────────────────────── Products grid ─────────────────────── */}
            {filteredProducts.length > 0 ? (
              <div className="kv-stagger grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    price={product.salePrice || product.price || 0}
                    image={product.image}
                    vendor={product.category || 'Verified Vendor'}
                    rating={product.rating}
                    reviews={product.reviews}
                    deliveryTime={product.deliveryTime}
                    discountPct={
                      product.originalPrice && product.salePrice && product.originalPrice > product.salePrice
                        ? Math.round(
                            ((product.originalPrice - product.salePrice) /
                              product.originalPrice) *
                              100,
                          )
                        : undefined
                    }
                    onAdd={() => handleAddToCart(product)}
                    onClick={() => handleProductClick(product.id)}
                  />
                ))}
              </div>
            ) : (
              /* ─────────────────────── Empty state (kv-empty) ─────────────────────── */
              <div className="kv-card kv-empty">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center kv-gold-glow"
                  style={{ background: 'var(--kv-royal-light)' }}
                >
                  <Search className="w-7 h-7 text-[var(--kv-mystic)]" aria-hidden />
                </div>
                <h3 className="text-white text-base font-bold tracking-tight">
                  No meals found
                </h3>
                <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
                  Safa is searching for the perfect meals…
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery('');
                  }}
                  className="kv-btn kv-btn-ghost text-sm py-2.5 px-5 min-h-[40px]"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* ─────────────────────── Selected retailer detail card ─────────────────────── */}
            {selectedRetailer && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 kv-card p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-bold tracking-tight">
                      {selectedRetailer.name}
                    </h4>
                    <p className="text-[var(--kv-text-tertiary)] text-xs">
                      {selectedRetailer.category} &bull; {selectedRetailer.deliveryTime} delivery
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star
                        className="w-3 h-3 fill-[var(--kv-gold)] text-[var(--kv-gold)]"
                        aria-hidden
                      />
                      <span className="text-[var(--kv-gold)] text-[10px] font-bold">
                        {selectedRetailer.rating}
                      </span>
                      {selectedRetailer.verified && (
                        <CheckCircle
                          className="w-3 h-3 text-[var(--kv-emerald)] ml-1"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRetailer(null)}
                    className="p-1.5 hover:bg-[var(--kv-glass-hover)] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Close retailer detail"
                  >
                    <ChevronRight className="w-4 h-4 text-white/60" aria-hidden />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory(selectedRetailer.category);
                      setSelectedRetailer(null);
                    }}
                    className="flex-1 kv-btn kv-btn-royal text-xs py-2 px-3 min-h-[40px]"
                  >
                    Browse Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory(selectedRetailer.category);
                      setSelectedRetailer(null);
                    }}
                    className="flex-1 kv-btn kv-btn-ghost text-xs py-2 px-3 min-h-[40px]"
                  >
                    View Store
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─────────────────────── Stores you'll love (popularRetailers) ─────────────────────── */}
            {!searchQuery && (
              <section className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                    Stores you&apos;ll love
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="text-xs text-[var(--kv-mystic)] font-semibold"
                  >
                    Explore All
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                  {popularRetailers.map((retailer) => (
                    <button
                      key={retailer.id}
                      type="button"
                      onClick={() => handleRetailerClick(retailer)}
                      className={`kv-card min-w-[160px] snap-start shrink-0 p-3 text-left ${
                        selectedRetailer?.id === retailer.id ? 'kv-card-royal' : ''
                      }`}
                    >
                      <div
                        className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-xl mb-3 border border-white/10"
                        style={{ backgroundImage: `url("${retailer.image}")` }}
                        aria-hidden
                      />
                      <h4 className="text-white text-sm font-bold tracking-tight truncate">
                        {retailer.name}
                      </h4>
                      <p className="text-[var(--kv-text-tertiary)] text-[10px] truncate">
                        {retailer.category} &bull; {retailer.deliveryTime}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star
                          className="w-3 h-3 fill-[var(--kv-gold)] text-[var(--kv-gold)]"
                          aria-hidden
                        />
                        <span className="text-[var(--kv-gold)] text-[10px] font-bold">
                          {retailer.rating}
                        </span>
                        {retailer.verified && (
                          <CheckCircle
                            className="w-3 h-3 text-[var(--kv-emerald)] ml-1"
                            aria-hidden
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ─────────────────────── Quick Actions ─────────────────────── */}
            {!searchQuery && (
              <section className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                    Quick actions
                  </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action)}
                      className="flex-shrink-0 w-20 flex flex-col items-center gap-2"
                    >
                      <div
                        className="size-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'var(--kv-royal-light)' }}
                      >
                        <Sparkles
                          className="w-6 h-6 text-[var(--kv-mystic)]"
                          aria-hidden
                        />
                      </div>
                      <span className="text-[10px] font-medium text-center text-[var(--kv-text-tertiary)]">
                        {action.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ─────────────────────── See all (preserves `setActiveTab`) ─────────────────────── */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="w-full text-center text-xs text-[var(--kv-text-tertiary)] hover:text-[var(--kv-mystic)] font-semibold py-2 transition-colors"
              >
                See all picks on the home feed →
              </button>
            </div>
          </>
        )}
      </main>
    </KingdomShell>
  );
}
