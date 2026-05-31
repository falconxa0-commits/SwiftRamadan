'use client';

import { motion } from 'framer-motion';
import { Phone, MessageCircle, Plus, Minus, Navigation, Search, Clock, MapPin } from 'lucide-react';
import { riderActiveDeliveries } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function RiderDeliveryMap() {
  const activeDelivery = riderActiveDeliveries[0];
  const [zoom, setZoom] = useState(1);
  const { setActiveTab } = useAppStore();

  const handleCall = () => {
    toast({
      title: 'Calling Musa 📞',
      description: 'Connecting to rider...',
    });
  };

  const handleChat = () => {
    toast({
      title: 'Chat Opened 💬',
      description: 'You can now message the rider',
    });
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-[#05070A]">
      {/* Search Bar at Top */}
      <div className="absolute top-4 left-4 right-4 z-30">
        <div className="glass-effect rounded-2xl border border-white/10 p-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <Search className="w-4 h-4 text-[#13ec13] shrink-0" />
            <span className="text-white/30 text-sm flex-1">15 Bourdillon Rd, Ikoyi</span>
            <MapPin className="w-4 h-4 text-white/20 shrink-0" />
          </div>
        </div>
      </div>

      {/* Simulated Map Background */}
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* CSS Grid Pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Major roads - horizontal */}
        <div className="absolute top-[30%] left-0 right-0 h-[3px] bg-white/[0.06]" />
        <div className="absolute top-[55%] left-0 right-0 h-[3px] bg-white/[0.06]" />
        <div className="absolute top-[78%] left-0 right-0 h-[3px] bg-white/[0.06]" />

        {/* Major roads - vertical */}
        <div className="absolute left-[25%] top-0 bottom-0 w-[3px] bg-white/[0.06]" />
        <div className="absolute left-[50%] top-0 bottom-0 w-[3px] bg-white/[0.06]" />
        <div className="absolute left-[75%] top-0 bottom-0 w-[3px] bg-white/[0.06]" />

        {/* Water body (Lagos lagoon feel) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[15%]"
          style={{
            background: 'linear-gradient(to top, rgba(19, 236, 19, 0.03), transparent)',
          }}
        />

        {/* Block fills */}
        <div className="absolute top-[12%] left-[10%] w-[12%] h-[15%] bg-white/[0.02] rounded" />
        <div className="absolute top-[35%] left-[30%] w-[15%] h-[12%] bg-white/[0.02] rounded" />
        <div className="absolute top-[60%] left-[55%] w-[18%] h-[10%] bg-white/[0.02] rounded" />
        <div className="absolute top-[20%] left-[60%] w-[10%] h-[20%] bg-white/[0.02] rounded" />
        <div className="absolute top-[42%] left-[8%] w-[14%] h-[10%] bg-white/[0.02] rounded" />

        {/* SVG Route Path */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none">
          {/* Golden dotted route */}
          <path
            d="M 130 580 C 130 520, 160 480, 200 440 C 240 400, 220 350, 250 300 C 280 250, 260 200, 240 160"
            fill="none"
            stroke="#FFD700"
            strokeWidth="3"
            strokeDasharray="8 6"
            opacity="0.7"
          />
          {/* Route glow */}
          <path
            d="M 130 580 C 130 520, 160 480, 200 440 C 240 400, 220 350, 250 300 C 280 250, 260 200, 240 160"
            fill="none"
            stroke="#FFD700"
            strokeWidth="8"
            strokeDasharray="8 6"
            opacity="0.1"
          />
        </svg>

        {/* Destination Marker (Gold Pin) - top area */}
        <div className="absolute" style={{ top: '18%', left: '57%' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
            className="relative"
          >
            <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center shadow-lg shadow-[#FFD700]/30">
              <MapPin className="w-4 h-4 text-[#05070A]" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#FFD700]" />
          </motion.div>
        </div>

        {/* Rider Marker (Green Pulsing Dot with Moped) - bottom area */}
        <div className="absolute" style={{ top: '70%', left: '30%' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative"
          >
            {/* Pulse rings */}
            <motion.div
              className="absolute -inset-4 bg-[#13ec13]/10 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -inset-2 bg-[#13ec13]/15 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            {/* Main dot */}
            <div className="w-10 h-10 bg-[#13ec13] rounded-full flex items-center justify-center shadow-lg shadow-[#13ec13]/40 relative z-10">
              <span className="material-symbols-outlined text-[#05070A] text-lg">moped</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ramadan Badge */}
      <div className="absolute top-20 right-4 z-30">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 gold-glow"
        >
          <span className="material-symbols-outlined text-[#FFD700] text-sm">bedtime</span>
          <span className="text-[#FFD700] text-[10px] font-black">Deliver before Iftar</span>
        </motion.div>
      </div>

      {/* Floating Map Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <button
          onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
          className="w-10 h-10 glass-effect rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))}
          className="w-10 h-10 glass-effect rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="w-10 h-10 glass-effect rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Navigation className="w-4 h-4 text-[#13ec13]" />
        </button>
      </div>

      {/* Bottom Sheet Card */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.3 }}
        className="absolute bottom-0 left-0 right-0 z-30"
      >
        <div className="mx-4 mb-4">
          <div className="glass-effect rounded-2xl border border-white/10 p-5">
            {/* ETA Heading */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-lg font-extrabold">Arriving in 8 min</h3>
              <div className="flex items-center gap-1.5 bg-[#13ec13]/10 px-2.5 py-1 rounded-full">
                <span className="size-2 bg-[#13ec13] rounded-full animate-pulse" />
                <span className="text-[#13ec13] text-[10px] font-bold">Ready for Iftar</span>
              </div>
            </div>

            {/* Rider Info */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
              <div className="w-12 h-12 bg-[#13ec13]/15 rounded-full flex items-center justify-center border border-[#13ec13]/20">
                <span className="material-symbols-outlined text-[#13ec13] text-xl">person</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold">Musa</p>
                <p className="text-white/40 text-[10px]">Electric Bike &bull; Golden Route Delivery</p>
              </div>
              <div className="text-right">
                <p className="text-[#13ec13] text-xs font-bold">{activeDelivery?.id || 'DEL-8825'}</p>
                <p className="text-white/30 text-[10px]">65% complete</p>
              </div>
            </div>

            {/* Quick Status Ticker */}
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
              <div className="flex-1 overflow-hidden">
                <motion.div
                  className="flex gap-4 whitespace-nowrap"
                  animate={{ x: [0, -200] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <span className="text-white/50 text-[10px]">Ramadan Box Premium</span>
                  <span className="text-[#FFD700] text-[10px]">•</span>
                  <span className="text-white/50 text-[10px]">Handle with care</span>
                  <span className="text-[#FFD700] text-[10px]">•</span>
                  <span className="text-white/50 text-[10px]">Iftar delivery</span>
                  <span className="text-[#FFD700] text-[10px]">•</span>
                  <span className="text-white/50 text-[10px]">Customer waiting</span>
                  <span className="text-[#FFD700] text-[10px]">•</span>
                  <span className="text-white/50 text-[10px]">Ramadan Box Premium</span>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCall}
                className="flex-1 flex items-center justify-center gap-2 bg-[#13ec13] text-[#05070A] py-3 rounded-xl font-bold text-xs hover:bg-[#13ec13]/90 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Rider
              </button>
              <button
                onClick={handleChat}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold text-xs hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
