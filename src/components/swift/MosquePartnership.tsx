'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Plus,
  Minus,
  Package,
  Clock,
  CheckCircle2,
  Landmark as MosqueIcon,
  ChevronRight,
  Sparkles,
  AlertCircle,
  ShoppingCart,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

/* ───────── Types ───────── */

interface MosqueOrder {
  id: string;
  mosqueName: string;
  mosqueArea: string;
  mosqueEmoji: string;
  totalPacks: number;
  packsClaimed: number;
  pricePerPack: number;
  deadline: string;
  menuDescription: string;
  isJoined: boolean;
  myPacks: number;
  partners: number;
  status: 'open' | 'closing_soon' | 'fulfilled';
  deliveryTime: string;
}

/* ───────── Mock Data ───────── */

const INITIAL_ORDERS: MosqueOrder[] = [
  {
    id: 'mo-1',
    mosqueName: 'Al-Huda Mosque',
    mosqueArea: 'Lekki Phase 1',
    mosqueEmoji: '🕌',
    totalPacks: 200,
    packsClaimed: 153,
    pricePerPack: 1500,
    deadline: '2h 15m left',
    menuDescription: 'Jollof rice, chicken, dates, zobo & water',
    isJoined: true,
    myPacks: 5,
    partners: 34,
    status: 'open',
    deliveryTime: '5:45 PM (before Maghrib)',
  },
  {
    id: 'mo-2',
    mosqueName: 'Central Mosque Ikeja',
    mosqueArea: 'Ikeja GRA',
    mosqueEmoji: '🕌',
    totalPacks: 500,
    packsClaimed: 453,
    pricePerPack: 1200,
    deadline: '45m left',
    menuDescription: 'Rice & stew, moin-moin, dates, kunu',
    isJoined: false,
    myPacks: 0,
    partners: 67,
    status: 'closing_soon',
    deliveryTime: '5:30 PM (before Maghrib)',
  },
  {
    id: 'mo-3',
    mosqueName: 'Ansar-Ud-Deen Mosque',
    mosqueArea: 'Surulere',
    mosqueEmoji: '🕌',
    totalPacks: 150,
    packsClaimed: 150,
    pricePerPack: 1800,
    deadline: 'Fulfilled',
    menuDescription: 'Special iftar: Fried rice, chicken, salad, chapman',
    isJoined: true,
    myPacks: 3,
    partners: 42,
    status: 'fulfilled',
    deliveryTime: '5:00 PM',
  },
  {
    id: 'mo-4',
    mosqueName: 'Yaba Muslim Community',
    mosqueArea: 'Yaba',
    mosqueEmoji: '🌙',
    totalPacks: 100,
    packsClaimed: 38,
    pricePerPack: 1000,
    deadline: '5h left',
    menuDescription: 'Beans porridge, bread, dates, water',
    isJoined: false,
    myPacks: 0,
    partners: 12,
    status: 'open',
    deliveryTime: '6:00 PM',
  },
  {
    id: 'mo-5',
    mosqueName: 'Victoria Island Islamic Centre',
    mosqueArea: 'Victoria Island',
    mosqueEmoji: '🕌',
    totalPacks: 300,
    packsClaimed: 210,
    pricePerPack: 2000,
    deadline: '3h left',
    menuDescription: 'Premium iftar: Ofada rice, assun, smoothies, dessert',
    isJoined: false,
    myPacks: 0,
    partners: 48,
    status: 'open',
    deliveryTime: '5:30 PM',
  },
];

/* ───────── Format helper ───────── */

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */

function MosquePartnershipInner() {
  const { activeModal, setActiveModal } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'mosque-partnership';

  const [orders, setOrders] = useState<MosqueOrder[]>(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [joinPacks, setJoinPacks] = useState(10);
  const [showJoinForm, setShowJoinForm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'joined'>('all');

  const handleClose = () => {
    setActiveModal(null);
    setSelectedOrder(null);
    setShowJoinForm(null);
    setJoinPacks(10);
  };

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showJoinForm) {
          setShowJoinForm(null);
        } else if (selectedOrder) {
          setSelectedOrder(null);
        } else {
          handleClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showJoinForm, selectedOrder]);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'open') return o.status !== 'fulfilled';
    if (filter === 'joined') return o.isJoined;
    return true;
  });

  const totalCommunityPacks = orders.reduce((sum, o) => sum + o.packsClaimed, 0);
  const totalPartnerMosques = orders.length;

  const handleJoinOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.status !== 'fulfilled') {
          const newClaimed = Math.min(o.packsClaimed + joinPacks, o.totalPacks);
          const isNowFulfilled = newClaimed >= o.totalPacks;
          return {
            ...o,
            packsClaimed: newClaimed,
            isJoined: true,
            myPacks: o.myPacks + joinPacks,
            partners: o.partners + 1,
            status: isNowFulfilled ? 'fulfilled' : o.status === 'closing_soon' ? 'closing_soon' : 'open',
            deadline: isNowFulfilled ? 'Fulfilled' : o.deadline,
          };
        }
        return o;
      })
    );

    const order = orders.find((o) => o.id === orderId);
    toast({
      title: 'Joined! 🎉',
      description: `${joinPacks} packs added to ${order?.mosqueName || 'the order'}. Community buying power!`,
    });

    setShowJoinForm(null);
    setJoinPacks(10);
  };

  const getStatusColor = (status: MosqueOrder['status']) => {
    switch (status) {
      case 'open':
        return '#10E07A';
      case 'closing_soon':
        return '#F5C451';
      case 'fulfilled':
        return '#A78BFA';
    }
  };

  const getStatusBg = (status: MosqueOrder['status']) => {
    switch (status) {
      case 'open':
        return 'rgba(16,224,122,0.12)';
      case 'closing_soon':
        return 'rgba(245,196,81,0.12)';
      case 'fulfilled':
        return 'rgba(167,139,250,0.12)';
    }
  };

  const getStatusBorder = (status: MosqueOrder['status']) => {
    switch (status) {
      case 'open':
        return 'rgba(16,224,122,0.25)';
      case 'closing_soon':
        return 'rgba(245,196,81,0.25)';
      case 'fulfilled':
        return 'rgba(167,139,250,0.25)';
    }
  };

  const getStatusLabel = (status: MosqueOrder['status']) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'closing_soon':
        return 'Closing Soon';
      case 'fulfilled':
        return 'Fulfilled ✓';
    }
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
            className="fixed inset-0 bg-black/70 z-[70]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[95vh] bg-[#0B0D14] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/8"
            role="dialog"
            aria-modal="true"
            aria-label="Mosque Partnership Hub"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between p-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(245,196,81,0.15)', border: '1px solid rgba(245,196,81,0.3)' }}
                >
                  <MosqueIcon className="w-4 h-4" style={{ color: '#F5C451' }} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">Mosque Partnership</h2>
                  <p className="text-white/45 text-xs">Community buying power for Iftar</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* ── Stats Banner ── */}
            <div className="px-4 pt-4 shrink-0">
              <div className="rounded-2xl p-4 border border-white/8 relative overflow-hidden" style={{ backgroundColor: '#0F1118' }}>
                {/* Decorative glow */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px]"
                  style={{ backgroundColor: 'rgba(245,196,81,0.1)' }}
                />

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-[#F5C451] text-xl font-black">{totalCommunityPacks}</p>
                    <p className="text-white/35 text-[10px] uppercase tracking-wider mt-0.5">Packs Ordered</p>
                  </div>
                  <div className="w-px h-10 bg-white/8" />
                  <div className="flex-1 text-center">
                    <p className="text-[#10E07A] text-xl font-black">{totalPartnerMosques}</p>
                    <p className="text-white/35 text-[10px] uppercase tracking-wider mt-0.5">Partner Mosques</p>
                  </div>
                  <div className="w-px h-10 bg-white/8" />
                  <div className="flex-1 text-center">
                    <p className="text-[#A78BFA] text-xl font-black">
                      {orders.filter((o) => o.isJoined).length}
                    </p>
                    <p className="text-white/35 text-[10px] uppercase tracking-wider mt-0.5">You Joined</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Filter Tabs ── */}
            <div className="px-4 mt-3 flex gap-2 shrink-0">
              {(['all', 'open', 'joined'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    filter === f
                      ? 'text-[#0B0D14]'
                      : 'bg-white/5 text-white/50 border border-white/8'
                  }`}
                  style={filter === f ? { backgroundColor: '#F5C451' } : undefined}
                >
                  {f === 'all' ? 'All Orders' : f === 'open' ? 'Open' : 'My Orders'}
                </button>
              ))}
            </div>

            {/* ── Scrollable Order Cards ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 mt-3 pb-6 space-y-3">
              {filteredOrders.map((order, i) => {
                const statusColor = getStatusColor(order.status);
                const statusBg = getStatusBg(order.status);
                const statusBorder = getStatusBorder(order.status);
                const progressPercent = (order.packsClaimed / order.totalPacks) * 100;
                const packsRemaining = order.totalPacks - order.packsClaimed;
                const isSelected = selectedOrder === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4 border transition-all"
                    style={{
                      backgroundColor: '#0F1118',
                      borderColor: isSelected ? statusBorder : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {/* Mosque header */}
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setSelectedOrder(isSelected ? null : order.id)}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: statusBg, border: `1px solid ${statusBorder}` }}
                      >
                        {order.mosqueEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold text-sm truncate">{order.mosqueName}</h4>
                          {order.isJoined && (
                            <span
                              className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ backgroundColor: 'rgba(16,224,122,0.12)', color: '#10E07A' }}
                            >
                              JOINED
                            </span>
                          )}
                        </div>
                        <p className="text-white/35 text-xs mt-0.5">{order.mosqueArea}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                          <span className="text-white/30 text-[10px] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {order.deadline}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-1" />
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/40 text-[10px] uppercase tracking-wider">Order Progress</span>
                        <span className="text-xs font-semibold" style={{ color: statusColor }}>
                          {order.packsClaimed}/{order.totalPacks} packs
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2.5 relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                          className="h-2.5 rounded-full relative"
                          style={{ backgroundColor: statusColor }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </motion.div>
                      </div>
                      <p className="text-white/30 text-[10px] mt-1">
                        {packsRemaining > 0 ? `${packsRemaining} left — want to add yours?` : 'All packs claimed!'}
                      </p>
                    </div>

                    {/* Menu description */}
                    <div className="mt-3 p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <p className="text-white/50 text-xs">{order.menuDescription}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[#F5C451] text-xs font-bold">{formatNaira(order.pricePerPack)}/pack</span>
                        <span className="text-white/30 text-[10px] flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          {order.partners} partners
                        </span>
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
                            {/* Delivery time */}
                            <div className="flex items-center gap-2">
                              <Package className="w-3.5 h-3.5 text-[#10E07A]" />
                              <span className="text-white/50 text-xs">Delivery: {order.deliveryTime}</span>
                            </div>

                            {/* My packs (if joined) */}
                            {order.isJoined && (
                              <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(16,224,122,0.06)', border: '1px solid rgba(16,224,122,0.15)' }}>
                                <div>
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Your Contribution</p>
                                  <p className="text-[#10E07A] text-lg font-black">{order.myPacks} packs</p>
                                </div>
                                <p className="text-[#10E07A] text-sm font-bold">{formatNaira(order.myPacks * order.pricePerPack)}</p>
                              </div>
                            )}

                            {/* Action buttons */}
                            {order.status !== 'fulfilled' && (
                              <div className="flex gap-2">
                                {!order.isJoined ? (
                                  <button
                                    onClick={() => setShowJoinForm(order.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                                    style={{ backgroundColor: '#F5C451', color: '#0B0D14' }}
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    Join Order
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setShowJoinForm(order.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                                    style={{ backgroundColor: 'rgba(16,224,122,0.12)', color: '#10E07A', border: '1px solid rgba(16,224,122,0.25)' }}
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add More Packs
                                  </button>
                                )}
                              </div>
                            )}

                            {order.status === 'fulfilled' && (
                              <div
                                className="flex items-center gap-2 p-3 rounded-xl"
                                style={{ backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
                              >
                                <CheckCircle2 className="w-4 h-4" style={{ color: '#A78BFA' }} />
                                <span className="text-[#A78BFA] text-xs font-semibold">
                                  Order fulfilled — {order.totalPacks} packs will be delivered before Maghrib, insha Allah
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-white/30 text-sm">No orders found for this filter</p>
                </div>
              )}
            </div>

            {/* ── Join Form Overlay ── */}
            <AnimatePresence>
              {showJoinForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0B0D14]/95 z-[90] flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/8 shrink-0">
                    <h3 className="text-white font-bold text-base">Join Mosque Order</h3>
                    <button
                      onClick={() => {
                        setShowJoinForm(null);
                        setJoinPacks(10);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5"
                      aria-label="Close join form"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Mosque info */}
                    {(() => {
                      const order = orders.find((o) => o.id === showJoinForm);
                      if (!order) return null;
                      return (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8" style={{ backgroundColor: '#0F1118' }}>
                            <span className="text-2xl">{order.mosqueEmoji}</span>
                            <div>
                              <h4 className="text-white font-bold text-sm">{order.mosqueName}</h4>
                              <p className="text-white/35 text-xs">{order.mosqueArea}</p>
                            </div>
                          </div>

                          {/* Pack selector */}
                          <div>
                            <label className="text-white/40 text-[10px] uppercase tracking-wider mb-3 block">
                              How many packs?
                            </label>
                            <div className="flex items-center justify-center gap-6">
                              <button
                                onClick={() => setJoinPacks(Math.max(1, joinPacks - 5))}
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/8 bg-white/5 hover:bg-white/10 transition-colors active:scale-95"
                                aria-label="Decrease packs"
                              >
                                <Minus className="w-5 h-5 text-white/60" />
                              </button>
                              <div className="text-center">
                                <p className="text-white text-4xl font-black">{joinPacks}</p>
                                <p className="text-white/30 text-xs mt-1">packs</p>
                              </div>
                              <button
                                onClick={() => setJoinPacks(Math.min(100, joinPacks + 5))}
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/8 bg-white/5 hover:bg-white/10 transition-colors active:scale-95"
                                aria-label="Increase packs"
                              >
                                <Plus className="w-5 h-5 text-white/60" />
                              </button>
                            </div>

                            {/* Quick select */}
                            <div className="flex gap-2 justify-center mt-3">
                              {[5, 10, 25, 50].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => setJoinPacks(num)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                                  style={{
                                    backgroundColor: joinPacks === num ? 'rgba(245,196,81,0.15)' : 'rgba(255,255,255,0.05)',
                                    color: joinPacks === num ? '#F5C451' : 'rgba(255,255,255,0.4)',
                                    border: `1px solid ${joinPacks === num ? 'rgba(245,196,81,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                  }}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cost summary */}
                          <div className="rounded-2xl p-4 border border-white/8 space-y-2" style={{ backgroundColor: '#0F1118' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-white/40 text-xs">Price per pack</span>
                              <span className="text-white text-xs font-medium">{formatNaira(order.pricePerPack)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/40 text-xs">Quantity</span>
                              <span className="text-white text-xs font-medium">× {joinPacks}</span>
                            </div>
                            <div className="h-px bg-white/8 my-1" />
                            <div className="flex items-center justify-between">
                              <span className="text-white font-semibold text-sm">Total</span>
                              <span className="text-[#F5C451] text-lg font-black">
                                {formatNaira(joinPacks * order.pricePerPack)}
                              </span>
                            </div>
                          </div>

                          {/* Community impact */}
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(16,224,122,0.06)', border: '1px solid rgba(16,224,122,0.15)' }}>
                            <Sparkles className="w-5 h-5 shrink-0" style={{ color: '#10E07A' }} />
                            <p className="text-white/50 text-xs">
                              Joining this order feeds <span className="text-[#10E07A] font-bold">{joinPacks} people</span> at your mosque. Community buying power = lower prices for everyone!
                            </p>
                          </div>

                          {/* Submit */}
                          <button
                            onClick={() => handleJoinOrder(showJoinForm)}
                            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                            style={{ backgroundColor: '#F5C451', color: '#0B0D14' }}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Confirm {joinPacks} Packs — {formatNaira(joinPacks * order.pricePerPack)}
                            </span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default React.memo(MosquePartnershipInner);
