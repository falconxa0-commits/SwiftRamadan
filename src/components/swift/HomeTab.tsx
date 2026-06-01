'use client';

import { Star, Clock, ChevronRight, Zap, BadgeCheck, Search, ShoppingCart, Flame, Users, Gift, BookOpen, Mosque, MapPin, Replay } from 'lucide-react';
import { heroSlides, categories, ramadanBox, trendingMeals, flashSales, quickActions, formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const quickActionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; action: (store: ReturnType<typeof useAppStore.getState>) => void }> = {
  replay: { icon: Replay, action: (s) => s.setActiveTab('orders') },
  groups: { icon: Users, action: (s) => s.setActiveModal('groupBuy') },
  card_giftcard: { icon: Gift, action: (s) => s.setActiveModal('giftcard') },
  restaurant: { icon: BookOpen, action: (s) => s.setActiveModal('recipes') },
  mosque: { icon: Mosque, action: (s) => s.setActiveModal('mosque') },
  local_shipping: { icon: MapPin, action: (s) => s.setActiveTab('orders') },
};

export default function HomeTab() {
  const { setActiveModal, setSelectedProduct, setActiveTab, setActiveCategory, addToCart, setShowSearch } = useAppStore();
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Scroll carousel when slide changes
  useEffect(() => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.scrollWidth / heroSlides.length;
      carouselRef.current.scrollTo({ left: slideWidth * currentSlide, behavior: 'smooth' });
    }
  }, [currentSlide]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCategoryClick = (category: typeof categories[0]) => {
    setActiveCategory(category.name);
    setActiveTab('explore');
    toast({ title: category.name, description: `Browsing ${category.name} items` });
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
    toast({ title: 'Added to Cart! 🛒', description: `${item.name} added to your cart` });
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    const config = quickActionConfig[action.icon];
    if (config) {
      config.action(useAppStore.getState());
    } else {
      toast({ title: action.name, description: `${action.name} feature coming soon!` });
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          <div className="animate-pulse w-full h-12 bg-[#1A1D26] rounded-xl mb-4" />
          <div className="animate-pulse w-full aspect-[16/9] bg-[#1A1D26] rounded-2xl mb-4" />
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-16 h-16 bg-[#1A1D26] rounded-full animate-pulse" />
                <div className="w-12 h-2 bg-[#1A1D26] rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="animate-pulse w-full h-64 bg-[#1A1D26] rounded-2xl mt-6" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 bg-[#1A1D26] border border-white/5 rounded-xl px-4 py-3.5 hover:border-white/10 transition-colors"
        >
          <Search className="w-4 h-4 text-white/30" />
          <span className="text-white/30 text-sm">Search meals, groceries, restaurants...</span>
          <span className="ml-auto text-[10px] text-white/20 font-mono bg-white/5 px-2 py-0.5 rounded">⌘K</span>
        </button>
      </div>

      {/* Hero Carousel */}
      <div className="relative pt-2">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto pb-4 no-scrollbar scroll-smooth"
        >
          <div className="flex items-stretch px-4 gap-4">
            {heroSlides.map((slide, index) => (
              <motion.div
                key={slide.id}
                className="flex h-full flex-1 flex-col gap-3 rounded-2xl min-w-[300px] cursor-pointer"
                onClick={() => handleMealClick(slide.id === 1 ? 2 : slide.id === 2 ? 3 : 100)}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="relative w-full aspect-[16/9] bg-center bg-no-repeat bg-cover rounded-2xl overflow-hidden border border-white/5"
                  style={{ backgroundImage: `url("${slide.image}")` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent" />
                  {slide.badge && (
                    <div className="absolute top-3 left-3 gold-gradient px-3 py-1 rounded-full flex items-center gap-1 gold-glow">
                      <Star className="w-3 h-3 text-black fill-black" />
                      <span className="text-black text-[10px] font-bold uppercase tracking-wider">{slide.badge}</span>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <p className="text-white text-lg font-bold leading-tight">{slide.title}</p>
                  <p className="text-[#13ec13]/80 text-sm font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {slide.subtitle}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Slide indicators */}
        <div className="flex justify-center gap-1.5 mt-1">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-6 bg-[#13ec13]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category Circles */}
      <div className="px-4 py-4">
        <div className="flex w-full overflow-x-auto gap-6 pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="flex flex-col items-center gap-2 min-w-[70px]"
            >
              <div className={`w-16 h-16 bg-[#1A1D26] border-2 ${cat.active ? 'border-[#13ec13]' : 'border-white/10'} rounded-full flex items-center justify-center p-1 ${cat.active ? 'green-glow' : ''} hover:border-[#13ec13]/50 transition-colors`}>
                <div
                  className="w-full h-full bg-center bg-no-repeat bg-cover rounded-full"
                  style={{ backgroundImage: `url("${cat.image}")` }}
                />
              </div>
              <p className={`text-[11px] font-bold whitespace-nowrap ${cat.active ? 'text-white/90' : 'text-white/60'}`}>{cat.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickActions.map((action) => {
            const config = quickActionConfig[action.icon];
            const Icon = config?.icon || Zap;
            return (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action)}
                className="flex flex-col items-center gap-2 min-w-[72px] p-3 bg-[#1A1D26]/60 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#13ec13]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#13ec13]" />
                </div>
                <span className="text-[10px] font-bold text-white/60 whitespace-nowrap">{action.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Featured Ramadan Box */}
      <div className="px-4 my-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#1A1D26] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#13ec13]/5 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FFD700]/5 blur-[80px]" />
          <div className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-[#13ec13]/10 text-[#13ec13] border border-[#13ec13]/20 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3">
                  Editor&apos;s Choice
                </span>
                <h3 className="text-3xl font-black text-white leading-[1.1] tracking-tight">
                  The Ultimate<br />Ramadan Box
                </h3>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[10px] font-medium line-through">{formatNaira(ramadanBox.originalPrice)}</p>
                <p className="text-[#13ec13] text-2xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(19,236,19,0.3)]">
                  {formatNaira(ramadanBox.salePrice)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {ramadanBox.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square bg-center bg-no-repeat bg-cover rounded-2xl border border-white/10"
                  style={{ backgroundImage: `url("${img}")` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 mb-8 bg-black/30 p-3 rounded-xl border border-white/5">
              <BadgeCheck className="w-5 h-5 text-[#FFD700] shrink-0" />
              <p className="text-white/80 text-xs font-semibold">{ramadanBox.contents} Included</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleQuickAdd({
                  id: ramadanBox.id,
                  name: 'The Ultimate Ramadan Box',
                  price: ramadanBox.salePrice,
                  image: ramadanBox.images[0],
                })}
                className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-white/10"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={() => handleMealClick(100)}
                className="flex-1 bg-[#13ec13] py-4 rounded-2xl text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-[#13ec13]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                DETAILS
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flash Sales */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FFD700]" />
            <h3 className="text-white text-xl font-black tracking-tight">Flash Sales</h3>
          </div>
          <button
            onClick={() => setActiveTab('offers')}
            className="text-[#13ec13] text-xs font-extrabold uppercase tracking-wider cursor-pointer hover:text-[#13ec13]/80 transition-colors"
          >
            See All
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {flashSales.map((sale) => (
            <motion.div
              key={sale.id}
              whileTap={{ scale: 0.97 }}
              className="min-w-[200px] bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden cursor-pointer hover:border-white/10 transition-colors"
              onClick={() => handleMealClick(sale.id + 200)}
            >
              <div className="relative">
                <div
                  className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
                  style={{ backgroundImage: `url("${sale.image}")` }}
                />
                <div className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-md">
                  <span className="text-white text-[10px] font-black">-{sale.discount}%</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                  <span className="text-[#FFD700] text-[9px] font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {sale.endsIn}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-white font-bold text-sm truncate">{sale.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#13ec13] font-black text-sm">{formatNaira(sale.salePrice)}</span>
                  <span className="text-white/30 text-[10px] line-through">{formatNaira(sale.originalPrice)}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                    <div
                      className="bg-[#FFD700] h-1.5 rounded-full transition-all"
                      style={{ width: `${sale.claimed}%` }}
                    />
                  </div>
                  <p className="text-white/30 text-[9px]">{sale.claimed}% claimed</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAdd({
                      id: sale.id + 200,
                      name: sale.name,
                      price: sale.salePrice,
                      image: sale.image,
                    });
                  }}
                  className="w-full mt-2 text-[10px] font-bold text-[#13ec13] bg-[#13ec13]/10 py-1.5 rounded-lg border border-[#13ec13]/20 hover:bg-[#13ec13]/20 transition-colors"
                >
                  + Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Iftar */}
      <div className="px-4 py-4 flex justify-between items-end">
        <h3 className="text-white text-xl font-black tracking-tight">Trending Iftar</h3>
        <button
          onClick={() => setActiveTab('explore')}
          className="text-[#13ec13] text-xs font-extrabold uppercase tracking-wider cursor-pointer hover:text-[#13ec13]/80 transition-colors"
        >
          See All
        </button>
      </div>
      <div className="px-4 space-y-4">
        {trendingMeals.map((meal) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: meal.id * 0.1 }}
            className="flex gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
            onClick={() => handleMealClick(meal.id)}
          >
            <div
              className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0 border border-white/10"
              style={{ backgroundImage: `url("${meal.image}")` }}
            />
            <div className="flex flex-col justify-between flex-1">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-bold text-base">{meal.name}</h4>
                  <span className="text-[#13ec13] font-black">{formatNaira(meal.price)}</span>
                </div>
                <p className="text-white/40 text-[11px] leading-relaxed mt-1">{meal.description}</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-white/50 font-bold bg-white/5 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {meal.deliveryTime}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#FFD700] font-bold">
                  <Star className="w-3 h-3 fill-[#FFD700]" />
                  {meal.rating}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAdd(meal);
                  }}
                  className="ml-auto text-[10px] font-bold text-[#13ec13] bg-[#13ec13]/10 px-3 py-1 rounded-full border border-[#13ec13]/20 hover:bg-[#13ec13]/20 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
