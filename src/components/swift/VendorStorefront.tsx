'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Store, Star, Shield, Palette, Camera, Award,
  Heart, ChevronRight, MessageSquare, Tag, Eye, TrendingUp, Crown
} from 'lucide-react';
import { formatNaira } from '@/lib/data';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface StorefrontProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold: number;
  rating: number;
  badge?: string;
}

interface StorefrontReview {
  id: number;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

interface StorefrontHighlight {
  id: number;
  title: string;
  image: string;
  views: number;
}

interface VendorStorefrontData {
  id: number;
  name: string;
  tagline: string;
  description: string;
  avatar: string;
  coverGradient: string;
  isPremium: boolean;
  theme: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  followers: number;
  highlights: StorefrontHighlight[];
  featuredProducts: StorefrontProduct[];
  specialOffers: { id: number; title: string; discount: number; code: string }[];
  reviews: StorefrontReview[];
}

const storefrontData: VendorStorefrontData = {
  id: 1,
  name: 'Mama Aisha Kitchen',
  tagline: 'Authentic Nigerian Iftar Since 2019',
  description: 'Handcrafted meals with love. Every dish tells a story of tradition and family. Our jollof rice has been voted #1 in Lagos 3 years running!',
  avatar: 'MAK',
  coverGradient: 'from-[#10E07A]/20 via-[#F5C451]/10 to-[#A78BFA]/10',
  isPremium: true,
  theme: 'aurora',
  rating: 4.9,
  reviewCount: 847,
  totalSales: 12500,
  followers: 3200,
  highlights: [
    { id: 1, title: 'Our Kitchen', image: '/images/highlights/kitchen.png', views: 2400 },
    { id: 2, title: 'Jollof Prep', image: '/images/highlights/jollof.png', views: 1800 },
    { id: 3, title: 'Happy Iftar!', image: '/images/highlights/iftar.png', views: 3100 },
    { id: 4, title: 'Fresh Ingredients', image: '/images/highlights/fresh.png', views: 900 },
    { id: 5, title: 'Eid Special', image: '/images/highlights/eid.png', views: 4200 },
  ],
  featuredProducts: [
    { id: 101, name: 'Signature Jollof Rice', price: 3500, image: '/images/products/jollof.png', sold: 5200, rating: 4.9, badge: 'Best Seller' },
    { id: 102, name: 'Suya Platter (Large)', price: 5000, originalPrice: 6000, image: '/images/products/suya.png', sold: 3100, rating: 4.8, badge: 'Popular' },
    { id: 103, name: 'Pepper Soup Combo', price: 4500, image: '/images/products/pepper-soup.png', sold: 2800, rating: 4.7 },
    { id: 104, name: 'Iftar Family Pack', price: 15000, originalPrice: 18000, image: '/images/products/iftar-pack.png', sold: 1400, rating: 4.9, badge: 'Premium' },
  ],
  specialOffers: [
    { id: 1, title: 'Ramadan Bundle', discount: 20, code: 'RAMADAN20' },
    { id: 2, title: 'First Order Off', discount: 15, code: 'WELCOME15' },
  ],
  reviews: [
    { id: 1, user: 'Amina B.', avatar: 'AB', rating: 5, comment: 'Best jollof in Lagos! My family loves it every Iftar.', date: '2 days ago' },
    { id: 2, user: 'Yusuf K.', avatar: 'YK', rating: 5, comment: 'Suya platter was amazing. Generous portions and fast delivery.', date: '1 week ago' },
    { id: 3, user: 'Halima M.', avatar: 'HM', rating: 4, comment: 'Great food, reliable service. My go-to for Ramadan meals.', date: '2 weeks ago' },
  ],
};

const themes = [
  { id: 'aurora', name: 'Aurora', color: '#10E07A' },
  { id: 'golden', name: 'Golden', color: '#F5C451' },
  { id: 'royal', name: 'Royal', color: '#A78BFA' },
  { id: 'ocean', name: 'Ocean', color: '#38BDF8' },
];

export default function VendorStorefront() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'vendorStorefront';

  const [data, setData] = useState<VendorStorefrontData>(storefrontData);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);

  const handleClose = useCallback(() => {
    setActiveModal(null);
    setShowThemePicker(false);
    setActiveHighlight(null);
  }, [setActiveModal]);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  const handleThemeChange = async (themeId: string) => {
    try {
      const res = await fetch('/api/vendor-storefront', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeId }),
      });
      if (res.ok) {
        setData((prev) => ({ ...prev, theme: themeId }));
        toast({ title: 'Theme Updated! 🎨', description: `Your storefront theme is now "${themes.find((t) => t.id === themeId)?.name}"` });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update theme', variant: 'destructive' });
    }
    setShowThemePicker(false);
  };

  const currentTheme = themes.find((t) => t.id === data.theme) || themes[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#0B0D14] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`${data.name} - Vendor Storefront`}
        >
          {/* Premium Gold Border */}
          {data.isPremium && (
            <div className="h-1 bg-gradient-to-r from-[#F5C451] via-[#FFD700] to-[#F5C451]" />
          )}

          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0B0D14]/80 border-b border-white/8">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: `${currentTheme.color}10`, borderColor: `${currentTheme.color}20` }}
                >
                  <Store className="w-5 h-5" style={{ color: currentTheme.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold text-lg">{data.name}</h2>
                    {data.isPremium && (
                      <Crown className="w-4 h-4 text-[#F5C451]" />
                    )}
                  </div>
                  <p className="text-white/65 text-xs">{data.tagline}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[#0F1118] border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close vendor storefront"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Cover Section */}
          <div className={`relative h-40 bg-gradient-to-br ${data.coverGradient} flex items-center justify-center`}>
            <div className="absolute inset-0 bg-[#0B0D14]/40" />
            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-2xl bg-[#0F1118] border-2 flex items-center justify-center text-2xl font-black mx-auto mb-3"
                style={{ borderColor: data.isPremium ? '#F5C451' : 'rgba(255,255,255,0.08)' }}
              >
                <span style={{ color: currentTheme.color }}>{data.avatar}</span>
              </motion.div>
              {data.isPremium && (
                <div className="inline-flex items-center gap-1.5 bg-[#F5C451]/20 border border-[#F5C451]/30 rounded-full px-3 py-1">
                  <Award className="w-3 h-3 text-[#F5C451]" />
                  <span className="text-[#F5C451] text-[10px] font-bold">Premium Vendor</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-4 -mt-4 relative z-10 mb-6">
            <div className="bg-[#0F1118] rounded-2xl border border-white/8 p-4 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 text-[#F5C451] fill-[#F5C451]" />
                  <span className="text-white font-black text-lg">{data.rating}</span>
                </div>
                <p className="text-white/65 text-[10px]">{data.reviewCount} reviews</p>
              </div>
              <div className="text-center border-x border-white/8">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#10E07A]" />
                  <span className="text-white font-black text-lg">{(data.totalSales / 1000).toFixed(1)}k</span>
                </div>
                <p className="text-white/65 text-[10px]">orders</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-white font-black text-lg">{(data.followers / 1000).toFixed(1)}k</span>
                </div>
                <p className="text-white/65 text-[10px]">followers</p>
              </div>
            </div>
          </div>

          {/* Story Highlights */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Highlights</h3>
              <Camera className="w-4 h-4 text-white/20" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {data.highlights.map((highlight, i) => (
                <motion.button
                  key={highlight.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveHighlight(activeHighlight === highlight.id ? null : highlight.id)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                  aria-label={`View highlight: ${highlight.title}`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      activeHighlight === highlight.id ? 'border-[#F5C451]' : 'border-white/10'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.color}20, ${currentTheme.color}5)`,
                    }}
                  >
                    <Camera className="w-6 h-6 text-white/20" />
                  </div>
                  <span className="text-white/50 text-[10px] max-w-[64px] truncate">{highlight.title}</span>
                  {highlight.views > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5 text-white/20" />
                      <span className="text-white/20 text-[8px]">{(highlight.views / 1000).toFixed(1)}k</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="px-4 mb-6">
            <div className="bg-[#0F1118] rounded-2xl border border-white/8 p-4">
              <h3 className="text-white font-bold text-sm mb-2">About</h3>
              <p className="text-white/50 text-xs leading-relaxed">{data.description}</p>
            </div>
          </div>

          {/* Special Offers */}
          {data.specialOffers.length > 0 && (
            <div className="px-4 mb-6">
              <h3 className="text-white font-bold text-sm mb-3">Special Offers</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {data.specialOffers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-[#F5C451]/10 to-[#F5C451]/5 border border-[#F5C451]/20 rounded-xl p-3 flex-shrink-0 min-w-[160px]"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Tag className="w-3 h-3 text-[#F5C451]" />
                      <span className="text-[#F5C451] text-[10px] font-bold">{offer.discount}% OFF</span>
                    </div>
                    <p className="text-white font-bold text-xs mb-1">{offer.title}</p>
                    <div className="bg-[#0B0D14]/50 rounded-md px-2 py-1">
                      <span className="text-[#F5C451] text-[10px] font-mono font-bold">{offer.code}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Products */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Featured Products</h3>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#0F1118] rounded-xl border border-white/8 overflow-hidden"
                >
                  <div className="relative h-28 bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center">
                    <Store className="w-10 h-10 text-white/5" />
                    {product.badge && (
                      <span className="absolute top-2 left-2 bg-[#10E07A]/90 text-[#0B0D14] text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                        {product.badge}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="absolute top-2 right-2 bg-red-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-white font-bold text-xs mb-1 line-clamp-1">{product.name}</h4>
                    <div className="flex items-center gap-1 mb-1.5">
                      <Star className="w-3 h-3 text-[#F5C451] fill-[#F5C451]" />
                      <span className="text-white/50 text-[10px]">{product.rating} · {product.sold.toLocaleString()} sold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: currentTheme.color }} className="font-black text-sm">{formatNaira(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-white/60 text-[10px] line-through">{formatNaira(product.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Customer Reviews</h3>
              <span className="text-white/60 text-xs">{data.reviewCount} total</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {data.reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#0F1118] rounded-xl border border-white/8 p-3"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] text-xs font-bold">
                      {review.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-xs font-bold">{review.user}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className={`w-2.5 h-2.5 ${s < review.rating ? 'text-[#F5C451] fill-[#F5C451]' : 'text-white/10'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-white/20 text-[10px]">{review.date}</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Theme Picker */}
          <div className="px-4 mb-6">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="w-full bg-[#0F1118] border border-white/8 rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
              aria-label="Change storefront theme"
            >
              <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/10 flex items-center justify-center border border-[#A78BFA]/20">
                <Palette className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-white font-bold text-sm">Storefront Theme</h4>
                <p className="text-white/65 text-xs">Current: {currentTheme.name}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/20 transition-transform ${showThemePicker ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          data.theme === theme.id
                            ? 'border-2'
                            : 'bg-white/5 border border-white/8 hover:bg-white/8'
                        }`}
                        style={data.theme === theme.id ? { borderColor: theme.color, backgroundColor: `${theme.color}10` } : {}}
                        aria-label={`Select ${theme.name} theme`}
                      >
                        <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: `${theme.color}20`, borderColor: theme.color }} />
                        <span style={{ color: data.theme === theme.id ? theme.color : 'rgba(255,255,255,0.5)' }}>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Premium Badge */}
          {data.isPremium && (
            <div className="px-4 mb-8">
              <div className="bg-gradient-to-r from-[#F5C451]/10 to-transparent border border-[#F5C451]/20 rounded-xl p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#F5C451]" />
                <div>
                  <p className="text-[#F5C451] font-bold text-xs">Premium Storefront</p>
                  <p className="text-white/65 text-[10px]">Priority placement · Custom themes · Story highlights</p>
                </div>
              </div>
            </div>
          )}

          {/* Follow + Message */}
          <div className="px-4 mb-8">
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: currentTheme.color, color: '#0B0D14' }}
                aria-label="Follow vendor"
              >
                <Heart className="w-4 h-4" />
                Follow
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-xl bg-[#0F1118] border border-white/8 font-bold text-sm flex items-center justify-center gap-2 text-white/70 hover:bg-white/5 transition-colors"
                aria-label="Message vendor"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </motion.button>
            </div>
          </div>

          <div className="h-20" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
