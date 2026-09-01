'use client';

/**
 * KingdomOrdersTab — Auren Kingdom V2 reinterpretation of the legacy
 * SwiftRamadan OrdersTab.
 *
 * Same store hooks (useOrders, useAppStore.getState().setActiveModal,
 * useAppStore.getState().setActiveTab, useAppStore.getState().addToCart)
 * and the same data import (`myOrders`, `formatNaira`, `prayerTimes`)
 * are preserved. The visual layer is completely replaced with the
 * Kingdom V2 design system (KingdomShell, RoyalSkeleton, RoyalBadge,
 * kv-card / kv-stagger / kv-progress / kv-empty / kv-accent-line).
 *
 * Visual changes per V2 spec:
 *  1. KingdomShell root
 *  2. Title: "Ramadan Journey" with kv-gradient-text + kv-accent-line
 *  3. Active orders as a vertical timeline (royal purple line)
 *     - status dots: current = mystic glow, completed = emerald
 *     - status text: Preparing → Cooking → On the way → Arrived before Maghrib
 *  4. Order cards: kv-card with kv-list-item details
 *  5. kv-progress + kv-progress-fill for delivery progress
 *  6. Past orders: kv-card with rating stars
 *  7. Empty state: kv-empty ("Your journey is about to begin. Safa is ready.")
 *  8. RoyalSkeleton loading state
 *  9. kv-stagger entrance
 * 10. Mobile-first
 * 11. Same store hooks preserved
 *
 * Legacy file `src/components/swift/OrdersTab.tsx` is untouched.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  ShoppingBag,
  Navigation,
  XCircle,
  Download,
  RotateCcw,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { myOrders, formatNaira, prayerTimes } from '@/lib/data';
import { useAppStore, type OrderItem } from '@/lib/store';
import { useOrders } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  RoyalSkeleton,
  RoyalBadge,
} from '../components';

/* ───────────────────────────────────────────────────────────────
   Status → Timeline step mapping
   The V2 spec prescribes the journey as:
     Preparing → Cooking → On the way → Arrived before Maghrib
   Legacy store status values map onto this journey as follows:
     'Confirmed'  → step 0 (Preparing)
     'Preparing'  → step 1 (Cooking)
     'Ready'      → step 1 (Cooking, ready for pickup)
     'In Transit' → step 2 (On the way)
     'Delivered'  → step 3 (Arrived before Maghrib)
     'Cancelled'  → none (skipped from active timeline)
   ─────────────────────────────────────────────────────────────── */
const TIMELINE_STEPS = [
  { key: 'preparing', label: 'Preparing' },
  { key: 'cooking', label: 'Cooking' },
  { key: 'on-the-way', label: 'On the way' },
  { key: 'arrived', label: 'Arrived before Maghrib' },
] as const;

function statusToStep(status: string): number {
  switch (status) {
    case 'Confirmed':
      return 0;
    case 'Preparing':
      return 1;
    case 'Ready':
      return 1;
    case 'In Transit':
      return 2;
    case 'Delivered':
      return 3;
    default:
      return 0;
  }
}

function statusToV2Label(status: string): string {
  if (status === 'Cancelled') return 'Cancelled';
  const step = statusToStep(status);
  return TIMELINE_STEPS[step].label;
}

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  'In Transit': Truck,
  Preparing: Clock,
  Delivered: CheckCircle,
  Confirmed: Package,
  Ready: CheckCircle,
  Cancelled: XCircle,
};

type OrderTab = 'active' | 'past';

/* ───────────────────────────────────────────────────────────────
   RoyalTimeline — vertical royal-purple timeline used for the
   currently-active order. Status dots:
     • completed step → emerald
     • current step → mystic glow
     • future step → muted
   ─────────────────────────────────────────────────────────────── */
function RoyalTimeline({ status, progress }: { status: string; progress: number }) {
  const currentStep = statusToStep(status);
  return (
    <div className="relative pl-6 mt-5">
      {/* Vertical royal-purple line */}
      <div
        className="absolute left-[7px] top-1 bottom-1 w-[2px] rounded-full"
        style={{
          background:
            'linear-gradient(180deg, var(--kv-royal), var(--kv-mystic), rgba(124,58,237,0.15))',
        }}
        aria-hidden
      />
      <ol className="space-y-4">
        {TIMELINE_STEPS.map((step, idx) => {
          const isComplete = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isFuture = idx > currentStep;
          return (
            <li key={step.key} className="relative flex items-center gap-3">
              <span
                aria-hidden
                className={`absolute -left-6 w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all ${
                  isComplete
                    ? 'border-[var(--kv-emerald)] bg-[var(--kv-emerald)]'
                    : isCurrent
                      ? 'border-[var(--kv-mystic)] bg-[var(--kv-mystic)]'
                      : 'border-white/15 bg-[var(--kv-surface)]'
                }`}
                style={
                  isCurrent
                    ? {
                        boxShadow:
                          '0 0 0 4px rgba(192, 132, 252, 0.20), 0 0 16px rgba(192, 132, 252, 0.55)',
                      }
                    : isComplete
                      ? { boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)' }
                      : undefined
                }
              >
                {isComplete && (
                  <CheckCircle className="w-2.5 h-2.5 text-[var(--kv-void)]" strokeWidth={3} />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold tracking-tight ${
                    isFuture ? 'text-[var(--kv-text-muted)]' : 'text-white'
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-[11px] text-[var(--kv-mystic)] font-semibold mt-0.5 flex items-center gap-1">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--kv-mystic)]"
                    />
                    {progress}% complete
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   RatingStars — used for past orders
   ─────────────────────────────────────────────────────────────── */
function RatingStars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rate this order">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          role="radio"
          aria-checked={value === star}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 active:scale-90 transition-transform"
        >
          <Star
            className={`w-4 h-4 ${
              star <= display
                ? 'fill-[var(--kv-gold)] text-[var(--kv-gold)]'
                : 'fill-transparent text-[var(--kv-text-muted)]'
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   OrdersTabSkeleton — RoyalSkeleton loading state
   ─────────────────────────────────────────────────────────────── */
function OrdersTabSkeleton() {
  return (
    <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
      {/* Header */}
      <div className="mb-6">
        <RoyalSkeleton variant="text" width={180} height={28} />
        <div className="kv-accent-line mt-3" />
      </div>
      {/* Active order timeline skeleton */}
      <div className="kv-card p-5 mb-5">
        <RoyalSkeleton variant="text" width={120} height={14} />
        <div className="mt-4">
          <RoyalSkeleton variant="rect" width="100%" height={8} />
        </div>
        <div className="mt-5 space-y-4 pl-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <RoyalSkeleton variant="circle" width={16} height={16} />
              <RoyalSkeleton variant="text" width={120 + i * 20} height={12} />
            </div>
          ))}
        </div>
      </div>
      {/* Past orders skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="kv-card p-4">
            <div className="flex items-center gap-3">
              <RoyalSkeleton variant="circle" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <RoyalSkeleton variant="text" width="70%" height={12} />
                <RoyalSkeleton variant="text" width="40%" height={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/* ───────────────────────────────────────────────────────────────
   Main component
   ─────────────────────────────────────────────────────────────── */
export function KingdomOrdersTab() {
  /* ── SAME store hooks preserved ── */
  const { orders, setOrders } = useOrders();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>('active');
  const [ratings, setRatings] = useState<Record<string, number>>({});

  /* ── Initialize orders from store, falling back to mock data ── */
  useEffect(() => {
    const initOrders = async () => {
      try {
        if (orders.length > 0) {
          setIsLoading(false);
          return;
        }
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
        } else {
          setOrders(myOrders as unknown as OrderItem[]);
        }
      } catch {
        setOrders(myOrders as unknown as OrderItem[]);
      } finally {
        setIsLoading(false);
      }
    };
    initOrders();
  }, []);

  const activeOrders = orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Cancelled',
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'Delivered' || o.status === 'Cancelled',
  );
  const activeOrder = activeOrders[0];

  /* ── Handlers — same behaviour as legacy OrdersTab ── */
  const handleCallRider = (riderName: string | null) => {
    toast({
      title: 'Calling Rider 📞',
      description: `Connecting to ${riderName || 'your rider'}...`,
    });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleActiveOrderClick = (_order: OrderItem) => {
    useAppStore.getState().setActiveModal('live-tracking');
  };

  const handleReorder = (order: OrderItem) => {
    const { addToCart } = useAppStore.getState();
    order.items.forEach((item) => {
      addToCart({
        id: parseInt(item.name.replace(/\D/g, '')) || Math.floor(Math.random() * 1000) + 500,
        name: item.name,
        price: item.price,
        image: '/images/meals/meal-jollof.png',
        quantity: item.qty,
      });
    });
    toast({
      title: 'Items Added! 🛒',
      description: `${order.items.length} item(s) from order ${order.id} added to cart`,
    });
  };

  const handleCancelOrder = async (order: OrderItem) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'Cancelled', progress: 0 }),
      });
      if (res.ok) {
        const { orders, setOrders } = useAppStore.getState();
        setOrders(
          orders.map((o) =>
            o.id === order.id ? { ...o, status: 'Cancelled', progress: 0 } : o,
          ),
        );
        toast({ title: 'Order Cancelled', description: `Order ${order.id} has been cancelled` });
      } else {
        toast({ title: 'Could not cancel', description: 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({
        title: 'Could not cancel',
        description: 'Network error — please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReceipt = (order: OrderItem) => {
    const date = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    const itemsList = order.items
      .map((item) => `  • ${item.name} x${item.qty} — ${formatNaira(item.price * item.qty)}`)
      .join('\n');
    const receipt = `
SwiftRamadan — Order Receipt
========================================

Order ID:        ${order.id}
Date:            ${date}
Status:          ${order.status}
ETA:             ${order.eta}
Rider:           ${order.rider || 'Not assigned'}

Items:
${itemsList}

----------------------------------------
Total:           ${formatNaira(order.total)}
----------------------------------------

Thank you for ordering with SwiftRamadan!
Ramadan Mubarak 🌙

This is an electronic receipt — no signature required.
`.trim();

    try {
      const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SwiftRamadan-Receipt-${order.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Receipt Downloaded 📄',
        description: `Saved as SwiftRamadan-Receipt-${order.id}.txt`,
      });
    } catch {
      toast({ title: 'Download Failed', description: 'Could not generate receipt', variant: 'destructive' });
    }
  };

  const handleRate = (orderId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [orderId]: value }));
    toast({
      title: 'Thanks for your rating! ⭐',
      description: `You rated this order ${value}/5`,
    });
  };

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <KingdomShell>
        <OrdersTabSkeleton />
      </KingdomShell>
    );
  }

  /* ── Empty state ── */
  if (orders.length === 0) {
    return (
      <KingdomShell>
        <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
              Ramadan Journey
            </h1>
            <div className="kv-accent-line mt-3" />
            <p className="text-sm text-[var(--kv-text-tertiary)] mt-3">
              Track and manage your Ramadan deliveries
            </p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="kv-card kv-empty"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
            >
              <ShoppingBag className="w-9 h-9 text-[var(--kv-mystic)]" />
            </div>
            <h3 className="text-white text-lg font-bold tracking-tight">
              Your journey is about to begin
            </h3>
            <p className="text-[var(--kv-text-tertiary)] text-sm max-w-xs">
              Your journey is about to begin. Safa is ready.
            </p>
            <button
              type="button"
              onClick={() => useAppStore.getState().setActiveTab('home')}
              className="kv-btn kv-btn-royal mt-2"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden />
              Start Ordering
            </button>
          </motion.div>
        </main>
      </KingdomShell>
    );
  }

  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Header ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            Ramadan Journey
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-sm text-[var(--kv-text-tertiary)] mt-3">
            Track and manage your Ramadan deliveries
          </p>
        </motion.header>

        {/* ─────────────────────── Tabs: Active / Past ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="kv-tab-bar mb-5"
        >
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`kv-tab-item ${activeTab === 'active' ? 'active' : ''}`}
          >
            <Navigation className="w-4 h-4" aria-hidden />
            <span className="text-xs font-bold">Active</span>
            {activeOrders.length > 0 && (
              <span className="kv-badge-neutral !text-[9px] !px-1.5 !py-0.5">
                {activeOrders.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`kv-tab-item ${activeTab === 'past' ? 'active' : ''}`}
          >
            <CheckCircle className="w-4 h-4" aria-hidden />
            <span className="text-xs font-bold">Past</span>
            {pastOrders.length > 0 && (
              <span className="kv-badge-neutral !text-[9px] !px-1.5 !py-0.5">
                {pastOrders.length}
              </span>
            )}
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'active' ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="kv-stagger space-y-5"
            >
              {/* ── Live Tracking + Timeline ── */}
              {activeOrder && (
                <div
                  className="kv-card kv-card-royal p-5 cursor-pointer"
                  onClick={() => handleActiveOrderClick(activeOrder)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex w-2 h-2">
                        <motion.span
                          className="absolute inline-flex w-full h-full rounded-full bg-[var(--kv-mystic)]"
                          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.6, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-[var(--kv-mystic)]" />
                      </span>
                      <span className="text-[var(--kv-mystic)] text-[10px] font-bold uppercase tracking-widest">
                        Live Tracking
                      </span>
                    </div>
                    <span className="text-[var(--kv-text-tertiary)] text-xs font-mono">
                      {activeOrder.id}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="kv-progress mb-1" aria-label="Delivery progress">
                    <motion.div
                      className="kv-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeOrder.progress}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-bold tracking-tight text-sm">
                      {activeOrder.item}
                    </p>
                    <span className="text-white font-bold text-sm">
                      {formatNaira(activeOrder.total)}
                    </span>
                  </div>
                  <p className="text-[var(--kv-mystic)] text-xs font-medium">
                    {activeOrder.eta}
                  </p>

                  {/* Timeline */}
                  <RoyalTimeline status={activeOrder.status} progress={activeOrder.progress} />

                  {/* Rider */}
                  {activeOrder.rider && (
                    <div className="mt-5 flex items-center justify-between kv-glass rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--kv-royal-light)' }}
                        >
                          <Truck className="w-5 h-5 text-[var(--kv-mystic)]" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">{activeOrder.rider}</p>
                          <p className="text-[var(--kv-text-tertiary)] text-xs">Your rider</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallRider(activeOrder.rider);
                          }}
                          aria-label="Call rider"
                          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                          style={{
                            background: 'var(--kv-royal-light)',
                            border: '1px solid var(--kv-royal-border)',
                          }}
                        >
                          <Phone className="w-4 h-4 text-[var(--kv-mystic)]" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            useAppStore.getState().setActiveModal('live-tracking');
                          }}
                          className="flex items-center gap-2 px-4 h-10 rounded-full text-xs font-bold active:scale-95 transition-transform"
                          style={{
                            background: 'rgba(212, 175, 55, 0.08)',
                            border: '1px solid var(--kv-gold-border)',
                            color: 'var(--kv-gold)',
                          }}
                        >
                          <MapPin className="w-4 h-4" aria-hidden />
                          Track
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Active Orders list (kv-card with kv-list-item details) ── */}
              {activeOrders.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                      Active Orders
                    </h2>
                    <RoyalBadge variant="royal">{activeOrders.length} live</RoyalBadge>
                  </div>
                  <div className="space-y-3">
                    {activeOrders.map((order) => {
                      const Icon = STATUS_ICON[order.status] || Package;
                      const v2Label = statusToV2Label(order.status);
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <div key={order.id} className="kv-card overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleActiveOrderClick(order)}
                            className="kv-list-item w-full text-left"
                          >
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: 'var(--kv-royal-light)',
                                border: '1px solid var(--kv-royal-border)',
                              }}
                            >
                              <Icon className="w-5 h-5 text-[var(--kv-mystic)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <p className="text-white font-bold text-sm tracking-tight truncate">
                                    {order.item}
                                  </p>
                                  <p className="text-[var(--kv-text-tertiary)] text-xs mt-0.5">
                                    {order.eta}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[var(--kv-mystic)] text-[11px] font-bold uppercase tracking-wider">
                                    {v2Label}
                                  </span>
                                  <p className="text-white text-xs font-bold mt-0.5">
                                    {formatNaira(order.total)}
                                  </p>
                                </div>
                              </div>
                              {/* Mini progress bar */}
                              <div className="kv-progress mt-2">
                                <div
                                  className="kv-progress-fill"
                                  style={{ width: `${order.progress}%` }}
                                />
                              </div>
                            </div>
                            <div
                              className="shrink-0 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(order.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[var(--kv-text-tertiary)]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[var(--kv-text-tertiary)]" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && order.items && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-white/5">
                                  {order.items.map((item, i) => (
                                    <div
                                      key={`${item.name}-${i}`}
                                      className="flex justify-between text-xs"
                                    >
                                      <span className="text-[var(--kv-text-tertiary)]">
                                        {item.name} ×{item.qty}
                                      </span>
                                      <span className="text-[var(--kv-text-secondary)]">
                                        {formatNaira(item.price * item.qty)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="kv-divider my-2" />
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-white">Total</span>
                                    <span className="kv-gradient-gold">
                                      {formatNaira(order.total)}
                                    </span>
                                  </div>
                                  {/* Action grid: Reorder / Cancel / Receipt */}
                                  <div className="grid grid-cols-3 gap-2 mt-3">
                                    <button
                                      type="button"
                                      onClick={() => handleReorder(order)}
                                      className="kv-btn kv-btn-ghost text-[11px] py-2 px-2 min-h-[36px]"
                                    >
                                      <RotateCcw className="w-3 h-3" aria-hidden />
                                      Reorder
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelOrder(order)}
                                      className="kv-btn text-[11px] py-2 px-2 min-h-[36px]"
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.10)',
                                        border: '1px solid rgba(239, 68, 68, 0.30)',
                                        color: 'var(--kv-danger)',
                                      }}
                                    >
                                      <XCircle className="w-3 h-3" aria-hidden />
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadReceipt(order)}
                                      className="kv-btn kv-btn-ghost text-[11px] py-2 px-2 min-h-[36px]"
                                    >
                                      <Download className="w-3 h-3" aria-hidden />
                                      Receipt
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── No active orders state ── */}
              {activeOrders.length === 0 && (
                <div className="kv-card kv-empty">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
                  >
                    <CheckCircle className="w-7 h-7 text-[var(--kv-mystic)]" />
                  </div>
                  <p className="text-white font-bold text-sm">No active orders</p>
                  <p className="text-[var(--kv-text-tertiary)] text-xs max-w-xs">
                    All your deliveries are complete. Browse past orders or start a new one.
                  </p>
                  <button
                    type="button"
                    onClick={() => useAppStore.getState().setActiveTab('home')}
                    className="kv-btn kv-btn-royal mt-2 text-sm py-2.5 px-6 min-h-[40px]"
                  >
                    Start New Order
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="past"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="kv-stagger space-y-3"
            >
              {/* ── Past Orders with rating stars ── */}
              {pastOrders.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                      Past Orders
                    </h2>
                    <RoyalBadge variant="neutral">{pastOrders.length} delivered</RoyalBadge>
                  </div>
                  {pastOrders.map((order) => {
                    const rating = ratings[order.id] || 0;
                    return (
                      <div key={order.id} className="kv-card overflow-hidden">
                        <div className="kv-list-item">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background:
                                order.status === 'Cancelled'
                                  ? 'rgba(239, 68, 68, 0.08)'
                                  : 'var(--kv-gold-light)',
                              border:
                                order.status === 'Cancelled'
                                  ? '1px solid rgba(239, 68, 68, 0.25)'
                                  : '1px solid var(--kv-gold-border)',
                            }}
                          >
                            {order.status === 'Cancelled' ? (
                              <XCircle className="w-5 h-5 text-[var(--kv-danger)]" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-[var(--kv-gold)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="text-white font-bold text-sm tracking-tight truncate">
                                  {order.item}
                                </p>
                                <p className="text-[var(--kv-text-tertiary)] text-xs mt-0.5">
                                  {order.eta}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider"
                                  style={{
                                    color:
                                      order.status === 'Cancelled'
                                        ? 'var(--kv-danger)'
                                        : 'var(--kv-gold)',
                                  }}
                                >
                                  {order.status === 'Cancelled' ? 'Cancelled' : 'Delivered'}
                                </span>
                                <p className="text-white text-xs font-bold mt-0.5">
                                  {formatNaira(order.total)}
                                </p>
                              </div>
                            </div>
                            {/* Rating stars (only for delivered orders) */}
                            {order.status === 'Delivered' && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] text-[var(--kv-text-muted)] font-semibold uppercase tracking-wider">
                                  Rate:
                                </span>
                                <RatingStars
                                  value={rating}
                                  onChange={(v) => handleRate(order.id, v)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Reorder + Receipt for past orders */}
                        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="kv-btn kv-btn-royal text-xs py-2 min-h-[36px]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                            Reorder
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(order)}
                            className="kv-btn kv-btn-ghost text-xs py-2 min-h-[36px]"
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden />
                            Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="kv-card kv-empty">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
                  >
                    <Clock className="w-7 h-7 text-[var(--kv-mystic)]" />
                  </div>
                  <p className="text-white font-bold text-sm">No past orders yet</p>
                  <p className="text-[var(--kv-text-tertiary)] text-xs max-w-xs">
                    Your completed orders will appear here for easy reordering.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────────────────── Prayer Times Widget ─────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8"
        >
          <div
            className="kv-card p-5"
            style={{
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(5, 5, 5, 0.6))',
              borderColor: 'rgba(16, 185, 129, 0.20)',
            }}
          >
            <h3 className="text-[var(--kv-emerald)] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span aria-hidden>🕌</span>
              Prayer Times — Lagos
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {prayerTimes.map((prayer) => {
                const now = new Date();
                const hours = now.getHours();
                const isNext =
                  (prayer.name === 'Maghrib' && hours >= 12 && hours < 19) ||
                  (prayer.name === 'Fajr' && hours >= 0 && hours < 6) ||
                  (prayer.name === 'Isha' && hours >= 19);
                return (
                  <div
                    key={prayer.name}
                    className="kv-glass p-2.5 rounded-xl border text-center transition-colors"
                    style={{
                      borderColor: isNext
                        ? 'rgba(16, 185, 129, 0.30)'
                        : 'var(--kv-glass-border)',
                      background: isNext ? 'rgba(16, 185, 129, 0.06)' : undefined,
                    }}
                  >
                    <span className="text-base" aria-hidden>
                      {prayer.icon === 'dark_mode'
                        ? '🌙'
                        : prayer.icon === 'light_mode'
                          ? '☀️'
                          : prayer.icon === 'wb_twilight'
                            ? '🌆'
                            : '🌃'}
                    </span>
                    <p className="text-white text-xs font-bold mt-1">{prayer.name}</p>
                    <p className="text-[var(--kv-text-tertiary)] text-[10px]">{prayer.time}</p>
                    {isNext && (
                      <span className="text-[var(--kv-emerald)] text-[8px] font-bold uppercase mt-0.5 block">
                        Next
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => useAppStore.getState().setActiveModal('prayer-times')}
              className="kv-btn kv-btn-ghost w-full mt-4 text-xs py-2.5 min-h-[40px]"
            >
              <Clock className="w-4 h-4 text-[var(--kv-emerald)]" aria-hidden />
              View Full Schedule
            </button>
          </div>
        </motion.section>
      </main>
    </KingdomShell>
  );
}
