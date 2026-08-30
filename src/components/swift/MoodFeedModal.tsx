'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, ShoppingCart, Clock, Flame, Zap, Sofa, Globe, Heart, Target } from 'lucide-react';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface MoodProduct {
  name: string;
  description: string;
  price: number;
  image: string;
  mood_match: string;
  spice_level: number;
  prep_time: number;
}

interface MoodOption {
  key: string;
  emoji: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const MOODS: MoodOption[] = [
  { key: 'energetic', emoji: '⚡', label: 'Energetic', icon: Zap, color: '#F97316' },
  { key: 'cozy', emoji: '🛋️', label: 'Cozy', icon: Sofa, color: '#F59E0B' },
  { key: 'adventurous', emoji: '🌍', label: 'Adventurous', icon: Globe, color: '#10E07A' },
  { key: 'romantic', emoji: '❤️', label: 'Romantic', icon: Heart, color: '#EF4444' },
  { key: 'focused', emoji: '🎯', label: 'Focused', icon: Target, color: '#3B82F6' },
];

function SpiceDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < level ? 'bg-red-500' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

export default function MoodFeedModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const isOpen = activeModal === 'mood-ordering';

  const [selectedMood, setSelectedMood] = useState<string>('');
  const [products, setProducts] = useState<MoodProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>('');

  const handleClose = () => setActiveModal(null);

  const handleMoodSelect = useCallback(async (mood: string) => {
    setSelectedMood(mood);
    setLoading(true);
    setProducts([]);

    try {
      const res = await fetch(`/api/mood-feed?mood=${mood}`);
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
        setSource(data.source || 'mock');
      }
    } catch {
      toast({ title: 'Failed to load mood feed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleAddToCart = (product: MoodProduct) => {
    addToCart({
      id: Math.floor(Math.random() * 100000),
      name: product.name,
      price: product.price,
      image: product.image || '/images/products/placeholder.png',
    });
    toast({ title: `${product.name} added to cart! 🛒`, description: product.mood_match });
  };

  const activeMood = MOODS.find((m) => m.key === selectedMood);

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
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center border border-[#F59E0B]/20">
                  <Smile className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">😊 Mood Order</h2>
                  <p className="text-white/65 text-xs">Eat how you feel</p>
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

          {/* Mood Selector */}
          <div className="px-4 pt-6 pb-2">
            <h3 className="text-white font-bold text-base mb-3">How are you feeling?</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.key;
                const MoodIcon = mood.icon;
                return (
                  <motion.button
                    key={mood.key}
                    onClick={() => handleMoodSelect(mood.key)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all shrink-0 min-w-[80px] ${
                      isSelected
                        ? 'border-white/20 bg-white/10'
                        : 'border-white/5 bg-[#1A1D26] hover:border-white/10'
                    }`}
                    style={isSelected ? { boxShadow: `0 0 20px ${mood.color}20` } : {}}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-white/65'}`}>
                      {mood.label}
                    </span>
                    {isSelected && (() => {
                      const Icon = mood.icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                      return <Icon className="w-3 h-3" style={{ color: mood.color }} />;
                    })()}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-16 flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-10 h-10 border-3 border-white/10 border-t-[#F59E0B] rounded-full mb-4"
                />
                <p className="text-white/50 text-sm">Finding the perfect {activeMood?.label.toLowerCase()} meals...</p>
              </motion.div>
            )}

            {/* No mood selected */}
            {!loading && !selectedMood && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-16 text-center"
              >
                <span className="text-5xl mb-4 block">🍽️</span>
                <p className="text-white/65 text-sm">Pick a mood above to discover meals that match your vibe</p>
              </motion.div>
            )}

            {/* Products Grid */}
            {!loading && selectedMood && products.length > 0 && (
              <motion.div
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 pt-4 pb-32"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-base">
                    {activeMood?.emoji} {activeMood?.label} Picks
                  </h3>
                  <span className="text-[10px] text-white/60 bg-white/5 px-2 py-1 rounded-full">
                    {source === 'ai' ? '✨ AI Curated' : 'Popular Picks'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {products.map((product, i) => (
                    <motion.div
                      key={product.name}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
                    >
                      {/* Food image placeholder */}
                      <div className="h-28 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                        <span className="text-3xl opacity-50">🍽️</span>
                      </div>

                      <div className="p-3">
                        <h4 className="text-white font-bold text-sm mb-0.5 truncate">{product.name}</h4>
                        <p className="text-white/65 text-[10px] leading-tight mb-2 line-clamp-2">{product.description}</p>

                        {/* Mood match */}
                        <p className="text-[#F59E0B] text-[10px] mb-2 line-clamp-1 italic">
                          &ldquo;{product.mood_match}&rdquo;
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-white/60" />
                            <span className="text-white/65 text-[10px]">{product.prep_time}m</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-red-500/50" />
                            <SpiceDots level={product.spice_level} />
                          </div>
                        </div>

                        {/* Price + Add */}
                        <div className="flex items-center justify-between">
                          <span className="text-[#10E07A] text-sm font-bold">{formatNaira(product.price)}</span>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="w-8 h-8 rounded-lg bg-[#10E07A] flex items-center justify-center hover:bg-[#10E07A]/80 active:scale-95 transition-all"
                          >
                            <ShoppingCart className="w-4 h-4 text-[#05070A]" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* No results */}
            {!loading && selectedMood && products.length === 0 && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-16 text-center"
              >
                <p className="text-white/65 text-sm">No meals found for this mood. Try another!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
