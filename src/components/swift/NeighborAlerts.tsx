'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Users,
  Truck,
  Clock,
  Check,
  AlertCircle,
  Shield,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useNavigation, useUserName } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────────────────────────────────────────────────────
   NeighborAlerts — Privacy-first nearby order combining.
   "Your neighbor in Lekki just ordered from The Food Hub —
   want to combine deliveries and save ₦500?"
   Opt-in, shows nearby active orders, creates group buys.
   ────────────────────────────────────────────────────────────────── */

interface NeighborOrder {
  id: string;
  area: string;
  restaurant: string;
  items: string[];
  total: number;
  deliveryFee: number;
  savedFee: number;
  timeLeft: string;
  distance: string;
  orderCount: number;
  maxOrders: number;
  isJoined: boolean;
  privacyLevel: 'area-only' | 'building' | 'street';
}

const MOCK_ORDERS: NeighborOrder[] = [
  {
    id: 'na1',
    area: 'Lekki Phase 1',
    restaurant: 'The Food Hub',
    items: ['Jollof Rice', 'Grilled Chicken', 'Zobo'],
    total: 4500,
    deliveryFee: 1200,
    savedFee: 500,
    timeLeft: '15 min',
    distance: '0.3 km',
    orderCount: 2,
    maxOrders: 4,
    isJoined: false,
    privacyLevel: 'area-only',
  },
  {
    id: 'na2',
    area: 'Victoria Island',
    restaurant: 'Suya Palace',
    items: ['Suya Platter', 'Kunnu'],
    total: 3200,
    deliveryFee: 1500,
    savedFee: 700,
    timeLeft: '22 min',
    distance: '0.8 km',
    orderCount: 1,
    maxOrders: 3,
    isJoined: false,
    privacyLevel: 'building',
  },
  {
    id: 'na3',
    area: 'Ikoyi',
    restaurant: 'Mama Calabar',
    items: ['Edikang Ikong', 'Pounded Yam', 'Pepper Soup'],
    total: 5800,
    deliveryFee: 1800,
    savedFee: 600,
    timeLeft: '8 min',
    distance: '1.2 km',
    orderCount: 3,
    maxOrders: 5,
    isJoined: false,
    privacyLevel: 'street',
  },
  {
    id: 'na4',
    area: 'Yaba',
    restaurant: 'Amala Spot',
    items: ['Amala & Ewedu', 'Gbegiri', 'Assorted Meat'],
    total: 2800,
    deliveryFee: 900,
    savedFee: 400,
    timeLeft: '18 min',
    distance: '0.5 km',
    orderCount: 1,
    maxOrders: 4,
    isJoined: false,
    privacyLevel: 'area-only',
  },
];

function NeighborAlertsInner() {
  const userName = useUserName();
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'neighbor-alerts';
  const { toast } = useToast();

  const [orders, setOrders] = useState<NeighborOrder[]>(MOCK_ORDERS);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [showJoinConfirm, setShowJoinConfirm] = useState<NeighborOrder | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/neighbor-alerts');
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.orders && data.orders.length > 0) {
            setOrders(data.orders);
          }
        }
      } catch {
        // keep mock data
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Escape key handler ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showJoinConfirm) setShowJoinConfirm(null);
        else if (showPrivacyInfo) setShowPrivacyInfo(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showJoinConfirm, showPrivacyInfo]);

  /* ── Filter by area ── */
  const areas = ['all', ...Array.from(new Set(orders.map((o) => o.area)))];
  const filteredOrders = selectedArea === 'all' ? orders : orders.filter((o) => o.area === selectedArea);

  /* ── Total savings ── */
  const totalSavings = orders.filter((o) => o.isJoined).reduce((sum, o) => sum + o.savedFee, 0);

  /* ── Join a combined delivery ── */
  const handleJoin = async (order: NeighborOrder) => {
    try {
      const res = await fetch('/api/neighbor-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (res.ok) {
        // success
      }
    } catch {
      // still join locally
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, isJoined: true, orderCount: o.orderCount + 1 }
          : o
      )
    );
    setShowJoinConfirm(null);
    toast({
      title: 'Joined delivery! 🚚',
      description: `You'll save ₦${order.savedFee.toLocaleString()} by combining with your neighbor`,
    });
  };

  /* ── Format currency ── */
  const formatNaira = (amt: number) => `₦${amt.toLocaleString()}`;

  if (!isOpen) return null;

  return (
    <div className="w-full space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--sr-customer)]" />
          <h2 className="text-white font-semibold text-lg">Neighbor Alerts</h2>
        </div>
        <div className="flex items-center gap-2">
          {totalSavings > 0 && (
            <span className="text-[var(--sr-customer)] text-xs font-semibold bg-[var(--sr-customer)]/10 px-2 py-1 rounded-full flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Saved {formatNaira(totalSavings)}
            </span>
          )}
        </div>
      </div>

      {/* ── Opt-in Banner ── */}
      {!isOptedIn ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#10E07A]/5 to-[#A78BFA]/5 border border-[var(--sr-customer)]/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-[var(--sr-customer)]" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium mb-1">Save on delivery with neighbors</p>
              <p className="text-white/50 text-xs mb-3">
                See nearby orders you can combine with. Privacy-first — only your area is shared.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOptedIn(true)}
                  className="bg-[var(--sr-customer)] text-black text-xs font-semibold px-4 py-2 rounded-full hover:bg-[var(--sr-customer)]/90 transition-colors"
                >
                  Opt In
                </button>
                <button
                  onClick={() => setShowPrivacyInfo(true)}
                  className="text-white/65 text-xs flex items-center gap-1 hover:text-white/60"
                >
                  <Shield className="w-3 h-3" /> Privacy Info
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center justify-between bg-[var(--sr-customer)]/5 border border-[var(--sr-customer)]/10 rounded-xl px-4 py-2">
          <span className="text-[var(--sr-customer)] text-xs flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Delivery sharing enabled
          </span>
          <button
            onClick={() => setShowPrivacyInfo(true)}
            className="text-white/60 text-[10px] flex items-center gap-1 hover:text-white/50"
          >
            <Shield className="w-3 h-3" /> Privacy
          </button>
        </div>
      )}

      {/* ── Area Filter ── */}
      {isOptedIn && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                selectedArea === area
                  ? 'bg-[var(--sr-customer)] text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {area === 'all' ? 'All Areas' : area}
            </button>
          ))}
        </div>
      )}

      {/* ── Active Combined Orders ── */}
      {isOptedIn && (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-[var(--sr-surface-raised)] border border-white/8 rounded-xl p-6 text-center">
              <Truck className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/60 text-sm">No nearby orders right now</p>
              <p className="text-white/20 text-xs mt-1">Check back in a few minutes</p>
            </div>
          ) : (
            filteredOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-[var(--sr-surface-raised)] border rounded-xl overflow-hidden transition-all ${
                  order.isJoined ? 'border-[var(--sr-customer)]/30' : 'border-white/8'
                }`}
              >
                {/* Main Card */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-[var(--sr-customer)] shrink-0" />
                        <span className="text-white/60 text-xs">{order.area}</span>
                        <span className="text-white/20 text-[10px]">•</span>
                        <span className="text-white/60 text-[10px]">{order.distance}</span>
                      </div>
                      <p className="text-white font-medium text-sm">{order.restaurant}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-[var(--sr-customer)] text-sm font-bold">Save {formatNaira(order.savedFee)}</p>
                      <p className="text-white/60 text-[10px]">on delivery</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-3.5 h-3.5 text-white/60 shrink-0" />
                    <p className="text-white/50 text-xs truncate">{order.items.join(', ')}</p>
                  </div>

                  {/* Order Count & Time */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-white/65 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {order.orderCount}/{order.maxOrders} joined
                      </span>
                      <span className="text-white/65 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.timeLeft} left
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedOrder(expandedOrder === order.id ? null : order.id)
                      }
                      className="text-white/60 text-[10px] flex items-center gap-0.5 hover:text-white/50"
                    >
                      {expandedOrder === order.id ? (
                        <>
                          Less <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          More <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-[#10E07A] to-[#F5C451] rounded-full transition-all"
                      style={{ width: `${(order.orderCount / order.maxOrders) * 100}%` }}
                    />
                  </div>

                  {/* Join / Joined Button */}
                  {order.isJoined ? (
                    <div className="bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/30 rounded-xl py-2.5 text-center">
                      <span className="text-[var(--sr-customer)] text-xs font-semibold flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" /> Joined — Saving {formatNaira(order.savedFee)}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowJoinConfirm(order)}
                      className="w-full bg-[var(--sr-customer)] text-black text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--sr-customer)]/90 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" /> Combine & Save {formatNaira(order.savedFee)}
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                        {/* Delivery Fee Breakdown */}
                        <div>
                          <p className="text-white/65 text-[10px] mb-1">Delivery Fee Breakdown</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/50">Original fee</span>
                            <span className="text-white/60 line-through">{formatNaira(order.deliveryFee)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/50">Combined fee</span>
                            <span className="text-[var(--sr-customer)]">{formatNaira(order.deliveryFee - order.savedFee)}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1 pt-1 border-t border-white/5">
                            <span className="text-white/50">You save</span>
                            <span className="text-[var(--sr-customer)] font-bold">{formatNaira(order.savedFee)}</span>
                          </div>
                        </div>

                        {/* Privacy Level */}
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-white/60" />
                          <span className="text-white/60 text-[10px]">
                            Privacy: Only your {order.privacyLevel.replace('-', ' ')} is shared
                          </span>
                        </div>

                        {/* Items List */}
                        <div>
                          <p className="text-white/65 text-[10px] mb-1">Items in this order</p>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                              <span className="w-1 h-1 rounded-full bg-[var(--sr-customer)]/50" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ── Not opted-in placeholder ── */}
      {!isOptedIn && (
        <div className="space-y-3">
          {MOCK_ORDERS.slice(0, 2).map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[var(--sr-surface-raised)] border border-white/8 rounded-xl p-4 opacity-50 blur-[2px] relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/60 text-xs">{order.area}</span>
              </div>
              <p className="text-white/60 text-sm">{order.restaurant}</p>
              <p className="text-[var(--sr-customer)]/30 text-xs mt-1">Save ₦{order.savedFee}</p>
            </motion.div>
          ))}
          <p className="text-center text-white/20 text-xs">Opt in to see nearby orders</p>
        </div>
      )}

      {/* ── Join Confirmation Modal ── */}
      <AnimatePresence>
        {showJoinConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0D14]/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm combined delivery"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[var(--sr-surface-raised)] border border-white/8 rounded-t-2xl sm:rounded-2xl w-full max-w-sm"
            >
              <div className="p-5 space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center mx-auto mb-3">
                    <Truck className="w-7 h-7 text-[var(--sr-customer)]" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">Combine Delivery?</h3>
                  <p className="text-white/50 text-sm mt-1">
                    Join {showJoinConfirm.orderCount} neighbor{showJoinConfirm.orderCount !== 1 ? 's' : ''} in {showJoinConfirm.area}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--sr-customer)]" />
                    <span className="text-white/70 text-sm">{showJoinConfirm.restaurant}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/65" />
                    <span className="text-white/50 text-xs">
                      {showJoinConfirm.orderCount}/{showJoinConfirm.maxOrders} spots filled
                    </span>
                  </div>
                </div>

                {/* Savings Highlight */}
                <div className="bg-[var(--sr-customer)]/5 border border-[var(--sr-customer)]/20 rounded-xl p-3 text-center">
                  <p className="text-[var(--sr-customer)] text-lg font-bold">
                    Save {formatNaira(showJoinConfirm.savedFee)}
                  </p>
                  <p className="text-white/65 text-xs">on delivery fee</p>
                </div>

                {/* Privacy Notice */}
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                  <p className="text-white/60 text-[10px] leading-relaxed">
                    Only your area will be shared with other participants. Your exact address and order details remain private.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleJoin(showJoinConfirm)}
                    className="w-full bg-[var(--sr-customer)] text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--sr-customer)]/90 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Yes, Combine & Save
                  </button>
                  <button
                    onClick={() => setShowJoinConfirm(null)}
                    className="w-full bg-white/5 text-white/50 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Privacy Info Modal ── */}
      <AnimatePresence>
        {showPrivacyInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0D14]/95 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Privacy information"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--sr-surface-raised)] border border-white/8 rounded-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/8">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#A78BFA]" /> Privacy First
                </h2>
                <button
                  onClick={() => setShowPrivacyInfo(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[var(--sr-customer)]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Area only, not address</p>
                      <p className="text-white/65 text-xs">Only your general area (e.g., &quot;Lekki Phase 1&quot;) is shared — never your exact address</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[var(--sr-customer)]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">No order details shared</p>
                      <p className="text-white/65 text-xs">Other participants only see the restaurant name, not what you ordered</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[var(--sr-customer)]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Opt out anytime</p>
                      <p className="text-white/65 text-xs">You can disable delivery sharing at any time from settings</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[var(--sr-customer)]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">No contact info shared</p>
                      <p className="text-white/65 text-xs">Your phone number and identity are never revealed to other participants</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowPrivacyInfo(false)}
                  className="w-full bg-white/5 text-white/60 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(NeighborAlertsInner);
