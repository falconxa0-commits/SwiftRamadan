'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Gift, Star, TrendingUp, Heart, Clock, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useNavigation, usePostRamadan } from '@/lib/store-selectors';

interface RamadanReview {
  fastsCompleted: number;
  mealsOrdered: number;
  newDishesTried: number;
  giftsSent: number;
  totalSpent: number;
  favoriteMeal: string;
  mostOrderedCategory: string;
  longestStreak: number;
  communityMealsShared: number;
  prayersLogged: number;
  charitiesGiven: number;
  totalHasanatEarned: number;
}

interface EidBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  items: string[];
}

interface PostRamadanData {
  eidGreeting: string;
  ramadanReview: RamadanReview;
  eidBundles: EidBundle[];
  confettiColors: string[];
}

const FALLBACK_DATA: PostRamadanData = {
  eidGreeting: 'Eid Mubarak! 🎉',
  ramadanReview: {
    fastsCompleted: 30,
    mealsOrdered: 42,
    newDishesTried: 8,
    giftsSent: 3,
    totalSpent: 285000,
    favoriteMeal: 'Jollof Rice & Grilled Chicken',
    mostOrderedCategory: 'Iftar Meals',
    longestStreak: 14,
    communityMealsShared: 5,
    prayersLogged: 87,
    charitiesGiven: 3,
    totalHasanatEarned: 2450,
  },
  eidBundles: [
    { id: 'eid-1', name: 'Eid Celebration Box', description: 'Complete festive meal for the whole family', price: 35000, originalPrice: 45000, image: '/images/products/ramadan-box-1.png', items: ['Rice Platter (6)', 'Suya Platter', 'Chapman (6)', 'Dates Box', 'Dessert Platter'] },
    { id: 'eid-2', name: 'Eid Gift Hamper', description: 'Beautiful gift package for loved ones', price: 15000, originalPrice: 20000, image: '/images/products/ramadan-box-2.png', items: ['Premium Dates', 'Arabic Perfume', 'Prayer Beads', 'Gift Card ₦5000'] },
    { id: 'eid-3', name: 'Kids Eid Special', description: 'Fun meals and treats for the little ones', price: 8000, originalPrice: 12000, image: '/images/products/ramadan-box-3.png', items: ['Mini Pizza (4)', 'Fruit Punch', 'Chocolate Box', 'Party Pack'] },
  ],
  confettiColors: ['#10E07A', '#F5C451', '#A78BFA', '#FB7185', '#38BDF8'],
};

// Confetti particle component
function ConfettiParticle({ color, delay, x }: { color: string; delay: number; x: number }) {
  return (
    <motion.div
      className="absolute top-0 w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: `${x}%` }}
      initial={{ y: -10, opacity: 0, rotate: 0 }}
      animate={{
        y: ['0vh', '100vh'],
        opacity: [0, 1, 1, 0],
        rotate: [0, 360, 720],
        x: [0, (Math.random() - 0.5) * 100],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Star; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-[#0F1118] border border-white/5"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-white/65">{label}</p>
      </div>
    </motion.div>
  );
}

export default function PostRamadanMode() {
  const { activeModal, setActiveModal } = useNavigation();
  const { isPostRamadan, setIsPostRamadan } = usePostRamadan();
  const isOpen = activeModal === 'post-ramadan';

  const [data, setData] = useState<PostRamadanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const openRef = useRef(false);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { openRef.current = isOpen; }, [isOpen]);

  // Fetch data — inline fetch with setState only in async callbacks
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    void fetch('/api/post-ramadan')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && openRef.current) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled && openRef.current) {
          setData(FALLBACK_DATA);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [isOpen]);

  // Show confetti when post-Ramadan mode is enabled
  useEffect(() => {
    if (!isPostRamadan || !isOpen) return;
    confettiTimerRef.current = setTimeout(() => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    }, 100);
    return () => { if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current); };
  }, [isPostRamadan, isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, setActiveModal]);

  const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;

  const handleCelebrate = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 6000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Post-Ramadan Mode"
        >
          {/* Confetti */}
          {showConfetti && data && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
              {data.confettiColors.flatMap((color, ci) =>
                Array.from({ length: 6 }, (_, i) => (
                  <ConfettiParticle
                    key={`${ci}-${i}`}
                    color={color}
                    delay={ci * 0.3 + i * 0.15}
                    x={10 + ci * 18 + (Math.random() - 0.5) * 10}
                  />
                ))
              )}
            </div>
          )}

          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar rounded-t-3xl sm:rounded-3xl border border-white/8"
            style={{ background: 'linear-gradient(180deg, #11141C 0%, #0B0D14 100%)' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header with Eid greeting */}
            <div className="sticky top-0 z-10 px-6 pt-6 pb-4" style={{ background: 'linear-gradient(180deg, #11141C 0%, rgba(17,20,28,0.95) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="icon-tile w-10 h-10 border border-[#F5C451]/20" style={{ background: 'rgba(245,196,81,0.12)' }}>
                    <PartyPopper className="w-5 h-5 text-[#F5C451]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Post-Ramadan</h2>
                    <p className="text-xs text-white/50">Eid celebration mode</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Eid Mubarak banner */}
              {isPostRamadan && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 rounded-2xl text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,224,122,0.12) 0%, rgba(245,196,81,0.12) 50%, rgba(167,139,250,0.08) 100%)',
                    border: '1px solid rgba(245,196,81,0.25)',
                  }}
                >
                  <motion.p
                    className="text-2xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #10E07A 0%, #F5C451 50%, #A78BFA 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {data?.eidGreeting || 'Eid Mubarak! 🎉'}
                  </motion.p>
                </motion.div>
              )}
            </div>

            <div className="px-6 pb-8 space-y-6">
              {/* Post-Ramadan toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0F1118] border border-white/8">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#10E07A]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Post-Ramadan Mode</p>
                    <p className="text-xs text-white/65">Enable Eid celebration theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPostRamadan(!isPostRamadan)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                    isPostRamadan ? 'bg-[#10E07A]' : 'bg-white/10'
                  }`}
                  role="switch"
                  aria-checked={isPostRamadan}
                  aria-label="Toggle post-Ramadan mode"
                >
                  <motion.div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg"
                    animate={{ left: isPostRamadan ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {isPostRamadan && data && (
                <>
                  {/* Your Ramadan in Review */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-white/70">Your Ramadan in Review</p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl border border-white/8 relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16,224,122,0.06) 0%, #0F1118 50%, rgba(245,196,81,0.06) 100%)',
                      }}
                    >
                      {/* Decorative corner */}
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ background: 'radial-gradient(circle, #10E07A, transparent 70%)' }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={Star} label="Fasts Completed" value={data.ramadanReview.fastsCompleted} color="#10E07A" />
                        <StatCard icon={UtensilsCrossed} label="Meals Ordered" value={data.ramadanReview.mealsOrdered} color="#F5C451" />
                        <StatCard icon={TrendingUp} label="New Dishes Tried" value={data.ramadanReview.newDishesTried} color="#A78BFA" />
                        <StatCard icon={Gift} label="Gifts Sent" value={data.ramadanReview.giftsSent} color="#FB7185" />
                        <StatCard icon={Clock} label="Longest Streak" value={`${data.ramadanReview.longestStreak} days`} color="#38BDF8" />
                        <StatCard icon={Heart} label="Community Shared" value={data.ramadanReview.communityMealsShared} color="#10E07A" />
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5">
                        <p className="text-xs text-white/65 mb-1">Total Spent</p>
                        <p className="text-xl font-bold text-[#F5C451]">{formatNaira(data.ramadanReview.totalSpent)}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/60">Favorite Meal</p>
                          <p className="text-sm text-white/70">{data.ramadanReview.favoriteMeal}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60">Hasanat Earned</p>
                          <p className="text-sm font-bold text-[#10E07A]">{data.ramadanReview.totalHasanatEarned.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Eid Gift Bundles */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#FB7185]" />
                      <p className="text-sm font-semibold text-white/70">Eid Gift Bundles</p>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {data.eidBundles.map((bundle, i) => (
                        <motion.div
                          key={bundle.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 rounded-2xl bg-[#0F1118] border border-white/8 hover:border-[#10E07A]/20 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-xl bg-[#10E07A]/10 flex items-center justify-center flex-shrink-0">
                              <Gift className="w-6 h-6 text-[#10E07A]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">{bundle.name}</p>
                              <p className="text-xs text-white/65 mt-0.5">{bundle.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-bold text-[#10E07A]">{formatNaira(bundle.price)}</span>
                                <span className="text-xs text-white/60 line-through">{formatNaira(bundle.originalPrice)}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#10E07A]/15 text-[#10E07A]">
                                  {Math.round((1 - bundle.price / bundle.originalPrice) * 100)}% OFF
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {bundle.items.slice(0, 3).map((item) => (
                                  <span key={item} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                                    {item}
                                  </span>
                                ))}
                                {bundle.items.length > 3 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                                    +{bundle.items.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Confetti trigger */}
                  <button
                    onClick={handleCelebrate}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                    style={{
                      background: 'linear-gradient(135deg, #10E07A 0%, #F5C451 100%)',
                      color: '#04140C',
                    }}
                  >
                    🎉 Celebrate Eid!
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
