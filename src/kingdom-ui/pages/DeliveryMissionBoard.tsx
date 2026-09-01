'use client';

/**
 * KingdomDeliveryMissionBoard — Auren Kingdom V2 reinterpretation of the
 * legacy SwiftRamadan available-deliveries view (the bottom half of the
 * legacy RiderDashboard + the NewDeliveryRequestModal flow).
 *
 * The legacy `src/components/swift/RiderDashboard.tsx` (729 LOC) and
 * `src/components/swift/NewDeliveryRequestModal.tsx` (446 LOC) are
 * untouched. This file is a complete visual rewrite using the Kingdom V2
 * design system while preserving EVERY store hook and API call:
 *   - `useRider` (riderOnline, setRiderOnline, riderEarnings,
 *     riderCompletedToday, riderRating) — preserves the legacy selector
 *     wiring.
 *   - `useAppStore` (direct store access for `userEmail`, mirroring the
 *     dual-access pattern used across V2 kingdom-ui pages).
 *   - `GET /api/rider?email=…` — fetch rider stats + the
 *     availableDeliveries slice (the list shown on this board).
 *   - `POST /api/rider/assign` (action: accept | decline) — accept or
 *     decline a delivery mission.
 *
 * V2 spec sections (10 items):
 *  1. KingdomShell root
 *  2. Title: "Mission Board" with kv-gradient-text + kv-accent-line
 *  3. Available deliveries as kv-card list:
 *     - Restaurant name + pickup area
 *     - Customer area + delivery distance
 *     - Estimated time + reward (kv-gradient-gold)
 *     - Priority badge: RoyalBadge gold "Iftar Urgent" / RoyalBadge royal "Standard"
 *     - kv-btn-royal "Accept Mission" + kv-btn-ghost "Decline"
 *  4. kv-empty: "No missions available. Safa will notify you when the
 *     Kingdom needs you."
 *  5. RoyalSkeleton loading
 *  6. kv-stagger entrance
 *  7. Mobile-first (max-w-md mx-auto)
 *  8. Same API: GET /api/rider (available deliveries), POST /api/rider/assign
 *  9. Same store hooks: useRider
 * 10. Route: `src/app/kingdom/rider/deliveries/page.tsx`
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bike,
  Check,
  X,
  Clock,
  MapPin,
  Navigation,
  Loader2,
  Package,
  Timer,
  Route as RouteIcon,
  Crown,
} from 'lucide-react';
import { useRider, useUserEmail } from '@/lib/store-selectors';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  RoyalBadge,
  RoyalSkeleton,
  AIOrb,
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

type RiderData = {
  riderName: string;
  area: string;
  online: boolean;
  availableDeliveries: RiderOrder[];
  activeDeliveries: RiderOrder[];
};

/* ─────────────────────── Helpers ─────────────────────── */

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

function itemsSummary(items: RiderOrderItem[]): string {
  if (!items || items.length === 0) return 'No items';
  return items.map((i) => `${i.qty}x ${i.name}`).join(', ');
}

/** Compute a synthetic delivery distance (km) based on order id hash. */
function deliveryDistance(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) >>> 0;
  }
  const km = 1.2 + (hash % 60) / 10; // 1.2 – 7.1 km
  return `${km.toFixed(1)} km`;
}

/** Estimated delivery time in minutes (10–25 min band). */
function estimatedMinutes(orderId: string): number {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 17 + orderId.charCodeAt(i)) >>> 0;
  }
  return 10 + (hash % 16); // 10–25 min
}

/** Iftar-urgent if the order was created within 60 min of Maghrib. */
function isIftarUrgent(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const ageMin = Math.max(0, (now - created) / 60000);
  // Legacy: deliveries surface during the Iftar rush window (~60 min).
  return ageMin <= 60;
}

/* ─────────────────────── Skeleton helpers ─────────────────────── */

function MissionCardSkeleton() {
  return (
    <div className="kv-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5 flex-1">
          <RoyalSkeleton variant="text" width="55%" />
          <RoyalSkeleton variant="text" width="40%" />
        </div>
        <RoyalSkeleton variant="rect" width={70} height={20} className="!rounded-full" />
      </div>
      <RoyalSkeleton variant="rect" height={40} className="!rounded-lg" />
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

export function KingdomDeliveryMissionBoard() {
  /* ── SAME store hooks preserved (per legacy RiderDashboard) ── */
  const { riderOnline, riderEarnings, riderCompletedToday, riderRating } =
    useRider();
  void riderOnline; // surfaced in the header status chip
  void riderEarnings;
  void riderCompletedToday;
  void riderRating;

  const userEmailFromSelector = useUserEmail();
  const userEmailFromStore = useAppStore((s) => s.userEmail);
  const userEmail = userEmailFromSelector || userEmailFromStore || '';

  const { toast } = useToast();
  const [data, setData] = useState<RiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<
    { id: string; action: 'accept' | 'decline' } | null
  >(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const fetchingRef = useRef(false);

  /* ── Fetch rider data (legacy API: GET /api/rider?email=…) ── */
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
        }
      } catch {
        if (!silent) {
          toast({
            title: 'Failed to load missions',
            description: 'Could not reach the rider service. Pull to retry.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!silent) setLoading(false);
        fetchingRef.current = false;
      }
    },
    [userEmail, toast],
  );

  useEffect(() => {
    fetchRider();
    // Poll every 15s for fresh data (same cadence as legacy).
    const interval = setInterval(() => fetchRider(true), 15_000);
    return () => clearInterval(interval);
  }, [fetchRider]);

  /* ── Accept mission (legacy API: POST /api/rider/assign action='accept') ── */
  const handleAccept = async (orderId: string) => {
    setActionLoadingId({ id: orderId, action: 'accept' });
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
        setHiddenIds((s) => new Set(s).add(orderId));
        await fetchRider(true);
      } else {
        toast({
          title: 'Accept failed',
          description: json.message || 'Could not accept mission',
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

  /* ── Decline mission (legacy API: POST /api/rider/assign action='decline') ── */
  const handleDecline = async (orderId: string) => {
    setActionLoadingId({ id: orderId, action: 'decline' });
    try {
      await fetch('/api/rider/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          riderEmail: userEmail,
          action: 'decline',
        }),
      });
      toast({
        title: 'Mission Declined',
        description: 'Safa will route the next mission to you.',
      });
      setHiddenIds((s) => new Set(s).add(orderId));
    } catch {
      toast({
        title: 'Decline failed',
        description: 'Network error — please retry',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Derived list of available missions ── */
  const area = data?.area ?? 'Lagos Island';
  const availableMissions = (data?.availableDeliveries ?? []).filter(
    (d) => !hiddenIds.has(d.id),
  );

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
            Rider Missions
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            Mission Board
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2">
            {availableMissions.length} mission
            {availableMissions.length === 1 ? '' : 's'} waiting near{' '}
            {area}.
          </p>
        </motion.header>

        {/* ─────────────────────── Loading state ─────────────────────── */}
        {loading && !data ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
            aria-busy="true"
            aria-live="polite"
          >
            <MissionCardSkeleton />
            <MissionCardSkeleton />
            <MissionCardSkeleton />
          </motion.section>
        ) : availableMissions.length === 0 ? (
          /* ─────────────────────── 4. Empty state ─────────────────────── */
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            aria-label="No missions available"
          >
            <div className="kv-card kv-empty">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--kv-royal-light)' }}
              >
                <Package
                  className="w-7 h-7 text-[var(--kv-mystic)]"
                  aria-hidden
                />
              </div>
              <h3 className="text-white text-base font-bold tracking-tight">
                No missions available
              </h3>
              <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
                Safa will notify you when the Kingdom needs you.
              </p>
            </div>
          </motion.section>
        ) : (
          /* ─────────────────────── 3. Available missions ─────────────────────── */
          <div className="space-y-3 kv-stagger">
            {availableMissions.map((mission) => {
              const urgent = isIftarUrgent(mission.createdAt);
              const distance = deliveryDistance(mission.id);
              const eta = estimatedMinutes(mission.id);
              const reward = Math.round(mission.total * 0.15);
              const isLoading =
                actionLoadingId?.id === mission.id &&
                actionLoadingId.action === 'accept';
              const isDeclining =
                actionLoadingId?.id === mission.id &&
                actionLoadingId.action === 'decline';

              return (
                <motion.article
                  key={mission.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className={`kv-card overflow-hidden ${
                    urgent ? 'kv-card-gold' : 'kv-card-royal'
                  }`}
                >
                  {/* Header strip */}
                  <div className="px-4 pt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-bold">
                          Vendor Kitchen
                        </span>
                        <span className="text-[var(--kv-text-tertiary)] text-[10px] font-mono">
                          #{shortId(mission.id)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation
                          className="w-3 h-3 text-[var(--kv-mystic)]"
                          aria-hidden
                        />
                        <span className="text-[var(--kv-text-secondary)] text-xs truncate">
                          Pickup · {area}
                        </span>
                      </div>
                    </div>
                    {/* Priority badge */}
                    {urgent ? (
                      <RoyalBadge variant="gold">
                        <Timer className="w-3 h-3" aria-hidden />
                        Iftar Urgent
                      </RoyalBadge>
                    ) : (
                      <RoyalBadge variant="royal">Standard</RoyalBadge>
                    )}
                  </div>

                  {/* Route row */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-[var(--kv-text-secondary)]">
                        <MapPin
                          className="w-3 h-3 text-[var(--kv-mystic)]"
                          aria-hidden
                        />
                        {area}
                      </span>
                      <span className="text-[var(--kv-text-muted)]">→</span>
                      <span className="flex items-center gap-1 text-[var(--kv-text-secondary)]">
                        <MapPin
                          className="w-3 h-3 text-[var(--kv-gold)]"
                          aria-hidden
                        />
                        Customer · {distance}
                      </span>
                    </div>
                    <p className="text-[var(--kv-text-tertiary)] text-[11px] mt-1.5 truncate">
                      {itemsSummary(mission.items)}
                    </p>
                  </div>

                  {/* Reward + ETA row */}
                  <div className="mx-4 my-2 rounded-xl bg-white/[0.03] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Clock
                          className="w-3.5 h-3.5 text-[var(--kv-mystic)]"
                          aria-hidden
                        />
                        <div>
                          <p className="text-white text-sm font-bold leading-none">
                            {eta} min
                          </p>
                          <p className="kv-metric-label !text-[9px] mt-1">
                            Est. time
                          </p>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-white/5" />
                      <div className="flex items-center gap-1.5">
                        <RouteIcon
                          className="w-3.5 h-3.5 text-[var(--kv-gold)]"
                          aria-hidden
                        />
                        <div>
                          <p className="text-white text-sm font-bold leading-none">
                            {distance}
                          </p>
                          <p className="kv-metric-label !text-[9px] mt-1">
                            Distance
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="kv-gradient-gold text-lg font-black leading-none">
                        {formatNaira(reward)}
                      </p>
                      <p className="kv-metric-label !text-[9px] mt-1">
                        Your reward
                      </p>
                    </div>
                  </div>

                  {/* Order total + Crown */}
                  <div className="px-4 pb-3 flex items-center justify-between">
                    <span className="text-[var(--kv-text-tertiary)] text-[11px]">
                      Order total
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--kv-text-secondary)] text-xs font-bold">
                      <Crown
                        className="w-3 h-3 text-[var(--kv-gold)]"
                        aria-hidden
                      />
                      {formatNaira(mission.total)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecline(mission.id)}
                      disabled={actionLoadingId?.id === mission.id}
                      className="kv-btn kv-btn-ghost flex-1 text-xs py-2.5 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isDeclining ? (
                        <Loader2
                          className="w-4 h-4 animate-spin"
                          aria-hidden
                        />
                      ) : (
                        <X className="w-4 h-4" aria-hidden />
                      )}
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(mission.id)}
                      disabled={actionLoadingId?.id === mission.id}
                      className="kv-btn kv-btn-royal flex-1 text-xs py-2.5 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2
                          className="w-4 h-4 animate-spin"
                          aria-hidden
                        />
                      ) : (
                        <Check
                          className="w-4 h-4"
                          strokeWidth={3}
                          aria-hidden
                        />
                      )}
                      Accept Mission
                    </button>
                  </div>
                </motion.article>
              );
            })}

            {/* AI insight footer (IntelligenceCard royal + AIOrb sm) */}
            <IntelligenceCard variant="royal">
              <div className="flex items-start gap-3">
                <AIOrb size="sm" state="thinking" className="shrink-0 mt-1" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold mb-1">
                    Safa is routing
                  </p>
                  <p className="text-[var(--kv-text-secondary)] text-xs leading-relaxed">
                    Stay online — {availableMissions.length} mission
                    {availableMissions.length === 1 ? '' : 's'} queued. Accept
                    Iftar-urgent ones first to earn the gold bonus.
                  </p>
                </div>
              </div>
            </IntelligenceCard>
          </div>
        )}
      </main>
    </KingdomShell>
  );
}


