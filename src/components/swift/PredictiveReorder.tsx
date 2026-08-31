'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RefreshCw,
  ShoppingCart,
  Clock,
  TrendingUp,
  Zap,
  Star,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface ReorderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  lastOrdered: string;
  orderCount: number;
  avgCadenceDays: number;
  daysSinceLastOrder: number;
  confidence: number;
  reason: string;
}

function getUrgencyColor(confidence: number): string {
  if (confidence >= 0.85) return 'var(--sr-customer)';
  if (confidence >= 0.65) return 'var(--sr-vendor)';
  return 'var(--sr-ai)';
}

function getUrgencyLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Order Now';
  if (confidence >= 0.65) return 'Soon';
  return 'Maybe';
}

function timeAgo(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function PredictiveReorder() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const isOpen = activeModal === 'predictive-reorder';
  const { toast } = useToast();
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

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

  const fetchPredictions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/predictive-reorder');
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not load predictions.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleAddToCart = useCallback(
    (item: ReorderItem) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
      });
      setAddedItems((prev) => new Set(prev).add(item.id));
      toast({ title: 'Added to Cart', description: `${item.name} added` });
    },
    [addToCart, toast]
  );

  const handleReorderAll = useCallback(() => {
    const toAdd = items.filter((item) => !addedItems.has(item.id) && item.confidence >= 0.65);
    toAdd.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
      });
    });
    const newAdded = new Set(addedItems);
    toAdd.forEach((item) => newAdded.add(item.id));
    setAddedItems(newAdded);
    toast({ title: 'Items Added', description: `${toAdd.length} items added to cart` });
  }, [items, addedItems, addToCart, toast]);

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
        aria-label="Predictive Reorder"
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
          style={{ backgroundColor: 'var(--sr-surface-raised)' }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/8" style={{ backgroundColor: 'var(--sr-surface-raised)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--sr-customer)' }} />
              <h2 className="text-white font-bold text-lg">Smart Reorder</h2>
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
            {/* AI Summary */}
            <motion.div
              className="rounded-xl p-3 border border-white/8"
              style={{ backgroundColor: 'var(--sr-surface-base)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" style={{ color: 'var(--sr-vendor)' }} />
                <span className="text-white text-sm font-semibold">AI Prediction</span>
              </div>
              <p className="text-white/65 text-xs">
                Based on your order patterns, we predict you&apos;ll need these items soon.
                Items are ranked by reorder probability.
              </p>
            </motion.div>

            {/* Loading */}
            {isLoading && (
              <div className="py-12 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                <p className="text-white/60 text-sm">Analyzing your order patterns...</p>
              </div>
            )}

            {/* Reorder Items */}
            {!isLoading && items.length > 0 && (
              <div className="space-y-3">
                {items.map((item, i) => {
                  const urgencyColor = getUrgencyColor(item.confidence);
                  const urgencyLabel = getUrgencyLabel(item.confidence);
                  const isOverdue = item.daysSinceLastOrder > item.avgCadenceDays;

                  return (
                    <motion.div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-xl border border-white/8"
                      style={{ backgroundColor: 'var(--sr-surface-base)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Confidence Badge */}
                        <div
                          className="absolute top-0.5 right-0.5 text-[8px] font-bold px-1 py-0.5 rounded"
                          style={{ backgroundColor: `color-mix(in srgb, ${urgencyColor} 19%, transparent)`, color: urgencyColor }}
                        >
                          {Math.round(item.confidence * 100)}%
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.name}</p>
                            <p className="text-white/60 text-xs mt-0.5">{item.reason}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-white/65 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(item.daysSinceLastOrder)}
                          </span>
                          <span className="text-white/60 text-xs">
                            Ordered {item.orderCount}x
                          </span>
                          <span className="text-white/60 text-xs">
                            Every ~{item.avgCadenceDays}d
                          </span>
                        </div>

                        {/* Overdue indicator */}
                        {isOverdue && (
                          <p className="text-[10px] mt-1" style={{ color: 'var(--sr-vendor)' }}>
                            ⚡ Overdue by {item.daysSinceLastOrder - item.avgCadenceDays} days
                          </p>
                        )}
                      </div>

                      {/* Price + Add */}
                      <div className="flex flex-col items-end justify-between flex-shrink-0">
                        <span className="text-white font-bold text-sm">{formatNaira(item.price)}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `color-mix(in srgb, ${urgencyColor} 13%, transparent)`, color: urgencyColor }}
                          >
                            {urgencyLabel}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={addedItems.has(item.id)}
                            className="p-2 rounded-lg transition-colors disabled:opacity-50"
                            style={{
                              backgroundColor: addedItems.has(item.id) ? 'color-mix(in srgb, var(--sr-customer) 13%, transparent)' : 'color-mix(in srgb, var(--sr-customer) 13%, transparent)',
                              color: addedItems.has(item.id) ? 'var(--sr-customer)' : 'var(--sr-customer)',
                            }}
                            aria-label={`Reorder ${item.name}`}
                          >
                            {addedItems.has(item.id) ? (
                              <span className="text-xs font-bold">✓</span>
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && items.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">📦</p>
                <p className="text-white/65 text-sm">No predictions yet. Order more to unlock smart reorders!</p>
              </div>
            )}

            {/* Reorder All */}
            {!isLoading && items.length > 0 && (
              <motion.button
                onClick={handleReorderAll}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: 'var(--sr-customer)', color: 'var(--sr-surface-base)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                Reorder All Suggested Items
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}

            {/* Legend */}
            {!isLoading && items.length > 0 && (
              <div className="flex items-center justify-center gap-4 text-[10px] text-white/60">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--sr-customer)' }} />
                  High confidence
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--sr-vendor)' }} />
                  Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--sr-ai)' }} />
                  Low
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
