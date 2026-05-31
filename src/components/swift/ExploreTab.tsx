'use client';

import { categoryHubItems, popularRetailers, quickActions, formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function ExploreTab() {
  const { setActiveCategory, setSelectedProduct, setActiveModal, addToCart } = useAppStore();
  const { toast } = useToast();

  const handleCategoryClick = (item: typeof categoryHubItems[0]) => {
    setActiveCategory(item.name);
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
    setActiveCategory(retailer.category);
    toast({ title: retailer.name, description: `Browsing ${retailer.category} from ${retailer.name}` });
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

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Welcome */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-[#13ec13] text-sm font-semibold uppercase tracking-widest mb-1">Welcome back</p>
        <h1 className="text-2xl font-bold">What do you need today?</h1>
      </div>

      {/* Category Grid */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {categoryHubItems.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleCategoryClick(item)}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square flex flex-col justify-end p-4 border border-white/5 hover:border-[#13ec13]/20 transition-colors text-left"
              style={{
                backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 100%), url('${item.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className="absolute top-2 right-2 bg-[#13ec13] text-[#05070A] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                {item.badge}
              </span>
              <p className="text-white text-lg font-bold">{item.name}</p>
              <p className="text-white/70 text-xs">{item.subtitle}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Seasonal Specials */}
      <div className="pt-6">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-xl font-bold">Seasonal Specials</h2>
          <button
            onClick={() => setActiveCategory('Iftar Meals')}
            className="text-[#13ec13] text-sm font-semibold cursor-pointer hover:text-[#13ec13]/80 transition-colors"
          >
            View all
          </button>
        </div>
        <div className="px-4">
          <div className="relative overflow-hidden rounded-xl bg-[#064e3b]/30 border border-[#064e3b]/50 p-1">
            <div
              className="relative w-full aspect-video rounded-lg overflow-hidden bg-center bg-cover"
              style={{
                backgroundImage: 'url("/images/seasonal-specials.png")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block bg-[#f2b90d]/90 text-[#05070A] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-2">Ramadan Kareem</span>
                <h3 className="text-2xl font-bold text-white leading-tight">Premium Ramadan Boxes</h3>
              </div>
            </div>
            <div className="p-4 bg-[#05070A]/40 backdrop-blur-sm rounded-b-lg">
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                Curated Iftar &amp; Sahur boxes filled with dates, fruits, and nutritious meals to keep you energized.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase">Starting from</span>
                  <span className="text-[#f2b90d] font-bold">{formatNaira(15000)}</span>
                </div>
                <button
                  onClick={handleShopNow}
                  className="bg-[#13ec13] hover:bg-[#13ec13]/90 text-[#05070A] font-bold py-2 px-6 rounded-lg transition-colors text-sm active:scale-[0.98] transform"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Retailers */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-extrabold">Popular Retailers</h3>
          <button
            onClick={() => setActiveCategory('All')}
            className="text-[#13ec13] text-sm font-bold cursor-pointer hover:text-[#13ec13]/80 transition-colors"
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
              className="min-w-[160px] bg-[#1A1D26] rounded-2xl p-3 border border-white/5 cursor-pointer hover:border-white/10 transition-colors text-left"
            >
              <div
                className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-xl mb-3"
                style={{ backgroundImage: `url("${retailer.image}")` }}
              />
              <h4 className="text-white text-sm font-bold">{retailer.name}</h4>
              <p className="text-white/40 text-[10px]">{retailer.category} &bull; {retailer.deliveryTime}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-8">
        <h2 className="text-xl font-bold mb-4">Your Favorites</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#13ec13]/20 transition-colors group-active:scale-95">
                <span className="material-symbols-outlined text-[#f2b90d] text-2xl">{action.icon}</span>
              </div>
              <span className="text-[10px] font-medium text-center text-white/70">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Products Row */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-extrabold">Top Picks</h3>
          <button
            onClick={() => setActiveTab('home')}
            className="text-[#13ec13] text-xs font-bold cursor-pointer"
          >
            See All
          </button>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {[
            { id: 1, name: 'Jollof Rice & Chicken', price: 4500, image: '/images/meals/meal-jollof.png' },
            { id: 2, name: 'Suya Platter', price: 3200, image: '/images/meals/meal-suya.png' },
            { id: 3, name: 'Moi Moi & Pap', price: 2800, image: '/images/meals/meal-moimoi.png' },
            { id: 4, name: 'Date & Nut Smoothie', price: 1800, image: '/images/meals/meal-smoothie.png' },
          ].map(product => (
            <motion.button
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              whileTap={{ scale: 0.97 }}
              className="min-w-[140px] bg-[#1A1D26] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors text-left"
            >
              <div
                className="w-full aspect-square bg-center bg-cover"
                style={{ backgroundImage: `url("${product.image}")` }}
              />
              <div className="p-3">
                <p className="text-white text-xs font-bold truncate">{product.name}</p>
                <p className="text-[#13ec13] text-sm font-black">{formatNaira(product.price)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </main>
  );
}
