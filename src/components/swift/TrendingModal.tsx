'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Newspaper,
  Tag,
  ChefHat,
  Lightbulb,
  Clock,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';

/* ──────────────────────────────────────────────────────────────────
   Trending in Lagos — live web-powered feed modal
   ────────────────────────────────────────────────────────────────── */

type Category = 'all' | 'deals' | 'recipes' | 'news' | 'tips';

interface TrendingItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  date: string;
  favicon: string;
  category: 'deals' | 'recipes' | 'news' | 'tips';
}

const CATEGORIES: { id: Category; label: string; icon: typeof Tag }[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'deals', label: 'Deals', icon: Tag },
  { id: 'recipes', label: 'Recipes', icon: ChefHat },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
];

const CATEGORY_STYLES: Record<
  'deals' | 'recipes' | 'news' | 'tips',
  { badge: string; ring: string; icon: typeof Tag; label: string; glow: string }
> = {
  deals: {
    badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    ring: 'group-hover:border-amber-400/30',
    icon: Tag,
    label: 'Deal',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
  },
  recipes: {
    badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    ring: 'group-hover:border-emerald-400/30',
    icon: ChefHat,
    label: 'Recipe',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  news: {
    badge: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    ring: 'group-hover:border-sky-400/30',
    icon: Newspaper,
    label: 'News',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
  },
  tips: {
    badge: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
    ring: 'group-hover:border-violet-400/30',
    icon: Lightbulb,
    label: 'Tip',
    glow: 'shadow-[0_0_20px_rgba(167,139,250,0.15)]',
  },
};

function prettyDate(input: string): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor(diffMs / dayMs);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function TrendingModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'trending';

  const [items, setItems] = useState<TrendingItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [source, setSource] = useState<'live' | 'fallback' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTrending = useCallback(
    async (category: Category, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/trending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: category === 'all' ? undefined : category }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems((data.items as TrendingItem[]) ?? []);
        setSource((data.source as 'live' | 'fallback') ?? 'unknown');
        setLastUpdated(new Date());
      } catch (err) {
        setError('Could not load live feed. Pull to retry.');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Fetch on open + refetch on category change
  useEffect(() => {
    if (!isOpen) return;
    fetchTrending(activeCategory);
    // Reset scroll position when switching category
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isOpen, activeCategory, fetchTrending]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTrending(activeCategory, { silent: true });
  }, [activeCategory, fetchTrending]);

  const handleClose = () => setActiveModal(null);

  // Loading skeletons
  const skeletonCount = 5;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 h-[94vh] bg-[var(--sr-surface-base)] rounded-t-3xl z-[120] flex flex-col overflow-hidden border-t border-white/10 max-w-md mx-auto"
          >
            {/* Decorative top glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full bg-[var(--sr-customer)]/10 blur-3xl" />

            {/* ──── Sticky Header ──── */}
            <div className="relative shrink-0 z-10 bg-[var(--sr-surface-base)]/95 backdrop-blur-md border-b border-white/5">
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1.5 rounded-full bg-white/15" />
              </div>

              <div className="flex items-start justify-between p-3 sm:p-4 pt-1">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="w-11 h-11 bg-gradient-to-br from-[var(--sr-customer)]/20 to-[var(--sr-customer)]/5 rounded-2xl flex items-center justify-center border border-[var(--sr-customer)]/30 shrink-0"
                  >
                    <TrendingUp className="w-5 h-5 text-[var(--sr-customer)]" />
                  </motion.div>
                  <div className="min-w-0">
                    <h2 className="text-white font-black text-lg leading-tight flex items-center gap-1.5">
                      Trending in Lagos
                    </h2>
                    <p className="text-white/65 text-xs flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--sr-customer)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--sr-customer)]" />
                      </span>
                      Live from the web
                      {lastUpdated && (
                        <span className="text-white/60">· updated {prettyDate(lastUpdated.toISOString())}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRefresh}
                    disabled={loading || isRefreshing}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
                    title="Refresh feed"
                    aria-label="Refresh"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Live / Fallback pill */}
              {lastUpdated && (
                <div className="px-4 -mt-1 pb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      source === 'live'
                        ? 'bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] border-[var(--sr-customer)]/30'
                        : source === 'fallback'
                          ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                          : 'bg-white/5 text-white/65 border-white/10'
                    }`}
                  >
                    <Globe className="w-2.5 h-2.5" />
                    {source === 'live'
                      ? 'Live web results'
                      : source === 'fallback'
                        ? 'Curated picks (live feed offline)'
                        : 'Loading source…'}
                  </span>
                </div>
              )}

              {/* ──── Category Chips ──── */}
              <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-t border-white/5">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[var(--sr-customer)] text-[var(--sr-surface-base)] shadow-[0_0_16px_rgba(16,224,122,0.4)]'
                          : 'bg-white/5 text-white/50 border border-white/10 hover:border-[var(--sr-customer)]/20 hover:text-white/80'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ──── Pull to Refresh Button ──── */}
            {!loading && items.length > 0 && (
              <button
                onClick={handleRefresh}
                className="shrink-0 mx-4 mt-3 py-2 rounded-xl text-[11px] font-bold text-white/50 bg-white/5 border border-white/5 hover:border-[var(--sr-customer)]/20 hover:text-[var(--sr-customer)] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing…' : 'Pull to refresh · fetch latest from the web'}
              </button>
            )}

            {/* ──── Scrollable Results ──── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3"
            >
              {/* Loading state */}
              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <motion.div
                      key={`skel-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 overflow-hidden p-3 sm:p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white/5 luxury-shimmer" />
                        <div className="h-3 w-24 rounded-full bg-white/5 luxury-shimmer" />
                        <div className="ml-auto h-5 w-12 rounded-full bg-white/5 luxury-shimmer" />
                      </div>
                      <div className="h-4 w-3/4 rounded-full bg-white/5 luxury-shimmer" />
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-full rounded-full bg-white/5 luxury-shimmer" />
                        <div className="h-2.5 w-5/6 rounded-full bg-white/5 luxury-shimmer" />
                        <div className="h-2.5 w-2/3 rounded-full bg-white/5 luxury-shimmer" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {!loading && error && items.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-amber-300" />
                  </div>
                  <p className="text-white font-bold text-sm mb-1">No trending items found</p>
                  <p className="text-white/65 text-xs mb-4 max-w-[240px]">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-full bg-[var(--sr-customer)] text-[var(--sr-surface-base)] text-xs font-bold flex items-center gap-1.5 hover:bg-[var(--sr-customer)]/90 active:scale-[0.98] transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </motion.div>
              )}

              {/* Empty state */}
              {!loading && !error && items.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white/65" />
                  </div>
                  <p className="text-white font-bold text-sm mb-1">No trending items found</p>
                  <p className="text-white/65 text-xs">Try another category or refresh the feed.</p>
                </motion.div>
              )}

              {/* Results */}
              {!loading && items.length > 0 && (
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => {
                    const style = CATEGORY_STYLES[item.category];
                    const CatIcon = style.icon;
                    return (
                      <motion.a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
                        className={`group block bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4 hover:bg-[var(--sr-surface-elevated)] transition-all ${style.ring}`}
                      >
                        {/* Top row: source + date + category badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {item.favicon ? (
                            <img
                              src={item.favicon}
                              alt=""
                              className="w-4 h-4 rounded-full bg-white/5 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <Globe className="w-2.5 h-2.5 text-white/60" />
                            </div>
                          )}
                          <span className="text-white/60 text-[11px] font-medium truncate">
                            {item.source}
                          </span>
                          <span className="text-white/60 text-[11px] flex items-center gap-1 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {prettyDate(item.date)}
                          </span>
                          <span
                            className={`ml-auto inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${style.badge}`}
                          >
                            <CatIcon className="w-2.5 h-2.5" />
                            {style.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-white font-bold text-sm leading-snug mb-1.5 group-hover:text-white transition-colors">
                          {item.title}
                        </h3>

                        {/* Snippet */}
                        <p className="text-white/55 text-xs leading-relaxed line-clamp-3 mb-3">
                          {item.snippet}
                        </p>

                        {/* Read more */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[var(--sr-customer)] text-xs font-bold group-hover:gap-1.5 transition-all">
                            Read more
                            <ExternalLink className="w-3 h-3" />
                          </span>
                          <span className="text-white/20 text-[10px] truncate max-w-[140px]">
                            {item.url.replace(/^https?:\/\//, '').split('/')[0]}
                          </span>
                        </div>
                      </motion.a>
                    );
                  })}
                </AnimatePresence>
              )}

              {/* Footer hint */}
              {!loading && items.length > 0 && (
                <div className="pt-2 pb-1 text-center">
                  <p className="text-white/20 text-[10px]">
                    Tap any card to open the source in your browser · Results powered by web search
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
