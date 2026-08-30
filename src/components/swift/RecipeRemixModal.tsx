'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Sparkles, Heart, List, BookOpen, Wand2 } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface RecipeRemix {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  twist_explanation: string;
}

interface PopularRemix {
  name: string;
  description: string;
  originalName: string;
  likes: number;
}

export default function RecipeRemixModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'recipe-remix';

  const [originalRecipe, setOriginalRecipe] = useState('Jollof Rice');
  const [twist, setTwist] = useState('make it healthier');
  const [remix, setRemix] = useState<RecipeRemix | null>(null);
  const [popularRemixes, setPopularRemixes] = useState<PopularRemix[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [source, setSource] = useState<string>('');

  const handleClose = () => setActiveModal(null);

  const fetchPopular = useCallback(async () => {
    setLoadingPopular(true);
    try {
      const res = await fetch('/api/recipe-remix');
      const data = await res.json();
      if (data.success && data.remixes) {
        setPopularRemixes(data.remixes);
      }
    } catch {
      // silently fail — popular remixes are secondary content
    } finally {
      setLoadingPopular(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPopular();
    }
  }, [isOpen, fetchPopular]);

  const handleRemix = async () => {
    if (!originalRecipe.trim()) {
      toast({ title: 'Recipe name required', description: 'Enter a recipe to remix.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setRemix(null);

    try {
      const res = await fetch('/api/recipe-remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalRecipe: originalRecipe.trim(),
          twist: twist.trim() || 'make it healthier',
        }),
      });
      const data = await res.json();
      if (data.success && data.remix) {
        setRemix(data.remix);
        setSource(data.source || 'mock');
        toast({ title: 'Recipe Remixed! 🍳', description: `Created: ${data.remix.name}` });
      }
    } catch {
      toast({ title: 'Remix failed', description: 'Could not generate remix. Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePopularRemix = (remixItem: PopularRemix) => {
    setOriginalRecipe(remixItem.originalName);
    setTwist(remixItem.description);
    toast({ title: `Ready to remix ${remixItem.originalName}!`, description: remixItem.description });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center border border-[#F97316]/20">
                  <ChefHat className="w-5 h-5 text-[#F97316]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">🍳 Recipe Remix</h2>
                  <p className="text-white/65 text-xs">Give your favorite dish a twist</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[#1A1D26] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Input Section */}
          <div className="px-4 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#1A1D26] rounded-2xl border border-white/5 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Wand2 className="w-5 h-5 text-[#F97316]" />
                <h3 className="text-white font-bold text-base">Create Your Remix</h3>
              </div>

              {/* Original Recipe */}
              <div className="mb-4">
                <label className="text-white/50 text-xs font-medium mb-1.5 block">Original Recipe</label>
                <input
                  type="text"
                  value={originalRecipe}
                  onChange={(e) => setOriginalRecipe(e.target.value)}
                  placeholder="e.g. Jollof Rice"
                  className="w-full bg-[#05070A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F97316]/40 transition-colors"
                />
              </div>

              {/* Twist */}
              <div className="mb-4">
                <label className="text-white/50 text-xs font-medium mb-1.5 block">Your Twist</label>
                <input
                  type="text"
                  value={twist}
                  onChange={(e) => setTwist(e.target.value)}
                  placeholder="e.g. make it healthier"
                  className="w-full bg-[#05070A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F97316]/40 transition-colors"
                />
              </div>

              {/* Remix Button */}
              <motion.button
                onClick={handleRemix}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-[#F97316] text-white hover:bg-[#F97316]/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Remixing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Remix It!
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>

          {/* Remix Result */}
          <AnimatePresence>
            {remix && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 mt-6"
              >
                <div className="bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden">
                  {/* Result header */}
                  <div className="p-5 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-lg">{remix.name}</h3>
                      <span className="text-[10px] text-white/60 bg-white/5 px-2 py-1 rounded-full">
                        {source === 'ai' ? '✨ AI Generated' : '💡 Suggested'}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm">{remix.description}</p>
                  </div>

                  {/* Ingredients */}
                  <div className="p-5 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <List className="w-4 h-4 text-[#F97316]" />
                      <h4 className="text-white font-bold text-sm">Ingredients</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {remix.ingredients.map((ing, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs"
                        >
                          {ing}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="p-5 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-[var(--sr-customer)]" />
                      <h4 className="text-white font-bold text-sm">Steps</h4>
                    </div>
                    <div className="space-y-2.5">
                      {remix.steps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-white/60 text-sm leading-relaxed">{step}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Twist Explanation */}
                  <div className="p-5">
                    <div className="bg-[#F97316]/5 border border-[#F97316]/10 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#F97316]" />
                        <h4 className="text-[#F97316] font-bold text-xs">Why This Twist Works</h4>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{remix.twist_explanation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Remixes */}
          <div className="px-4 mt-6 mb-32">
            <h3 className="text-white font-bold text-base mb-3">🔥 Popular Remixes</h3>

            {loadingPopular ? (
              <div className="flex justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-white/10 border-t-[#F97316] rounded-full"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {popularRemixes.map((item, i) => (
                  <motion.button
                    key={item.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handlePopularRemix(item)}
                    className="w-full bg-[#1A1D26] rounded-xl border border-white/5 p-3.5 flex items-center gap-3 hover:border-white/10 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20 shrink-0">
                      <span className="text-lg">🍳</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm">{item.name}</h4>
                      <p className="text-white/65 text-[10px] truncate">
                        {item.description} • from {item.originalName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Heart className="w-3.5 h-3.5 text-red-400/60" />
                      <span className="text-white/65 text-[10px] font-bold">{item.likes}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
