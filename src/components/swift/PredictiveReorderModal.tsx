'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Plus, ShoppingBag, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface ReorderItem {
  name: string;
  price: number;
  image: string;
  lastOrdered: string;
  reorderScore: number;
  reason: string;
}

export default function PredictiveReorderModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const isOpen = activeModal === 'predictive-reorder';

  const [items, setItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>('');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleClose = () => setActiveModal(null);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predictive-reorder');
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
        setSource(data.source || 'mock');
      }
    } catch {
      toast({ title: 'Failed to load predictions', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen && items.length === 0) {
      fetchPredictions();
    }
  }, [isOpen, items.length, fetchPredictions]);

  const handleAddItem = (item: ReorderItem) => {
    addToCart({
      id: Math.floor(Math.random() * 100000),
      name: item.name,
      price: item.price,
      image: item.image || '/images/products/placeholder.png',
    });
    setAddedItems((prev) => new Set(prev).add(item.name));
    toast({ title: `${item.name} added! 🛒`, description: item.reason });
  };

  const handleReorderAll = () => {
    items.forEach((item) => {
      if (!addedItems.has(item.name)) {
        addToCart({
          id: Math.floor(Math.random() * 100000),
          name: item.name,
          price: item.price,
          image: item.image || '/images/products/placeholder.png',
        });
      }
    });
    const allNames = new Set(items.map((i) => i.name));
    setAddedItems(allNames);
    const total = items.reduce((sum, i) => sum + i.price, 0);
    toast({ title: 'All items added to cart! 🎉', description: `Total: ${formatNaira(total)}` });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10E07A';
    if (score >= 60) return '#F5C451';
    return '#F97316';
  };

  const total = items.reduce((sum, i) => sum + i.price, 0);
  const allAdded = addedItems.size >= items.length && items.length > 0;

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
                <div className="w-10 h-10 bg-[#10E07A]/10 rounded-xl flex items-center justify-center border border-[#10E07A]/20">
                  <Sparkles className="w-5 h-5 text-[#10E07A]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">🔮 Smart Reorder</h2>
                  <p className="text-white/40 text-xs">AI-predicted reorder suggestions</p>
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

          {/* Hero */}
          <div className="relative overflow-hidden px-4 pt-6 pb-4">
            <div className="absolute inset-0 bg-gradient-to-b from-[#10E07A]/5 to-transparent pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center gap-2 bg-[#10E07A]/10 border border-[#10E07A]/20 rounded-full px-4 py-1.5 mb-3">
                <TrendingUp className="w-4 h-4 text-[#10E07A]" />
                <span className="text-[#10E07A] text-xs font-bold">AI Powered</span>
              </div>
              <h1 className="text-2xl font-black text-white mb-1">
                We know what you <span className="text-[#10E07A]">crave</span>
              </h1>
              <p className="text-white/40 text-sm">
                Based on your order patterns and Ramadan habits
              </p>
              {source && (
                <span className="text-[10px] text-white/20 mt-2 inline-block">
                  Source: {source === 'ai' ? '✨ AI Prediction' : 'Smart Defaults'}
                </span>
              )}
            </motion.div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-4 py-12 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 border-3 border-white/10 border-t-[#10E07A] rounded-full mb-4"
              />
              <p className="text-white/50 text-sm">Predicting your next order...</p>
            </div>
          )}

          {/* Items List */}
          {!loading && items.length > 0 && (
            <div className="px-4 mb-4">
              <div className="space-y-3">
                {items.map((item, i) => {
                  const isAdded = addedItems.has(item.name);
                  const scoreColor = getScoreColor(item.reorderScore);
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Item icon */}
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-5 h-5 text-white/30" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-white font-bold text-sm">{item.name}</h4>
                            <span className="text-[#10E07A] text-sm font-bold shrink-0">
                              {formatNaira(item.price)}
                            </span>
                          </div>

                          {/* Last ordered */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-white/30" />
                            <span className="text-white/30 text-[10px]">Last ordered {item.lastOrdered}</span>
                          </div>

                          {/* Reason */}
                          <p className="text-white/50 text-xs mt-1.5 italic">{item.reason}</p>

                          {/* Reorder Score */}
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white/40 text-[10px]">Reorder likelihood</span>
                              <span className="text-xs font-bold" style={{ color: scoreColor }}>
                                {item.reorderScore}%
                              </span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="h-1.5 rounded-full"
                                style={{ backgroundColor: scoreColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.reorderScore}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Add button */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleAddItem(item)}
                          disabled={isAdded}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isAdded
                              ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                              : 'bg-[#10E07A] text-[#05070A] hover:bg-[#10E07A]/90 active:scale-[0.98]'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <span>✓</span>
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reorder All Button */}
          {!loading && items.length > 0 && (
            <div className="px-4 mb-32">
              <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/50 text-sm">Total for all items</span>
                  <span className="text-white font-bold text-lg">{formatNaira(total)}</span>
                </div>
                <motion.button
                  onClick={handleReorderAll}
                  disabled={allAdded}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    allAdded
                      ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-[#10E07A] text-[#05070A] hover:bg-[#10E07A]/90 active:scale-[0.98]'
                  }`}
                >
                  {allAdded ? (
                    <>
                      <span>✓</span>
                      All Items Added
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Reorder All
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
