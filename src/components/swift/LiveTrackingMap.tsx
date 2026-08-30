'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageCircle, Plus, Minus, Navigation, Clock, Bike } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

export default function LiveTrackingMap() {
  const { activeModal, setActiveModal, setActiveTab } = useNavigation();
  const { toast } = useToast();

  const isOpen = activeModal === 'live-tracking-map';
  const [countdown, setCountdown] = useState('12:40');

  // Maghrib countdown timer
  useEffect(() => {
    if (!isOpen) return;
    let minutes = 12;
    let seconds = 40;
    const interval = setInterval(() => {
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(interval);
          return;
        }
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = () => {
    setActiveModal(null);
    setActiveTab('orders');
  };

  const handleCallRider = () => {
    toast({ title: 'Calling Musa... 📞', description: 'Connecting you to your rider' });
  };

  const handleChatRider = () => {
    toast({ title: 'Chat with Musa 💬', description: 'Opening chat with your rider' });
  };

  const statusMessages = [
    'Warm Jollof & Dates Pack being carefully handled',
    'Rider is navigating through Lekki Phase 1',
    'Almost there! Preparing for your Iftar',
    'Your order is on the Golden Route 🌟',
  ];
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % statusMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, statusMessages.length]);

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

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-hidden flex flex-col"
          >
            {/* Simulated Map Background */}
            <div className="absolute inset-0">
              {/* Dark base */}
              <div className="absolute inset-0 bg-[#080c12]" />

              {/* Grid pattern - streets */}
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 80px),
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 80px)
                  `,
                }}
              />

              {/* Major roads - wider lines */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
                {/* Horizontal roads */}
                <line x1="0" y1="30%" x2="100%" y2="30%" stroke="white" strokeWidth="3" />
                <line x1="0" y1="55%" x2="100%" y2="55%" stroke="white" strokeWidth="3" />
                <line x1="0" y1="75%" x2="100%" y2="75%" stroke="white" strokeWidth="2" />
                {/* Vertical roads */}
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="white" strokeWidth="2" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="3" />
                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="white" strokeWidth="2" />
                {/* Diagonal roads */}
                <line x1="10%" y1="0" x2="50%" y2="60%" stroke="white" strokeWidth="2" />
                <line x1="50%" y1="55%" x2="90%" y2="100%" stroke="white" strokeWidth="2" />
              </svg>

              {/* Block buildings */}
              <div className="absolute top-[10%] left-[10%] w-16 h-12 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[35%] left-[30%] w-20 h-10 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[15%] right-[15%] w-14 h-18 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[58%] left-[55%] w-18 h-14 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute bottom-[35%] left-[12%] w-22 h-12 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[40%] right-[8%] w-12 h-20 border border-white/[0.03] bg-white/[0.01] rounded-sm" />

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/60 via-transparent to-[#05070A]" />
              <div className="absolute top-[20%] left-[20%] w-40 h-40 bg-[var(--sr-vendor)]/5 blur-[80px] rounded-full" />
              <div className="absolute bottom-[30%] right-[25%] w-36 h-36 bg-[var(--sr-customer)]/5 blur-[70px] rounded-full" />
            </div>

            {/* SVG Route Overlay */}
            <div className="absolute inset-0 z-[5] pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
                {/* Golden dotted route path */}
                <path
                  d="M 100 180 C 120 250, 180 300, 200 350 S 280 420, 300 500 S 280 580, 260 620"
                  fill="none"
                  stroke="#F5C451"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  opacity="0.8"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-28"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Route glow */}
                <path
                  d="M 100 180 C 120 250, 180 300, 200 350 S 280 420, 300 500 S 280 580, 260 620"
                  fill="none"
                  stroke="#F5C451"
                  strokeWidth="8"
                  strokeDasharray="8 6"
                  opacity="0.15"
                  filter="blur(4px)"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-28"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Restaurant marker (start) */}
                <circle cx="100" cy="180" r="8" fill="#1A1D26" stroke="#F5C451" strokeWidth="2.5" />
                <circle cx="100" cy="180" r="3" fill="#F5C451" />

                {/* Rider marker (along route) */}
                <g>
                  <circle cx="200" cy="350" r="18" fill="#F5C451" opacity="0.1">
                    <animate
                      attributeName="r"
                      values="18;28;18"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.1;0;0.1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="200" cy="350" r="14" fill="#1A1D26" stroke="#F5C451" strokeWidth="2.5" />
                  <circle cx="200" cy="350" r="6" fill="#F5C451" />
                  {/* Bike icon indicator */}
                  <circle cx="200" cy="350" r="2" fill="#05070A" />
                </g>

                {/* Destination marker (end) */}
                <g>
                  <circle cx="260" cy="620" r="18" fill="#10E07A" opacity="0.1">
                    <animate
                      attributeName="r"
                      values="18;26;18"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.1;0;0.1"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="260" cy="620" r="14" fill="#1A1D26" stroke="#10E07A" strokeWidth="2.5" />
                  <circle cx="260" cy="620" r="6" fill="#10E07A" />
                  {/* House icon indicator */}
                  <rect x="256" y="617" width="8" height="6" rx="1" fill="#05070A" />
                </g>

                {/* Labels */}
                <text x="100" y="165" textAnchor="middle" fill="#F5C451" fontSize="10" fontWeight="bold" opacity="0.8">Suya Central</text>
                <text x="260" y="650" textAnchor="middle" fill="#10E07A" fontSize="10" fontWeight="bold" opacity="0.8">Your Location</text>
              </svg>
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Top Bar */}
              <div className="glass-effect border-b border-white/5 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-white text-sm font-bold">Live Iftar Tracking</h2>
                    <p className="text-white/65 text-[10px]">Real-time delivery updates</p>
                  </div>
                  <div className="bg-[#1A1D26] border border-[var(--sr-vendor)]/20 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[var(--sr-vendor)]" />
                    <span className="text-[var(--sr-vendor)] text-xs font-bold">Maghrib in {countdown}</span>
                  </div>
                </div>
              </div>

              {/* Map Controls (floating right) */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                <button
                  onClick={() => toast({ title: 'Zoom In 🔍' })}
                  className="w-11 h-11 rounded-xl bg-[#1A1D26]/90 border border-white/10 flex items-center justify-center glass-effect hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => toast({ title: 'Zoom Out 🔍' })}
                  className="w-11 h-11 rounded-xl bg-[#1A1D26]/90 border border-white/10 flex items-center justify-center glass-effect hover:bg-white/10 transition-colors"
                >
                  <Minus className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => toast({ title: 'Centering Map 📍' })}
                  className="w-11 h-11 rounded-xl bg-[#1A1D26]/90 border border-white/10 flex items-center justify-center glass-effect hover:bg-white/10 transition-colors"
                >
                  <Navigation className="w-4 h-4 text-[var(--sr-customer)]" />
                </button>
              </div>

              {/* Legend (floating left) */}
              <div className="absolute left-4 top-[20%] z-20">
                <div className="bg-[#1A1D26]/80 rounded-xl border border-white/5 p-2.5 glass-effect space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--sr-vendor)]" />
                    <span className="text-white/50 text-[10px]">Rider</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--sr-customer)]" />
                    <span className="text-white/50 text-[10px]">Your Home</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-[var(--sr-vendor)] rounded-full" />
                    <span className="text-white/50 text-[10px]">Route</span>
                  </div>
                </div>
              </div>

              {/* Bottom Tracking Card */}
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 25 }}
                className="mt-auto bg-[#0F1117] rounded-t-3xl border-t border-white/10"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <div className="px-5 pb-6">
                  {/* ETA */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white text-2xl font-black">Arriving in 8 min</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 bg-[var(--sr-customer)] rounded-full"
                        />
                        <span className="text-[var(--sr-customer)] text-sm font-bold">Ready for Iftar</span>
                      </div>
                    </div>
                    <div className="bg-[#1A1D26] border border-white/5 rounded-xl px-3 py-2 text-center">
                      <p className="text-white/60 text-[10px]">Order</p>
                      <p className="text-white text-xs font-bold">#SWR-2847</p>
                    </div>
                  </div>

                  {/* Rider Details */}
                  <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-3 sm:p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5C451]/30 to-[#F5C451]/10 flex items-center justify-center border border-[var(--sr-vendor)]/20 shrink-0">
                        <Bike className="w-5 h-5 text-[var(--sr-vendor)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">Musa</p>
                        <p className="text-white/65 text-xs">Electric Bike &bull; Golden Route Delivery</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCallRider}
                          className="w-11 h-11 rounded-xl bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/20 flex items-center justify-center hover:bg-[var(--sr-vendor)]/20 transition-colors"
                        >
                          <Phone className="w-4.5 h-4.5 text-[var(--sr-vendor)]" />
                        </button>
                        <button
                          onClick={handleChatRider}
                          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <MessageCircle className="w-4.5 h-4.5 text-white/60" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Ticker */}
                  <div className="bg-[#1A1D26]/60 rounded-xl border border-white/5 p-3 mb-4 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="shrink-0 w-1.5 h-1.5 bg-[var(--sr-vendor)] rounded-full"
                      />
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={statusIdx}
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -12, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-white/50 text-xs"
                        >
                          {statusMessages[statusIdx]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    Back to Orders
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
