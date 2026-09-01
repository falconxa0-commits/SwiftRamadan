'use client';

/**
 * KingdomKitchenOrders — Auren Kingdom V2 reinterpretation of the vendor
 * order-management experience (the legacy SwiftRamadan VendorDashboard's
 * Processing/Dispatched tabs + incoming "active queue" view, reimagined
 * as a single vertical timeline).
 *
 * The legacy `src/components/swift/VendorDashboard.tsx` (1107 LOC) is
 * untouched. This file is a brand-new V2 page that uses the same store
 * hooks and a slightly different API surface:
 *   - `useVendor` (vendorStoreName) — preserves the legacy selector.
 *   - `useAppStore` (direct store access for `userEmail`, mirroring the
 *     dual-access pattern used in V2 ProductStudio / MerchantIntelligence).
 *   - `useUserEmail` (used for `?email=` vendor-orders query).
 *   - `GET /api/vendor/orders?email=…` — fetch the full vendor order list.
 *   - `PUT /api/orders` ({ id, status, progress }) — transitions the
 *     order through the kitchen lifecycle:
 *       Preparing  → Confirmed  ("Start Cooking")
 *       Confirmed  → Ready      ("Mark Ready")
 *       Ready/In Transit → (Dispatched, read-only)
 *
 * V2 spec sections (7 items):
 *  1. KingdomShell root
 *  2. Title: "Kitchen Orders" with kv-gradient-text + kv-accent-line
 *  3. Iftar urgency banner: IntelligenceCard gold — time remaining
 *  4. Order queue as vertical timeline:
 *     - kv-card with items, customer, prep time, delivery time
 *     - Status: kv-btn-royal "Start Cooking" → kv-btn-gold "Mark Ready" →
 *       kv-badge-gold "Dispatched"
 *     - Red glow if < 30 min to Maghrib
 *  5. kv-empty: "No active orders. Your kitchen is calm."
 *  6. RoyalSkeleton loading + kv-stagger entrance
 *  7. Same API: GET /api/vendor/orders, PUT /api/orders
 *  8. Route: `src/app/kingdom/vendor/orders/page.tsx`
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Check,
  Truck,
  Clock,
  MapPin,
  Timer,
  Loader2,
  Package,
  Crown,
  ChefHat,
} from 'lucide-react';
import { useVendor, useUserEmail } from '@/lib/store-selectors';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  RoyalBadge,
  RoyalSkeleton,
} from '../components';

/* ─────────────────────── Types ─────────────────────── */

type VendorApiOrderItem = { name?: string; qty?: number; price?: number };

type VendorApiOrder = {
  id: string;
  shortId: string;
  status: string; // 'Preparing' | 'Confirmed' | 'Ready' | 'In Transit' | 'Delivered' | 'Cancelled'
  total: number;
  items: VendorApiOrderItem[];
  progress: number;
  riderName: string | null;
  createdAt: string;
  createdAtLabel: string;
  image: string;
};

/* ─────────────────────── Kitchen-stage helpers ─────────────────────── */

type KitchenStage = 'incoming' | 'cooking' | 'dispatched';

const stageOf = (status: string): KitchenStage => {
  if (status === 'Confirmed') return 'cooking';
  if (status === 'Ready' || status === 'In Transit') return 'dispatched';
  return 'incoming'; // Preparing + anything else
};

const stageLabel = (stage: KitchenStage): string =>
  stage === 'incoming' ? 'Awaiting Start' : stage === 'cooking' ? 'Cooking' : 'Dispatched';

/* ─────────────────────── Skeleton helpers ─────────────────────── */

function OrderCardSkeleton() {
  return (
    <div className="kv-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <RoyalSkeleton variant="circle" width={36} height={36} />
        <div className="flex-1 flex flex-col gap-1.5">
          <RoyalSkeleton variant="text" width="50%" />
          <RoyalSkeleton variant="text" width="35%" />
        </div>
        <RoyalSkeleton variant="text" width={56} />
      </div>
      <RoyalSkeleton variant="rect" height={36} className="!rounded-lg" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export function KingdomKitchenOrders() {
  /* ── SAME store hooks preserved ── */
  const { vendorStoreName } = useVendor();
  const userEmailFromSelector = useUserEmail();
  const userEmailFromStore = useAppStore((s) => s.userEmail);
  const userEmail = userEmailFromSelector || userEmailFromStore;

  const { toast } = useToast();
  const [orders, setOrders] = useState<VendorApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, 'start' | 'ready' | undefined>>({});

  /* ── Live Iftar countdown ── */
  const [secondsLeft, setSecondsLeft] = useState(22 * 60 + 30); // 22:30 → 6:45 PM
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const minsLeft = Math.floor(secondsLeft / 60);
  const secsLeft = secondsLeft % 60;
  const isUrgent = minsLeft <= 30;
  const isCritical = minsLeft <= 15;

  /* ── Fetch vendor orders (legacy API: GET /api/vendor/orders?email=…) ── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/vendor/orders?email=${encodeURIComponent(userEmail || '')}`,
      );
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        setOrders(json.orders as VendorApiOrder[]);
      } else {
        setOrders([]);
      }
    } catch {
      // silently handle — empty state will surface
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ── Transition an order via PUT /api/orders ── */
  const transitionOrder = async (
    order: VendorApiOrder,
    nextStatus: 'Confirmed' | 'Ready',
    progress: number,
    actionLabel: 'start' | 'ready',
    successTitle: string,
    successBody: string,
  ) => {
    setProcessing((p) => ({ ...p, [order.id]: actionLabel }));
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: nextStatus, progress }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        toast({ title: successTitle, description: successBody });
        // Optimistically update local list, then refresh.
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: nextStatus, progress } : o,
          ),
        );
        setTimeout(() => fetchOrders(), 600);
      } else {
        throw new Error(json.message || json.error || 'Order update failed');
      }
    } catch {
      toast({
        title: 'Update failed',
        description: 'Could not update the order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing((p) => {
        const next = { ...p };
        delete next[order.id];
        return next;
      });
    }
  };

  const handleStartCooking = (order: VendorApiOrder) =>
    transitionOrder(
      order,
      'Confirmed',
      15,
      'start',
      'Cooking started! 🔥',
      `Order ${order.id.slice(-6).toUpperCase()} is now in the kitchen.`,
    );

  const handleMarkReady = (order: VendorApiOrder) =>
    transitionOrder(
      order,
      'Ready',
      55,
      'ready',
      'Order Ready! 🎉',
      `Order ${order.id.slice(-6).toUpperCase()} marked as ready for dispatch.`,
    );

  /* ── Derived active queue: incoming + cooking + dispatched ──
     (excluding delivered/cancelled) */
  const queue = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === 'Preparing' ||
          o.status === 'Confirmed' ||
          o.status === 'Ready' ||
          o.status === 'In Transit',
      ),
    [orders],
  );

  /* ── Per-order prep / delivery-time helpers ── */
  const computePrepTime = (order: VendorApiOrder): string => {
    if (stageOf(order.status) === 'incoming') return 'Not started';
    const start = new Date(order.createdAt).getTime();
    const now = Date.now();
    const elapsedMin = Math.max(0, Math.floor((now - start) / 60000));
    if (elapsedMin < 1) return 'Just started';
    if (elapsedMin < 60) return `${elapsedMin} min in`;
    return `${Math.floor(elapsedMin / 60)}h ${elapsedMin % 60}m in`;
  };

  const computeDeliveryTime = (order: VendorApiOrder): string => {
    const stage = stageOf(order.status);
    if (stage === 'dispatched') {
      return order.status === 'In Transit' ? 'Out for delivery' : 'Awaiting rider';
    }
    if (stage === 'cooking') return 'Ready in ~10 min';
    return 'Ready in ~25 min';
  };

  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Title ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <p className="text-sm text-[var(--kv-text-tertiary)] flex items-center gap-1.5">
            <ChefHat className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
            {vendorStoreName || 'Your Kitchen'}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            Kitchen Orders
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2">
            Live cooking queue — what&apos;s on the fire, what&apos;s urgent.
          </p>
        </motion.header>

        {/* ─────────────────────── Iftar urgency banner (IntelligenceCard gold) ─────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-5"
          aria-label="Iftar urgency"
        >
          <IntelligenceCard
            variant="gold"
            className={
              isUrgent
                ? '!border-[rgba(239,68,68,0.35)] !shadow-[0_0_24px_rgba(239,68,68,0.25),0_0_48px_rgba(239,68,68,0.12)]'
                : ''
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isUrgent
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'var(--kv-gold-light)',
                    border: isUrgent
                      ? '1px solid rgba(239, 68, 68, 0.25)'
                      : '1px solid var(--kv-gold-border)',
                  }}
                >
                  <Timer
                    className="w-5 h-5"
                    style={{
                      color: isUrgent ? 'var(--kv-danger)' : 'var(--kv-gold)',
                    }}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: isUrgent ? 'var(--kv-danger)' : 'var(--kv-gold)',
                    }}
                  >
                    {isCritical
                      ? 'Iftar Critical'
                      : isUrgent
                        ? 'Iftar Approaching'
                        : 'Time Until Iftar'}
                  </p>
                  <p className="text-[var(--kv-text-tertiary)] text-[11px] mt-0.5">
                    Maghrib at 6:45 PM
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className="text-2xl font-black font-mono"
                  style={{
                    color: isUrgent ? 'var(--kv-danger)' : 'var(--kv-gold)',
                  }}
                >
                  {minsLeft}:{secsLeft.toString().padStart(2, '0')}
                </p>
                <p className="kv-metric-label !text-[9px] mt-0.5">remaining</p>
              </div>
            </div>
          </IntelligenceCard>
        </motion.section>

        {/* ─────────────────────── Order queue ─────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          aria-label="Active order queue"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-white">Active Queue</h2>
            <RoyalBadge variant="neutral">{queue.length} active</RoyalBadge>
          </div>

          {loading ? (
            <div className="space-y-3 kv-stagger" aria-busy="true" aria-live="polite">
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
          ) : queue.length === 0 ? (
            <div className="kv-card kv-empty">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center kv-gold-glow"
                style={{ background: 'var(--kv-gold-light)' }}
              >
                <ChefHat className="w-7 h-7 text-[var(--kv-gold)]" aria-hidden />
              </div>
              <h3 className="text-white text-base font-bold tracking-tight">
                No active orders
              </h3>
              <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
                Your kitchen is calm.
              </p>
            </div>
          ) : (
            <div className="relative space-y-3 kv-stagger">
              {/* Vertical timeline line */}
              <div
                aria-hidden
                className="absolute left-[22px] top-2 bottom-2 w-px"
                style={{
                  background:
                    'linear-gradient(180deg, var(--kv-gold-border), var(--kv-royal-border), transparent)',
                }}
              />

              {queue.map((order) => {
                const stage = stageOf(order.status);
                const urgent = isUrgent && stage !== 'dispatched';
                const itemTotalQty = order.items.reduce(
                  (sum, i) => sum + (i.qty ?? 1),
                  0,
                );

                return (
                  <div
                    key={order.id}
                    className={`kv-card relative pl-12 pr-4 py-4 ${
                      urgent ? '!border-[rgba(239,68,68,0.35)] !shadow-[0_0_24px_rgba(239,68,68,0.20)]' : ''
                    }`}
                  >
                    {/* Timeline node */}
                    <div
                      className="absolute left-3 top-4 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background:
                          stage === 'incoming'
                            ? 'var(--kv-royal-light)'
                            : stage === 'cooking'
                              ? 'var(--kv-gold-light)'
                              : 'rgba(16,185,129,0.12)',
                        border:
                          stage === 'incoming'
                            ? '1px solid var(--kv-royal-border)'
                            : stage === 'cooking'
                              ? '1px solid var(--kv-gold-border)'
                              : '1px solid rgba(16,185,129,0.25)',
                      }}
                      aria-hidden
                    >
                      {stage === 'incoming' && (
                        <Clock className="w-3 h-3 text-[var(--kv-mystic)]" />
                      )}
                      {stage === 'cooking' && (
                        <Flame className="w-3 h-3 text-[var(--kv-gold)]" />
                      )}
                      {stage === 'dispatched' && (
                        <Truck className="w-3 h-3 text-[var(--kv-emerald)]" />
                      )}
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-bold truncate">
                            Order {order.shortId}
                          </span>
                          <RoyalBadge
                            variant={
                              stage === 'incoming'
                                ? 'royal'
                                : stage === 'cooking'
                                  ? 'gold'
                                  : 'gold'
                            }
                          >
                            {stageLabel(stage)}
                          </RoyalBadge>
                          {urgent && (
                            <RoyalBadge variant="royal">
                              <Timer className="w-3 h-3" aria-hidden />
                              Urgent
                            </RoyalBadge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[var(--kv-text-tertiary)]" aria-hidden />
                          <span className="text-[var(--kv-text-secondary)] text-[11px]">
                            Lagos, Nigeria
                          </span>
                        </div>
                      </div>
                      <p className="kv-metric-value kv-gradient-gold !text-base shrink-0">
                        {formatNaira(order.total)}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="space-y-0.5 mb-2.5">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={`${item.name}-${idx}`}
                          className="flex items-center justify-between"
                        >
                          <span className="text-[var(--kv-text-tertiary)] text-xs">
                            {item.qty ?? 1}× {item.name || 'Item'}
                          </span>
                          <span className="text-[var(--kv-text-secondary)] text-xs">
                            {formatNaira((item.price ?? 0) * (item.qty ?? 1))}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-[10px] text-[var(--kv-text-muted)] mt-1">
                          +{order.items.length - 3} more item
                          {order.items.length - 3 === 1 ? '' : 's'} ({itemTotalQty} total)
                        </p>
                      )}
                    </div>

                    {/* Prep / delivery meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[var(--kv-mystic)]" aria-hidden />
                        <span className="text-[10px] text-[var(--kv-text-secondary)]">
                          {computePrepTime(order)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
                        <span className="text-[10px] text-[var(--kv-text-secondary)]">
                          {computeDeliveryTime(order)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar (cooking stage) */}
                    {stage === 'cooking' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="kv-metric-label !text-[10px]">Prep</span>
                          <span className="text-[10px] font-bold text-[var(--kv-gold)]">
                            {order.progress ?? 15}%
                          </span>
                        </div>
                        <div className="kv-progress">
                          <div
                            className="kv-progress-fill"
                            style={{ width: `${Math.max(order.progress ?? 15, 8)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action / status */}
                    {stage === 'incoming' && (
                      <button
                        type="button"
                        onClick={() => handleStartCooking(order)}
                        disabled={processing[order.id] !== undefined}
                        className="kv-btn kv-btn-royal w-full text-xs py-2.5 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {processing[order.id] === 'start' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Flame className="w-3.5 h-3.5" aria-hidden />
                        )}
                        Start Cooking
                      </button>
                    )}
                    {stage === 'cooking' && (
                      <button
                        type="button"
                        onClick={() => handleMarkReady(order)}
                        disabled={processing[order.id] !== undefined}
                        className="kv-btn kv-btn-gold w-full text-xs py-2.5 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {processing[order.id] === 'ready' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                        )}
                        Mark Ready
                      </button>
                    )}
                    {stage === 'dispatched' && (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <RoyalBadge variant="gold">
                          <Truck className="w-3 h-3" aria-hidden />
                          {order.status === 'In Transit'
                            ? order.riderName
                              ? `Dispatched — ${order.riderName}`
                              : 'Dispatched — In Transit'
                            : 'Dispatched — Ready'}
                        </RoyalBadge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ─────────────────────── Footer hint ─────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-[10px] text-[var(--kv-text-muted)] mt-6 flex items-center justify-center gap-1.5"
        >
          <Crown className="w-3 h-3" aria-hidden />
          Powered by Safa&apos;s kitchen intelligence
        </motion.p>
      </main>
    </KingdomShell>
  );
}
