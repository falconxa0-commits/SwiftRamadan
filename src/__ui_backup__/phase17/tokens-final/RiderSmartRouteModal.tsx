'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Clock, MapPin, Zap, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';

const aiRouteDeliveries = [
  {
    id: 'DEL-8829',
    customer: 'Ahmed K.',
    address: '12 Admiralty Way, Lekki Phase 1',
    items: '1x Jollof Rice & Lamb Platter, 2x Zobo',
    distance: '3.2 km',
    estimatedTime: '12 min',
    timeSaved: '8 min',
    priority: 'iftar' as const,
    order: 1,
    eta: '6:30 PM',
  },
  {
    id: 'DEL-8831',
    customer: 'Fatima B.',
    address: '8 Akin Adesola St, Victoria Island',
    items: 'Large Suya Sampler, 4x Masa Cakes',
    distance: '2.1 km',
    estimatedTime: '9 min',
    timeSaved: '5 min',
    priority: 'iftar' as const,
    order: 2,
    eta: '6:38 PM',
  },
  {
    id: 'DEL-8835',
    customer: 'Yusuf M.',
    address: '5 Awolombo Rd, Ikoyi',
    items: '2x Date Smoothie, 1x Moi Moi',
    distance: '4.5 km',
    estimatedTime: '18 min',
    timeSaved: '12 min',
    priority: 'standard' as const,
    order: 3,
    eta: '6:56 PM',
  },
  {
    id: 'DEL-8841',
    customer: 'Halima S.',
    address: '22 Alexander Rd, Ikoyi',
    items: '1x Ramadan Box Premium',
    distance: '1.8 km',
    estimatedTime: '7 min',
    timeSaved: '3 min',
    priority: 'standard' as const,
    order: 4,
    eta: '7:03 PM',
  },
];

const totalTimeSaved = aiRouteDeliveries.reduce((sum, d) => sum + parseInt(d.timeSaved), 0);

export default function RiderSmartRouteModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'rider-smart-route';

  const handleClose = () => {
    setActiveModal(null);
  };

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
            onClick={handleClose}
          />
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[var(--sr-surface-raised)] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                  <Navigation className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">AI Smart Route</h2>
                  <p className="text-white/65 text-xs mt-0.5">Optimized delivery order</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar">
              {/* AI Savings Banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-900/30 to-[#0F1117] border border-cyan-500/20 p-5"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-[40px]" />
                <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                    <Sparkles className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">AI Optimization</p>
                    <p className="text-cyan-400 text-2xl font-black">{totalTimeSaved} min saved</p>
                    <p className="text-white/60 text-xs mt-0.5">{aiRouteDeliveries.length} deliveries optimized</p>
                  </div>
                </div>
              </motion.div>

              {/* Route Timeline */}
              <div className="mt-5">
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Optimized Route
                </h4>
                <div className="space-y-0">
                  {aiRouteDeliveries.map((delivery, i) => (
                    <motion.div
                      key={delivery.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                    >
                      {/* Timeline connector */}
                      {i > 0 && (
                        <div className="flex items-center ml-5 py-1">
                          <div className="w-0.5 h-4 bg-white/10 rounded-full" />
                          <div className="ml-3 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-white/10" />
                            <span className="text-white/20 text-[9px]">
                              {parseInt(aiRouteDeliveries[i].estimatedTime) + parseInt(aiRouteDeliveries[i - 1].estimatedTime) - parseInt(aiRouteDeliveries[i].estimatedTime)} min
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Delivery Card */}
                      <div className={`relative flex gap-3 p-3 sm:p-4 rounded-2xl border transition-all ${
                        delivery.priority === 'iftar'
                          ? 'bg-[var(--sr-vendor)]/5 border-[var(--sr-vendor)]/20'
                          : 'bg-[var(--sr-surface-elevated)] border-white/5'
                      }`}>
                        {/* Order Number Badge */}
                        <div className="shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                            delivery.priority === 'iftar'
                              ? 'bg-[var(--sr-vendor)]/20 text-[var(--sr-vendor)] border border-[var(--sr-vendor)]/30'
                              : 'bg-[var(--sr-rider)]/20 text-[var(--sr-rider)] border border-[var(--sr-rider)]/30'
                          }`}>
                            {delivery.order}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold text-sm truncate">{delivery.customer}</p>
                            {delivery.priority === 'iftar' && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--sr-vendor)]/10 text-[var(--sr-vendor)] border border-[var(--sr-vendor)]/20 shrink-0">
                                IFTAR
                              </span>
                            )}
                          </div>
                          <p className="text-white/65 text-xs mt-0.5 truncate">{delivery.address}</p>
                          <p className="text-white/60 text-[10px] mt-0.5 truncate">{delivery.items}</p>

                          {/* Meta Row */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-white/20" />
                              <span className="text-white/65 text-[10px]">{delivery.distance}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white/20" />
                              <span className="text-white/65 text-[10px]">{delivery.estimatedTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-cyan-400/60" />
                              <span className="text-cyan-400 text-[10px] font-bold">-{delivery.timeSaved}</span>
                            </div>
                          </div>
                        </div>

                        {/* ETA */}
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-black ${delivery.priority === 'iftar' ? 'text-[var(--sr-vendor)]' : 'text-white/60'}`}>
                            {delivery.eta}
                          </p>
                          <p className="text-white/20 text-[9px]">ETA</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Start Route Button */}
              <button
                onClick={() => setActiveModal(null)}
                aria-label="Start Optimized Route"
                className="w-full mt-5 bg-[var(--sr-rider)] py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[var(--sr-rider)]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Navigation className="w-4 h-4" />
                Start Optimized Route
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
