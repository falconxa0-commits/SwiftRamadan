'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Clock, Package, Trophy, PartyPopper, TrendingDown, Flame } from 'lucide-react';
import { formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface AuctionItem {
  id: number;
  name: string;
  vendor: string;
  startPrice: number;
  currentPrice: number;
  dropRate: number; // amount to drop per minute
  totalStock: number;
  remainingStock: number;
  minutesLeft: number;
  image: string;
  category: string;
  grabbed: boolean;
}

const initialAuctions: AuctionItem[] = [
  {
    id: 1,
    name: 'Suya Platter Premium',
    vendor: 'Mama Aisha Kitchen',
    startPrice: 5000,
    currentPrice: 3500,
    dropRate: 200,
    totalStock: 10,
    remainingStock: 7,
    minutesLeft: 14,
    image: '/images/products/suya-platter.png',
    category: 'Iftar',
    grabbed: false,
  },
  {
    id: 2,
    name: 'Ramadan Fruit Basket',
    vendor: 'Fresh Harvest NG',
    startPrice: 8000,
    currentPrice: 5200,
    dropRate: 300,
    totalStock: 5,
    remainingStock: 3,
    minutesLeft: 9,
    image: '/images/products/fruit-basket.png',
    category: 'Sahur',
    grabbed: false,
  },
  {
    id: 3,
    name: 'Jollof Rice Family Pack',
    vendor: 'Alhaji Bello Foods',
    startPrice: 12000,
    currentPrice: 7800,
    dropRate: 500,
    totalStock: 8,
    remainingStock: 5,
    minutesLeft: 22,
    image: '/images/products/jollof-family.png',
    category: 'Iftar',
    grabbed: false,
  },
];

export default function FlashAuction() {
  const { activeModal, setActiveModal } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'flashAuction';

  const [auctions, setAuctions] = useState<AuctionItem[]>(initialAuctions);
  const [celebrating, setCelebrating] = useState<number | null>(null);
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; x: number; y: number; color: string; size: number }[]>([]);

  const handleClose = useCallback(() => {
    setActiveModal(null);
    setCelebrating(null);
    setConfettiParticles([]);
  }, [setActiveModal]);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  // Countdown and price drop timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setAuctions((prev) =>
        prev.map((auction) => {
          if (auction.grabbed || auction.remainingStock <= 0) return auction;
          const newMinutesLeft = Math.max(0, auction.minutesLeft - 1);
          const newPrice = Math.max(500, auction.currentPrice - auction.dropRate);
          return { ...auction, minutesLeft: newMinutesLeft, currentPrice: newPrice };
        })
      );
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [isOpen]);

  // Simulate faster countdown for demo (every 3 seconds reduces by 1)
  useEffect(() => {
    if (!isOpen) return;
    const fastTick = setInterval(() => {
      setAuctions((prev) =>
        prev.map((auction) => {
          if (auction.grabbed || auction.remainingStock <= 0 || auction.minutesLeft <= 0) return auction;
          return { ...auction, minutesLeft: auction.minutesLeft - 1, currentPrice: Math.max(500, auction.currentPrice - Math.round(auction.dropRate / 20)) };
        })
      );
    }, 3000);
    return () => clearInterval(fastTick);
  }, [isOpen]);

  const handleGrab = (auctionId: number) => {
    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId ? { ...a, grabbed: true, remainingStock: a.remainingStock - 1 } : a
      )
    );
    setCelebrating(auctionId);

    // Generate confetti
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#10E07A', '#F5C451', '#38BDF8', '#A78BFA', '#FF6B6B'][Math.floor(Math.random() * 5)],
      size: Math.random() * 8 + 4,
    }));
    setConfettiParticles(particles);

    const auction = auctions.find((a) => a.id === auctionId);
    toast({
      title: 'Grabbed! 🎉',
      description: `You got "${auction?.name}" for ${formatNaira(auction?.currentPrice ?? 0)}! What a steal!`,
    });

    setTimeout(() => {
      setCelebrating(null);
      setConfettiParticles([]);
    }, 3000);
  };

  const formatTime = (minutes: number) => {
    const m = Math.floor(minutes);
    const s = 0;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#0B0D14] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Flash Auction - grab deals before prices drop"
        >
          {/* Confetti */}
          {confettiParticles.length > 0 && (
            <div className="fixed inset-0 z-[200] pointer-events-none">
              {confettiParticles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, y: 0, x: `${p.x}vw` }}
                  animate={{ opacity: 0, y: '100vh', rotate: 360 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                  className="absolute"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    left: `${p.x}%`,
                    top: -10,
                  }}
                />
              ))}
            </div>
          )}

          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0B0D14]/80 border-b border-white/8">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10E07A]/10 rounded-xl flex items-center justify-center border border-[#10E07A]/20">
                  <Zap className="w-5 h-5 text-[#10E07A]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Flash Auction</h2>
                  <p className="text-white/40 text-xs">Prices drop every minute — Grab fast!</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[#0F1118] border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close auction"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Hero */}
          <div className="relative overflow-hidden px-4 pt-6 pb-8">
            <div className="absolute inset-0 bg-gradient-to-b from-[#10E07A]/5 to-transparent pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center gap-2 bg-[#F5C451]/10 border border-[#F5C451]/20 rounded-full px-4 py-1.5 mb-4">
                <Flame className="w-4 h-4 text-[#F5C451]" />
                <span className="text-[#F5C451] text-xs font-bold">Live Now</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                Price Drops <span className="text-[#10E07A]">Every Minute</span>
              </h1>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                Vendors list limited batches. The price keeps dropping — but stock runs out fast. First to grab wins!
              </p>
            </motion.div>
          </div>

          {/* Auction Items */}
          <div className="px-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Live Auctions</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#10E07A] animate-pulse" />
                <span className="text-[#10E07A] text-xs font-bold">{auctions.filter((a) => !a.grabbed && a.remainingStock > 0 && a.minutesLeft > 0).length} active</span>
              </div>
            </div>

            <div className="space-y-4">
              {auctions.map((auction, index) => {
                const isExpired = auction.minutesLeft <= 0;
                const isSoldOut = auction.remainingStock <= 0;
                const isActive = !auction.grabbed && !isExpired && !isSoldOut;
                const discount = Math.round(((auction.startPrice - auction.currentPrice) / auction.startPrice) * 100);

                return (
                  <motion.div
                    key={auction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="bg-[#0F1118] rounded-2xl border border-white/8 overflow-hidden relative"
                  >
                    {/* Celebration Overlay */}
                    <AnimatePresence>
                      {celebrating === auction.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="absolute inset-0 z-20 bg-[#0B0D14]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.5 }}
                          >
                            <PartyPopper className="w-16 h-16 text-[#F5C451]" />
                          </motion.div>
                          <h3 className="text-white font-black text-xl text-center">You Grabbed It!</h3>
                          <p className="text-[#10E07A] font-bold text-lg">{formatNaira(auction.currentPrice)}</p>
                          <p className="text-white/50 text-sm">Saving {discount}% off original price</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Top Image Area */}
                    <div className="relative h-36 bg-gradient-to-br from-[#10E07A]/10 to-[#F5C451]/5 flex items-center justify-center">
                      <Package className="w-16 h-16 text-white/10" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#F5C451]/90 text-[#0B0D14] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                          {auction.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          -{discount}%
                        </span>
                      </div>
                      {!isActive && (
                        <div className="absolute inset-0 bg-[#0B0D14]/60 flex items-center justify-center">
                          <span className="text-white/80 font-black text-lg uppercase tracking-wider">
                            {isSoldOut ? 'Sold Out' : 'Ended'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="text-white font-bold text-base mb-0.5">{auction.name}</h4>
                      <p className="text-white/40 text-xs mb-3">by {auction.vendor}</p>

                      {/* Price Display */}
                      <div className="flex items-end gap-3 mb-3">
                        <span className="text-white/30 text-sm line-through">{formatNaira(auction.startPrice)}</span>
                        <motion.span
                          key={auction.currentPrice}
                          initial={{ scale: 1.2, color: '#10E07A' }}
                          animate={{ scale: 1, color: '#10E07A' }}
                          className="font-black text-2xl"
                        >
                          {formatNaira(auction.currentPrice)}
                        </motion.span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-3.5 h-3.5 text-[#10E07A]/70" />
                        <span className="text-white/40 text-xs">Drops {formatNaira(auction.dropRate)}/min</span>
                      </div>

                      {/* Countdown + Stock */}
                      <div className="flex items-center gap-3 mb-4">
                        {/* Timer */}
                        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-2 flex-1">
                          <Clock className="w-3.5 h-3.5 text-[#F5C451]" />
                          <span className="text-[#F5C451] font-mono font-bold text-sm">{formatTime(auction.minutesLeft)}</span>
                          <span className="text-white/30 text-xs">left</span>
                        </div>
                        {/* Stock */}
                        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-2 flex-1">
                          <Package className="w-3.5 h-3.5 text-[#A78BFA]" />
                          <span className="text-[#A78BFA] font-bold text-sm">{auction.remainingStock}</span>
                          <span className="text-white/30 text-xs">left</span>
                        </div>
                      </div>

                      {/* Stock Bar */}
                      <div className="w-full bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden">
                        <motion.div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#10E07A] to-[#F5C451]"
                          style={{ width: `${((auction.totalStock - auction.remainingStock) / auction.totalStock) * 100}%` }}
                        />
                      </div>

                      {/* Grab Button */}
                      {isActive ? (
                        <motion.button
                          onClick={() => handleGrab(auction.id)}
                          className="w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 bg-[#10E07A] text-[#0B0D14] relative overflow-hidden"
                          animate={{
                            boxShadow: [
                              '0 0 20px rgba(16,224,122,0.3)',
                              '0 0 40px rgba(16,224,122,0.5)',
                              '0 0 20px rgba(16,224,122,0.3)',
                            ],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          whileTap={{ scale: 0.97 }}
                          aria-label={`Grab ${auction.name} for ${formatNaira(auction.currentPrice)}`}
                        >
                          <Zap className="w-5 h-5" />
                          <span>GRAB NOW</span>
                          <motion.span
                            className="absolute inset-0 bg-white/20"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            style={{ width: '50%' }}
                          />
                        </motion.button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-white/5 border border-white/8 text-white/30 cursor-not-allowed"
                        >
                          <Trophy className="w-4 h-4" />
                          {auction.grabbed ? 'You Grabbed This!' : isSoldOut ? 'Sold Out' : 'Auction Ended'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div className="px-4 mb-8">
            <h3 className="text-white font-bold text-lg mb-4">How Flash Auction Works</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: 1, title: 'Watch Prices Drop', icon: TrendingDown, color: '#10E07A' },
                { step: 2, title: 'Grab Before Others', icon: Zap, color: '#F5C451' },
                { step: 3, title: 'Win the Deal!', icon: Trophy, color: '#A78BFA' },
              ].map((item, idx) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                  className="bg-[#0F1118] rounded-2xl border border-white/8 p-4 text-center"
                >
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center border"
                    style={{ backgroundColor: `${item.color}10`, borderColor: `${item.color}20` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="text-[10px] font-black mb-1" style={{ color: item.color }}>STEP {item.step}</div>
                  <h4 className="text-white font-bold text-xs">{item.title}</h4>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="h-20" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
