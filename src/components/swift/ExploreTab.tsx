'use client';

import { categoryHubItems, popularRetailers, quickActions, allProducts, formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { X, SlidersHorizontal, Star, CheckCircle, Search, Camera, Sparkles, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ExploreTab() {
  const { activeCategory, setActiveCategory, setSelectedProduct, setActiveModal, addToCart, setActiveTab, setShowSearch } = useAppStore();
  const { toast } = useToast();
  const [selectedRetailer, setSelectedRetailer] = useState<typeof popularRetailers[0] | null>(null);

  // Filter products by active category
  const categoryProductMap: Record<string, string[]> = {
    'Iftar Meals': ['iftar meals', 'meals'],
    'Groceries': ['groceries'],
    'Pharmacy': [],
    'Office Meals': ['meals', 'iftar meals'],
  };

  const filteredProducts = activeCategory
    ? allProducts.filter(p => {
        const cats = categoryProductMap[activeCategory];
        if (!cats || cats.length === 0) return true; // Show all if no specific mapping
        return cats.some(cat => (p.category || '').toLowerCase().includes(cat));
      })
    : allProducts.filter(p => p.id <= 4 || p.id === 100 || p.id === 101 || p.id === 102); // Show curated set by default

  const handleCategoryClick = (item: typeof categoryHubItems[0]) => {
    if (activeCategory === item.name) {
      setActiveCategory(null);
    } else {
      setActiveCategory(item.name);
    }
  };

  const handleShopNow = () => {
    addToCart({
      id: 100,
      name: 'The Ultimate Ramadan Box',
      price: 17500,
      image: '/images/products/ramadan-box-1.png',
    });
    toast({ title: 'Added to Cart! 🛒', description: 'Ramadan Box added - check your cart' });
  };

  const handleRetailerClick = (retailer: typeof popularRetailers[0]) => {
    setSelectedRetailer(retailer);
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    switch (action.name) {
      case 'Reorder':
        toast({ title: 'Reorder 🔄', description: 'Your last order items loaded' });
        break;
      case 'Group Buy':
        setActiveModal('groupBuy');
        break;
      case 'Gift':
        setActiveModal('giftcard');
        break;
      case 'Recipes':
        setActiveModal('recipes');
        break;
      case 'Mosques':
        setActiveModal('mosque');
        break;
      case 'Track':
        useAppStore.getState().setActiveTab('orders');
        break;
    }
  };

  const handleProductClick = (id: number) => {
    setSelectedProduct(id);
    setActiveModal('product');
  };

  const handleAddToCart = (product: { id: number; name: string; price: number; salePrice?: number; image: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.image,
    });
    toast({ title: 'Added to Cart! 🛒', description: `${product.name} added to your cart` });
  };

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Welcome + Search */}
      <div className="px-5 pt-6 pb-3">
        <p className="text-[#10E07A] text-[11px] font-bold uppercase tracking-[0.18em] mb-1">Welcome back</p>
        <h1 className="text-2xl font-bold tracking-tight">What do you need today?</h1>

        {/* Search bar */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full mt-4 flex items-center gap-3 glass-card rounded-2xl px-4 py-3 text-left hover:border-white/15 transition-colors group active:scale-[0.99]"
        >
          <Search className="w-4 h-4 text-white/40 group-hover:text-[#10E07A] transition-colors" />
          <span className="text-white/40 text-sm flex-1">Search meals, stores, products…</span>
          <span className="soft-chip">⌘K</span>
        </button>

        {/* Visual Search CTA */}
        <button
          onClick={() => useAppStore.getState().setActiveModal('visual-search')}
          className="mt-3 w-full flex items-center gap-3 aurora-card rounded-2xl px-4 py-3 text-left hover:border-white/15 transition-colors active:scale-[0.99]"
        >
          <div className="w-9 h-9 rounded-xl bg-[#A78BFA]/15 flex items-center justify-center border border-[#A78BFA]/30 icon-tile shrink-0">
            <Camera className="w-4 h-4 text-[#A78BFA] relative z-10" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-bold flex items-center gap-1.5">
              Visual Search
              <Sparkles className="w-3.5 h-3.5 text-[#F5C451]" />
            </p>
            <p className="text-white/40 text-[11px]">Snap a photo, find similar meals instantly</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
        </button>
      </div>

      {/* Active category filter indicator */}
      {activeCategory && (
        <div className="px-5 pb-1">
          <div className="flex items-center gap-2 bg-[#10E07A]/10 border border-[#10E07A]/20 rounded-xl px-3 py-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#10E07A]" />
            <span className="text-[#10E07A] text-xs font-bold">Showing: {activeCategory}</span>
            <button
              onClick={() => setActiveCategory(null)}
              className="ml-auto p-0.5 hover:bg-[#10E07A]/10 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#10E07A]/60" />
            </button>
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="px-5 py-4">
        <h2 className="text-white text-lg font-extrabold mb-3 heading-accent">Browse Categories</h2>
        <div className="grid grid-cols-2 gap-4">
          {categoryHubItems.map((item, i) => {
            const isActive = activeCategory === item.name;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleCategoryClick(item)}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl aspect-square flex flex-col justify-end p-4 border transition-colors text-left ${
                  isActive ? 'border-[#10E07A]/40 ring-1 ring-[#10E07A]/20' : 'border-white/5 hover:border-[#10E07A]/20'
                }`}
                style={{
                  backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.2) 100%), url('${item.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                  isActive ? 'bg-[#10E07A] text-[#06070B]' : 'bg-[#F5C451] text-[#06070B]'
                }`}>
                  {isActive ? '✓ Active' : item.badge}
                </span>
                <p className="text-white text-lg font-bold tracking-tight">{item.name}</p>
                <p className="text-white/70 text-xs">{item.subtitle}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Seasonal Specials — aurora-card */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-xl font-bold heading-accent">Seasonal Specials</h2>
          <button
            onClick={() => setActiveCategory('Iftar Meals')}
            className="text-[#10E07A] text-sm font-semibold cursor-pointer hover:text-[#10E07A]/80 transition-colors"
          >
            View all
          </button>
        </div>
        <div className="px-5">
          <div className="relative overflow-hidden rounded-2xl aurora-card p-1.5">
            <div
              className="relative w-full aspect-video rounded-xl overflow-hidden bg-center bg-cover"
              style={{
                backgroundImage: 'url("/images/seasonal-specials.png")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#06070B] via-[#06070B]/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block bg-[#F5C451]/90 text-[#06070B] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-2">Ramadan Kareem</span>
                <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">Premium Ramadan Boxes</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                Curated Iftar &amp; Sahur boxes filled with dates, fruits, and nutritious meals to keep you energized.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider">Starting from</span>
                  <span className="text-[#F5C451] font-bold text-lg">{formatNaira(15000)}</span>
                </div>
                <button
                  onClick={handleShopNow}
                  className="bg-[#10E07A] hover:bg-[#10E07A]/90 text-[#06070B] font-bold py-2 px-6 rounded-xl transition-colors text-sm active:scale-[0.98] transform green-glow"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Retailers */}
      <div className="px-5 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-extrabold heading-accent">Popular Retailers</h3>
          <button
            onClick={() => setActiveCategory(null)}
            className="text-[#10E07A] text-sm font-bold cursor-pointer hover:text-[#10E07A]/80 transition-colors"
          >
            Explore All
          </button>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {popularRetailers.map((retailer) => (
            <motion.button
              key={retailer.id}
              onClick={() => handleRetailerClick(retailer)}
              whileTap={{ scale: 0.97 }}
              className={`min-w-[160px] glass-card rounded-2xl p-3 cursor-pointer hover:border-white/15 transition-colors text-left ${
                selectedRetailer?.id === retailer.id ? 'border-[#10E07A]/30' : ''
              }`}
            >
              <div
                className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-xl mb-3 border border-white/10"
                style={{ backgroundImage: `url("${retailer.image}")` }}
              />
              <h4 className="text-white text-sm font-bold tracking-tight">{retailer.name}</h4>
              <p className="text-white/40 text-[10px]">{retailer.category} &bull; {retailer.deliveryTime}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-[#F5C451] fill-[#F5C451]" />
                <span className="text-[#F5C451] text-[10px] font-bold">{retailer.rating}</span>
                {retailer.verified && (
                  <CheckCircle className="w-3 h-3 text-[#10E07A] ml-1" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Retailer Detail Card */}
      {selectedRetailer && (
        <div className="px-5 mt-2">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-white font-bold tracking-tight">{selectedRetailer.name}</h4>
                <p className="text-white/40 text-xs">{selectedRetailer.category} &bull; {selectedRetailer.deliveryTime} delivery</p>
              </div>
              <button
                onClick={() => setSelectedRetailer(null)}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveCategory(selectedRetailer.category);
                  setSelectedRetailer(null);
                }}
                className="flex-1 bg-[#10E07A]/10 border border-[#10E07A]/20 text-[#10E07A] py-2 rounded-xl font-bold text-xs hover:bg-[#10E07A]/20 transition-colors active:scale-95"
              >
                Browse Menu
              </button>
              <button
                onClick={() => {
                  setActiveCategory(selectedRetailer.category);
                  setSelectedRetailer(null);
                  toast({ title: `Viewing ${selectedRetailer.name}`, description: `Showing ${selectedRetailer.category} items` });
                }}
                className="flex-1 bg-white/5 border border-white/10 text-white py-2 rounded-xl font-bold text-xs hover:bg-white/10 transition-colors active:scale-95"
              >
                View Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-5 py-8">
        <h2 className="text-xl font-bold mb-4 heading-accent">Your Favorites</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#10E07A]/20 transition-colors group-active:scale-95 icon-tile">
                <span className="material-symbols-outlined text-[#F5C451] text-2xl relative z-10">{action.icon}</span>
              </div>
              <span className="text-[10px] font-medium text-center text-white/70">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Products / Filtered Products */}
      <div className="px-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-extrabold heading-accent">
            {activeCategory ? `${activeCategory} Picks` : 'Top Picks'}
          </h3>
          <button
            onClick={() => setActiveTab('home')}
            className="text-[#10E07A] text-xs font-bold cursor-pointer hover:text-[#10E07A]/80 transition-colors"
          >
            See All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.slice(0, 6).map(product => (
            <motion.div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              whileTap={{ scale: 0.97 }}
              className="glass-card rounded-2xl overflow-hidden hover:border-white/15 transition-colors cursor-pointer"
            >
              <div
                className="w-full aspect-square bg-center bg-cover relative"
                style={{ backgroundImage: `url("${product.image}")` }}
              >
                {product.originalPrice && product.salePrice && product.originalPrice > product.salePrice && (
                  <span className="absolute top-2 left-2 bg-[#FB7185] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    -{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-white text-xs font-bold truncate tracking-tight">{product.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-[#F5C451] fill-[#F5C451]" />
                  <span className="text-[#F5C451] text-[10px] font-bold">{product.rating}</span>
                  <span className="text-white/20 text-[10px]">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div>
                    <span className="text-[#10E07A] text-sm font-black">
                      {formatNaira(product.salePrice || product.price)}
                    </span>
                    {product.originalPrice && product.salePrice && product.originalPrice > product.salePrice && (
                      <span className="text-white/30 text-[10px] line-through ml-1">{formatNaira(product.originalPrice)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleAddToCart(product, e)}
                  className="w-full mt-2 text-[10px] font-bold text-[#10E07A] bg-[#10E07A]/10 py-1.5 rounded-lg border border-[#10E07A]/20 hover:bg-[#10E07A]/20 transition-colors active:scale-95"
                >
                  + Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {filteredProducts.length === 0 && activeCategory && (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-white/40 text-sm">No products found for &quot;{activeCategory}&quot;</p>
            <button
              onClick={() => setActiveCategory(null)}
              className="text-[#10E07A] text-sm font-bold mt-2 hover:text-[#10E07A]/80 transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
