'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingCart,
  Star,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useNavigation, useMood, useCart } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface MoodProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  deliveryTime: string;
  matchReason: string;
}

interface Mood {
  key: string;
  emoji: string;
  label: string;
  color: string;
}

const MOODS: Mood[] = [
  { key: 'celebratory', emoji: '😊', label: 'Celebratory', color: '#F5C451' },
  { key: 'low-energy', emoji: '😴', label: 'Low-Energy', color: '#A78BFA' },
  { key: 'hosting', emoji: '🤗', label: 'Hosting', color: '#10E07A' },
  { key: 'health-focused', emoji: '🏋️', label: 'Health-Focused', color: '#38BDF8' },
  { key: 'craving', emoji: '🍿', label: 'Craving', color: '#F97316' },
  { key: 'peaceful', emoji: '🧘', label: 'Peaceful', color: '#A78BFA' },
];

export default function MoodOrdering() {
  const { activeModal, setActiveModal } = useNavigation();
  const { currentMood, setCurrentMood, tasteProfile, setTasteProfile } = useMood();
  const { addToCart } = useCart();
  const isOpen = activeModal === 'mood-ordering';
  const { toast } = useToast();
  const [products, setProducts] = useState<MoodProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(currentMood);

  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, [setActiveModal]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  const fetchMoodFeed = useCallback(async (mood: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/mood-feed?mood=${encodeURIComponent(mood)}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not load mood feed. Try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedMood) {
      setCurrentMood(selectedMood);
      fetchMoodFeed(selectedMood);

      // Update taste profile based on selected mood
      const newProfile = { ...tasteProfile };
      switch (selectedMood) {
        case 'energetic':
          newProfile.spicy = Math.min(100, newProfile.spicy + 5);
          newProfile.rich = Math.min(100, newProfile.rich + 3);
          break;
        case 'cozy':
          newProfile.sweet = Math.min(100, newProfile.sweet + 5);
          newProfile.rich = Math.min(100, newProfile.rich + 3);
          break;
        case 'adventurous':
          newProfile.umami = Math.min(100, newProfile.umami + 5);
          newProfile.smoky = Math.min(100, newProfile.smoky + 3);
          break;
        case 'craving':
          newProfile.smoky = Math.min(100, newProfile.smoky + 5);
          newProfile.spicy = Math.min(100, newProfile.spicy + 3);
          break;
        case 'peaceful':
          newProfile.fresh = Math.min(100, newProfile.fresh + 5);
          newProfile.sweet = Math.min(100, newProfile.sweet + 3);
          break;
        // 'celebratory', 'low-energy', 'hosting', 'health-focused' — no taste shift
      }
      setTasteProfile(newProfile);
    }
  }, [selectedMood, setCurrentMood, fetchMoodFeed, tasteProfile, setTasteProfile]);

  const handleAddToCart = useCallback(
    (product: MoodProduct) => {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      toast({ title: 'Added to Cart', description: `${product.name} added` });
    },
    [addToCart, toast]
  );

  const activeMood = MOODS.find((m) => m.key === selectedMood);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Mood-Based Ordering"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/8 shadow-2xl"
          style={{ backgroundColor: '#0F1118' }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/8" style={{ backgroundColor: '#0F1118' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: '#A78BFA' }} />
              <h2 className="text-white font-bold text-lg">Mood Ordering</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Mood Selector */}
            <div>
              <p className="text-white/50 text-xs mb-3">How are you feeling right now?</p>
              <div className="grid grid-cols-3 gap-2">
                {MOODS.map((mood) => (
                  <motion.button
                    key={mood.key}
                    onClick={() => setSelectedMood(mood.key)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                      selectedMood === mood.key
                        ? 'border-white/20 bg-white/5'
                        : 'border-white/8 hover:border-white/15 hover:bg-white/[0.02]'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${mood.label} mood`}
                    aria-pressed={selectedMood === mood.key}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: selectedMood === mood.key ? mood.color : 'rgba(255,255,255,0.4)' }}
                    >
                      {mood.label}
                    </span>
                    {selectedMood === mood.key && (
                      <motion.div
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: mood.color }}
                        layoutId="mood-dot"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mood Feed */}
            {selectedMood && activeMood && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{activeMood.emoji}</span>
                  <h3 className="text-white font-semibold text-sm">
                    {activeMood.label} Picks
                  </h3>
                  <span className="text-white/20 text-xs">Curated for your mood</span>
                </div>

                {isLoading ? (
                  <div className="py-8 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                    <p className="text-white/30 text-sm">Finding the perfect matches...</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedMood}
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {products.map((product, i) => (
                        <motion.div
                          key={product.id}
                          className="flex gap-3 p-3 rounded-xl border border-white/8"
                          style={{ backgroundColor: '#0B0D14' }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          {/* Product Image */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/8">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{product.name}</p>
                            <p className="text-white/30 text-xs mt-0.5 line-clamp-2">{product.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-white/50 text-xs flex items-center gap-1">
                                <Star className="w-3 h-3" style={{ color: '#F5C451' }} />
                                {product.rating}
                              </span>
                              <span className="text-white/30 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {product.deliveryTime}
                              </span>
                            </div>
                            {/* Match Reason */}
                            <p
                              className="text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block"
                              style={{ backgroundColor: `${activeMood.color}15`, color: activeMood.color }}
                            >
                              {product.matchReason}
                            </p>
                          </div>

                          {/* Price + Add */}
                          <div className="flex flex-col items-end justify-between">
                            <span className="text-white font-bold text-sm">{formatNaira(product.price)}</span>
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ backgroundColor: '#10E07A20', color: '#10E07A' }}
                              aria-label={`Add ${product.name} to cart`}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* No mood selected */}
            {!selectedMood && (
              <motion.div
                className="py-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-3xl mb-3">🎭</p>
                <p className="text-white/40 text-sm">Select a mood to see personalized recommendations</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
