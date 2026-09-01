'use client';

/**
 * KingdomEarningsCommand — Auren Kingdom V2 reinterpretation of the legacy
 * SwiftRamdan RiderEarningsHub component.
 *
 * The legacy `src/components/swift/RiderEarningsHub.tsx` (371 LOC) is
 * untouched. This file is a complete visual rewrite using the Kingdom V2
 * design system while preserving EVERY store hook and API call:
 *   - `useRider` (riderEarnings, riderCompletedToday, riderRating,
 *     riderBankName, riderAccountNumber) — same selector wiring as legacy.
 *   - `useAppStore` (direct store access for parity with the V2 dual-access
 *     pattern used by MerchantCommandCenter / ProductStudio).
 *   - `GET /api/rider/payout` — earnings summary + available balance +
 *     weekly breakdown + recent payout history + bank details.
 *   - `POST /api/rider/payout` — request payout (full balance by default,
 *     or a custom amount).
 *
 * V2 spec sections (13 items):
 *  1. KingdomShell root
 *  2. Title: "Earnings Command" with kv-gradient-text + kv-accent-line
 *  3. Today's Earnings: IntelligenceCard gold variant — kv-metric-value
 *     with kv-gradient-gold for today's amount + delivery count
 *  4. Weekly Performance: IntelligenceCard royal variant — 7-day bar
 *     visualization using kv-progress bars + total weekly earnings +
 *     average per delivery
 *  5. Rewards: kv-card list — base earnings per delivery, tips (gold
 *     gradient), Ramadan incentive bonus (kv-badge-gold), performance
 *     bonus
 *  6. Payout: kv-card-gold — available balance, bank details, kv-btn-gold
 *     "Request Payout"
 *  7. kv-empty: "No earnings yet. Your first mission is coming."
 *  8. RoyalSkeleton loading state
 *  9. kv-stagger entrance
 *  10. Mobile-first layout
 *  11. Same API: GET /api/rider/payout, POST /api/rider/payout
 *  12. Same store hooks: useRider
 *  13. Route: `src/app/kingdom/rider/earnings/page.tsx`
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Star,
  Zap,
  Award,
  Sparkles,
  Banknote,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRider, useUserName } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  RoyalBadge,
  RoyalSkeleton,
} from '../components';

/* ─────────────────────── Types for /api/rider/payout payload ─────────────────────── */
interface WeeklyEarning {
  day: string;
  amount: number;
}

interface RecentPayout {
  id: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
}

interface PayoutBankDetails {
  bankName: string | null;
  accountNumber: string | null;
}

interface PayoutData {
  riderName: string;
  totalEarnings: number;
  todaysEarnings: number;
  totalWithdrawn: number;
  availableBalance: number;
  deliveredOrdersCount: number;
  recentPayouts: RecentPayout[];
  weeklyEarnings: WeeklyEarning[];
  bankDetails: PayoutBankDetails;
  hasBankDetails: boolean;
}

/* ─────────────────────── Estimated reward components ─────────────────────── */
const REWARDS = {
  basePerDelivery: 1500,
  tips: 3000,
  ramadanBonus: 6500,
  performanceBonus: 2000,
} as const;

export function KingdomEarningsCommand() {
  /* ── SAME store hooks preserved (per legacy RiderEarningsHub) ── */
  const {
    riderEarnings,
    riderCompletedToday,
    riderRating,
    riderBankName,
    riderAccountNumber,
  } = useRider();
  const userName = useUserName();
  const { toast } = useToast();

  /* ── Direct store access — V2 dual-access pattern ── */
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  /* ── API state ── */
  const [data, setData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);

  /* ── Fetch earnings summary (legacy API: GET /api/rider/payout) ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rider/payout');
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data as PayoutData);
      } else {
        // Empty/zero-earnings state — keep data null so kv-empty shows.
        setData(null);
      }
    } catch {
      // Silently fall back to in-store earnings + empty payout state.
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Request payout (legacy API: POST /api/rider/payout) ── */
  const handleRequestPayout = async () => {
    if (!data || data.availableBalance <= 0) {
      toast({
        title: 'No balance available',
        description: 'Complete deliveries to unlock payouts.',
        variant: 'destructive',
      });
      return;
    }
    if (!data.hasBankDetails) {
      toast({
        title: 'Bank details required',
        description: 'Add your bank name and account number in settings.',
        variant: 'destructive',
      });
      return;
    }
    setRequestingPayout(true);
    try {
      const res = await fetch('/api/rider/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: data.availableBalance }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `API error: ${res.status}`);
      }
      toast({
        title: 'Payout Requested 💰',
        description: `${formatNaira(data.availableBalance)} will arrive in your ${data.bankDetails.bankName || riderBankName || 'bank'} account within 24 hours.`,
      });
      // Refresh data so the available balance reflects the new payout.
      fetchData();
    } catch (err) {
      toast({
        title: 'Payout failed',
        description:
          err instanceof Error
            ? err.message
            : 'Could not process payout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRequestingPayout(false);
    }
  };

  /* ── Derived display values ── */
  const todayAmount = data?.todaysEarnings ?? riderEarnings;
  const completedToday = data?.deliveredOrdersCount ?? riderCompletedToday;
  const rating = riderRating;
  const availableBalance = data?.availableBalance ?? 0;
  const bankName = data?.bankDetails.bankName ?? riderBankName ?? null;
  const accountNumber =
    data?.bankDetails.accountNumber ??
    (riderAccountNumber ? riderAccountNumber.slice(-4).padStart(riderAccountNumber.length, '*') : null);

  const weeklyEarnings = data?.weeklyEarnings ?? [];
  const weeklyTotal = weeklyEarnings.reduce((sum, d) => sum + d.amount, 0);
  const weeklyMax = weeklyEarnings.reduce((max, d) => Math.max(max, d.amount), 0);
  const avgPerDelivery = completedToday > 0 ? Math.round(todayAmount / completedToday) : 0;

  const hasEarnings = todayAmount > 0 || availableBalance > 0 || completedToday > 0;

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
          <p className="text-sm text-[var(--kv-text-tertiary)]">Royal Courier</p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            Earnings Command
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2 flex items-center gap-1.5">
            <Award className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
            {userName || 'Rider'} · Ramadan 2026
          </p>
        </motion.header>

        {loading ? (
          /* ── RoyalSkeleton loading state (V2 spec #8) ── */
          <div className="space-y-4">
            <RoyalSkeleton variant="rect" height={120} />
            <RoyalSkeleton variant="rect" height={180} />
            <RoyalSkeleton variant="rect" height={140} />
            <RoyalSkeleton variant="rect" height={180} />
          </div>
        ) : !hasEarnings ? (
          /* ── kv-empty state (V2 spec #7) ── */
          <div className="kv-card kv-card-royal">
            <div className="kv-empty">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--kv-royal-light)' }}
              >
                <DollarSign className="w-8 h-8 text-[var(--kv-mystic)]" aria-hidden />
              </div>
              <div>
                <p className="text-white font-bold text-lg">
                  No earnings yet.
                </p>
                <p className="text-[var(--kv-text-tertiary)] text-sm mt-1">
                  Your first mission is coming.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('rider-dashboard')}
                className="kv-btn kv-btn-royal text-sm"
              >
                Go Online &amp; Accept Missions
              </button>
            </div>
          </div>
        ) : (
          /* ── Stagger entrance (V2 spec #9) ── */
          <div className="kv-stagger space-y-5">
            {/* ── 3. Today's Earnings — IntelligenceCard gold variant ── */}
            <IntelligenceCard variant="gold" title="Today's Earnings" subtitle="Live mission income">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-1">
                    Today
                  </p>
                  <p className="kv-metric-value text-3xl sm:text-4xl kv-gradient-gold">
                    {formatNaira(todayAmount)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--kv-emerald)]" aria-hidden />
                    <span className="text-xs text-[var(--kv-emerald)] font-bold">
                      {completedToday} deliveries
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="kv-metric-label mb-1">Rating</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="w-4 h-4 text-[var(--kv-gold)] fill-[var(--kv-gold)]" aria-hidden />
                    <p className="kv-metric-value text-xl">{rating.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </IntelligenceCard>

            {/* ── 4. Weekly Performance — IntelligenceCard royal variant ── */}
            <IntelligenceCard variant="royal" title="Weekly Performance" subtitle="Last 7 days">
              {/* 7-day bar visualization using kv-progress bars */}
              <div className="space-y-2.5">
                {weeklyEarnings.length > 0 ? (
                  weeklyEarnings.map((d) => {
                    const pct = weeklyMax > 0 ? Math.max(8, Math.round((d.amount / weeklyMax) * 100)) : 8;
                    const isPeak = d.amount === weeklyMax && d.amount > 0;
                    return (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-[var(--kv-text-tertiary)] w-8 shrink-0">
                          {d.day}
                        </span>
                        <div className="kv-progress flex-1" style={{ height: 8 }}>
                          <div
                            className="kv-progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: isPeak
                                ? 'linear-gradient(90deg, var(--kv-gold), #E8C547)'
                                : undefined,
                            }}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-bold w-16 text-right shrink-0 ${
                            isPeak ? 'text-[var(--kv-gold)]' : 'text-white'
                          }`}
                        >
                          {formatNaira(d.amount)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div
                          className="kv-progress w-full"
                          style={{ height: 56, transform: 'rotate(180deg)' }}
                        >
                          <div className="kv-progress-fill" style={{ width: '12%' }} />
                        </div>
                        <span className="text-[10px] text-[var(--kv-text-muted)] font-bold">
                          {d}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 kv-divider">
                <div>
                  <p className="kv-metric-label mb-1">Weekly Total</p>
                  <p className="kv-metric-value text-lg">{formatNaira(weeklyTotal)}</p>
                </div>
                <div>
                  <p className="kv-metric-label mb-1">Avg / Delivery</p>
                  <p className="kv-metric-value text-lg">{formatNaira(avgPerDelivery)}</p>
                </div>
              </div>
            </IntelligenceCard>

            {/* ── 5. Rewards — kv-card list ── */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
                Rewards Breakdown
              </h2>
              <div className="space-y-2.5">
                {/* Base earnings per delivery */}
                <div className="kv-card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--kv-royal-light)' }}
                    >
                      <DollarSign className="w-5 h-5 text-[var(--kv-mystic)]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm">Base Earnings</p>
                      <p className="text-[var(--kv-text-tertiary)] text-xs">
                        Per delivery
                      </p>
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm shrink-0">
                    {formatNaira(REWARDS.basePerDelivery)}
                  </p>
                </div>

                {/* Tips — kv-gradient-gold highlight */}
                <div className="kv-card kv-card-gold p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--kv-gold-light)' }}
                    >
                      <Star className="w-5 h-5 text-[var(--kv-gold)] fill-[var(--kv-gold)]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm kv-gradient-gold">Tips Received</p>
                      <p className="text-[var(--kv-text-tertiary)] text-xs">
                        Grateful customers
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-sm kv-gradient-gold shrink-0">
                    {formatNaira(REWARDS.tips)}
                  </p>
                </div>

                {/* Ramadan incentive bonus — kv-badge-gold */}
                <div className="kv-card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--kv-gold-light)' }}
                    >
                      <Sparkles className="w-5 h-5 text-[var(--kv-gold)]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold text-sm">Ramadan Incentive</p>
                        <RoyalBadge variant="gold">Active</RoyalBadge>
                      </div>
                      <p className="text-[var(--kv-text-tertiary)] text-xs">
                        2× multiplier on Iftar runs
                      </p>
                    </div>
                  </div>
                  <p className="text-[var(--kv-gold)] font-bold text-sm shrink-0">
                    {formatNaira(REWARDS.ramadanBonus)}
                  </p>
                </div>

                {/* Performance bonus */}
                <div className="kv-card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--kv-royal-light)' }}
                    >
                      <Zap className="w-5 h-5 text-[var(--kv-mystic)]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold text-sm">Performance Bonus</p>
                        <RoyalBadge variant="royal">+{riderRating.toFixed(1)}★</RoyalBadge>
                      </div>
                      <p className="text-[var(--kv-text-tertiary)] text-xs">
                        Top-tier courier bonus
                      </p>
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm shrink-0">
                    {formatNaira(REWARDS.performanceBonus)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 6. Payout — kv-card-gold with available balance + bank + button ── */}
            <div className="kv-card kv-card-gold p-5">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-4 h-4 text-[var(--kv-gold)]" aria-hidden />
                <h3 className="text-sm font-bold text-white">Payout</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="kv-metric-label mb-1">Available Balance</p>
                  <p className="kv-metric-value text-2xl kv-gradient-gold">
                    {formatNaira(availableBalance)}
                  </p>
                </div>
                <div>
                  <p className="kv-metric-label mb-1">Total Earned</p>
                  <p className="kv-metric-value text-2xl">
                    {formatNaira(data?.totalEarnings ?? riderEarnings)}
                  </p>
                </div>
              </div>

              {/* Bank details display */}
              <div
                className="rounded-xl p-3 mb-4"
                style={{ background: 'var(--kv-glass)' }}
              >
                <p className="kv-metric-label mb-2">Bank Details</p>
                {bankName && accountNumber ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{bankName}</p>
                      <p className="text-[var(--kv-text-tertiary)] text-xs font-mono">
                        {accountNumber}
                      </p>
                    </div>
                    <RoyalBadge variant="gold">Verified</RoyalBadge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[var(--kv-text-tertiary)] text-xs">
                      No bank account on file
                    </p>
                    <button
                      type="button"
                      onClick={() => useAppStore.getState().setActiveModal('settings')}
                      className="text-xs text-[var(--kv-gold)] font-bold flex items-center gap-1 shrink-0"
                    >
                      Add now <ChevronRight className="w-3 h-3" aria-hidden />
                    </button>
                  </div>
                )}
              </div>

              {/* Request payout button */}
              <button
                type="button"
                onClick={handleRequestPayout}
                disabled={requestingPayout || availableBalance <= 0}
                className="kv-btn kv-btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DollarSign className="w-4 h-4" aria-hidden />
                {requestingPayout
                  ? 'Processing…'
                  : `Request Payout · ${formatNaira(availableBalance)}`}
              </button>
              <p className="text-[10px] text-[var(--kv-text-tertiary)] text-center mt-2">
                Funds arrive within 24 hours
              </p>
            </div>

            {/* ── Recent payout history (preserves recentPayouts from API) ── */}
            {data && data.recentPayouts.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
                  Payout History
                </h2>
                <div className="space-y-2">
                  {data.recentPayouts.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="kv-card p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm">
                          {formatNaira(p.amount)}
                        </p>
                        <p className="text-[var(--kv-text-tertiary)] text-[11px] font-mono truncate">
                          {p.reference}
                        </p>
                      </div>
                      <RoyalBadge
                        variant={
                          p.status === 'success'
                            ? 'gold'
                            : p.status === 'pending'
                              ? 'royal'
                              : 'neutral'
                        }
                      >
                        {p.status}
                      </RoyalBadge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </KingdomShell>
  );
}
