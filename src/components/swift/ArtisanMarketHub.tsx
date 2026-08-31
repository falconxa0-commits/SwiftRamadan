'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ExternalLink } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

const artisanCategories = [
  { id: 1, name: 'Handmade Crafts', icon: '🏺', color: 'from-amber-600/20 to-amber-800/10' },
  { id: 2, name: 'Local Spices', icon: '🌶️', color: 'from-red-600/20 to-red-800/10' },
  { id: 3, name: 'Traditional Fabrics', icon: '🧵', color: 'from-purple-600/20 to-purple-800/10' },
  { id: 4, name: 'Pottery', icon: '🫖', color: 'from-orange-600/20 to-orange-800/10' },
  { id: 5, name: 'Jewelry', icon: '💍', color: 'from-[var(--sr-vendor)]/20 to-[var(--sr-vendor)]/5' },
  { id: 6, name: 'Woodwork', icon: '🪵', color: 'from-yellow-800/20 to-yellow-900/10' },
];

const featuredArtisans = [
  {
    id: 1,
    name: 'Aisha\'s Craft Studio',
    specialty: 'Handmade Leather Goods',
    rating: 4.9,
    reviews: 127,
    gradient: 'from-amber-600/30 via-orange-700/20 to-red-900/10',
    icon: '👜',
  },
  {
    id: 2,
    name: 'Lagos Spice Market',
    specialty: 'Premium Local Spices',
    rating: 4.8,
    reviews: 89,
    gradient: 'from-red-600/30 via-rose-700/20 to-pink-900/10',
    icon: '🌶️',
  },
  {
    id: 3,
    name: 'Kano Weaving House',
    specialty: 'Traditional Aso Oke Fabrics',
    rating: 4.7,
    reviews: 64,
    gradient: 'from-purple-600/30 via-indigo-700/20 to-violet-900/10',
    icon: '🧶',
  },
];

export default function ArtisanMarketHub() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();

  const isOpen = activeModal === 'artisan-market';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={() => setActiveModal(null)}
          />

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏪</span>
                  <div>
                    <h2 className="text-white text-lg font-bold">Artisan Market</h2>
                    <p className="text-white/60 text-[10px]">Local crafts & traditional goods</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-8">
              {/* Category Grid */}
              <div className="mt-4 mb-6">
                <h3 className="text-white font-bold text-sm mb-3">Browse Categories</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {artisanCategories.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => toast({ title: `${cat.name} 🛍️`, description: `Browsing ${cat.name} collection` })}
                      className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4 flex flex-col items-center gap-2 hover:border-white/10 transition-all active:scale-95"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center border border-white/5`}>
                        <span className="text-xl">{cat.icon}</span>
                      </div>
                      <span className="text-white/60 text-[11px] font-semibold text-center leading-tight">{cat.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Featured Artisans */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm">Featured Artisans</h3>
                  <button
                    onClick={() => toast({ title: 'All Artisans', description: 'Browse all artisans' })}
                    className="text-[var(--sr-customer)] text-xs font-bold"
                  >
                    See All
                  </button>
                </div>

                <div className="space-y-4">
                  {featuredArtisans.map((artisan, i) => (
                    <motion.div
                      key={artisan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 overflow-hidden"
                    >
                      {/* Image placeholder with gradient */}
                      <div className={`h-32 bg-gradient-to-br ${artisan.gradient} relative flex items-center justify-center`}>
                        <span className="text-5xl opacity-80">{artisan.icon}</span>
                        {/* Decorative pattern overlay */}
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`,
                          }}
                        />
                        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[var(--sr-surface-elevated)] to-transparent" />
                      </div>

                      {/* Info */}
                      <div className="p-4 -mt-3 relative">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-bold text-sm">{artisan.name}</h4>
                            <p className="text-white/65 text-xs mt-0.5">{artisan.specialty}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/20 rounded-lg px-2 py-1">
                            <Star className="w-3 h-3 text-[var(--sr-vendor)]" fill="var(--sr-vendor)" />
                            <span className="text-[var(--sr-vendor)] text-xs font-bold">{artisan.rating}</span>
                            <span className="text-white/60 text-[10px]">({artisan.reviews})</span>
                          </div>
                        </div>

                        <button
                          onClick={() => toast({ title: `Visiting ${artisan.name} 🏪`, description: 'Opening artisan shop' })}
                          className="w-full mt-2 py-2.5 rounded-xl bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[var(--sr-customer)]/20 transition-colors active:scale-[0.98]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Visit Shop
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Ramadan Special Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 bg-gradient-to-r from-[var(--sr-surface-elevated)] to-[var(--sr-surface-raised)] rounded-2xl border border-[var(--sr-vendor)]/10 p-3 sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--sr-vendor)]/10 flex items-center justify-center border border-[var(--sr-vendor)]/20 shrink-0">
                    <span className="text-2xl">🌙</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--sr-vendor)] text-sm font-bold">Ramadan Artisan Fair</p>
                    <p className="text-white/65 text-xs mt-0.5">Special collections for the holy month</p>
                  </div>
                  <button
                    onClick={() => toast({ title: 'Ramadan Fair 🎪', description: 'Exploring Ramadan artisan collections' })}
                    className="px-3 py-1.5 rounded-lg bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/20 text-[var(--sr-vendor)] text-xs font-bold"
                  >
                    Explore
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
