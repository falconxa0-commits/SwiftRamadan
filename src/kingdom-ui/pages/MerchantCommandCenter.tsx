'use client';

/**
 * KingdomMerchantCommandCenter — Auren Kingdom V2 reinterpretation of the
 * legacy SwiftRamadan VendorDashboard component.
 *
 * The legacy `src/components/swift/VendorDashboard.tsx` (1107 LOC) is
 * untouched. This file is a complete visual rewrite using the Kingdom V2
 * design system while preserving EVERY store hook and API call:
 *   - `useVendor` (vendorStoreName, vendorOnline, setVendorOnline,
 *     setVendorStoreName, setVendorBalance, setVendorPendingSettlement,
 *     setVendorTotalEarnings) — preserves the legacy selector wiring.
 *   - `useAppStore` (direct store access for `setActiveModal` and
 *     `userEmail` reads, matching the dual-access pattern used in V2
 *     ProductStudio / MerchantIntelligence).
 *   - `useUserEmail` (used for `?email=` vendor API queries).
 *   - `GET /api/vendor?email=…` — dashboard metrics (todayRevenue,
 *     todayOrders, avgOrderValue, incomingOrders slice).
 *   - `GET /api/vendor/orders?email=…` — full order list (Processing +
 *     Dispatched tabs derive from this).
 *   - `PUT /api/vendor/orders` (action: accept | reject | ready).
 *   - `POST /api/vendor` (action: toggle-online).
 *
 * V2 spec sections (14 items):
 *  1. KingdomShell root
 *  2. Title: store name with kv-gradient-text + "Mission Control" subtitle
 *  3. kv-accent-line under title
 *  4. Iftar Countdown: IntelligenceCard gold variant — "Maghrib at [time]"
 *     + countdown
 *  5. Live Status: kv-badge-gold "Online" / kv-badge-royal "Offline"
 *     toggle
 *  6. Revenue: 3 IntelligenceCards with kv-metric (Today's Revenue, Today's
 *     Orders, Avg Order)
 *  7. Order Pipeline: RoyalTabs (Incoming, Processing, Dispatched)
 *     - Incoming: kv-card + kv-btn-royal "Accept" + kv-btn-ghost "Decline"
 *     - Processing: kv-card + kv-progress + kv-btn-gold "Mark Ready"
 *     - Dispatched: kv-card with delivery status
 *  8. AI Recommendations: IntelligenceCard royal + AIOrb sm
 *  9. RoyalSkeleton loading + kv-empty ("Your kitchen is ready. Safa is
 *     watching for orders.")
 * 10. kv-stagger entrance
 * 11. Mobile-first (max-w-md mx-auto)
 * 12. Same API: GET /api/vendor/orders (+ GET /api/vendor,
 *     PUT /api/vendor/orders, POST /api/vendor toggle-online)
 * 13. Same store hooks: useVendor, useAppStore (+ useUserEmail)
 * 14. Route: `src/app/kingdom/vendor/page.tsx`
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Timer,
  Check,
  X,
  Clock,
  MapPin,
  Loader2,
  Package,
  Truck,
  Sparkles,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';
import { useVendor, useUserEmail, useNavigation } from '@/lib/store-selectors';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  AIOrb,
  RoyalBadge,
  RoyalTabs,
  type RoyalTabItem,
  RoyalSkeleton,
} from '../components';

/* ─────────────────────── Types ─────────────────────── */

type IncomingOrder = {
  id: string;
  customer: string;
  area: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  minutesUntilIftar: number;
  status: 'incoming';
  image: string;
  createdAt?: string;
  progress?: number;
};

type ProcessingOrder = {
  id: string;
  customer: string;
  area: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  startedAt: string;
  estimatedReady: string;
  status: 'processing';
  progress: number;
};

type DispatchedOrder = {
  id: string;
  customer: string;
  area: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
  riderName: string | null;
  orderStatus: string; // 'Ready' | 'In Transit'
  createdAtLabel: string;
  image: string;
};

// Shape returned by GET /api/vendor/orders (all vendor orders, newest first)
type VendorApiOrder = {
  id: string;
  shortId: string;
  status: string;
  total: number;
  items: { name?: string; qty?: number; price?: number }[];
  progress: number;
  riderName: string | null;
  createdAt: string;
  createdAtLabel: string;
  image: string;
};

type VendorData = {
  storeName: string;
  online: boolean;
  balance: number;
  pendingSettlement: number;
  totalEarnings: number;
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  incomingOrders: IncomingOrder[];
  transactions: { id: string; reference: string; type: string; amount: number; status: string; date: string }[];
  salesInsights: {
    topSellingItem: string;
    peakHour: string;
    customerRetention: number;
    ramadanRevenue: number;
    ramadanOrders: number;
    dailyTrend: { day: string; revenue: number }[];
  };
  vendorId: string | null;
};

type OrderStatus = 'incoming' | 'processing' | 'dispatched';

/* ─────────────────────── Skeleton helpers ─────────────────────── */

function MetricSkeleton() {
  return (
    <div className="kv-card p-4 flex flex-col gap-2">
      <RoyalSkeleton variant="rect" width={28} height={28} className="!rounded-lg" />
      <RoyalSkeleton variant="text" width="60%" />
      <RoyalSkeleton variant="text" width="40%" />
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="kv-card p-4 space-y-3">
      <RoyalSkeleton variant="rect" height={96} className="!rounded-xl" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5 flex-1">
          <RoyalSkeleton variant="text" width="50%" />
          <RoyalSkeleton variant="text" width="35%" />
        </div>
        <RoyalSkeleton variant="text" width={64} />
      </div>
      <RoyalSkeleton variant="rect" height={36} className="!rounded-lg" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export function KingdomMerchantCommandCenter() {
  /* ── SAME store hooks preserved (per legacy VendorDashboard) ── */
  const {
    vendorStoreName,
    vendorOnline,
    setVendorOnline,
    setVendorStoreName,
    setVendorBalance,
    setVendorPendingSettlement,
    setVendorTotalEarnings,
  } = useVendor();
  const { setActiveModal } = useNavigation();
  const userEmail = useUserEmail();
  // Direct store access for parity with the V2 dual-access pattern.
  const setStoreFromApp = useAppStore((s) => ({
    setVendorStoreName: s.setVendorStoreName,
    setVendorBalance: s.setVendorBalance,
    setVendorTotalEarnings: s.setVendorTotalEarnings,
    setVendorPendingSettlement: s.setVendorPendingSettlement,
  }));

  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<OrderStatus>('incoming');

  const [data, setData] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<
    Record<string, 'accept' | 'reject' | 'ready' | undefined>
  >({});
  // Local list of incoming order ids that the vendor has rejected/accepted
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  // Marked-as-ready processing orders (for quick visual feedback)
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());
  // All vendor orders (polled from /api/vendor/orders) — used to derive the
  // Processing & Dispatched tabs (the /api/vendor endpoint only returns the
  // "incoming" slice, so we keep this second list for accepted/dispatched
  // orders).
  const [allOrders, setAllOrders] = useState<VendorApiOrder[]>([]);

  /* ── Live Iftar countdown (MM:SS) ── */
  const [secondsLeft, setSecondsLeft] = useState(22 * 60 + 30); // 22:30 → 6:45 PM
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = mins <= 15;

  /* ── Fetch vendor dashboard data (legacy API: GET /api/vendor?email=…) ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!userEmail) return;
      const res = await fetch(`/api/vendor?email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        const payload = json.data as VendorData;
        setData(payload);
        if (payload.storeName) {
          setVendorStoreName(payload.storeName);
          setStoreFromApp.setVendorStoreName(payload.storeName);
        }
        setVendorBalance(payload.balance);
        setVendorPendingSettlement(payload.pendingSettlement);
        setVendorTotalEarnings(payload.totalEarnings);
        setStoreFromApp.setVendorBalance(payload.balance);
        setStoreFromApp.setVendorPendingSettlement(payload.pendingSettlement);
        setStoreFromApp.setVendorTotalEarnings(payload.totalEarnings);
      }
    } catch {
      toast({
        title: 'Failed to load command center',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [
    userEmail,
    setVendorStoreName,
    setVendorBalance,
    setVendorPendingSettlement,
    setVendorTotalEarnings,
    setStoreFromApp,
    toast,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Fetch all vendor orders (for Processing & Dispatched tabs) ── */
  const fetchVendorOrders = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/vendor/orders?email=${encodeURIComponent(userEmail || '')}`,
      );
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        setAllOrders(json.orders as VendorApiOrder[]);
      }
    } catch {
      // silently handle — the dashboard fetch still covers the incoming slice
    }
  }, [userEmail]);

  useEffect(() => {
    fetchVendorOrders();
  }, [fetchVendorOrders]);

  /* ── Accept order (legacy API: PUT /api/vendor/orders action='accept') ── */
  const handleAccept = async (order: IncomingOrder) => {
    setProcessing((p) => ({ ...p, [order.id]: 'accept' }));
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'accept' }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setHiddenIds((s) => new Set(s).add(order.id));
        toast({
          title: 'Order Accepted!',
          description: `Order ${order.id.slice(-6).toUpperCase()} is now being prepared`,
        });
        setTimeout(() => {
          fetchData();
          fetchVendorOrders();
        }, 600);
      } else {
        throw new Error(json.error || 'Failed to accept order');
      }
    } catch {
      toast({
        title: 'Accept failed',
        description: 'Could not accept order. Please try again.',
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

  /* ── Reject order (legacy API: PUT /api/vendor/orders action='reject') ── */
  const handleReject = async (order: IncomingOrder) => {
    setProcessing((p) => ({ ...p, [order.id]: 'reject' }));
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'reject' }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setHiddenIds((s) => new Set(s).add(order.id));
        toast({
          title: 'Order Declined',
          description: `Order ${order.id.slice(-6).toUpperCase()} has been declined`,
          variant: 'destructive',
        });
        setTimeout(() => {
          fetchData();
          fetchVendorOrders();
        }, 600);
      } else {
        throw new Error(json.error || 'Failed to reject order');
      }
    } catch {
      toast({
        title: 'Decline failed',
        description: 'Could not decline order. Please try again.',
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

  /* ── Mark ready (legacy API: PUT /api/vendor/orders action='ready') ── */
  const handleMarkReady = async (orderId: string) => {
    setProcessing((p) => ({ ...p, [orderId]: 'ready' }));
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'ready' }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setReadyIds((s) => new Set(s).add(orderId));
        toast({
          title: 'Order Ready!',
          description: `Order ${orderId.slice(-6).toUpperCase()} marked as ready for dispatch`,
        });
        setTimeout(() => {
          fetchData();
          fetchVendorOrders();
        }, 600);
      } else {
        throw new Error(json.error || 'Failed to mark order ready');
      }
    } catch {
      toast({
        title: 'Action failed',
        description: 'Could not mark order as ready.',
        variant: 'destructive',
      });
    } finally {
      setProcessing((p) => {
        const next = { ...p };
        delete next[orderId];
        return next;
      });
    }
  };

  /* ── Toggle online status (legacy API: POST /api/vendor action='toggle-online') ── */
  const handleToggleOnline = async () => {
    const next = !vendorOnline;
    setVendorOnline(next);
    toast({
      title: next ? 'Back Online!' : 'Going Offline',
      description: next
        ? 'You are now accepting orders for Iftar & Suhoor'
        : 'You will stop receiving new orders',
    });
    try {
      const toggleRes = await fetch('/api/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-online', email: userEmail, online: next }),
      });
      if (!toggleRes.ok) {
        throw new Error(`API error: ${toggleRes.status}`);
      }
    } catch {
      // silently handle — the optimistic store toggle remains
    }
  };

  /* ── Derived lists (same logic as legacy VendorDashboard) ── */
  const otherTabOrderIds = new Set(
    allOrders
      .filter(
        (o) =>
          o.status === 'Confirmed' ||
          o.status === 'Ready' ||
          o.status === 'In Transit',
      )
      .map((o) => o.id),
  );
  const incomingOrders = (data?.incomingOrders || []).filter(
    (o) => !hiddenIds.has(o.id) && !otherTabOrderIds.has(o.id),
  );

  const processingOrders: ProcessingOrder[] = allOrders
    .filter((o) => o.status === 'Confirmed')
    .map((o) => ({
      id: o.id,
      customer: `Order ${o.shortId}`,
      area: 'Lagos, Nigeria',
      items: (o.items || []).map((i) => ({
        name: i.name || 'Item',
        qty: i.qty || 1,
        price: i.price || 0,
      })),
      total: o.total,
      startedAt: o.createdAtLabel,
      estimatedReady: 'Soon',
      status: 'processing',
      progress: o.progress ?? 15,
    }));

  const dispatchedOrders: DispatchedOrder[] = allOrders
    .filter((o) => o.status === 'Ready' || o.status === 'In Transit')
    .map((o) => ({
      id: o.id,
      customer: `Order ${o.shortId}`,
      area: 'Lagos, Nigeria',
      items: (o.items || []).map((i) => ({
        name: i.name || 'Item',
        qty: i.qty || 1,
        price: i.price || 0,
      })),
      total: o.total,
      riderName: o.riderName,
      orderStatus: o.status,
      createdAtLabel: o.createdAtLabel,
      image: o.image,
    }));

  /* ── RoyalTabs items (Incoming / Processing / Dispatched) ── */
  const filterItems: RoyalTabItem[] = [
    { id: 'incoming', label: `Incoming${incomingOrders.length ? ` (${incomingOrders.length})` : ''}` },
    { id: 'processing', label: `Processing${processingOrders.length ? ` (${processingOrders.length})` : ''}` },
    { id: 'dispatched', label: `Dispatched${dispatchedOrders.length ? ` (${dispatchedOrders.length})` : ''}` },
  ];

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
            <Crown className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
            Mission Control
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            {vendorStoreName || 'Your Store'}
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2">
            Real-time Iftar &amp; Suhoor order pipeline.
          </p>
        </motion.header>

        {/* ─────────────────────── Loading state ─────────────────────── */}
        {loading && !data ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
            aria-busy="true"
            aria-live="polite"
          >
            <RoyalSkeleton variant="rect" height={96} className="!rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </div>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </motion.section>
        ) : (
          <>
            {/* ─────────────────────── Live Status toggle ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mb-4"
              aria-label="Store live status"
            >
              <div className="kv-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: vendorOnline
                        ? 'var(--kv-gold-light)'
                        : 'var(--kv-royal-light)',
                      border: vendorOnline
                        ? '1px solid var(--kv-gold-border)'
                        : '1px solid var(--kv-royal-border)',
                    }}
                  >
                    <ShoppingBag
                      className="w-5 h-5"
                      style={{
                        color: vendorOnline ? 'var(--kv-gold)' : 'var(--kv-mystic)',
                      }}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">
                      Ramadan Platters
                    </p>
                    <p
                      className="text-xs font-semibold mt-0.5"
                      style={{
                        color: vendorOnline
                          ? 'var(--kv-gold)'
                          : 'var(--kv-mystic)',
                      }}
                    >
                      {vendorOnline
                        ? 'Active for Iftar & Suhoor prep'
                        : 'Currently offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RoyalBadge variant={vendorOnline ? 'gold' : 'royal'}>
                    {vendorOnline ? 'Online' : 'Offline'}
                  </RoyalBadge>
                  <button
                    type="button"
                    onClick={handleToggleOnline}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                      vendorOnline ? 'kv-btn-gold' : 'kv-btn-ghost'
                    }`}
                    style={{
                      background: vendorOnline
                        ? 'linear-gradient(135deg, var(--kv-gold), #E8C547)'
                        : 'var(--kv-glass)',
                      border: vendorOnline ? 'none' : '1px solid var(--kv-glass-border)',
                    }}
                    aria-pressed={vendorOnline}
                    aria-label={vendorOnline ? 'Take store offline' : 'Bring store online'}
                  >
                    <motion.span
                      animate={{ x: vendorOnline ? 28 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>
            </motion.section>

            {/* ─────────────────────── Iftar Countdown (IntelligenceCard gold variant) ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mb-4"
              aria-label="Iftar countdown"
            >
              <IntelligenceCard variant="gold">
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
                        Iftar Countdown
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
                      {mins}:{secs.toString().padStart(2, '0')}
                    </p>
                    <p className="kv-metric-label !text-[9px] mt-0.5">remaining</p>
                  </div>
                </div>
              </IntelligenceCard>
            </motion.section>

            {/* ─────────────────────── Revenue: 3 IntelligenceCards with kv-metric ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mb-5"
              aria-label="Revenue metrics"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 kv-stagger">
                {/* Today's Revenue (gold gradient) */}
                <div className="kv-card kv-card-gold p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="kv-metric-label">Today&apos;s Revenue</span>
                    <Crown className="w-4 h-4 text-[var(--kv-gold)]" aria-hidden />
                  </div>
                  {loading ? (
                    <RoyalSkeleton variant="text" width="70%" />
                  ) : (
                    <p className="kv-metric-value kv-gradient-gold">
                      {formatNaira(data?.todayRevenue ?? 0)}
                    </p>
                  )}
                </div>
                {/* Today's Orders */}
                <div className="kv-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="kv-metric-label">Today&apos;s Orders</span>
                    <Package className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                  </div>
                  {loading ? (
                    <RoyalSkeleton variant="text" width="50%" />
                  ) : (
                    <p className="kv-metric-value kv-gradient-text">
                      {data?.todayOrders ?? 0}
                    </p>
                  )}
                </div>
                {/* Avg Order */}
                <div className="kv-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="kv-metric-label">Avg Order</span>
                    <Sparkles className="w-4 h-4 text-[var(--kv-text-tertiary)]" aria-hidden />
                  </div>
                  {loading ? (
                    <RoyalSkeleton variant="text" width="60%" />
                  ) : (
                    <p className="kv-metric-value">
                      {formatNaira(data?.avgOrderValue ?? 0)}
                    </p>
                  )}
                </div>
              </div>
            </motion.section>

            {/* ─────────────────────── Order Pipeline (RoyalTabs) ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="mb-5"
              aria-label="Order pipeline"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold text-white">Order Pipeline</h2>
                <button
                  type="button"
                  onClick={() => setActiveModal('vendor-insights')}
                  className="text-xs text-[var(--kv-mystic)] font-bold flex items-center gap-1 hover:opacity-80"
                >
                  Insights <ChevronRight className="w-3 h-3" aria-hidden />
                </button>
              </div>

              <RoyalTabs
                items={filterItems}
                active={activeFilter}
                onChange={(id) => setActiveFilter(id as OrderStatus)}
                className="mb-4"
              />

              <AnimatePresence mode="wait">
                {/* ── Incoming ── */}
                {activeFilter === 'incoming' && (
                  <motion.div
                    key="incoming"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {loading ? (
                      <>
                        <OrderCardSkeleton />
                        <OrderCardSkeleton />
                      </>
                    ) : incomingOrders.length === 0 ? (
                      <div className="kv-card kv-empty">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center kv-gold-glow"
                          style={{ background: 'var(--kv-gold-light)' }}
                        >
                          <Package className="w-7 h-7 text-[var(--kv-gold)]" aria-hidden />
                        </div>
                        <h3 className="text-white text-base font-bold tracking-tight">
                          Your kitchen is ready
                        </h3>
                        <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
                          Safa is watching for orders.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 kv-stagger">
                        {incomingOrders.map((order) => (
                          <div key={order.id} className="kv-card overflow-hidden">
                            {/* Image strip */}
                            <div className="relative h-28 overflow-hidden">
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${order.image})` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[var(--kv-surface)] via-[var(--kv-surface)]/60 to-transparent" />
                              <div className="absolute top-3 left-3">
                                <RoyalBadge variant="gold">
                                  <Timer className="w-3 h-3" aria-hidden />
                                  {order.minutesUntilIftar}m to Iftar
                                </RoyalBadge>
                              </div>
                              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                                <span className="text-white/80 text-[10px] font-bold font-mono">
                                  #{order.id.slice(-6).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  <p className="text-white text-sm font-bold truncate">
                                    {order.customer}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-[var(--kv-text-tertiary)]" aria-hidden />
                                    <span className="text-[var(--kv-text-secondary)] text-xs truncate">
                                      {order.area}
                                    </span>
                                  </div>
                                </div>
                                <p className="kv-metric-value kv-gradient-gold !text-base shrink-0">
                                  {formatNaira(order.total)}
                                </p>
                              </div>

                              {/* Items */}
                              <div className="space-y-1 mb-3 max-h-28 overflow-y-auto">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={`${item.name}-${item.qty}-${item.price}-${idx}`}
                                    className="flex items-center justify-between"
                                  >
                                    <span className="text-[var(--kv-text-tertiary)] text-xs">
                                      {item.qty}× {item.name}
                                    </span>
                                    <span className="text-[var(--kv-text-secondary)] text-xs">
                                      {formatNaira(item.price * item.qty)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAccept(order)}
                                  disabled={processing[order.id] !== undefined}
                                  className="kv-btn kv-btn-royal flex-1 text-xs py-2.5 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {processing[order.id] === 'accept' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                                  )}
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(order)}
                                  disabled={processing[order.id] !== undefined}
                                  className="kv-btn kv-btn-ghost flex-1 text-xs py-2.5 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {processing[order.id] === 'reject' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                                  ) : (
                                    <X className="w-3.5 h-3.5" aria-hidden />
                                  )}
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Processing ── */}
                {activeFilter === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {processingOrders.length === 0 ? (
                      <div className="kv-card kv-empty">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ background: 'var(--kv-royal-light)' }}
                        >
                          <Clock className="w-7 h-7 text-[var(--kv-mystic)]" aria-hidden />
                        </div>
                        <h3 className="text-white text-base font-bold tracking-tight">
                          No orders in the kitchen
                        </h3>
                        <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
                          Accept incoming orders to start cooking.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 kv-stagger">
                        {processingOrders.map((order) => (
                          <div
                            key={order.id}
                            className={`kv-card p-4 ${
                              readyIds.has(order.id) ? 'kv-card-gold' : 'kv-card-royal'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-bold truncate">
                                    {order.customer}
                                  </span>
                                  <RoyalBadge variant={readyIds.has(order.id) ? 'gold' : 'royal'}>
                                    {readyIds.has(order.id) ? 'Ready' : 'Cooking'}
                                  </RoyalBadge>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-[var(--kv-text-tertiary)]" aria-hidden />
                                  <span className="text-[var(--kv-text-secondary)] text-xs truncate">
                                    {order.area}
                                  </span>
                                </div>
                              </div>
                              <p className="kv-metric-value kv-gradient-text !text-base shrink-0">
                                {formatNaira(order.total)}
                              </p>
                            </div>

                            {/* Items */}
                            <div className="space-y-1 mb-3">
                              {order.items.map((item, idx) => (
                                <div
                                  key={`${item.name}-${idx}`}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-[var(--kv-text-tertiary)] text-xs">
                                    {item.qty}× {item.name}
                                  </span>
                                  <span className="text-[var(--kv-text-secondary)] text-xs">
                                    {formatNaira(item.price * item.qty)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Progress */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="kv-metric-label">Prep Progress</span>
                                <span className="text-[10px] font-bold text-[var(--kv-mystic)]">
                                  {order.progress}%
                                </span>
                              </div>
                              <div className="kv-progress">
                                <div
                                  className="kv-progress-fill"
                                  style={{ width: `${Math.max(order.progress, 8)}%` }}
                                />
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/5 mb-3">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[var(--kv-mystic)]" aria-hidden />
                                <span className="text-[var(--kv-text-secondary)] text-[11px]">
                                  Started {order.startedAt}
                                </span>
                              </div>
                              <span className="text-[var(--kv-gold)] text-[11px] font-bold">
                                Ready by {order.estimatedReady}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleMarkReady(order.id)}
                              disabled={readyIds.has(order.id) || processing[order.id] !== undefined}
                              className="kv-btn kv-btn-gold w-full text-xs py-2.5 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {processing[order.id] === 'ready' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                              )}
                              {readyIds.has(order.id) ? 'Marked Ready' : 'Mark Ready'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Dispatched ── */}
                {activeFilter === 'dispatched' && (
                  <motion.div
                    key="dispatched"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {dispatchedOrders.length === 0 ? (
                      <div className="kv-card kv-empty">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ background: 'var(--kv-gold-light)' }}
                        >
                          <Truck className="w-7 h-7 text-[var(--kv-gold)]" aria-hidden />
                        </div>
                        <h3 className="text-white text-base font-bold tracking-tight">
                          No dispatched orders
                        </h3>
                        <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
                          Orders marked ready or out for delivery appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 kv-stagger">
                        {dispatchedOrders.map((order) => (
                          <div key={order.id} className="kv-card p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-bold truncate">
                                    {order.customer}
                                  </span>
                                  <RoyalBadge
                                    variant={order.orderStatus === 'In Transit' ? 'royal' : 'gold'}
                                  >
                                    {order.orderStatus === 'In Transit' ? 'In Transit' : 'Ready'}
                                  </RoyalBadge>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-[var(--kv-text-tertiary)]" aria-hidden />
                                  <span className="text-[var(--kv-text-secondary)] text-xs truncate">
                                    {order.area}
                                  </span>
                                </div>
                              </div>
                              <p className="kv-metric-value kv-gradient-gold !text-base shrink-0">
                                {formatNaira(order.total)}
                              </p>
                            </div>

                            <div className="space-y-1 mb-3">
                              {order.items.map((item, idx) => (
                                <div
                                  key={`${item.name}-${idx}`}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-[var(--kv-text-tertiary)] text-xs">
                                    {item.qty}× {item.name}
                                  </span>
                                  <span className="text-[var(--kv-text-secondary)] text-xs">
                                    {formatNaira(item.price * item.qty)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Truck className="w-3.5 h-3.5 text-[var(--kv-gold)] shrink-0" aria-hidden />
                                <span className="text-[var(--kv-text-secondary)] text-[11px] truncate">
                                  {order.riderName
                                    ? `Rider: ${order.riderName}`
                                    : order.orderStatus === 'In Transit'
                                      ? 'Awaiting rider assignment'
                                      : 'Ready for pickup'}
                                </span>
                              </div>
                              <span className="text-[var(--kv-text-tertiary)] text-[10px] shrink-0">
                                Placed {order.createdAtLabel}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* ─────────────────────── AI Recommendations (IntelligenceCard royal + AIOrb sm) ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-5"
              aria-label="AI recommendations"
            >
              <IntelligenceCard variant="royal">
                <div className="flex items-start gap-3">
                  <AIOrb size="sm" state="thinking" className="shrink-0 mt-1" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--kv-mystic)]" aria-hidden />
                      <h3 className="text-white text-sm font-bold">Safa Recommends</h3>
                    </div>
                    <p className="text-[var(--kv-text-secondary)] text-sm leading-relaxed">
                      Stock extra jollof &amp; dates before 5 PM — Safa predicts a 24%
                      demand surge as Iftar approaches.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <RoyalBadge variant="royal">5 PM Surge</RoyalBadge>
                      <RoyalBadge variant="gold">+24% demand</RoyalBadge>
                      <RoyalBadge variant="neutral">
                        {data?.todayOrders ?? 0} orders today
                      </RoyalBadge>
                    </div>
                  </div>
                </div>
              </IntelligenceCard>
            </motion.section>
          </>
        )}
      </main>
    </KingdomShell>
  );
}
