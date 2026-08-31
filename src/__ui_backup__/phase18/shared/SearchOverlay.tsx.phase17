'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation, useSetActiveCategory, useSetSelectedProduct } from '@/lib/store-selectors';
import { formatNaira, popularSearches } from '@/lib/data';
import { track } from '@/lib/analytics';

interface SearchResult {
  id: number;
  name: string;
  type: string;
  category: string;
  price?: number;
  image?: string;
}

interface SearchResults {
  products: SearchResult[];
  categories: SearchResult[];
  retailers: SearchResult[];
}

export default function SearchOverlay() {
  const { showSearch, setShowSearch, setActiveTab, setActiveModal } = useNavigation();
  const setActiveCategory = useSetActiveCategory();
  const setSelectedProduct = useSetSelectedProduct();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ products: [], categories: [], retailers: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const HISTORY_KEY = 'search-history';
  const MAX_HISTORY = 10;

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setQuery('');
      setResults({ products: [], categories: [], retailers: [] });
    }
  }, [showSearch]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, MAX_HISTORY));
      }
      // Also migrate any legacy history into the new key
      const legacy = localStorage.getItem('swiftramadan-recent-searches');
      if (legacy) {
        const legacyParsed = JSON.parse(legacy);
        if (Array.isArray(legacyParsed)) {
          setRecentSearches((prev) => {
            const merged = Array.from(new Set([...legacyParsed, ...prev])).slice(0, MAX_HISTORY);
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
            return merged;
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ products: [], categories: [], retailers: [] });
      return;
    }
    setIsSearching(true);
    track('search', { query: q.trim() });
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || { products: [], categories: [], retailers: [] });
    } catch {
      setResults({ products: [], categories: [], retailers: [] });
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  // Persist search history to localStorage (max 10, newest first, no duplicates)
  const saveToHistory = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((q: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== q);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
  }, []);

  const handleSearchClick = (q: string) => {
    setQuery(q);
    saveToHistory(q);
  };

  const handleProductClick = (product: SearchResult) => {
    saveToHistory(query);
    setShowSearch(false);
    setSelectedProduct(product.id);
    setActiveModal('product');
  };

  const handleCategoryClick = (category: SearchResult) => {
    saveToHistory(query);
    setShowSearch(false);
    setActiveCategory(category.name);
    setActiveTab('explore');
  };

  const handleRetailerClick = (retailer: SearchResult) => {
    saveToHistory(query);
    setShowSearch(false);
    setActiveCategory(retailer.category);
    setActiveTab('explore');
  };

  const totalResults = results.products.length + results.categories.length + results.retailers.length;

  return (
    <AnimatePresence>
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] bg-[var(--sr-surface-base)] flex flex-col"
        >
          {/* Search Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center rounded-full h-12 bg-[var(--sr-surface-elevated)] border border-white/5 focus-within:border-[var(--sr-customer)]/30 transition-all">
                <Search className="w-5 h-5 text-[var(--sr-customer)]/70 ml-4 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Jollof, Groceries, or Boxes..."
                  className="flex-1 bg-transparent text-white text-sm px-3 focus:outline-none placeholder:text-white/60"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="mr-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5"
                  >
                    <X className="w-3 h-3 text-white/50" />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setShowSearch(false); setActiveModal('voice'); }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 hover:bg-[var(--sr-customer)]/20 transition-colors active:scale-95"
                aria-label="Voice search"
              >
                <Mic className="w-5 h-5 text-[var(--sr-customer)]" />
              </button>
              <button
                onClick={() => setShowSearch(false)}
                className="text-white/60 text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
            {/* Loading */}
            {isSearching && (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-[var(--sr-customer)]/30 border-t-[var(--sr-customer)] rounded-full animate-spin" />
                <span className="text-white/65 text-sm">Searching...</span>
              </div>
            )}

            {/* Results */}
            {!isSearching && query && totalResults > 0 && (
              <div className="space-y-6">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                  {totalResults} result{totalResults !== 1 ? 's' : ''} for &quot;{query}&quot;
                </p>

                {/* Products */}
                {results.products.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold text-sm mb-3">Products</h3>
                    <div className="space-y-2">
                      {results.products.map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--sr-surface-elevated)]/40 border border-white/5 hover:border-white/10 transition-colors w-full text-left"
                        >
                          {product.image && (
                            <div
                              className="w-12 h-12 rounded-lg bg-center bg-cover shrink-0 border border-white/10"
                              style={{ backgroundImage: `url("${product.image}")` }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{product.name}</p>
                            <p className="text-white/65 text-xs">{product.category}</p>
                          </div>
                          {product.price && (
                            <span className="text-[var(--sr-customer)] font-bold text-sm shrink-0">{formatNaira(product.price)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {results.categories.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold text-sm mb-3">Categories</h3>
                    <div className="space-y-2">
                      {results.categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryClick(cat)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--sr-surface-elevated)]/40 border border-white/5 hover:border-white/10 transition-colors w-full text-left"
                        >
                          {cat.image && (
                            <div
                              className="w-10 h-10 rounded-lg bg-center bg-cover shrink-0 border border-white/10"
                              style={{ backgroundImage: `url("${cat.image}")` }}
                            />
                          )}
                          <div>
                            <p className="text-white font-bold text-sm">{cat.name}</p>
                            <p className="text-white/65 text-xs">{cat.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retailers */}
                {results.retailers.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold text-sm mb-3">Retailers</h3>
                    <div className="space-y-2">
                      {results.retailers.map(retailer => (
                        <button
                          key={retailer.id}
                          onClick={() => handleRetailerClick(retailer)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--sr-surface-elevated)]/40 border border-white/5 hover:border-white/10 transition-colors w-full text-left"
                        >
                          {retailer.image && (
                            <div
                              className="w-10 h-10 rounded-lg bg-center bg-cover shrink-0 border border-white/10"
                              style={{ backgroundImage: `url("${retailer.image}")` }}
                            />
                          )}
                          <div>
                            <p className="text-white font-bold text-sm">{retailer.name}</p>
                            <p className="text-white/65 text-xs">{retailer.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {!isSearching && query && totalResults === 0 && (
              <div className="text-center py-12">
                <p className="text-white/65 text-sm">No results for &quot;{query}&quot;</p>
                <p className="text-white/20 text-xs mt-2">Try searching for jollof, dates, or iftar</p>
              </div>
            )}

            {/* Default: Recent + Popular */}
            {!query && (
              <div className="space-y-6">
                {/* Recent Searches (search history) */}
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--sr-ai)]" />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <div
                          key={s}
                          className="group flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full bg-[var(--sr-surface-raised)] border border-white/8 hover:border-[var(--sr-ai)]/30 transition-colors"
                        >
                          <button
                            onClick={() => handleSearchClick(s)}
                            className="text-white/80 text-xs font-medium"
                          >
                            {s}
                          </button>
                          <button
                            onClick={() => removeFromHistory(s)}
                            className="ml-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-[var(--sr-error)]/20 transition-colors"
                            aria-label={`Remove ${s} from history`}
                          >
                            <X className="w-3 h-3 text-white/60 group-hover:text-[var(--sr-error)]" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={clearHistory}
                      className="mt-3 text-[var(--sr-customer)] text-[11px] font-bold hover:text-[var(--sr-customer)]/80 transition-colors"
                    >
                      Clear all history
                    </button>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--sr-vendor)]" />
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map(s => (
                      <button
                        key={s}
                        onClick={() => handleSearchClick(s)}
                        className="px-3 py-1.5 rounded-full bg-[var(--sr-surface-raised)] border border-white/5 text-white/60 text-xs font-medium hover:border-[var(--sr-customer)]/30 hover:text-white/80 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
