'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Package, Navigation, X, Loader2, Bike,
} from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, useRef } from 'react';

/* ───────── Types ───────── */

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface AvailableDelivery {
  id: string;
  status: string;
  total: number;
  riderName: string | null;
  items: OrderItem[];
  progress: number;
  createdAt: string;
}

interface RiderResponse {
  success: boolean;
  riderName: string;
  area: string;
  availableDeliveries: AvailableDelivery[];
}

const COUNTDOWN_SECONDS = 30;

/* ───────── Component ───────── */

export default function NewDeliveryRequestModal() {
  const { activeModal, setActiveModal, setActiveTab } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const isOpen = activeModal === 'new-delivery';

  const [delivery, setDelivery] = useState<AvailableDelivery | null>(null);
  const [riderArea, setRiderArea] = useState<string>('Lagos Island');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<'accept' | 'decline' | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const email = userEmail || '';

  /* Fetch latest available delivery when modal opens */
  const fetchLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rider?email=${encodeURIComponent(email)}`);
      const json: RiderResponse = await res.json();
      if (json.success) {
        if (json.area) setRiderArea(json.area);
        setDelivery(json.availableDeliveries?.[0] ?? null);
      } else {
        setDelivery(null);
      }
    } catch (err) {
      setDelivery(null);
    } finally {
      setLoading(false);
    }
  }, [email]);

  /* Start countdown when delivery loaded */
  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
  }, []);

  /* Auto-decline when countdown hits 0 */
  useEffect(() => {
    if (!isOpen || !delivery || submitting) return;
    if (countdown === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setActiveModal(null);
      toast({
        title: 'Request expired',
        description: 'The delivery request timed out.',
      });
    }
  }, [countdown, isOpen, delivery, submitting, setActiveModal]);

  useEffect(() => {
    if (isOpen) {
      fetchLatest();
    } else {
      // Reset state when modal closes
      setDelivery(null);
      setCountdown(COUNTDOWN_SECONDS);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, fetchLatest]);

  useEffect(() => {
    if (isOpen && delivery && !submitting) {
      startCountdown();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, delivery, submitting, startCountdown]);

  const handleAccept = async () => {
    if (!delivery) return;
    setSubmitting('accept');
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await fetch('/api/rider/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: delivery.id,
          riderEmail: email,
          action: 'accept',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Delivery accepted! 🎉',
          description: 'Head to the pickup location.',
        });
        setActiveModal(null);
        setActiveTab('rider-deliveries');
      } else {
        toast({
          title: 'Accept failed',
          description: json.message || 'Could not accept delivery',
        });
        setSubmitting(null);
      }
    } catch (err) {
      toast({
        title: 'Accept failed',
        description: 'Network error — please retry',
      });
      setSubmitting(null);
    }
  };

  const handleDecline = async () => {
    if (!delivery) {
      setActiveModal(null);
      return;
    }
    setSubmitting('decline');
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await fetch('/api/rider/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: delivery.id,
          riderEmail: email,
          action: 'decline',
        }),
      });
    } catch (err) {
      // silently handle
    }
    toast({
      title: 'Delivery declined',
      description: 'You declined this delivery request.',
    });
    setActiveModal(null);
    setSubmitting(null);
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveModal(null);
  };

  const isUrgent = countdown <= 10;
  const estimatedEarnings = delivery ? Math.round(delivery.total * 0.15) : 0;
  const itemsSummary = delivery
    ? delivery.items.map((i) => `${i.qty}x ${i.name}`).join(', ')
    : '';
  const minutesToIftar = (() => {
    // Static-ish iftar estimate (Maghrib ~6:45 PM in Lagos during Ramadan)
    const now = new Date();
    const iftar = new Date(now);
    iftar.setHours(18, 45, 0, 0);
    if (iftar < now) iftar.setDate(iftar.getDate() + 1);
    return Math.max(1, Math.round((iftar.getTime() - now.getTime()) / 60000));
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={handleClose}
          />

          {/* Modal - Slide-up Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[100] max-h-[85vh]"
          >
            <div className="bg-[var(--sr-surface-raised)] rounded-t-3xl border-t border-white/10 overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[var(--sr-rider)]/10 rounded-xl flex items-center justify-center">
                    <Bike className="w-5 h-5 text-[var(--sr-rider)]" />
                  </div>
                  <div>
                    <h2 className="text-white text-base font-extrabold">New Delivery Request</h2>
                    <p className="text-white/60 text-[10px]">
                      {delivery ? `Order #${delivery.id.slice(-6).toUpperCase()}` : 'Checking for requests...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white/65" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-6 overflow-y-auto max-h-[65vh] custom-scrollbar">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[var(--sr-rider)] animate-spin mb-3" />
                    <p className="text-white/50 text-sm">Looking for delivery requests...</p>
                  </div>
                ) : !delivery ? (
                  /* Empty state: no deliveries available */
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-white font-bold text-base mb-1">
                      No new delivery requests
                    </h3>
                    <p className="text-white/65 text-xs max-w-xs">
                      New orders will pop up here as soon as vendors mark them ready. Stay online!
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-5 px-6 py-2.5 bg-[var(--sr-rider)]/10 border border-[var(--sr-rider)]/30 text-[var(--sr-rider)] rounded-xl text-xs font-bold hover:bg-[var(--sr-rider)]/20 transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Countdown Timer */}
                    <div
                      className={`rounded-2xl p-3 sm:p-4 mb-4 border ${
                        isUrgent
                          ? 'bg-red-500/10 border-red-500/20'
                          : 'bg-[var(--sr-rider)]/5 border-[var(--sr-rider)]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock
                            className={`w-4 h-4 ${
                              isUrgent ? 'text-red-400' : 'text-[var(--sr-rider)]'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isUrgent ? 'text-red-400' : 'text-[var(--sr-rider)]'
                            }`}
                          >
                            {isUrgent ? 'Hurry — Expiring Soon' : 'Accept within'}
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                            isUrgent ? 'bg-red-500/15' : 'bg-[var(--sr-rider)]/10'
                          }`}
                        >
                          <Clock
                            className={`w-3.5 h-3.5 ${
                              isUrgent ? 'text-red-400' : 'text-[var(--sr-rider)]'
                            }`}
                          />
                          <span
                            className={`text-sm font-black tabular-nums ${
                              isUrgent ? 'text-red-400' : 'text-[var(--sr-rider)]'
                            }`}
                          >
                            0:{countdown.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <p className="text-white/60 text-[10px] mt-2">
                        Iftar at 6:45 PM • {minutesToIftar} min remaining • Deliver before Maghrib
                      </p>
                    </div>

                    {/* Customer / Drop-off Info */}
                    <div className="glass-card rounded-2xl p-3 sm:p-4 mb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 bg-[var(--sr-rider)]/10 rounded-full flex items-center justify-center border border-[var(--sr-rider)]/20">
                          <span className="material-symbols-outlined text-[var(--sr-rider)] text-lg">person</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">Customer Order</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-white/60" />
                            <p className="text-white/65 text-xs">{riderArea} drop-off</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Ordered */}
                    <div className="glass-card rounded-2xl p-3 sm:p-4 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-white/60" />
                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                          Items Ordered
                        </span>
                      </div>
                      <p className="text-white text-sm">{itemsSummary || 'No items'}</p>
                    </div>

                    {/* Pickup Address */}
                    <div className="glass-card rounded-2xl p-3 sm:p-4 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-[var(--sr-rider)]" />
                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                          Pickup
                        </span>
                      </div>
                      <p className="text-white text-sm">
                        Vendor kitchen, {riderArea}
                      </p>
                      <p className="text-white/60 text-[10px] mt-1">
                        ~2.4 km from your current location
                      </p>
                    </div>

                    {/* Payment Summary */}
                    <div className="glass-card rounded-2xl p-3 sm:p-4 mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/65 text-xs">Order Total</span>
                        <span className="text-white text-sm font-bold">
                          {formatNaira(delivery.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/65 text-xs">Customer Pays</span>
                        <span className="text-white/60 text-sm">
                          {formatNaira(delivery.total)}
                        </span>
                      </div>
                      <div className="h-px bg-white/5 my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs font-bold">You Earn (15%)</span>
                        <span className="text-[var(--sr-vendor)] text-lg font-black">
                          {formatNaira(estimatedEarnings)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDecline}
                        disabled={submitting !== null}
                        className="flex-1 bg-white/5 border border-white/10 text-white/60 py-4 rounded-2xl font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-60"
                      >
                        {submitting === 'decline' ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'Decline'
                        )}
                      </button>
                      <button
                        onClick={handleAccept}
                        disabled={submitting !== null}
                        className="flex-1 bg-[var(--sr-rider)] text-[#06070B] py-4 rounded-2xl font-black text-sm hover:bg-[var(--sr-rider)]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {submitting === 'accept' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Bike className="w-4 h-4" />
                            Accept Delivery
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
