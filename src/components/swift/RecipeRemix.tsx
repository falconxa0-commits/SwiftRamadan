'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ChefHat,
  Star,
  ArrowRight,
  Flame,
  Clock,
  Plus,
  Shuffle,
  Award,
} from 'lucide-react';
import { useNavigation, useUserName } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────────────────────────────────────────────────────
   RecipeRemix — Take any recipe and remix it with modifications.
   "What if we made Jollof with coconut rice?" Shows original +
   remix with modifications. Users can try and rate.
   Top remixer gets "Chef Sultan" badge.
   ────────────────────────────────────────────────────────────────── */

interface Ingredient {
  name: string;
  original?: string;
}

interface RecipeRemix {
  id: string;
  authorName: string;
  authorInitial: string;
  originalRecipe: string;
  originalIngredients: string[];
  originalSteps: string[];
  remixName: string;
  remixIngredients: Ingredient[];
  remixSteps: string[];
  remixDescription: string;
  rating: number;
  ratingCount: number;
  tries: number;
  hasChefBadge: boolean;
  createdAt: string;
  userRating?: number;
}

const MOCK_REMIXES: RecipeRemix[] = [
  {
    id: 'rr1',
    authorName: 'Amina K.',
    authorInitial: 'A',
    originalRecipe: 'Traditional Jollof Rice',
    originalIngredients: ['Rice', 'Tomato paste', 'Scotch bonnet peppers', 'Onions', 'Vegetable oil', 'Seasoning cubes'],
    originalSteps: ['Blend tomatoes and peppers', 'Fry onion in oil', 'Add tomato mix and cook', 'Add rice and water', 'Simmer until done'],
    remixName: 'Coconut Jollof Rice',
    remixIngredients: [
      { name: 'Rice', original: 'Rice' },
      { name: 'Coconut milk', original: 'Water' },
      { name: 'Tomato paste', original: 'Tomato paste' },
      { name: 'Scotch bonnet peppers', original: 'Scotch bonnet peppers' },
      { name: 'Coconut oil', original: 'Vegetable oil' },
      { name: 'Shredded coconut', original: undefined },
    ],
    remixSteps: ['Blend tomatoes and peppers with coconut milk', 'Fry onion in coconut oil', 'Add tomato-coconut mix and cook', 'Add rice and remaining coconut milk', 'Top with shredded coconut and simmer'],
    remixDescription: 'What if we made Jollof with coconut rice? A creamy twist on the classic!',
    rating: 4.7,
    ratingCount: 23,
    tries: 156,
    hasChefBadge: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rr2',
    authorName: 'Yusuf A.',
    authorInitial: 'Y',
    originalRecipe: 'Suya Skewers',
    originalIngredients: ['Beef', 'Suya spice', 'Onions', 'Vegetable oil', 'Groundnut'],
    originalSteps: ['Cut beef into strips', 'Coat with suya spice', 'Thread onto skewers', 'Grill over charcoal', 'Serve with onions'],
    remixName: 'Suya-Stuffed Plantain',
    remixIngredients: [
      { name: 'Ripe plantain', original: undefined },
      { name: 'Beef (minced)', original: 'Beef' },
      { name: 'Suya spice', original: 'Suya spice' },
      { name: 'Mozzarella cheese', original: undefined },
      { name: 'Bell peppers', original: 'Onions' },
    ],
    remixSteps: ['Slit plantain and stuff with seasoned minced beef', 'Add suya spice generously', 'Top with mozzarella', 'Bake until plantain is caramelized', 'Garnish with peppers'],
    remixDescription: 'Suya meets plantain — the ultimate Nigerian fusion bite!',
    rating: 4.5,
    ratingCount: 18,
    tries: 89,
    hasChefBadge: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'rr3',
    authorName: 'Halima B.',
    authorInitial: 'H',
    originalRecipe: 'Pepper Soup',
    originalIngredients: ['Goat meat', 'Pepper soup spice', 'Crayfish', 'Ehu seeds', 'Onions'],
    originalSteps: ['Boil goat meat till tender', 'Add pepper soup spice', 'Add crayfish and ehu', 'Season and simmer', 'Serve hot'],
    remixName: 'Coconut Pepper Soup',
    remixIngredients: [
      { name: 'Goat meat', original: 'Goat meat' },
      { name: 'Coconut milk', original: undefined },
      { name: 'Pepper soup spice', original: 'Pepper soup spice' },
      { name: 'Lemongrass', original: undefined },
      { name: 'Ginger', original: 'Ehu seeds' },
    ],
    remixSteps: ['Boil goat meat till tender', 'Add pepper soup spice and lemongrass', 'Pour in coconut milk', 'Add ginger and simmer', 'Serve with a dash of lime'],
    remixDescription: 'A Thai-Nigerian fusion that brings coconut milk to our beloved pepper soup!',
    rating: 4.3,
    ratingCount: 12,
    tries: 67,
    hasChefBadge: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rr4',
    authorName: 'Ibrahim S.',
    authorInitial: 'I',
    originalRecipe: 'Moi Moi',
    originalIngredients: ['Beans', 'Pepper', 'Onions', 'Eggs', 'Crayfish', 'Vegetable oil'],
    originalSteps: ['Soak and peel beans', 'Blend with pepper and onions', 'Add eggs and crayfish', 'Wrap in leaves or foil', 'Steam for 45 minutes'],
    remixName: 'Smokey Moi Moi Wraps',
    remixIngredients: [
      { name: 'Beans', original: 'Beans' },
      { name: 'Smoked paprika', original: undefined },
      { name: 'Smoked fish flakes', original: 'Crayfish' },
      { name: 'Pepper', original: 'Pepper' },
      { name: 'Avocado', original: 'Eggs' },
    ],
    remixSteps: ['Soak and peel beans', 'Blend with pepper and smoked paprika', 'Add smoked fish flakes and diced avocado', 'Wrap in banana leaves', 'Smoke-steam for 50 minutes'],
    remixDescription: 'Adding smoky depth to classic moi moi — a Sahur favorite!',
    rating: 4.1,
    ratingCount: 9,
    tries: 34,
    hasChefBadge: false,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

function RecipeRemixInner() {
  const userName = useUserName();
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'recipe-remix';
  const { toast } = useToast();

  const [remixes, setRemixes] = useState<RecipeRemix[]>(MOCK_REMIXES);
  const [selectedRemix, setSelectedRemix] = useState<RecipeRemix | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'tried'>('popular');

  // Create form state
  const [originalName, setOriginalName] = useState('');
  const [remixName, setRemixName] = useState('');
  const [remixDesc, setRemixDesc] = useState('');
  const [remixIngredients, setRemixIngredients] = useState('');
  const [remixSteps, setRemixSteps] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/recipe-remix');
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.remixes && data.remixes.length > 0) {
            setRemixes(data.remixes);
          }
        }
      } catch {
        // keep mock data
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Escape key handler ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreate) setShowCreate(false);
        else if (selectedRemix) setSelectedRemix(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showCreate, selectedRemix]);

  /* ── Sort remixes ── */
  const sortedRemixes = [...remixes].sort((a, b) => {
    if (sortBy === 'popular') return b.rating - a.rating;
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.tries - a.tries;
  });

  /* ── Top remixer (most tries) ── */
  const topRemixer = [...remixes].sort((a, b) => b.tries - a.tries)[0];

  /* ── Rate a remix ── */
  const handleRate = (remixId: string, rating: number) => {
    setRemixes((prev) =>
      prev.map((r) =>
        r.id === remixId
          ? {
              ...r,
              rating: (r.rating * r.ratingCount + rating) / (r.ratingCount + 1),
              ratingCount: r.ratingCount + 1,
              userRating: rating,
            }
          : r
      )
    );
    toast({ title: `Rated ${rating} ⭐`, description: 'Thanks for your feedback!' });
  };

  /* ── Try a remix ── */
  const handleTry = (remixId: string) => {
    setRemixes((prev) =>
      prev.map((r) => (r.id === remixId ? { ...r, tries: r.tries + 1 } : r))
    );
    toast({ title: 'Recipe saved! 🍳', description: 'Added to your meal plan' });
  };

  /* ── Create remix ── */
  const handleCreateRemix = async () => {
    if (!originalName || !remixName || !remixDesc) {
      toast({ title: 'Fill required fields', description: 'Original recipe, remix name, and description are required' });
      return;
    }

    const newRemix: RecipeRemix = {
      id: `rr-${Date.now()}`,
      authorName: userName || 'You',
      authorInitial: (userName || 'Y')[0].toUpperCase(),
      originalRecipe: originalName,
      originalIngredients: [],
      originalSteps: [],
      remixName,
      remixIngredients: remixIngredients.split('\n').map((line) => ({ name: line.trim() })),
      remixSteps: remixSteps.split('\n').map((line) => line.trim()).filter(Boolean),
      remixDescription: remixDesc,
      rating: 0,
      ratingCount: 0,
      tries: 0,
      hasChefBadge: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/recipe-remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalRecipe: originalName,
          remixName,
          remixDescription: remixDesc,
          remixIngredients: remixIngredients.split('\n').map((l) => l.trim()),
          remixSteps: remixSteps.split('\n').map((l) => l.trim()).filter(Boolean),
          authorName: userName || 'Anonymous',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.remix) newRemix.id = data.remix.id;
      }
    } catch {
      // still add locally
    }

    setRemixes((prev) => [newRemix, ...prev]);
    setShowCreate(false);
    setOriginalName('');
    setRemixName('');
    setRemixDesc('');
    setRemixIngredients('');
    setRemixSteps('');
    toast({ title: 'Remix created! 🎨', description: 'Your recipe remix is live' });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="w-full space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-[#F5C451]" />
          <h2 className="text-white font-semibold text-lg">Recipe Remix</h2>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#10E07A] text-black text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#10E07A]/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Remix
        </button>
      </div>

      {/* ── Chef Sultan Badge Banner ── */}
      {topRemixer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#F5C451]/10 to-[#A78BFA]/10 border border-[#F5C451]/20 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#F5C451]/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-[#F5C451]" />
          </div>
          <div className="min-w-0">
            <p className="text-[#F5C451] text-xs font-semibold">👑 Chef Sultan</p>
            <p className="text-white/60 text-xs truncate">
              {topRemixer.authorName} — {topRemixer.tries} tries on &quot;{topRemixer.remixName}&quot;
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Sort Tabs ── */}
      <div className="flex gap-2">
        {(['popular', 'newest', 'tried'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              sortBy === sort
                ? 'bg-[#10E07A] text-black'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {sort === 'popular' ? '🔥 Popular' : sort === 'newest' ? '✨ Newest' : '🍳 Most Tried'}
          </button>
        ))}
      </div>

      {/* ── Remix Cards ── */}
      <div className="space-y-3">
        {sortedRemixes.map((remix, idx) => (
          <motion.div
            key={remix.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedRemix(remix)}
            className="bg-[#0F1118] border border-white/8 rounded-xl p-4 cursor-pointer hover:border-[#10E07A]/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#10E07A] to-[#F5C451] flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                    {remix.authorInitial}
                  </div>
                  <span className="text-white/50 text-xs">{remix.authorName}</span>
                  {remix.hasChefBadge && (
                    <span className="text-[#F5C451] text-[10px] font-semibold bg-[#F5C451]/10 px-1.5 py-0.5 rounded-full">
                      👑 Chef Sultan
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                  <span className="line-through">{remix.originalRecipe}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-[#10E07A] font-medium no-underline">{remix.remixName}</span>
                </p>
                <p className="text-white/70 text-sm">{remix.remixDescription}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <span className="text-[#F5C451] text-xs flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#F5C451]" />
                {remix.rating.toFixed(1)} ({remix.ratingCount})
              </span>
              <span className="text-white/40 text-xs flex items-center gap-1">
                <ChefHat className="w-3.5 h-3.5" /> {remix.tries} tried
              </span>
              <span className="text-white/30 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(remix.createdAt)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Remix Detail Modal ── */}
      <AnimatePresence>
        {selectedRemix && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0D14]/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedRemix.remixName} recipe details`}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#0F1118] border border-white/8 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#0F1118] border-b border-white/8 p-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-white font-semibold">{selectedRemix.remixName}</h3>
                  <p className="text-white/40 text-xs">Remix of {selectedRemix.originalRecipe}</p>
                </div>
                <button
                  onClick={() => setSelectedRemix(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10E07A] to-[#F5C451] flex items-center justify-center text-sm font-bold text-black">
                    {selectedRemix.authorInitial}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm flex items-center gap-2">
                      {selectedRemix.authorName}
                      {selectedRemix.hasChefBadge && <Award className="w-4 h-4 text-[#F5C451]" />}
                    </p>
                    <p className="text-white/40 text-xs">{timeAgo(selectedRemix.createdAt)}</p>
                  </div>
                </div>

                {/* Toggle: Original vs Remix */}
                <div className="flex bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => setShowOriginal(false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      !showOriginal ? 'bg-[#10E07A] text-black' : 'text-white/50'
                    }`}
                  >
                    🎨 Remix
                  </button>
                  <button
                    onClick={() => setShowOriginal(true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      showOriginal ? 'bg-white/20 text-white' : 'text-white/50'
                    }`}
                  >
                    📖 Original
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {!showOriginal ? (
                    <motion.div
                      key="remix"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-white/70 text-sm">{selectedRemix.remixDescription}</p>

                      {/* Remix Ingredients */}
                      <div>
                        <h4 className="text-[#10E07A] text-xs font-semibold mb-2 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Remix Ingredients
                        </h4>
                        <div className="space-y-1">
                          {selectedRemix.remixIngredients.map((ing, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ing.original ? 'bg-[#F5C451]' : 'bg-[#10E07A]'
                                }`}
                              />
                              <span className={ing.original ? 'text-white/60' : 'text-white font-medium'}>
                                {ing.name}
                              </span>
                              {ing.original && ing.original !== ing.name && (
                                <span className="text-white/30 text-xs line-through">{ing.original}</span>
                              )}
                              {!ing.original && (
                                <span className="text-[#10E07A] text-[10px] font-semibold bg-[#10E07A]/10 px-1.5 py-0.5 rounded-full">
                                  NEW
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remix Steps */}
                      <div>
                        <h4 className="text-[#10E07A] text-xs font-semibold mb-2 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" /> Steps
                        </h4>
                        <div className="space-y-2">
                          {selectedRemix.remixSteps.map((step, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                              <span className="w-6 h-6 rounded-full bg-[#10E07A]/10 text-[#10E07A] text-xs font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-white/70">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="original"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Original Ingredients */}
                      <div>
                        <h4 className="text-white/60 text-xs font-semibold mb-2">Original Ingredients</h4>
                        <div className="space-y-1">
                          {selectedRemix.originalIngredients.map((ing, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                              <span className="text-white/50">{ing}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Original Steps */}
                      <div>
                        <h4 className="text-white/60 text-xs font-semibold mb-2">Original Steps</h4>
                        <div className="space-y-2">
                          {selectedRemix.originalSteps.map((step, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                              <span className="w-6 h-6 rounded-full bg-white/5 text-white/40 text-xs font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-white/50">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rating & Actions */}
                <div className="border-t border-white/8 pt-4 space-y-3">
                  {/* Star Rating */}
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs">Rate this remix:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(selectedRemix.id, star)}
                          className="focus:outline-none"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              (selectedRemix.userRating || 0) >= star
                                ? 'fill-[#F5C451] text-[#F5C451]'
                                : 'text-white/20 hover:text-[#F5C451]/60'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Try Button */}
                  <button
                    onClick={() => handleTry(selectedRemix.id)}
                    className="w-full bg-[#10E07A] text-black font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#10E07A]/90 transition-colors"
                  >
                    <ChefHat className="w-4 h-4" /> Try This Remix
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Remix Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0D14]/95 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Create recipe remix"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F1118] border border-white/8 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-[#F5C451]" /> Create Remix
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-white/60 text-xs block mb-1">Original Recipe *</label>
                  <input
                    type="text"
                    value={originalName}
                    onChange={(e) => setOriginalName(e.target.value)}
                    placeholder="e.g., Traditional Jollof Rice"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#10E07A]/50"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs block mb-1">Remix Name *</label>
                  <input
                    type="text"
                    value={remixName}
                    onChange={(e) => setRemixName(e.target.value)}
                    placeholder="e.g., Coconut Jollof Rice"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#10E07A]/50"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs block mb-1">Description *</label>
                  <textarea
                    value={remixDesc}
                    onChange={(e) => setRemixDesc(e.target.value)}
                    placeholder="What's your twist on this recipe?"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#10E07A]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs block mb-1">Remix Ingredients (one per line)</label>
                  <textarea
                    value={remixIngredients}
                    onChange={(e) => setRemixIngredients(e.target.value)}
                    placeholder={"Coconut milk\nSmoked paprika\nShredded coconut"}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#10E07A]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs block mb-1">Steps (one per line)</label>
                  <textarea
                    value={remixSteps}
                    onChange={(e) => setRemixSteps(e.target.value)}
                    placeholder={"Blend tomatoes with coconut milk\nFry onion in coconut oil\nAdd rice and coconut milk"}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#10E07A]/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateRemix}
                  className="w-full bg-[#10E07A] text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#10E07A]/90 transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> Post Remix
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(RecipeRemixInner);
