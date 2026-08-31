'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, Gift, MapPin, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigation, useGiftAMeal, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface MealOption {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
}

interface ChainStat {
  city: string;
  count: number;
  meals: number;
  totalAmount: number;
}

interface GiftAMealProps {
  onClose?: () => void;
}

const FORMAT_NAIRA = (amount: number) => `₦${amount.toLocaleString()}`;

export default function GiftAMeal({ onClose }: GiftAMealProps) {
  const { giftChainCount, setGiftChainCount } = useGiftAMeal();
  const hasanatPoints = useAppStore(s => s.hasanatPoints);
  const setHasanatPoints = useAppStore(s => s.setHasanatPoints);
  const dailyStreak = useAppStore(s => s.dailyStreak);
  const setDailyStreak = useAppStore(s => s.setDailyStreak);
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'gift-meal';
  const { toast } = useToast();

  const [meals, setMeals] = useState<MealOption[]>([]);
  const [chains, setChains] = useState<ChainStat[]>([]);
  const [totalStats, setTotalStats] = useState({ gifts: 0, meals: 0, cities: 0 });
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [city, setCity] = useState('Lagos');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sentGift, setSentGift] = useState<{ meal: string; amount: number; city: string } | null>(null);

  const CITIES = ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'];

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/gift-meal');
      if (res.ok) {
        const data = await res.json();
        setMeals(data.meals);
        setChains(data.chains);
        setTotalStats(data.total);
      }
    } catch {
      // Use empty defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSuccess) {
          setShowSuccess(false);
        } else if (onClose) {
          onClose();
        } else {
          setActiveModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccess, onClose, setActiveModal]);

  // Send gift
  const handleSend = async () => {
    if (!selectedMeal || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/gift-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealId: selectedMeal, message, city }),
      });

      if (res.ok) {
        const data = await res.json();
        const newChainCount = giftChainCount + 1;
        setGiftChainCount(newChainCount);

        // Award loyalty points for generous gifting
        setHasanatPoints(hasanatPoints + 200);

        // Gifting counts as daily activity
        setDailyStreak(dailyStreak + 1);

        setSentGift({
          meal: data.gift.meal,
          amount: data.gift.amount,
          city: data.gift.city,
        });
        setShowSuccess(true);

        // Refresh chain data
        fetchData();

        toast({
          title: '🎁 Meal Gifted!',
          description: `+200 Hasanat, Chain x${newChainCount}`,
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send gift', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const selectedMealData = meals.find(m => m.id === selectedMeal);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Gift a Meal"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--sr-customer)]/15 flex items-center justify-center border border-[var(--sr-customer)]/25">
            <Gift className="w-4 h-4 text-[var(--sr-customer)]" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Gift-a-Meal</h2>
            <p className="text-white/65 text-[10px]">Feed a fellow Muslim this Ramadan</p>
          </div>
        </div>
        <button
          onClick={() => { if (onClose) onClose(); else setActiveModal(null); }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close gift a meal"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--sr-customer)]/30 border-t-[var(--sr-customer)] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Total Impact Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 relative overflow-hidden rounded-2xl border border-[var(--sr-customer)]/20 p-5"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--sr-customer) 8%, transparent), var(--sr-surface-raised))' }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[var(--sr-customer)]/10 blur-[60px]" />
              <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--sr-customer)]/10 flex items-center justify-center border border-[var(--sr-customer)]/20">
                  <Heart className="w-7 h-7 text-[var(--sr-customer)]" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Community meals gifted</p>
                  <p className="text-[var(--sr-customer)] text-2xl font-black">{totalStats.gifts.toLocaleString()}</p>
                  <p className="text-white/60 text-[10px]">across {totalStats.cities} cities</p>
                </div>
              </div>
            </motion.div>

            {/* City Chains */}
            <div className="mt-5">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Chain Leaderboard</p>
              <div className="space-y-2">
                {chains.slice(0, 5).map((chain, i) => (
                  <motion.div
                    key={chain.city}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-[var(--sr-surface-raised)] rounded-xl border border-white/5 p-3 flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                      i === 0 ? 'bg-[var(--sr-vendor)]/15 text-[var(--sr-vendor)] border border-[var(--sr-vendor)]/20' :
                      i === 1 ? 'bg-white/10 text-white/70 border border-white/10' :
                      i === 2 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-white/5 text-white/65 border border-white/5'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-white/60" />
                        <span className="text-white text-xs font-bold">{chain.city}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (chain.count / (chains[0]?.count || 1)) * 100)}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: i === 0 ? 'var(--sr-customer)' : i === 1 ? 'var(--sr-vendor)' : 'rgba(255,255,255,0.2)' }}
                        />
                      </div>
                    </div>
                    <span className="text-white/60 text-[10px] font-bold shrink-0">{chain.count.toLocaleString()} meals</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Meal Selection */}
            <div className="mt-6">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Choose a Meal to Gift</p>
              <div className="space-y-2">
                {meals.map((meal, i) => (
                  <motion.button
                    key={meal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMeal(meal.id)}
                    className={`w-full rounded-xl border p-3.5 flex items-center gap-3 transition-all text-left ${
                      selectedMeal === meal.id
                        ? 'bg-[var(--sr-customer)]/10 border-[var(--sr-customer)]/30'
                        : 'bg-[var(--sr-surface-raised)] border-white/5 hover:border-white/15'
                    }`}
                    aria-label={`Select ${meal.name} - ${FORMAT_NAIRA(meal.price)}`}
                  >
                    <span className="text-2xl shrink-0">{meal.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold">{meal.name}</p>
                      <p className="text-white/65 text-[10px] mt-0.5">{meal.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[var(--sr-customer)] text-sm font-black">{FORMAT_NAIRA(meal.price)}</p>
                    </div>
                    {selectedMeal === meal.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-[var(--sr-customer)] flex items-center justify-center shrink-0"
                      >
                        <svg className="w-3 h-3 text-[var(--sr-surface-base)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* City Selection */}
            <div className="mt-5">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Gift to City</p>
              <div className="flex flex-wrap gap-2">
                {CITIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      city === c
                        ? 'bg-[var(--sr-customer)]/15 border border-[var(--sr-customer)]/30 text-[var(--sr-customer)]'
                        : 'bg-white/5 border border-white/5 text-white/50 hover:border-white/15'
                    }`}
                    aria-label={`Select ${c}`}
                  >
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mt-5">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Add a Message</p>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-white/20" />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A fellow Muslim gifted you Iftar 🌙"
                  maxLength={120}
                  className="w-full bg-[var(--sr-surface-raised)] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--sr-customer)]/30 resize-none h-20"
                  aria-label="Gift message"
                />
                <span className="absolute bottom-2 right-3 text-white/20 text-[10px]">{message.length}/120</span>
              </div>
            </div>

            {/* Send Button */}
            <div className="mt-6 pb-4">
              {selectedMealData ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: sending
                      ? 'linear-gradient(135deg, #555, #444)'
                      : 'linear-gradient(135deg, var(--sr-customer), var(--sr-customer))',
                    color: 'var(--sr-surface-base)',
                    boxShadow: sending ? 'none' : '0 4px 20px rgba(16,224,122,0.3)',
                  }}
                  aria-label={`Send ${selectedMealData.name} gift for ${FORMAT_NAIRA(selectedMealData.price)}`}
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-[var(--sr-surface-base)]/30 border-t-[var(--sr-surface-base)] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gift {selectedMealData.name} • {FORMAT_NAIRA(selectedMealData.price)}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 text-white/60 text-sm">
                  <Gift className="w-4 h-4" />
                  Select a meal to gift
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && sentGift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-6"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-full max-w-sm relative overflow-hidden rounded-3xl border border-[var(--sr-customer)]/30"
              style={{ background: 'linear-gradient(135deg, var(--sr-surface-elevated), var(--sr-surface-raised))' }}
              role="dialog"
              aria-modal="true"
              aria-label="Gift sent successfully"
            >
              {/* Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[var(--sr-customer)]/20 blur-[60px]" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[var(--sr-vendor)]/10 blur-[40px]" />

              <div className="relative z-10 p-8 text-center">
                {/* Animated heart */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2, stiffness: 150 }}
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-2"
                  style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--sr-customer) 13%, transparent), color-mix(in srgb, var(--sr-customer) 6%, transparent))',
                    borderColor: 'color-mix(in srgb, var(--sr-customer) 31%, transparent)',
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Heart className="w-10 h-10 text-[var(--sr-customer)]" fill="var(--sr-customer)" />
                  </motion.div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-black text-[var(--sr-customer)] mb-1"
                >
                  Gift Sent! 🌙
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-sm mb-1"
                >
                  {sentGift.meal} gifted in {sentGift.city}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/65 text-xs mb-4"
                >
                  {FORMAT_NAIRA(sentGift.amount)} • A stranger will receive your Iftar gift
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-2 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-[var(--sr-vendor)]" />
                  <span className="text-[var(--sr-vendor)] text-xs font-bold">
                    {city} chain: {giftChainCount + 1} meals gifted!
                  </span>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSuccess(false);
                    setSelectedMeal(null);
                    setMessage('');
                  }}
                  className="w-full py-3.5 rounded-2xl text-[var(--sr-surface-base)] font-black text-sm"
                  style={{
                    background: 'linear-gradient(135deg, var(--sr-customer), var(--sr-customer))',
                    boxShadow: '0 4px 20px rgba(16,224,122,0.4)',
                  }}
                >
                  Send Another Gift 🎁
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
