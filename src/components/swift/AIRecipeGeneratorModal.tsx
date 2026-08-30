'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChefHat,
  Sparkles,
  Clock,
  Users,
  Flame,
  ShoppingCart,
  Check,
  RefreshCw,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/format';

interface AIIngredient {
  name: string;
  price: number;
  quantity: string;
}

interface AIRecipe {
  name: string;
  description: string;
  prepTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: AIIngredient[];
  steps: string[];
  tips: string;
}

const QUICK_PROMPTS = [
  'Spicy iftar meal',
  'Quick sahur bowl',
  'Family of 6 iftar',
  'Light healthy iftar',
  'Traditional Nigerian',
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return 'text-[#10E07A] bg-[#10E07A]/10 border-[#10E07A]/20';
    case 'Medium':
      return 'text-[#F5C451] bg-[#F5C451]/10 border-[#F5C451]/20';
    case 'Hard':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    default:
      return 'text-white/50 bg-white/5 border-white/10';
  }
};

export default function AIRecipeGeneratorModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const isOpen = activeModal === 'ai-recipe';

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<AIRecipe | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [addedAll, setAddedAll] = useState(false);

  const generate = async (override?: string) => {
    const p = (override ?? prompt).trim();
    if (!p) {
      toast({
        title: 'Describe your craving 🍽️',
        description: "Tell Chef Safa what you're hungry for!",
      });
      return;
    }
    setLoading(true);
    setRecipe(null);
    setChecked(new Set());
    setAddedAll(false);
    try {
      const res = await fetch('/api/ai-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (data?.recipe) {
        setRecipe(data.recipe as AIRecipe);
      } else {
        toast({ title: 'Could not generate', description: 'Please try again.' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const addCheckedToCart = () => {
    if (!recipe) return;
    const items = recipe.ingredients
      .map((ing, i) => ({ ing, i }))
      .filter(({ i }) => checked.has(i));
    if (items.length === 0) {
      toast({
        title: 'Select ingredients first',
        description: 'Tick the items you want to add.',
      });
      return;
    }
    items.forEach(({ ing }) => {
      addToCart({
        id: Math.floor(Math.random() * 100000),
        name: ing.name,
        price: ing.price,
        image: '/images/categories/cat-groceries.png',
      });
    });
    toast({
      title: 'Added to Cart! 🛒',
      description: `${items.length} ingredient(s) from ${recipe.name}`,
    });
  };

  const addAllToCart = () => {
    if (!recipe) return;
    recipe.ingredients.forEach((ing) => {
      addToCart({
        id: Math.floor(Math.random() * 100000),
        name: ing.name,
        price: ing.price,
        image: '/images/categories/cat-groceries.png',
      });
    });
    setChecked(new Set(recipe.ingredients.map((_, i) => i)));
    setAddedAll(true);
    toast({
      title: 'All ingredients added! 🛒',
      description: `${recipe.ingredients.length} items from ${recipe.name}`,
    });
  };

  const totalCost = recipe
    ? recipe.ingredients.reduce((sum, i) => sum + i.price, 0)
    : 0;
  const checkedCost = recipe
    ? recipe.ingredients
        .filter((_, i) => checked.has(i))
        .reduce((sum, i) => sum + i.price, 0)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[95]"
            onClick={() => setActiveModal(null)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 h-[94vh] bg-[#05070A] rounded-t-3xl z-[105] flex flex-col overflow-hidden border-t border-[#10E07A]/20"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 bg-gradient-to-r from-[#10E07A]/5 to-[#F5C451]/5">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 bg-gradient-to-br from-[#10E07A]/20 to-[#F5C451]/20 rounded-2xl flex items-center justify-center border border-[#10E07A]/30">
                  <ChefHat className="w-6 h-6 text-[#F5C451]" />
                  <Sparkles className="w-3 h-3 text-[#10E07A] absolute -top-1 -right-1" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    AI Chef Safa
                  </h2>
                  <p className="text-white/65 text-xs">
                    Custom Ramadan recipes, instantly ✨
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-5">
              {/* Hero / Prompt */}
              <div className="bg-gradient-to-br from-[#1A1D26] to-[#0F1117] rounded-3xl border border-white/5 p-5 space-y-4">
                <div className="flex items-start gap-2">
                  <Flame className="w-4 h-4 text-[#F5C451] mt-0.5 shrink-0" />
                  <p className="text-white/70 text-sm leading-relaxed">
                    Describe what you&rsquo;re craving and Chef Safa will craft a
                    halal Ramadan recipe with a shoppable ingredient list.
                  </p>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. I'm craving something spicy with plantain for iftar..."
                  rows={3}
                  className="w-full bg-[#05070A] text-white text-sm placeholder:text-white/60 rounded-2xl border border-white/10 px-4 py-3 focus:outline-none focus:border-[#10E07A]/40 resize-none"
                />
                {/* Quick prompts */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setPrompt(q)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/60 border border-white/10 hover:border-[#10E07A]/30 hover:text-white transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => generate()}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-[#05070A] bg-[#10E07A] hover:bg-[#10E07A]/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cooking up your recipe...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Recipe ✨
                    </>
                  )}
                </button>
              </div>

              {/* Loading State */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="relative h-40 rounded-3xl bg-[#1A1D26] border border-white/5 overflow-hidden flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <ChefHat className="w-14 h-14 text-[#F5C451]/60" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10E07A]/5 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    </div>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded-2xl bg-[#1A1D26] border border-white/5 overflow-hidden"
                      >
                        <motion.div
                          className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                          animate={{ x: ['-100%', '300%'] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 0.2,
                          }}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              {recipe && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Recipe Header */}
                  <div className="bg-[#1A1D26] rounded-3xl border border-[#10E07A]/15 overflow-hidden">
                    <div className="bg-gradient-to-br from-[#10E07A]/10 to-[#F5C451]/10 p-5">
                      <span className="inline-block bg-[#F5C451]/15 text-[#F5C451] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-[#F5C451]/20">
                        AI Generated Recipe
                      </span>
                      <h3 className="text-white font-bold text-xl mt-3 leading-tight">
                        {recipe.name}
                      </h3>
                      <p className="text-white/60 text-sm mt-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 px-5 py-3 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#10E07A]" />
                        <span>{recipe.prepTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Users className="w-3.5 h-3.5 text-[#10E07A]" />
                        <span>{recipe.servings} servings</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(
                          recipe.difficulty
                        )}`}
                      >
                        {recipe.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="bg-[#1A1D26] rounded-3xl border border-white/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-[#10E07A]" />
                        Ingredients
                      </h4>
                      <span className="text-white/65 text-xs">
                        {formatNaira(totalCost)} total
                      </span>
                    </div>
                    <div className="space-y-2">
                      {recipe.ingredients.map((ing, i) => {
                        const isChecked = checked.has(i);
                        return (
                          <button
                            key={`${recipe.name}-ing-${i}`}
                            onClick={() => toggleIngredient(i)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                              isChecked
                                ? 'bg-[#10E07A]/8 border-[#10E07A]/25'
                                : 'bg-[#0F1117] border-white/5 hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-[#10E07A] border-[#10E07A]'
                                    : 'border-white/20'
                                }`}
                              >
                                {isChecked && (
                                  <Check className="w-3.5 h-3.5 text-[#05070A]" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="text-white text-sm truncate">
                                  {ing.name}
                                </p>
                                <p className="text-white/65 text-xs">
                                  {ing.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="text-[#F5C451] text-sm font-semibold shrink-0 ml-2">
                              {formatNaira(ing.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={addCheckedToCart}
                        disabled={checked.size === 0}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-white/5 text-white border border-white/10 hover:border-[#10E07A]/30 hover:text-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add {checked.size > 0 ? `(${checked.size})` : ''} -{' '}
                        {formatNaira(checkedCost)}
                      </button>
                      <button
                        onClick={addAllToCart}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-[#10E07A] text-[#05070A] hover:bg-[#10E07A]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        {addedAll ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                        {addedAll ? 'Added!' : 'Add All'}
                      </button>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="bg-[#1A1D26] rounded-3xl border border-white/5 p-4 space-y-3">
                    <h4 className="text-white font-bold text-sm flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-[#F5C451]" />
                      Cooking Steps
                    </h4>
                    <div className="space-y-2">
                      {recipe.steps.map((step, i) => (
                        <div
                          key={`${recipe.name}-step-${i}`}
                          className="flex gap-3 p-3 bg-[#0F1117] rounded-2xl border border-white/5"
                        >
                          <span className="w-7 h-7 shrink-0 rounded-full bg-[#F5C451]/10 border border-[#F5C451]/20 flex items-center justify-center text-[#F5C451] text-xs font-black">
                            {i + 1}
                          </span>
                          <p className="text-white/70 text-sm leading-relaxed pt-1">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chef Tips */}
                  <div className="bg-gradient-to-br from-[#F5C451]/8 to-[#10E07A]/5 rounded-3xl border border-[#F5C451]/20 p-4">
                    <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-[#F5C451]" />
                      Chef Safa&rsquo;s Tip
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {recipe.tips}
                    </p>
                  </div>

                  {/* Regenerate */}
                  <button
                    onClick={() => generate()}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl font-bold text-sm bg-white/5 text-white border border-white/10 hover:border-[#10E07A]/30 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Recipe
                  </button>
                </motion.div>
              )}
            </div>

            {/* Sticky Footer Buttons */}
            {recipe && !loading && (
              <div className="shrink-0 p-4 border-t border-white/5 bg-[#05070A]/95 backdrop-blur-lg flex gap-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-white/5 text-white/70 border border-white/10 hover:text-white transition-all"
                >
                  Done
                </button>
                <button
                  onClick={addAllToCart}
                  className="flex-[2] py-3.5 rounded-2xl font-bold text-sm bg-[#10E07A] text-[#05070A] hover:bg-[#10E07A]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add All to Cart 🛒 - {formatNaira(totalCost)}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
