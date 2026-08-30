'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Share2, Plus, Check, Truck, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { groupBuyDeals, formatNaira } from '@/lib/data';
import { useNavigation, useGroupBuy } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

export default function GroupBuyModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { groupBuySlots, joinGroupBuy } = useGroupBuy();
  const { toast } = useToast();
  const isOpen = activeModal === 'groupBuy';

  const handleClose = () => setActiveModal(null);

  const handleJoin = (dealId: number, totalSlots: number) => {
    const slotData = groupBuySlots[dealId];
    if (slotData?.joined) return;
    joinGroupBuy(dealId, totalSlots);
    toast({ title: 'Slot secured! 🎉', description: 'You\'ve joined the group buy. Share with neighbors to fill it faster!' });
  };

  const handleShareWhatsApp = (dealName: string) => {
    const text = encodeURIComponent(`🤝 Join my Group Buy on SwiftRamadan! "${dealName}" - Split the cost and save big together! Download SwiftRamadan to join.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getSlotData = (dealId: number, filledSlots: number, totalSlots: number) => {
    const stored = groupBuySlots[dealId];
    return {
      filled: stored?.filled ?? filledSlots,
      total: stored?.total ?? totalSlots,
      joined: stored?.joined ?? false,
    };
  };

  const howItWorks = [
    { step: 1, title: 'Join a Split', description: 'Pick a deal and secure your slot', icon: 'handshake' },
    { step: 2, title: 'Share with Neighbors', description: 'Invite others to fill remaining slots', icon: 'share' },
    { step: 3, title: 'Save Together', description: 'Once full, everyone gets wholesale prices', icon: 'savings' },
  ];

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
                <div className="w-10 h-10 bg-[var(--sr-customer)]/10 rounded-xl flex items-center justify-center border border-[var(--sr-customer)]/20">
                  <Users className="w-5 h-5 text-[var(--sr-customer)]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Group Buy</h2>
                  <p className="text-white/65 text-xs">Split & Save Together</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[#1A1D26] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="relative overflow-hidden px-4 pt-6 pb-8">
            <div className="absolute inset-0 bg-gradient-to-b from-[#10E07A]/5 to-transparent pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center gap-2 bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/20 rounded-full px-4 py-1.5 mb-4">
                <Sparkles className="w-4 h-4 text-[var(--sr-vendor)]" />
                <span className="text-[var(--sr-vendor)] text-xs font-bold">Save up to 40%</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                Split & Save with{' '}
                <span className="text-[var(--sr-vendor)]">Your Neighbors</span>
              </h1>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                Join community bulk orders and get wholesale prices on groceries, livestock, and Ramadan essentials.
              </p>
            </motion.div>
          </div>

          {/* Active Deals */}
          <div className="px-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Active Deals</h3>
              <span className="text-[var(--sr-customer)] text-xs font-bold">{groupBuyDeals.length} deals live</span>
            </div>
            <div className="space-y-4">
              {groupBuyDeals.map((deal, index) => {
                const slots = getSlotData(deal.id, deal.filledSlots, deal.totalSlots);
                const progress = (slots.filled / slots.total) * 100;
                const slotsLeft = slots.total - slots.filled;

                return (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
                  >
                    {/* Deal Image + Category Badge */}
                    <div className="relative">
                      <div
                        className="w-full h-40 bg-center bg-no-repeat bg-cover"
                        style={{ backgroundImage: `url("${deal.image}")` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D26] via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-[var(--sr-vendor)]/90 text-[#05070A] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                          {deal.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {slotsLeft} slots left
                        </span>
                      </div>
                    </div>

                    {/* Deal Content */}
                    <div className="p-4 -mt-4 relative">
                      <h4 className="text-white font-bold text-base mb-1">{deal.name}</h4>
                      <p className="text-white/65 text-xs mb-3 line-clamp-2">{deal.description}</p>

                      {/* Pricing */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-white/60 text-sm line-through">{formatNaira(deal.originalPrice)}</span>
                        <span className="text-[var(--sr-customer)] font-black text-lg">{formatNaira(deal.perPersonPrice)}</span>
                        <span className="text-white/65 text-[10px]">per person</span>
                      </div>
                      <div className="flex items-center gap-2 mb-4 text-white/60 text-xs">
                        <span>Group price: {formatNaira(deal.salePrice)}</span>
                        <span>•</span>
                        <span className="text-[var(--sr-customer)]/70 font-bold">{Math.round((1 - deal.salePrice / deal.originalPrice) * 100)}% off</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white/50 text-xs font-medium">
                            {slots.filled} of {slots.total} slots filled
                          </span>
                          <span className="text-[var(--sr-customer)] text-xs font-bold">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            className="h-2.5 rounded-full bg-gradient-to-r from-[#10E07A] to-[#10E07A]/70"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Avatar Row */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(slots.filled, 6) }).map((_, i) => (
                            <div
                              key={`avatar-${i}`}
                              className="w-7 h-7 rounded-full border-2 border-[#1A1D26] flex items-center justify-center text-[9px] font-bold"
                              style={{
                                backgroundColor: ['#10E07A', '#F5C451', '#38BDF8', '#f59e0b', '#8b5cf6', '#ec4899'][i % 6],
                                color: '#05070A',
                              }}
                            >
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                          {slots.filled > 6 && (
                            <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-[#1A1D26] flex items-center justify-center text-white/60 text-[9px] font-bold">
                              +{slots.filled - 6}
                            </div>
                          )}
                        </div>
                        <span className="text-white/65 text-xs">
                          {slots.filled} {slots.filled === 1 ? 'person' : 'people'} joined
                        </span>
                      </div>

                      {/* Delivery Date */}
                      <div className="flex items-center gap-2 mb-4 bg-white/5 rounded-lg px-3 py-2">
                        <Truck className="w-4 h-4 text-[var(--sr-customer)]/70" />
                        <span className="text-white/50 text-xs">Guaranteed delivery:</span>
                        <span className="text-white text-xs font-bold">{deal.guaranteedDelivery}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleJoin(deal.id, deal.totalSlots)}
                          disabled={slots.joined}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            slots.joined
                              ? 'bg-white/5 border border-white/10 text-white/65 cursor-not-allowed'
                              : 'bg-[var(--sr-customer)] text-[#05070A] hover:bg-[var(--sr-customer)]/90 active:scale-[0.98]'
                          }`}
                        >
                          {slots.joined ? (
                            <>
                              <Check className="w-4 h-4" />
                              Joined ✓
                            </>
                          ) : (
                            <>
                              Secure My Slot
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(deal.name)}
                          className="px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors"
                          aria-label="Share on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div className="px-4 mb-8">
            <h3 className="text-white font-bold text-lg mb-4">How It Works</h3>
            <div className="grid grid-cols-3 gap-3">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                  className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-[var(--sr-customer)]/10 rounded-xl flex items-center justify-center border border-[var(--sr-customer)]/20">
                    <span className="material-symbols-outlined text-[var(--sr-customer)] text-xl">{item.icon}</span>
                  </div>
                  <div className="text-[var(--sr-customer)] text-[10px] font-black mb-1">STEP {item.step}</div>
                  <h4 className="text-white font-bold text-xs mb-1">{item.title}</h4>
                  <p className="text-white/65 text-[10px] leading-tight">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Create Your Own */}
          <div className="px-4 mb-32">
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              onClick={() => toast({ title: 'Coming Soon! 🚀', description: 'Create your own Group Buy and invite your community.' })}
              className="w-full bg-[#1A1D26] border border-dashed border-[var(--sr-customer)]/30 rounded-2xl p-6 flex items-center gap-4 hover:border-[var(--sr-customer)]/50 transition-colors group"
            >
              <div className="w-14 h-14 bg-[var(--sr-customer)]/10 rounded-2xl flex items-center justify-center border border-[var(--sr-customer)]/20 group-hover:bg-[var(--sr-customer)]/20 transition-colors">
                <Plus className="w-6 h-6 text-[var(--sr-customer)]" />
              </div>
              <div className="text-left flex-1">
                <h4 className="text-white font-bold text-sm">Start Your Own Split</h4>
                <p className="text-white/65 text-xs">Create a Group Buy and invite your community</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[var(--sr-customer)] transition-colors" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
