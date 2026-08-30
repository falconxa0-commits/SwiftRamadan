'use client';

import { Star, Clock, ChevronRight, Zap, BadgeCheck, ShoppingCart, Flame, Users, Gift, BookOpen, Landmark, MapPin, RotateCcw, X, SlidersHorizontal, ChefHat, TrendingUp, Sparkles, Navigation, Radio, CalendarDays, Clapperboard, Play } from 'lucide-react';
import { heroSlides, categories, ramadanBox, trendingMeals, flashSales, quickActions, allProducts, formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import {
  useNavigation, useCart, useSetActiveCategory, useSetSelectedProduct,
  useActiveCategory, useLastSpinDate,
} from '@/lib/store-selectors';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import RamadanCountdown from './RamadanCountdown';
import { HomeTabSkeleton } from './HomeTabSkeleton';

const quickActionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; action: (store: ReturnType<typeof useAppStore.getState>) => void }> = {
  replay: { icon: RotateCcw, action: (s) => s.setActiveTab('orders') },
  groups: { icon: Users, action: (s) => s.setActiveModal('groupBuy') },
  card_giftcard: { icon: Gift, action: (s) => s.setActiveModal('giftcard') },
  restaurant: { icon: BookOpen, action: (s) => s.setActiveModal('recipes') },
  mosque: { icon: Landmark, action: (s) => s.setActiveModal('mosque') },
  local_shipping: { icon: MapPin, action: (s) => s.setActiveTab('orders') },
};

export default function HomeTab() {
  const { setActiveModal, setActiveTab } = useNavigation();
  const { addToCart } = useCart();
  const setSelectedProduct = useSetSelectedProduct();
  const setActiveCategory = useSetActiveCategory();
  const activeCategory = useActiveCategory();
  const lastSpinDate = useLastSpinDate();
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Helper for Next-Gen Features: maps some to existing modals, shows Coming Soon for others
  const handleNextGenFeature = (feature: { emoji: string; label: string; modal: string }) => {
    const modalMap: Record<string, string> = {
      'iftar-radar': 'live-tracking',
      'mosque-partnership': 'mosque',
      'recipe-remix': 'recipes',
    };
    const targetModal = modalMap[feature.modal] || feature.modal;

    // Show coming soon for features without proper modals
    const comingSoonKeys = ['taste-dna', 'fridge-scanner', 'mood-ordering', 'predictive-reorder',
      'challenge-board', 'gift-meal', 'chef-battles', 'streak-shrine',
      'rider-eta-party', 'iftar-stories', 'ramadan-diary', 'neighbor-alerts',
      'flashAuction', 'subscriptionBoxes', 'vendorStorefront', 'tippingKiosk',
      'adhan-sync', 'haptic-countdown', 'theme-transition', 'dua-of-the-day', 'post-ramadan'];

    if (comingSoonKeys.includes(feature.modal)) {
      toast({
        title: `${feature.emoji} ${feature.label}`,
        description: 'Coming soon! This feature is being built for Ramadan 2026.',
      });
    } else {
      setActiveModal(targetModal);
    }
  };

  // Filtered meals based on active category
  const filteredMeals = activeCategory
    ? trendingMeals.filter(m => m.category === activeCategory)
    : trendingMeals;

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
    if (activeCategory === category.name) {
      // Toggle off if already selected
      setActiveCategory(null);
    } else {
      setActiveCategory(category.name);
    }
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

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {isLoading ? (
        <HomeTabSkeleton />
      ) : (
        <div className="space-y-7 animate-in fade-in duration-500">
      {/* ── Greeting + Beta Badge (top brand strip) ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2.5"
        >
          <div className="icon-tile w-9 h-9 bg-gradient-to-br from-[#10E07A] to-[#F5C451] shadow-[0_0_20px_rgba(16,224,122,0.28)]">
            <Sparkles className="w-4 h-4 text-black relative z-10" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white text-lg font-black tracking-tight">SwiftRamadan</span>
            <span className="beta-badge">Beta</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-right"
        >
          <p className="text-white/65 text-[10px] font-semibold uppercase tracking-[0.14em]">Assalamu Alaikum</p>
          <p className="text-white text-xs sm:text-sm font-bold leading-tight mt-0.5">Let&apos;s break fast together 🌙</p>
        </motion.div>
      </div>

      {/* ── Free Spin Available Card ── */}
      {lastSpinDate !== new Date().toISOString().split('T')[0] && (
        <div className="px-5">
          <motion.button
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={() => setActiveModal('rewards')}
            className="w-full relative overflow-hidden rounded-2xl p-3.5 flex items-center gap-3 border border-[#F5C451]/30 active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(245,196,81,0.12), rgba(16,224,122,0.08))',
            }}
          >
            {/* Glow */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#F5C451]/15 blur-3xl pointer-events-none" />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#F5C451]/30 shrink-0"
              style={{ background: 'linear-gradient(135deg, #F5C451/20, #F5C451/10)' }}>
              <span className="text-xl">🎰</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-bold">Free Spin Available!</p>
              <p className="text-white/65 text-[10px]">Spin the wheel for free rewards</p>
            </div>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="px-3 py-1.5 rounded-xl text-[10px] font-black text-[#0B0D14] shrink-0"
              style={{ background: 'linear-gradient(135deg, #F5C451, #E5A830)' }}
            >
              SPIN NOW
            </motion.div>
          </motion.button>
        </div>
      )}

      {/* ── Smart Kitchen Hero Card (FLAGSHIP) ── */}
      <div className="px-5">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="premium-card sk-aura relative overflow-hidden"
        >
          {/* Floating aurora glow orbs */}
          <motion.div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#10E07A]/15 blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-[#A78BFA]/15 blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />

          <div className="relative z-10 p-5">
            {/* Top row: icon + LIVE badge */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="icon-tile w-12 h-12 bg-gradient-to-br from-[#10E07A] to-[#F5C451] shadow-[0_0_24px_rgba(16,224,122,0.40)]"
                >
                  <ChefHat className="w-6 h-6 text-black relative z-10" />
                </motion.div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F5C451]" />
                  <Sparkles className="w-2.5 h-2.5 text-[#10E07A]" />
                </div>
              </div>

              {/* LIVE pulsing red dot */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
                <span className="relative flex w-2 h-2">
                  <motion.span
                    className="absolute inline-flex w-full h-full rounded-full bg-red-500"
                    animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
                </span>
                <span className="text-red-400 text-[10px] font-black tracking-[0.14em] uppercase">Live</span>
              </div>
            </div>

            {/* Title + subtitle */}
            <div className="mb-5">
              <h2 className="text-white text-[1.65rem] font-black tracking-tight leading-tight">
                Smart Kitchen
              </h2>
              <p className="text-[#10E07A] text-sm font-bold flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3.5 h-3.5" />
                Chef Safa Live
              </p>
              <p className="text-white/60 text-xs sm:text-sm mt-2 leading-relaxed">
                AI watches you cook &amp; guides you in real-time.
              </p>
            </div>

            {/* CTA button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveModal('smart-kitchen')}
              className="w-full emerald-gradient text-black font-black text-sm uppercase tracking-[0.18em] py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,224,122,0.35)] hover:brightness-110 transition-all"
            >
              <Radio className="w-4 h-4" />
              Launch Live Coach
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── Live Iftar/Sahur Countdown ── */}
      <div className="px-5">
        <RamadanCountdown />
      </div>

      {/* ── Quick Actions Row (with Meal Planner featured) ── */}
      <div className="px-5">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {/* Meal Planner featured action */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('meal-planner')}
            className="flex flex-col items-center gap-2 min-w-[76px] p-3 bg-[#A78BFA]/10 rounded-2xl border border-[#A78BFA]/20 hover:border-[#A78BFA]/40 transition-colors"
          >
            <div className="icon-tile w-10 h-10 bg-[#A78BFA]/15">
              <CalendarDays className="w-5 h-5 text-[#A78BFA] relative z-10" />
            </div>
            <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">Plan Meals</span>
          </motion.button>
          {quickActions.map((action) => {
            const config = quickActionConfig[action.icon];
            const Icon = config?.icon || Zap;
            return (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action)}
                className="flex flex-col items-center gap-2 min-w-[76px] p-3 glass-card rounded-2xl hover:border-white/15 transition-colors"
              >
                <div className="icon-tile w-10 h-10 bg-[#10E07A]/10">
                  <Icon className="w-5 h-5 text-[#10E07A] relative z-10" />
                </div>
                <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">{action.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── SwiftReel: TikTok-style feed link ── */}
      <div className="px-5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('reels')}
          className="relative w-full overflow-hidden rounded-2xl border border-[#10E07A]/25 text-left group"
          style={{
            background: 'linear-gradient(110deg, rgba(16,224,122,0.18) 0%, rgba(245,196,81,0.10) 55%, rgba(167,139,250,0.14) 100%)',
          }}
        >
          {/* Floating orbs */}
          <div className="absolute -top-6 -right-4 w-24 h-24 rounded-full bg-[#10E07A]/20 blur-2xl" />
          <div className="absolute -bottom-8 -left-2 w-20 h-20 rounded-full bg-[#A78BFA]/20 blur-2xl" />

          <div className="relative flex items-center gap-3 p-3.5">
            {/* Animated clapper icon */}
            <div className="relative size-14 shrink-0 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#10E07A]/30 to-[#F5C451]/20" />
              <Clapperboard className="w-7 h-7 text-white relative z-10" />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-[#FB7185] animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-white font-black text-base tracking-tight">SwiftReel</h3>
                <span className="px-1.5 h-4 rounded-full bg-[#FB7185] text-white text-[9px] font-black flex items-center">LIVE</span>
              </div>
              <p className="text-white/65 text-xs font-medium leading-tight mt-0.5">
                Watch food shorts from Lagos chefs & creators
              </p>
            </div>

            {/* Play CTA */}
            <div className="shrink-0 flex items-center gap-1 px-3 h-9 rounded-full bg-white text-black text-xs font-black active:scale-95 transition-transform">
              <Play className="w-3.5 h-3.5 fill-black" />
              Watch
            </div>
          </div>
        </motion.button>
      </div>

      {/* ── Hero Carousel ── */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto pb-4 no-scrollbar scroll-smooth"
        >
          <div className="flex items-stretch px-5 gap-3 sm:gap-4">
            {heroSlides.map((slide, index) => (
              <motion.div
                key={slide.id}
                className="flex h-full flex-1 flex-col gap-3 rounded-2xl min-w-[300px] cursor-pointer"
                onClick={() => handleMealClick(slide.id === 1 ? 2 : slide.id === 2 ? 3 : 100)}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="relative w-full aspect-[16/9] bg-center bg-no-repeat bg-cover rounded-2xl overflow-hidden border border-white/8 hover:border-white/15 transition-colors"
                  style={{ backgroundImage: `url("${slide.image}")` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06070B] via-transparent to-transparent" />
                  {slide.badge && (
                    <div className="absolute top-3 left-3 gold-gradient px-3 py-1 rounded-full flex items-center gap-1 gold-glow">
                      <Star className="w-3 h-3 text-black fill-black" />
                      <span className="text-black text-[10px] font-bold uppercase tracking-[0.10em]">{slide.badge}</span>
                    </div>
                  )}
                  {/* Slide counter */}
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                    <span className="text-white/80 text-[10px] font-bold">{index + 1} / {heroSlides.length}</span>
                  </div>
                </div>
                <div className="px-1">
                  <p className="text-white text-lg font-bold leading-tight tracking-tight">{slide.title}</p>
                  <p className="text-[#10E07A]/80 text-xs sm:text-sm font-semibold flex items-center gap-1 mt-0.5">
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
              key={`slide-${i}`}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-6 bg-[#10E07A] shadow-[0_0_8px_rgba(16,224,122,0.5)]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Category Circles ── */}
      <div className="px-5">
        <h3 className="heading-accent text-white text-xl font-black tracking-tight mb-3 px-1">Categories</h3>
        <div className="flex w-full overflow-x-auto gap-5 pb-2 no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name || (!activeCategory && cat.id === 1);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center gap-2 min-w-[70px]"
              >
                <div className={`w-16 h-16 bg-[#0F1118] border-2 ${isActive ? 'border-[#10E07A]' : 'border-white/10'} rounded-full flex items-center justify-center p-1 ${isActive ? 'green-glow' : ''} hover:border-[#10E07A]/50 transition-colors`}>
                  <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover rounded-full"
                    style={{ backgroundImage: `url("${cat.image}")` }}
                  />
                </div>
                <p className={`text-[11px] font-bold whitespace-nowrap ${isActive ? 'text-white' : 'text-white/60'}`}>{cat.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active category filter indicator */}
      {activeCategory && (
        <div className="px-5">
          <div className="flex items-center gap-2 bg-[#10E07A]/10 border border-[#10E07A]/20 rounded-xl px-3 py-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#10E07A]" />
            <span className="text-[#10E07A] text-xs font-bold">Filtered by: {activeCategory}</span>
            <button
              onClick={() => setActiveCategory(null)}
              aria-label="Clear filter"
              className="ml-auto p-0.5 hover:bg-[#10E07A]/10 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#10E07A]/60" />
            </button>
          </div>
        </div>
      )}

      {/* ── Featured Ramadan Box (Editor's Choice) ── */}
      <div className="px-5">
        <div
          className="premium-card relative overflow-hidden cursor-pointer"
          onClick={() => handleMealClick(100)}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#10E07A]/8 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F5C451]/8 blur-[80px] pointer-events-none" />
          <div className="p-5 relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div>
                <span className="inline-block px-3 py-1 bg-[#10E07A]/10 text-[#10E07A] border border-[#10E07A]/20 rounded-full text-[10px] font-extrabold uppercase tracking-[0.16em] mb-3">
                  Editor&apos;s Choice
                </span>
                <h3 className="text-2xl font-black text-white leading-[1.1] tracking-tight">
                  The Ultimate<br />Ramadan Box
                </h3>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-[10px] font-medium line-through">{formatNaira(ramadanBox.originalPrice)}</p>
                <p className="text-gradient-emerald text-xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(16,224,122,0.3)]">
                  {formatNaira(ramadanBox.salePrice)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {ramadanBox.images.map((img, i) => (
                <div
                  key={img}
                  className="aspect-square bg-center bg-no-repeat bg-cover rounded-2xl border border-white/10"
                  style={{ backgroundImage: `url("${img}")` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 mb-5 bg-black/30 p-3 rounded-xl border border-white/5">
              <BadgeCheck className="w-5 h-5 text-[#F5C451] shrink-0" />
              <p className="text-white/80 text-xs font-semibold">{ramadanBox.contents} Included</p>
            </div>

            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleQuickAdd({
                  id: ramadanBox.id,
                  name: 'The Ultimate Ramadan Box',
                  price: ramadanBox.salePrice,
                  image: ramadanBox.images[0],
                })}
                className="flex-1 bg-white/5 border border-white/10 py-3.5 rounded-2xl text-white font-bold text-sm uppercase tracking-[0.16em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-white/10"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={() => handleMealClick(100)}
                className="flex-1 emerald-gradient py-3.5 rounded-2xl text-black font-black text-sm uppercase tracking-[0.16em] shadow-lg shadow-[#10E07A]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:brightness-110"
              >
                Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Flash Sales ── */}
      <div className="px-5">
        <div className="flex justify-between items-end mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="icon-tile w-7 h-7 bg-[#F5C451]/12">
              <Flame className="w-4 h-4 text-[#F5C451] relative z-10" />
            </div>
            <h3 className="heading-accent text-white text-xl font-black tracking-tight">Flash Sales</h3>
          </div>
          <button
            onClick={() => setActiveTab('offers')}
            className="text-[#10E07A] text-xs font-extrabold uppercase tracking-[0.12em] cursor-pointer hover:text-[#10E07A]/80 transition-colors"
          >
            See All
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {flashSales.map((sale) => (
            <motion.div
              key={sale.id}
              whileTap={{ scale: 0.97 }}
              className="glass-card min-w-[200px] rounded-2xl overflow-hidden cursor-pointer hover:border-white/15 transition-colors"
              onClick={() => handleMealClick(sale.id + 200)}
            >
              <div className="relative">
                <div
                  className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
                  style={{ backgroundImage: `url("${sale.image}")` }}
                />
                <div className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-md shadow-lg shadow-red-500/30">
                  <span className="text-white text-[10px] font-black">-{sale.discount}%</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
                  <span className="text-[#F5C451] text-[9px] font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {sale.endsIn}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-white font-bold text-xs sm:text-sm truncate">{sale.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#10E07A] font-black text-sm">{formatNaira(sale.salePrice)}</span>
                  <span className="text-white/60 text-[10px] line-through">{formatNaira(sale.originalPrice)}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-white/5 rounded-full h-1.5 mb-1 overflow-hidden">
                    <div
                      className="gold-gradient h-1.5 rounded-full transition-all"
                      style={{ width: `${sale.claimed}%` }}
                    />
                  </div>
                  <p className="text-white/65 text-[9px] font-semibold">{sale.claimed}% claimed</p>
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
                  className="w-full mt-2 text-[10px] font-bold text-[#10E07A] bg-[#10E07A]/10 py-1.5 rounded-lg border border-[#10E07A]/20 hover:bg-[#10E07A]/20 transition-colors"
                >
                  + Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Trending Iftar Meals ── */}
      <div className="px-5">
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="heading-accent text-white text-xl font-black tracking-tight">
            {activeCategory ? activeCategory : 'Trending Iftar'}
          </h3>
          <button
            onClick={() => setActiveModal('trending')}
            className="text-[#10E07A] text-xs font-extrabold uppercase tracking-[0.12em] cursor-pointer hover:text-[#10E07A]/80 transition-colors"
          >
            See All
          </button>
        </div>

        {filteredMeals.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {filteredMeals.map((meal) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: meal.id * 0.05 }}
                className="glass-card flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl hover:border-white/15 transition-colors cursor-pointer"
                onClick={() => handleMealClick(meal.id)}
              >
                <div
                  className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0 border border-white/10"
                  style={{ backgroundImage: `url("${meal.image}")` }}
                />
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-white font-bold text-base truncate tracking-tight">{meal.name}</h4>
                      <span className="text-[#10E07A] font-black whitespace-nowrap">{formatNaira(meal.price)}</span>
                    </div>
                    <p className="text-white/65 text-[11px] leading-relaxed mt-1 line-clamp-2">{meal.description}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="soft-chip">
                      <Clock className="w-3 h-3" />
                      {meal.deliveryTime}
                    </span>
                    <span className="soft-chip text-[#F5C451]">
                      <Star className="w-3 h-3 fill-[#F5C451]" />
                      {meal.rating}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(meal);
                      }}
                      className="ml-auto text-[10px] font-bold text-[#10E07A] bg-[#10E07A]/10 px-3 py-1 rounded-full border border-[#10E07A]/20 hover:bg-[#10E07A]/20 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center py-8 text-center rounded-2xl">
            <p className="text-white/65 text-xs sm:text-sm">No meals found for &quot;{activeCategory}&quot;</p>
            <button
              onClick={() => setActiveCategory(null)}
              className="text-[#10E07A] text-sm font-bold mt-2 hover:text-[#10E07A]/80 transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* ── Join the Community CTA ── */}
      <div className="px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveModal('community')}
          className="aurora-card relative overflow-hidden rounded-3xl cursor-pointer hover:border-white/20 transition-colors"
        >
          {/* Floating aurora glow orbs */}
          <motion.div
            className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#A78BFA]/20 blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-[#10E07A]/15 blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />

          <div className="relative z-10 p-5 flex items-center gap-3 sm:gap-4">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="icon-tile shrink-0 w-14 h-14 bg-gradient-to-br from-[#A78BFA] to-[#10E07A] shadow-[0_0_24px_rgba(167,139,250,0.40)]"
            >
              <Users className="w-7 h-7 text-white relative z-10" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gradient-aurora text-lg font-black tracking-tight leading-tight">
                Join the Community
              </h3>
              <p className="text-white/70 text-xs mt-1 leading-relaxed">
                Connect with thousands of Muslims breaking fast together.
              </p>
            </div>
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── ✨ Next-Gen Features ── */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#A78BFA]" />
          <h2 className="text-white text-xl font-black tracking-tight">✨ Next-Gen Features</h2>
        </div>

        {/* AI-Powered */}
        <p className="text-white/65 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">🤖 AI-Powered</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3">
          {[
            { emoji: '🧬', label: 'Taste DNA', modal: 'taste-dna' },
            { emoji: '📸', label: 'Fridge Scanner', modal: 'fridge-scanner' },
            { emoji: '😊', label: 'Mood Order', modal: 'mood-ordering' },
            { emoji: '🔮', label: 'Smart Reorder', modal: 'predictive-reorder' },
          ].map(f => (
            <button key={f.modal} onClick={() => handleNextGenFeature(f)} className="flex flex-col items-center gap-1.5 min-w-[80px] bg-[#0F1118] border border-white/8 rounded-2xl p-3 hover:border-[#A78BFA]/30 active:scale-[0.97] transition-all">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-bold text-white/70">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Gamification */}
        <p className="text-white/65 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">🎮 Gamification</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3">
          {[
            { emoji: '🏆', label: 'Challenges', modal: 'challenge-board' },
            { emoji: '🎁', label: 'Gift-a-Meal', modal: 'gift-meal' },
            { emoji: '👨‍🍳', label: 'Chef Battles', modal: 'chef-battles' },
            { emoji: '🔥', label: 'Streak Shrine', modal: 'streak-shrine' },
          ].map(f => (
            <button key={f.modal} onClick={() => handleNextGenFeature(f)} className="flex flex-col items-center gap-1.5 min-w-[80px] bg-[#0F1118] border border-white/8 rounded-2xl p-3 hover:border-[#F5C451]/30 active:scale-[0.97] transition-all">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-bold text-white/70">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Location */}
        <p className="text-white/65 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">📍 Location</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3">
          {[
            { emoji: '📡', label: 'Iftar Radar', modal: 'iftar-radar' },
            { emoji: '🎉', label: 'ETA Party', modal: 'rider-eta-party' },
            { emoji: '🕌', label: 'Mosque Hub', modal: 'mosque-partnership' },
          ].map(f => (
            <button key={f.modal} onClick={() => handleNextGenFeature(f)} className="flex flex-col items-center gap-1.5 min-w-[80px] bg-[#0F1118] border border-white/8 rounded-2xl p-3 hover:border-[#38BDF8]/30 active:scale-[0.97] transition-all">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-bold text-white/70">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Social */}
        <p className="text-white/65 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">💬 Social</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3">
          {[
            { emoji: '📖', label: 'Iftar Stories', modal: 'iftar-stories' },
            { emoji: '🍳', label: 'Recipe Remix', modal: 'recipe-remix' },
            { emoji: '📓', label: 'Ramadan Diary', modal: 'ramadan-diary' },
            { emoji: '🏘️', label: 'Neighbor Alerts', modal: 'neighbor-alerts' },
          ].map(f => (
            <button key={f.modal} onClick={() => handleNextGenFeature(f)} className="flex flex-col items-center gap-1.5 min-w-[80px] bg-[#0F1118] border border-white/8 rounded-2xl p-3 hover:border-[#10E07A]/30 active:scale-[0.97] transition-all">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-bold text-white/70">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Commerce */}
        <p className="text-white/65 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">💰 Commerce</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3">
          {[
            { emoji: '🎉', label: 'Bulk Order', modal: 'partyBulk' },
            { emoji: '⚡', label: 'Flash Auction', modal: 'flashAuction' },
            { emoji: '📦', label: 'Sub Boxes', modal: 'subscriptionBoxes' },
            { emoji: '🏪', label: 'Storefront', modal: 'vendorStorefront' },
            { emoji: '💰', label: 'Tip Kiosk', modal: 'tippingKiosk' },
          ].map(f => (
            <button key={f.modal} onClick={() => handleNextGenFeature(f)} className="flex flex-col items-center gap-1.5 min-w-[80px] bg-[#0F1118] border border-white/8 rounded-2xl p-3 hover:border-[#F5C451]/30 active:scale-[0.97] transition-all">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-bold text-white/70">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Ambient & Delight */}
        <p className="text-white/65 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">🌙 Ambient</p>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3">
          {[
            { emoji: '🕌', label: 'Adhan Sync', modal: 'adhan-sync' },
            { emoji: '⏰', label: 'Iftar Countdown', modal: 'haptic-countdown' },
            { emoji: '🌗', label: 'Theme Shift', modal: 'theme-transition' },
            { emoji: '🤲', label: "Du'a of Day", modal: 'dua-of-the-day' },
            { emoji: '🎊', label: 'Post-Ramadan', modal: 'post-ramadan' },
          ].map(f => (
            <button key={f.modal} onClick={() => handleNextGenFeature(f)} className="flex flex-col items-center gap-1.5 min-w-[80px] bg-[#0F1118] border border-white/8 rounded-2xl p-3 hover:border-[#A78BFA]/30 active:scale-[0.97] transition-all">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-bold text-white/70">{f.label}</span>
            </button>
          ))}
        </div>
      </div>
        </div>
      )}
    </main>
  );
}
