'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, ChefHat, ShoppingCart, ChevronRight, Check, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { recipes, recipeCategories, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function RecipesModal() {
  const { activeModal, setActiveModal, addToCart } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'recipes';

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [shoppedIngredients, setShoppedIngredients] = useState<Set<number>>(new Set());

  const filteredRecipes = selectedCategory === 'all'
    ? recipes
    : recipes.filter(r => r.category === selectedCategory);

  const handleShopIngredients = (recipeId: number) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    let addedCount = 0;
    recipe.ingredients.forEach(ing => {
      if (ing.productId && !shoppedIngredients.has(ing.productId)) {
        addToCart({
          id: ing.productId,
          name: ing.name,
          price: ing.price,
          image: '/images/categories/cat-groceries.png',
        });
        addedCount++;
      }
    });

    setShoppedIngredients(prev => {
      const next = new Set(prev);
      recipe.ingredients.forEach(ing => {
        if (ing.productId) next.add(ing.productId);
      });
      return next;
    });

    if (addedCount > 0) {
      toast({ title: 'Added to Cart! 🛒', description: `${addedCount} ingredient(s) from ${recipe.name}` });
    } else {
      toast({ title: 'Already in Cart', description: 'All shoppable ingredients are already in your cart' });
    }
  };

  const allIngredientsShopped = (recipeId: number) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return false;
    const shoppable = recipe.ingredients.filter(i => i.productId);
    return shoppable.length > 0 && shoppable.every(i => shoppedIngredients.has(i.productId!));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-[#10E07A] bg-[#10E07A]/10 border-[#10E07A]/20';
      case 'Medium': return 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={() => setActiveModal(null)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[92vh] bg-[#05070A] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFD700]/10 rounded-xl flex items-center justify-center border border-[#FFD700]/20">
                  <ChefHat className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Ramadan Kitchen</h2>
                  <p className="text-white/40 text-xs">Recipes for the holy month</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar shrink-0 border-b border-white/5">
              {recipeCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setExpandedRecipe(null); }}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#10E07A] text-[#05070A]'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:border-[#10E07A]/20 hover:text-white/70'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* AI Chef Safa CTA */}
            <div className="px-4 pt-4 shrink-0">
              <button
                onClick={() => setActiveModal('ai-recipe')}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#10E07A]/10 to-[#FFD700]/10 border border-[#10E07A]/25 hover:border-[#10E07A]/50 transition-all text-left"
              >
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#10E07A]/20 to-[#FFD700]/20 rounded-xl flex items-center justify-center border border-[#10E07A]/30 shrink-0">
                  <ChefHat className="w-5 h-5 text-[#FFD700]" />
                  <Sparkles className="w-2.5 h-2.5 text-[#10E07A] absolute -top-0.5 -right-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm flex items-center gap-1.5">
                    Try AI Chef Safa
                    <span className="text-[10px] font-black bg-[#FFD700]/15 text-[#FFD700] px-1.5 py-0.5 rounded-full border border-[#FFD700]/20">NEW</span>
                  </p>
                  <p className="text-white/50 text-xs">Describe your craving & get a custom AI recipe ✨</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
              </button>
            </div>

            {/* Recipes List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
              <AnimatePresence mode="wait">
                {filteredRecipes.map((recipe, index) => {
                  const isExpanded = expandedRecipe === recipe.id;
                  const totalIngredientCost = recipe.ingredients.reduce((sum, i) => sum + i.price, 0);

                  return (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ delay: index * 0.08, duration: 0.3 }}
                      className="bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
                    >
                      {/* Recipe Card Header */}
                      <button
                        onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
                        className="w-full text-left"
                      >
                        <div className="relative">
                          <div
                            className="w-full h-44 bg-center bg-no-repeat bg-cover"
                            style={{ backgroundImage: `url("${recipe.image}")` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D26] via-transparent to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span className="bg-[#FFD700]/90 text-[#05070A] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                              {recipe.category}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-bold text-base">{recipe.name}</h3>
                          </div>
                        </div>

                        {/* Meta Row */}
                        <div className="flex items-center gap-4 px-4 py-3">
                          <div className="flex items-center gap-1.5 text-white/50 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{recipe.prepTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/50 text-xs">
                            <Users className="w-3.5 h-3.5" />
                            <span>{recipe.servings} servings</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(recipe.difficulty)}`}>
                            {recipe.difficulty}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-white/30 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-4">
                              {/* Ingredients */}
                              <div>
                                <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                  <ShoppingCart className="w-4 h-4 text-[#10E07A]" />
                                  Ingredients
                                  <span className="text-white/30 text-xs font-normal">({formatNaira(totalIngredientCost)} total)</span>
                                </h4>
                                <div className="space-y-2">
                                  {recipe.ingredients.map((ing, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between p-2.5 bg-[#0F1117] rounded-xl border border-white/5"
                                    >
                                      <div className="flex items-center gap-2">
                                        {ing.productId ? (
                                          <span className="w-2 h-2 rounded-full bg-[#10E07A] shrink-0" />
                                        ) : (
                                          <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
                                        )}
                                        <span className="text-white text-xs">{ing.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-white/40 text-xs">{formatNaira(ing.price)}</span>
                                        {ing.productId && shoppedIngredients.has(ing.productId) && (
                                          <Check className="w-3.5 h-3.5 text-[#10E07A]" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleShopIngredients(recipe.id)}
                                  disabled={allIngredientsShopped(recipe.id)}
                                  className={`w-full mt-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                    allIngredientsShopped(recipe.id)
                                      ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                                      : 'bg-[#10E07A] text-[#05070A] hover:bg-[#10E07A]/90 active:scale-[0.98]'
                                  }`}
                                >
                                  {allIngredientsShopped(recipe.id) ? (
                                    <>
                                      <Check className="w-4 h-4" />
                                      All Ingredients in Cart
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-4 h-4" />
                                      Shop Ingredients - {formatNaira(totalIngredientCost)}
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Steps */}
                              <div>
                                <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                  <ChefHat className="w-4 h-4 text-[#FFD700]" />
                                  Steps
                                </h4>
                                <div className="space-y-2">
                                  {recipe.steps.map((step, i) => (
                                    <div
                                      key={i}
                                      className="flex gap-3 p-2.5 bg-[#0F1117] rounded-xl border border-white/5"
                                    >
                                      <span className="w-6 h-6 shrink-0 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center text-[#FFD700] text-[10px] font-black">
                                        {i + 1}
                                      </span>
                                      <p className="text-white/70 text-xs leading-relaxed pt-0.5">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredRecipes.length === 0 && (
                <div className="flex flex-col items-center py-12 text-white/30">
                  <ChefHat className="w-12 h-12 mb-3" />
                  <p className="text-sm font-bold">No recipes found</p>
                  <p className="text-xs">Try a different category</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
