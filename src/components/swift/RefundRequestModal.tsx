'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  Package,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore, OrderItem } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────── Types ──────────────────── */

interface RefundRequestModalProps {
  onClose: () => void;
}

type Step = 1 | 2 | 3;
type ModalState = 'flow' | 'success';

/* ─────────────── Confetti Particle ─────────────── */

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 400 + 100;
  const randomRotate = Math.random() * 720 - 360;
  const size = Math.random() * 8 + 4;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x: randomX, y: randomY, rotate: randomRotate, scale: 0.3 }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="absolute rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: '50%',
        top: '30%',
      }}
    />
  );
}

const confettiColors = ['#10E07A', '#38BDF8', '#F5C451', '#A855F7', '#FF6B6B', '#FFD700'];

const quickReasons = [
  'Order never arrived',
  'Wrong items delivered',
  'Food quality issue',
  'Duplicate charge',
  'Other',
];

const refundableStatuses = ['Delivered', 'Cancelled', 'Preparing'];

/* ─────────────── Status Badge ─────────────── */

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Delivered: 'bg-[#10E07A]/20 text-[#10E07A] border-[#10E07A]/20',
    Cancelled: 'bg-red-500/20 text-red-400 border-red-500/20',
    Preparing: 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/20',
    Pending: 'bg-[#F5C451]/20 text-[#F5C451] border-[#F5C451]/20',
    Refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  };
  const classes = colorMap[status] || 'bg-white/5 text-white/40 border-white/5';
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${classes}`}>
      {status}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function RefundRequestModal({ onClose }: RefundRequestModalProps) {
  const { orders } = useAppStore();
  const { toast } = useToast();

  const [state, setState] = useState<ModalState>('flow');
  const [step, setStep] = useState<Step>(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [successRef, setSuccessRef] = useState('');
  const [successAmount, setSuccessAmount] = useState(0);

  /* ── Filter refundable orders ── */
  const refundableOrders = orders.filter((o) => refundableStatuses.includes(o.status));
  const nonRefundableOrders = orders.filter((o) => !refundableStatuses.includes(o.status));

  /* ── Handle order selection ── */
  const handleSelectOrder = (order: OrderItem) => {
    setSelectedOrder(order);
    setRefundAmount(order.total.toString());
    setReason('');
    setStep(2);
  };

  /* ── Handle reason quick-fill ── */
  const handleQuickReason = (r: string) => {
    if (r === 'Other') {
      setReason('');
    } else {
      setReason(r);
    }
  };

  /* ── Handle submit ── */
  const handleSubmit = async () => {
    if (!selectedOrder) return;

    const amount = refundAmount ? parseInt(refundAmount.replace(/[^0-9]/g, ''), 10) : selectedOrder.total;
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid refund amount' });
      return;
    }
    if (amount > selectedOrder.total) {
      toast({ title: 'Amount Exceeds Order Total', description: `Maximum refund is ${formatNaira(selectedOrder.total)}` });
      return;
    }
    if (!reason.trim()) {
      toast({ title: 'Reason Required', description: 'Please provide a reason for the refund' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          amount,
          reason: reason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessAmount(amount);
        setSuccessRef(json.data?.reference || `REF-${Date.now()}`);
        setState('success');
      } else {
        toast({
          title: 'Refund Failed',
          description: json.message || 'Could not process refund request',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Refund Failed',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Animation variants ── */
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const stepLabels = ['Select Order', 'Refund Details', 'Confirm'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#06070B] z-[100] flex flex-col"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0"
        >
          <div className="flex items-center gap-3">
            {state === 'flow' && step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as Step)}
                disabled={submitting}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#10E07A]/20 flex items-center justify-center border border-[#10E07A]/20">
                <Receipt className="w-5 h-5 text-[#10E07A]" />
              </div>
            )}
            <div>
              <h2 className="text-white text-lg font-bold">Request Refund</h2>
              {state === 'flow' && (
                <p className="text-white/30 text-xs">Step {step} of 3 — {stepLabels[step - 1]}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </motion.div>

        {/* Step Indicator */}
        {state === 'flow' && (
          <div className="px-4 py-3 shrink-0">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <div
                    className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                      s <= step ? 'bg-[#10E07A]' : 'bg-white/5'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {state === 'success' ? (
              /* ──────── SUCCESS STATE ──────── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="px-4 py-10 flex flex-col items-center text-center relative"
              >
                {/* Confetti */}
                {confettiColors.map((color, i) => (
                  <ConfettiParticle key={i} delay={i * 0.12} color={color} />
                ))}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-[#10E07A]/20 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-[#10E07A]" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-2xl font-black mb-2"
                >
                  Refund Submitted! ✅
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/50 text-sm mb-8 max-w-xs"
                >
                  Your refund of {formatNaira(successAmount)} is being processed and will be credited to your wallet
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full max-w-xs bg-[#0F1118] border border-white/5 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs">Amount</span>
                    <span className="text-[#10E07A] font-bold">{formatNaira(successAmount)}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs">Order</span>
                    <span className="text-white/60 text-xs font-mono">{selectedOrder?.id}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs">Reference</span>
                    <span className="text-white/60 text-xs font-mono">{successRef}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs">Credited To</span>
                    <span className="text-white/60 text-xs">Swift Wallet</span>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  className="mt-8 px-8 py-3.5 rounded-2xl bg-[#10E07A] text-[#06070B] font-bold text-sm hover:bg-[#10E07A]/90 active:scale-[0.98] transition-all"
                >
                  Done
                </motion.button>
              </motion.div>
            ) : step === 1 ? (
              /* ──────── STEP 1: SELECT ORDER ──────── */
              <motion.div
                key="step1"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="px-4 py-4"
              >
                {/* Refundable Orders */}
                <motion.div variants={staggerItem}>
                  <h3 className="text-white text-sm font-bold mb-1">Recent Orders</h3>
                  <p className="text-white/30 text-xs mb-4">Select an order to request a refund</p>
                </motion.div>

                {orders.length === 0 ? (
                  <motion.div variants={staggerItem} className="flex flex-col items-center py-16">
                    <Package className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/20 text-sm font-bold">No orders yet</p>
                    <p className="text-white/10 text-xs mt-1">Place an order first to request a refund</p>
                  </motion.div>
                ) : refundableOrders.length === 0 ? (
                  <motion.div variants={staggerItem} className="flex flex-col items-center py-16">
                    <ShieldCheck className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/20 text-sm font-bold">No refundable orders</p>
                    <p className="text-white/10 text-xs mt-1 max-w-xs text-center">
                      Only orders with status Delivered, Cancelled, or Preparing can be refunded
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
                    {/* Refundable orders */}
                    {refundableOrders.map((order, i) => (
                      <motion.button
                        key={order.id}
                        variants={staggerItem}
                        onClick={() => handleSelectOrder(order)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#0F1118] border border-white/5 hover:border-white/10 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#10E07A]/10 flex items-center justify-center border border-[#10E07A]/20 shrink-0">
                          <Package className="w-5 h-5 text-[#10E07A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{order.item}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-white/20" />
                            <span className="text-white/30 text-[10px]">{order.eta}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <p className="text-white font-bold text-sm">{formatNaira(order.total)}</p>
                          <StatusBadge status={order.status} />
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
                      </motion.button>
                    ))}

                    {/* Non-refundable orders (greyed out) */}
                    {nonRefundableOrders.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-4 pb-1">
                          <div className="h-px flex-1 bg-white/5" />
                          <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Not Eligible</span>
                          <div className="h-px flex-1 bg-white/5" />
                        </div>
                        {nonRefundableOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center gap-3 p-4 rounded-xl bg-[#0F1118]/50 border border-white/5 opacity-40 cursor-not-allowed"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                              <Package className="w-5 h-5 text-white/20" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/40 text-sm font-semibold truncate">{order.item}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Clock className="w-3 h-3 text-white/10" />
                                <span className="text-white/20 text-[10px]">{order.eta}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <p className="text-white/30 font-bold text-sm">{formatNaira(order.total)}</p>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            ) : step === 2 ? (
              /* ──────── STEP 2: REFUND DETAILS ──────── */
              <motion.div
                key="step2"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="px-4 py-4 space-y-5"
              >
                {/* Selected Order Summary */}
                <motion.div variants={staggerItem} className="rounded-2xl bg-[#0F1118] border border-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#10E07A]/10 flex items-center justify-center border border-[#10E07A]/20 shrink-0">
                      <Package className="w-5 h-5 text-[#10E07A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{selectedOrder?.item}</p>
                      <p className="text-white/30 text-[10px]">Order #{selectedOrder?.id}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold text-sm">{formatNaira(selectedOrder?.total ?? 0)}</p>
                      <StatusBadge status={selectedOrder?.status ?? ''} />
                    </div>
                  </div>
                </motion.div>

                {/* Refund Amount */}
                <motion.div variants={staggerItem} className="rounded-2xl bg-[#0F1118] border border-white/5 p-4">
                  <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#10E07A]" />
                    Refund Amount
                  </h3>
                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg font-bold">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={`Up to ${formatNaira(selectedOrder?.total ?? 0)}`}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#06070B]/50 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-lg font-bold placeholder:text-white/20 focus:border-[#10E07A]/30 focus:outline-none transition-colors"
                    />
                  </div>
                  {/* Quick amount buttons */}
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((pct) => {
                      const amt = Math.floor(((selectedOrder?.total ?? 0) * pct) / 100);
                      return (
                        <button
                          key={pct}
                          onClick={() => setRefundAmount(amt.toString())}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            refundAmount === amt.toString()
                              ? 'bg-[#10E07A]/20 text-[#10E07A] border border-[#10E07A]/30'
                              : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                          }`}
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-white/20 text-[10px] mt-2">
                    Maximum refund: {formatNaira(selectedOrder?.total ?? 0)}
                  </p>
                </motion.div>

                {/* Reason */}
                <motion.div variants={staggerItem} className="rounded-2xl bg-[#0F1118] border border-white/5 p-4">
                  <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#10E07A]" />
                    Reason for Refund
                  </h3>

                  {/* Quick reason buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickReasons.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleQuickReason(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          reason === r
                            ? 'bg-[#10E07A]/20 text-[#10E07A] border border-[#10E07A]/30'
                            : r === 'Other' && reason !== '' && !quickReasons.slice(0, -1).includes(reason)
                              ? 'bg-[#10E07A]/20 text-[#10E07A] border border-[#10E07A]/30'
                              : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={quickReasons.includes(reason) ? reason : 'Describe why you need a refund...'}
                    rows={3}
                    className="w-full bg-[#06070B]/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#10E07A]/30 focus:outline-none transition-colors resize-none"
                  />
                </motion.div>

                {/* Continue Button */}
                <motion.div variants={staggerItem}>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!reason.trim() || !refundAmount}
                    className="w-full py-4 rounded-2xl bg-[#10E07A] text-[#06070B] font-black text-sm hover:bg-[#10E07A]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Confirm
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              /* ──────── STEP 3: CONFIRM & SUBMIT ──────── */
              <motion.div
                key="step3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="px-4 py-4 space-y-5"
              >
                {/* Summary Card */}
                <motion.div variants={staggerItem} className="rounded-2xl bg-[#0F1118] border border-white/5 p-5">
                  <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#10E07A]" />
                    Refund Summary
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Order</span>
                      <span className="text-white text-xs font-semibold truncate max-w-[180px]">{selectedOrder?.item}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Order ID</span>
                      <span className="text-white/60 text-xs font-mono">{selectedOrder?.id}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Order Total</span>
                      <span className="text-white/60 text-xs">{formatNaira(selectedOrder?.total ?? 0)}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Refund Amount</span>
                      <span className="text-[#10E07A] font-bold">{formatNaira(parseInt(refundAmount) || 0)}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-start">
                      <span className="text-white/40 text-xs shrink-0">Reason</span>
                      <span className="text-white/60 text-xs text-right max-w-[180px]">{reason}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Credited To</span>
                      <span className="text-white/60 text-xs">Swift Wallet</span>
                    </div>
                  </div>
                </motion.div>

                {/* Notice */}
                <motion.div variants={staggerItem} className="flex items-start gap-3 p-3 rounded-xl bg-[#10E07A]/5 border border-[#10E07A]/10">
                  <ShieldCheck className="w-5 h-5 text-[#10E07A] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#10E07A]/80 text-xs font-bold">Refund Protection</p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      Your refund will be credited to your Swift Wallet instantly. If you prefer a card refund, contact support.
                    </p>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={staggerItem}>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-[#10E07A] text-[#06070B] font-black text-sm hover:bg-[#10E07A]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Refund...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Submit Refund Request
                      </>
                    )}
                  </button>
                  <p className="text-white/20 text-[10px] text-center mt-2">
                    Refunds are processed within 24 hours
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
