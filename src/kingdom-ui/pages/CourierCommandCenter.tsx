'use client';

/**
 * KingdomCourierCommandCenter — Auren Kingdom V2 reinterpretation of the
 * legacy SwiftRamadan RiderDashboard component.
 *
 * The legacy `src/components/swift/RiderDashboard.tsx` (729 LOC) is
 * untouched. This file is a complete visual rewrite using the Kingdom V2
 * design system while preserving EVERY store hook and API call:
 *   - `useRider` (riderOnline, setRiderOnline, riderEarnings,
 *     riderCompletedToday, riderRating) — preserves the legacy selector
 *     wiring (plus the matching setters: setRiderEarnings,
 *     setRiderCompletedToday, setRiderRating).
 *   - `useAppStore` (direct store access for `userEmail`, mirroring the
 *     dual-access pattern used in V2 MerchantCommandCenter /
 *     MerchantIntelligence).
 *   - `useUserEmail` (used for `?email=` rider API queries).
 *   - `GET /api/rider?email=…` — rider stats (riderName, area, online,
 *     rating, completedToday, earningsToday, totalEarnings,
 *     activeDeliveries slice, availableDeliveries slice,
 *     recentDeliveries, weeklyEarnings).
 *   - `POST /api/rider/assign` (action: accept | complete) — accept a
 *     delivery or mark it as completed.
 *
 * V2 spec sections (14 items):
 *  1. KingdomShell root
 *  2. Title: "Courier Command" with kv-gradient-text + kv-accent-line
 *  3. Status Orb: large AIOrb (md) — idle=offline (dim), thinking=online
 *     (bright). Toggle: kv-btn-royal "Go Online" / kv-btn-ghost "Go Offline"
 *  4. Ramadan Mission Status: IntelligenceCard gold variant —
 *     "3 iftars protected today" (kv-metric-value) +
 *     "Your deliveries helped 18 families break fast" (text-secondary)
 *  5. Active Mission: IntelligenceCard royal variant (when delivery active)
 *     — pickup + restaurant, dropoff + customer, ETA countdown
 *     (kv-metric-value, red glow if < 15 min to Maghrib),
 *     kv-btn-gold "Navigate to Pickup" / "Navigate to Dropoff"
 *  6. Performance: 3 kv-metric cards (Deliveries, Rating, Earnings)
 *  7. AI Rider Assistant: IntelligenceCard royal + AIOrb (sm) — Safa
 *     suggestions ("Lekki-Epe Expressway for faster delivery" / "Traffic
 *     is light. You can complete 2 more before Maghrib.")
 *  8. RoyalSkeleton loading
 *  9. kv-empty: "No active mission. Safa will notify you when the Kingdom
 *     needs you."
 * 10. kv-stagger entrance
 * 11. Mobile-first (max-w-md mx-auto, one-hand usage)
 * 12. Same API: GET /api/rider, POST /api/rider/assign
 * 13. Same store hooks: useRider, useAppStore
 * 14. Route: `src/app/kingdom/rider/page.tsx`
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bike,
  Crown,
  Timer,
  Check,
  Clock,
  MapPin,
  Navigation,
  Loader2,
  Star,
  Moon,
  Sparkles,
  Package,
  Power,
} from 'lucide-react';
import { useRider, useUserEmail } from '@/lib/store-selectors';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  AIOrb,
  RoyalBadge,
  RoyalSkeleton,
} from '../components';

/* ─────────────────────── Types ─────────────────────── */

type RiderOrderItem = { name: string; qty: number; price: number };

type RiderOrder = {
  id: string;
  status: string;
  total: number;
  riderName: string | null;
  items: RiderOrderItem[];
  progress: number;
  createdAt: string;
};

type WeeklyEarning = { day: string; amount: number };

type RiderData = {
  riderName: string;
  online: boolean;
  rating: number;
  completedToday: number;
  earningsToday: number;
  totalEarnings: number;
  activeDeliveries: RiderOrder[];
  availableDeliveries: RiderOrder[];
  recentDeliveries: RiderOrder[];
  weeklyEarnings: WeeklyEarning[];
  vehicleType: string;
  area: string;
};

/* ─────────────────────── Helpers ─────────────────────── */

function itemsSummary(items: RiderOrderItem[]): string {
  if (!items || items.length === 0) return 'No items';
  return items.map((i) => `${i.qty}x ${i.name}`).join(', ');
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

/** Static-ish Maghrib ETA (Lagos ~6:45 PM during Ramadan). */
function minutesToIftar(): number {
  const now = new Date();
  const iftar = new Date(now);
  iftar.setHours(18, 45, 0, 0);
  if (iftar < now) iftar.setDate(iftar.getDate() + 1);
  return Math.max(1, Math.round((iftar.getTime() - now.getTime()) / 60000));
}

/** Compute a live ETA countdown (minutes) based on order progress + Iftar. */
function etaMinutes(order: RiderOrder): number {
  const remaining = Math.max(0, 100 - (order.progress ?? 0));
  // 35 min total delivery window — proportion to remaining progress.
  return Math.max(2, Math.round((remaining / 100) * 35));
}

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

function ActiveMissionSkeleton() {
  return (
    <div className="kv-card kv-card-royal p-5 space-y-3">
      <div className="flex items-center justify-between">
        <RoyalSkeleton variant="text" width="40%" />
        <RoyalSkeleton variant="text" width={56} />
      </div>
      <RoyalSkeleton variant="rect" height={48} className="!rounded-lg" />
      <RoyalSkeleton variant="rect" height={48} className="!rounded-lg" />
      <div className="flex gap-2">
        <RoyalSkeleton variant="rect" height={40} className="!rounded-lg flex-1" />
        <RoyalSkeleton variant="rect" height={40} className="!rounded-lg flex-1" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export function KingdomCourierCommandCenter() {
  /* ── SAME store hooks preserved (per legacy RiderDashboard) ── */
  const {
    riderOnline,
    setRiderOnline,
    riderEarnings,
    setRiderEarnings,
    riderCompletedToday,
    setRiderCompletedToday,
    riderRating,
    setRiderRating,
  } = useRider();

  const userEmailFromSelector = useUserEmail();
  const userEmailFromStore = useAppStore((s) => s.userEmail);
  const userEmail = userEmailFromSelector || userEmailFromStore || '';

  const { toast } = useToast();
  const [data, setData] = useState<RiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  /* ── Live Iftar countdown (used by the Active Mission ETA glow) ── */
  const [minsLeft, setMinsLeft] = useState(minutesToIftar());
  useEffect(() => {
    const interval = setInterval(() => {
      setMinsLeft(minutesToIftar());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);
  const isIftarUrgent = minsLeft <= 15;

  /* ── Fetch rider dashboard (legacy API: GET /api/rider?email=…) ── */
  const fetchRider = useCallback(
    async (silent = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(
          `/api/rider?email=${encodeURIComponent(userEmail)}`,
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = (await res.json()) as RiderData & { success?: boolean };
        if (json.success !== false) {
          setData(json);
          // Sync store hooks with backend (preserves legacy wiring).
          if (typeof json.online === 'boolean') setRiderOnline(json.online);
          if (typeof json.earningsToday === 'number')
            setRiderEarnings(json.earningsToday);
          if (typeof json.completedToday === 'number')
            setRiderCompletedToday(json.completedToday);
          if (typeof json.rating === 'number') setRiderRating(json.rating);
        }
      } catch {
        if (!silent) {
          toast({
            title: 'Failed to load',
            description: 'Could not reach the rider service. Pull to retry.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!silent) setLoading(false);
        fetchingRef.current = false;
      }
    },
    [
      userEmail,
      setRiderOnline,
      setRiderEarnings,
      setRiderCompletedToday,
      setRiderRating,
      toast,
    ],
  );

  useEffect(() => {
    fetchRider();
    // Poll every 15s for fresh data (same cadence as legacy RiderDashboard).
    const interval = setInterval(() => fetchRider(true), 15_000);
    return () => clearInterval(interval);
  }, [fetchRider]);

  /* ── Accept delivery (legacy API: POST /api/rider/assign action='accept') ── */
  const handleAccept = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/rider/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          riderEmail: userEmail,
          action: 'accept',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Mission Accepted! 🏍️',
          description: 'Head to the pickup location.',
        });
        await fetchRider(true);
      } else {
        toast({
          title: 'Accept failed',
          description: json.message || 'Could not accept delivery',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Accept failed',
        description: 'Network error — please retry',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Complete delivery (legacy API: POST /api/rider/assign action='complete') ── */
  const handleComplete = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/rider/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          riderEmail: userEmail,
          action: 'complete',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Mission Complete! 🎉',
          description: `You earned ${formatNaira(json.earnings || 0)}.`,
        });
        await fetchRider(true);
      } else {
        toast({
          title: 'Complete failed',
          description: json.message || 'Could not complete delivery',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Complete failed',
        description: 'Network error — please retry',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Toggle online (optimistic store update — no dedicated legacy API call) ── */
  const handleToggleOnline = async () => {
    const next = !riderOnline;
    setRiderOnline(next);
    toast({
      title: next ? 'Back Online!' : 'Going Offline',
      description: next
        ? 'You will start receiving new delivery requests'
        : 'You will stop receiving new requests',
    });
  };

  /* ── Derived: active delivery (legacy shows only the first active one) ── */
  const activeDelivery = data?.activeDeliveries?.[0] ?? null;
  const area = data?.area ?? 'Lagos Island';
  const restaurantName = 'Vendor Kitchen';
  const customerName = 'Customer';

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */
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
            <Bike className="w-3 h-3 text-[var(--kv-mystic)]" aria-hidden />
            Kingdom Rider
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            Courier Command
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2">
            {data?.riderName ? `${data.riderName} · ` : ''}Iftar &amp; Suhoor delivery pipeline.
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
            <ActiveMissionSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </div>
          </motion.section>
        ) : (
          <div className="kv-stagger">
            {/* ─────────────────────── 3. Status Orb ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.04 }}
              className="mb-4"
              aria-label="Rider status"
            >
              <div className="kv-card p-5 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <AIOrb
                    size="md"
                    state={riderOnline ? 'thinking' : 'idle'}
                    className={riderOnline ? '' : 'opacity-40'}
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      background: riderOnline
                        ? 'var(--kv-emerald)'
                        : 'var(--kv-text-muted)',
                      borderColor: 'var(--kv-surface)',
                    }}
                  />
                </div>
                <p className="text-white text-sm font-bold">
                  {riderOnline ? 'Online & Ready' : 'Currently Offline'}
                </p>
                <p className="text-[var(--kv-text-tertiary)] text-[11px] mt-0.5">
                  {riderOnline
                    ? 'Safa is routing missions to you'
                    : 'Go online to receive delivery requests'}
                </p>
                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className={
                    riderOnline
                      ? 'kv-btn kv-btn-ghost w-full mt-4 text-xs py-2.5 min-h-[44px]'
                      : 'kv-btn kv-btn-royal w-full mt-4 text-xs py-2.5 min-h-[44px]'
                  }
                  aria-pressed={riderOnline}
                  aria-label={riderOnline ? 'Go offline' : 'Go online'}
                >
                  <Power className="w-4 h-4" aria-hidden />
                  {riderOnline ? 'Go Offline' : 'Go Online'}
                </button>
              </div>
            </motion.section>

            {/* ─────────────────────── 4. Ramadan Mission Status (IntelligenceCard gold) ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mb-4"
              aria-label="Ramadan mission status"
            >
              <IntelligenceCard variant="gold">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'var(--kv-gold-light)',
                      border: '1px solid var(--kv-gold-border)',
                    }}
                  >
                    <Moon className="w-5 h-5 text-[var(--kv-gold)]" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="kv-metric-value kv-gradient-gold !text-2xl leading-none">
                      {data?.completedToday ?? 0}{' '}
                      <span className="text-sm font-bold text-[var(--kv-gold)]">
                        iftars protected today
                      </span>
                    </p>
                    <p className="text-[var(--kv-text-secondary)] text-xs mt-1.5">
                      Your deliveries helped{' '}
                      <span className="text-[var(--kv-gold)] font-bold">
                        {Math.max(1, (data?.completedToday ?? 0) * 6)}
                      </span>{' '}
                      families break fast.
                    </p>
                  </div>
                </div>
              </IntelligenceCard>
            </motion.section>

            {/* ─────────────────────── 5. Active Mission (IntelligenceCard royal) ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mb-4"
              aria-label="Active mission"
            >
              {activeDelivery ? (
                <IntelligenceCard variant="royal">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--kv-mystic)] rounded-full animate-pulse" />
                      <span className="text-[var(--kv-mystic)] text-[10px] font-bold uppercase tracking-widest">
                        Mission in Progress
                      </span>
                    </div>
                    <span className="text-[var(--kv-text-tertiary)] text-[10px] font-mono">
                      #{shortId(activeDelivery.id)}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="kv-progress">
                      <div
                        className="kv-progress-fill"
                        style={{ width: `${Math.max(activeDelivery.progress, 6)}%` }}
                      />
                    </div>
                  </div>

                  {/* Pickup */}
                  <div className="flex items-start gap-2.5 mb-3 p-3 rounded-xl bg-white/[0.03]">
                    <Navigation
                      className="w-4 h-4 text-[var(--kv-mystic)] shrink-0 mt-0.5"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--kv-text-tertiary)]">
                        Pickup
                      </p>
                      <p className="text-white text-sm font-bold truncate">
                        {restaurantName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin
                          className="w-3 h-3 text-[var(--kv-text-tertiary)]"
                          aria-hidden
                        />
                        <span className="text-[var(--kv-text-secondary)] text-xs truncate">
                          {area}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropoff */}
                  <div className="flex items-start gap-2.5 mb-3 p-3 rounded-xl bg-white/[0.03]">
                    <MapPin
                      className="w-4 h-4 text-[var(--kv-gold)] shrink-0 mt-0.5"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--kv-text-tertiary)]">
                        Dropoff
                      </p>
                      <p className="text-white text-sm font-bold truncate">
                        {customerName}
                      </p>
                      <span className="text-[var(--kv-text-secondary)] text-xs">
                        {itemsSummary(activeDelivery.items)}
                      </span>
                    </div>
                  </div>

                  {/* ETA countdown */}
                  <div
                    className="rounded-xl p-3 mb-3 flex items-center justify-between"
                    style={{
                      background: isIftarUrgent
                        ? 'rgba(239, 68, 68, 0.10)'
                        : 'var(--kv-royal-light)',
                      border: isIftarUrgent
                        ? '1px solid rgba(239, 68, 68, 0.30)'
                        : '1px solid var(--kv-royal-border)',
                      boxShadow: isIftarUrgent
                        ? '0 0 24px rgba(239, 68, 68, 0.25)'
                        : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Timer
                        className="w-4 h-4"
                        style={{
                          color: isIftarUrgent
                            ? 'var(--kv-danger)'
                            : 'var(--kv-mystic)',
                        }}
                        aria-hidden
                      />
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color: isIftarUrgent
                            ? 'var(--kv-danger)'
                            : 'var(--kv-mystic)',
                        }}
                      >
                        {isIftarUrgent ? 'Iftar Urgent' : 'ETA'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p
                        className="kv-metric-value !text-lg leading-none"
                        style={{
                          color: isIftarUrgent
                            ? 'var(--kv-danger)'
                            : 'var(--kv-text-primary)',
                        }}
                      >
                        {etaMinutes(activeDelivery)} min
                      </p>
                      <p className="text-[9px] text-[var(--kv-text-tertiary)] mt-0.5">
                        Maghrib in {minsLeft} min
                      </p>
                    </div>
                  </div>

                  {/* Earnings line */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[var(--kv-text-tertiary)] text-[11px]">
                      Your earnings (15%)
                    </span>
                    <span className="kv-gradient-gold text-sm font-black">
                      {formatNaira(Math.round(activeDelivery.total * 0.15))}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {activeDelivery.progress < 50 ? (
                      <button
                        type="button"
                        onClick={() =>
                          toast({
                            title: 'Navigating to Pickup 🧭',
                            description: `Routing to ${restaurantName}, ${area}`,
                          })
                        }
                        className="kv-btn kv-btn-gold flex-1 text-xs py-2.5 min-h-[44px]"
                      >
                        <Navigation className="w-4 h-4" aria-hidden />
                        Navigate to Pickup
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          toast({
                            title: 'Navigating to Dropoff 🧭',
                            description: `Routing to ${customerName}`,
                          })
                        }
                        className="kv-btn kv-btn-gold flex-1 text-xs py-2.5 min-h-[44px]"
                      >
                        <MapPin className="w-4 h-4" aria-hidden />
                        Navigate to Dropoff
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleComplete(activeDelivery.id)}
                      disabled={actionLoadingId === activeDelivery.id}
                      className="kv-btn kv-btn-royal flex-1 text-xs py-2.5 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === activeDelivery.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      ) : (
                        <Check className="w-4 h-4" strokeWidth={3} aria-hidden />
                      )}
                      Complete
                    </button>
                  </div>
                </IntelligenceCard>
              ) : (
                <div className="kv-card kv-empty">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--kv-royal-light)' }}
                  >
                    <Package className="w-7 h-7 text-[var(--kv-mystic)]" aria-hidden />
                  </div>
                  <h3 className="text-white text-base font-bold tracking-tight">
                    No active mission
                  </h3>
                  <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
                    Safa will notify you when the Kingdom needs you.
                  </p>
                </div>
              )}
            </motion.section>

            {/* ─────────────────────── 6. Performance metrics (3 kv-metric cards) ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="mb-5"
              aria-label="Performance metrics"
            >
              <div className="grid grid-cols-3 gap-3">
                {/* Deliveries */}
                <div className="kv-card p-3 sm:p-4 text-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: 'var(--kv-royal-light)' }}
                  >
                    <Package className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                  </div>
                  <p className="kv-metric-value kv-gradient-text !text-xl leading-none">
                    {riderCompletedToday ?? data?.completedToday ?? 0}
                  </p>
                  <p className="kv-metric-label !text-[9px] mt-1.5">Deliveries</p>
                </div>
                {/* Rating */}
                <div className="kv-card p-3 sm:p-4 text-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: 'var(--kv-gold-light)' }}
                  >
                    <Star className="w-4 h-4 text-[var(--kv-gold)]" aria-hidden />
                  </div>
                  <p className="kv-metric-value kv-gradient-gold !text-xl leading-none">
                    {(riderRating ?? data?.rating ?? 4.8).toFixed(1)}
                  </p>
                  <p className="kv-metric-label !text-[9px] mt-1.5">Rating</p>
                </div>
                {/* Earnings */}
                <div className="kv-card p-3 sm:p-4 text-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: 'rgba(16, 185, 129, 0.12)' }}
                  >
                    <Crown className="w-4 h-4 text-[var(--kv-emerald)]" aria-hidden />
                  </div>
                  <p className="kv-metric-value !text-base leading-tight">
                    {formatNaira(riderEarnings ?? data?.earningsToday ?? 0)}
                  </p>
                  <p className="kv-metric-label !text-[9px] mt-1.5">Earned Today</p>
                </div>
              </div>
            </motion.section>

            {/* ─────────────────────── 7. AI Rider Assistant (IntelligenceCard royal + AIOrb sm) ─────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-5"
              aria-label="AI rider assistant"
            >
              <IntelligenceCard variant="royal">
                <div className="flex items-start gap-3">
                  <AIOrb size="sm" state="thinking" className="shrink-0 mt-1" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles
                        className="w-3.5 h-3.5 text-[var(--kv-mystic)]"
                        aria-hidden
                      />
                      <h3 className="text-white text-sm font-bold">Safa Rider Assistant</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[var(--kv-text-secondary)] text-sm leading-relaxed">
                        Safa suggests taking the{' '}
                        <span className="text-[var(--kv-mystic)] font-bold">
                          Lekki-Epe Expressway
                        </span>{' '}
                        for faster delivery.
                      </p>
                      <p className="text-[var(--kv-text-secondary)] text-sm leading-relaxed">
                        Traffic is light. You can complete{' '}
                        <span className="text-[var(--kv-gold)] font-bold">
                          2 more
                        </span>{' '}
                        before Maghrib.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <RoyalBadge variant="royal">Light Traffic</RoyalBadge>
                      <RoyalBadge variant="gold">
                        <Clock className="w-3 h-3" aria-hidden />
                        {minsLeft}m to Iftar
                      </RoyalBadge>
                      <RoyalBadge variant="neutral">
                        {data?.vehicleType || 'Bike'}
                      </RoyalBadge>
                    </div>
                  </div>
                </div>
              </IntelligenceCard>
            </motion.section>

            {/* ─────────────────────── Available deliveries CTA ─────────────────────── */}
            {riderOnline && !activeDelivery && (data?.availableDeliveries?.length ?? 0) > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24 }}
                className="mb-5"
                aria-label="Available deliveries"
              >
                <button
                  type="button"
                  onClick={() => {
                    const first = data?.availableDeliveries?.[0];
                    if (first) handleAccept(first.id);
                  }}
                  disabled={actionLoadingId !== null}
                  className="kv-card kv-card-royal w-full p-4 flex items-center gap-3 text-left disabled:opacity-60"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--kv-royal-light)' }}
                  >
                    {actionLoadingId ? (
                      <Loader2 className="w-5 h-5 text-[var(--kv-mystic)] animate-spin" />
                    ) : (
                      <Package className="w-5 h-5 text-[var(--kv-mystic)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold">
                      {data?.availableDeliveries?.length ?? 0} missions waiting
                    </p>
                    <p className="text-[var(--kv-text-tertiary)] text-xs mt-0.5">
                      Tap to accept the nearest delivery.
                    </p>
                  </div>
                  <Navigation
                    className="w-4 h-4 text-[var(--kv-mystic)] shrink-0"
                    aria-hidden
                  />
                </button>
              </motion.section>
            )}
          </div>
        )}
      </main>
    </KingdomShell>
  );
}
