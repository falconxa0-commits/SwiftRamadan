'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bike, Star, Check, Clock,
  MapPin, Phone, Navigation, ToggleLeft, ToggleRight, ChevronRight,
  Package, Loader2, CheckCircle, Moon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { toast } from '@/hooks/use-toast';

/* ───────── Types ───────── */

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface RiderOrder {
  id: string;
  status: string;
  total: number;
  riderName: string | null;
  items: OrderItem[];
  progress: number;
  createdAt: string;
}

interface WeeklyEarning {
  day: string;
  amount: number;
}

interface RiderData {
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
}

/* ───────── Animation variants ───────── */

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ───────── Helpers ───────── */

function itemsSummary(items: OrderItem[]): string {
  if (!items || items.length === 0) return 'No items';
  return items.map((i) => `${i.qty}x ${i.name}`).join(', ');
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ───────── Component ───────── */

export default function RiderDashboard() {
  const {
    riderOnline,
    setRiderOnline,
    userEmail,
    setActiveModal,
    setActiveTab,
  } = useAppStore();

  const [data, setData] = useState<RiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const email = userEmail || 'sani@swiftramadan.app';

  const fetchRider = useCallback(
    async (silent = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/rider?email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error('Failed to fetch rider data');
        const json = await res.json();
        if (json.success) {
          setData(json);
          // Sync online state with backend
          if (typeof json.online === 'boolean') {
            setRiderOnline(json.online);
          }
        }
      } catch (err) {
        console.error('RiderDashboard fetch error:', err);
        if (!silent) {
          toast({
            title: 'Failed to load',
            description: 'Could not reach rider service. Pull to retry.',
          });
        }
      } finally {
        if (!silent) setLoading(false);
        setRefreshing(false);
        fetchingRef.current = false;
      }
    },
    [email, setRiderOnline]
  );

  useEffect(() => {
    fetchRider();
    // Poll every 15s for fresh data
    const interval = setInterval(() => fetchRider(true), 15000);
    return () => clearInterval(interval);
  }, [fetchRider]);

  const handleToggleOnline = async () => {
    const next = !riderOnline;
    setRiderOnline(next);
    toast({
      title: next ? "You're Online! 🟢" : "You're Offline",
      description: next
        ? 'You will now receive delivery requests'
        : "You won't receive new requests",
    });
    try {
      await fetch('/api/rider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, online: next }),
      });
    } catch (err) {
      console.error('Toggle online failed:', err);
    }
  };

  const handleAccept = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/rider/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          riderEmail: email,
          action: 'accept',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Delivery Accepted! 🎉',
          description: 'Head to the pickup location.',
        });
        await fetchRider(true);
      } else {
        toast({
          title: 'Accept failed',
          description: json.message || 'Could not accept delivery',
        });
      }
    } catch (err) {
      console.error('Accept failed:', err);
      toast({
        title: 'Accept failed',
        description: 'Network error — please retry',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/rider/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          riderEmail: email,
          action: 'complete',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Delivery Completed! 🎉',
          description: `You earned ${formatNaira(json.earnings || 0)}.`,
        });
        await fetchRider(true);
      } else {
        toast({
          title: 'Complete failed',
          description: json.message || 'Could not complete delivery',
        });
      }
    } catch (err) {
      console.error('Complete failed:', err);
      toast({
        title: 'Complete failed',
        description: 'Network error — please retry',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ───────── Loading skeleton ───────── */
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto pb-32 px-4 pt-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
            <div>
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse mb-1" />
              <div className="h-2 w-24 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-24 bg-white/5 rounded-full animate-pulse" />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-40 bg-white/5 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>

        <div className="h-20 rounded-2xl bg-white/5 animate-pulse mb-6" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  const activeDelivery = data?.activeDeliveries?.[0] ?? null;
  const availableDeliveries = data?.availableDeliveries ?? [];
  const weeklyEarnings = data?.weeklyEarnings ?? [];
  const maxWeekly = Math.max(1, ...weeklyEarnings.map((w) => w.amount));

  return (
    <motion.main
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex-1 overflow-y-auto pb-32 px-4 pt-4"
    >
      {/* Online/Offline Toggle */}
      <motion.div
        variants={staggerItem}
        className="flex items-center justify-between mb-5"
      >
        <div className="flex items-center gap-3">
          <button onClick={handleToggleOnline} className="relative" aria-label="Toggle online">
            {riderOnline ? (
              <ToggleRight className="w-12 h-12 text-[#38BDF8]" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-white/30" />
            )}
          </button>
          <div>
            <p
              className={`text-sm font-bold ${
                riderOnline ? 'text-[#38BDF8]' : 'text-white/40'
              }`}
            >
              {riderOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-white/30 text-[10px]">Toggle to receive deliveries</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            riderOnline
              ? 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20'
              : 'bg-white/5 text-white/30 border border-white/5'
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              riderOnline ? 'bg-[#38BDF8] animate-pulse' : 'bg-white/20'
            }`}
          />
          {riderOnline ? 'Accepting Orders' : 'Not Available'}
        </div>
      </motion.div>

      {/* Profile Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#38BDF8]/30 to-[#38BDF8]/5 flex items-center justify-center border border-[#38BDF8]/20">
            <Bike className="w-7 h-7 text-[#38BDF8]" />
          </div>
          {riderOnline && (
            <span className="absolute -bottom-1 -right-1 size-4 bg-[#38BDF8] rounded-full border-2 border-[#0B0D14] animate-pulse" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-lg font-extrabold">
              {data?.riderName ?? 'Rider'}
            </h2>
            <span className="material-symbols-outlined text-[#38BDF8] text-lg">verified</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="material-symbols-outlined text-[#F5C451] text-sm">workspace_premium</span>
            <span className="text-[#F5C451] text-xs font-bold">Elite Rider</span>
            <span className="text-white/20 text-xs">•</span>
            <span className="text-white/40 text-xs">{data?.area ?? 'Lagos'}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/20" />
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-[#38BDF8]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5 text-[#38BDF8]" />
          </div>
          <p className="text-white text-xl font-extrabold">
            {data?.completedToday ?? 0}
          </p>
          <p className="text-white/40 text-[10px] mt-0.5">Completed Today</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-[#F5C451]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-[#F5C451]" />
          </div>
          <p className="text-white text-xl font-extrabold">
            {data?.rating?.toFixed(1) ?? '4.8'}
          </p>
          <p className="text-white/40 text-[10px] mt-0.5">Rating</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-[#10E07A]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[#10E07A] text-base">payments</span>
          </div>
          <p className="text-white text-base font-extrabold leading-tight">
            {formatNaira(data?.earningsToday ?? 0)}
          </p>
          <p className="text-white/40 text-[10px] mt-0.5">Earned Today</p>
        </div>
      </motion.div>

      {/* Iftar Rush Legend Badge */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#F5C451]/10 to-[#F5C451]/5 border border-[#F5C451]/20 p-4">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F5C451]/5 blur-[80px]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#F5C451]/20 rounded-2xl flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-[#F5C451]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[#F5C451] font-extrabold text-sm">Iftar Rush Active</h3>
                <span className="px-2 py-0.5 bg-[#F5C451]/20 rounded-full text-[#F5C451] text-[8px] font-black uppercase tracking-wider">
                  Ramadan Exclusive
                </span>
              </div>
              <p className="text-white/40 text-xs mt-1">
                2x bonus on all Iftar deliveries until Maghrib
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Delivery Card */}
      {activeDelivery && (
        <motion.div variants={staggerItem} className="mb-6">
          <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#38BDF8]" />
            Active Delivery
          </h3>
          <div className="relative overflow-hidden rounded-2xl bg-[#0F1118] border border-[#38BDF8]/20 p-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#38BDF8]/5 blur-[50px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 bg-[#38BDF8] rounded-full animate-pulse" />
                  <span className="text-[#38BDF8] text-xs font-bold uppercase tracking-widest">
                    In Progress
                  </span>
                </div>
                <span className="text-white/30 text-[10px] font-mono">
                  #{shortId(activeDelivery.id)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                <motion.div
                  className="bg-[#38BDF8] h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeDelivery.progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">
                    {itemsSummary(activeDelivery.items)}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-white/30" />
                    <p className="text-white/40 text-xs">
                      {data?.area ?? 'Lagos Island'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#10E07A] text-sm font-bold">
                    +{formatNaira(Math.round(activeDelivery.total * 0.15))}
                  </p>
                  <p className="text-white/40 text-xs">your earnings</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    toast({
                      title: 'Calling Customer 📞',
                      description: 'Connecting to customer...',
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-2 bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] py-2.5 rounded-xl font-bold text-xs hover:bg-[#38BDF8]/20 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </button>
                <button
                  onClick={() => handleComplete(activeDelivery.id)}
                  disabled={actionLoadingId === activeDelivery.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#10E07A] text-[#06070B] py-2.5 rounded-xl font-bold text-xs hover:bg-[#10E07A]/90 transition-colors disabled:opacity-60"
                >
                  {actionLoadingId === activeDelivery.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Complete Delivery
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* New Delivery Request CTA */}
      {riderOnline && !activeDelivery && (
        <motion.div variants={staggerItem} className="mb-6">
          <button
            onClick={() => setActiveModal('new-delivery')}
            className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#38BDF8]/20 to-[#38BDF8]/5 border border-[#38BDF8]/30 p-4 flex items-center gap-4 hover:border-[#38BDF8]/50 transition-all active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#38BDF8]/10 blur-[50px]" />
            <div className="w-12 h-12 bg-[#38BDF8]/20 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
              <Package className="w-6 h-6 text-[#38BDF8]" />
            </div>
            <div className="flex-1 text-left relative z-10">
              <h3 className="text-white font-extrabold text-sm">New Delivery Request</h3>
              <p className="text-white/40 text-xs mt-0.5">
                {availableDeliveries.length} deliveries waiting for you
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#38BDF8] shrink-0 relative z-10" />
          </button>
        </motion.div>
      )}

      {/* Available Deliveries */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#F5C451]" />
          Available Deliveries
          <span className="ml-auto px-2 py-0.5 bg-[#F5C451]/10 rounded-full text-[#F5C451] text-[10px] font-bold">
            {availableDeliveries.length} new
          </span>
        </h3>

        {availableDeliveries.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
              <Package className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white font-bold text-sm">No deliveries available</p>
            <p className="text-white/40 text-xs mt-1">
              New orders will appear here as vendors mark them ready.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableDeliveries.map((req) => (
              <motion.div
                key={req.id}
                variants={staggerItem}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm">
                        #{shortId(req.id)}
                      </p>
                      <span className="px-1.5 py-0.5 bg-[#A78BFA]/15 text-[#A78BFA] text-[8px] font-black rounded uppercase">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-white/30" />
                      <p className="text-white/40 text-xs">{data?.area ?? 'Lagos Island'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-sm">{formatNaira(req.total)}</p>
                    <p className="text-[#10E07A] text-[10px] font-bold">
                      +{formatNaira(Math.round(req.total * 0.15))} earn
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 text-[10px] text-white/30">
                  <Package className="w-3 h-3" />
                  <span className="truncate">{itemsSummary(req.items)}</span>
                  <span>•</span>
                  <span>{timeAgo(req.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="flex-1 bg-[#38BDF8] text-[#06070B] py-2.5 rounded-xl font-bold text-xs hover:bg-[#38BDF8]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {actionLoadingId === req.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => setActiveModal('new-delivery')}
                    className="flex-1 bg-white/5 border border-white/10 text-white/60 py-2.5 rounded-xl font-bold text-xs hover:bg-white/10 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Weekly Earnings Chart */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#10E07A] text-base">bar_chart</span>
          Weekly Earnings
          <span className="ml-auto text-white/40 text-[10px] font-bold">
            Total: {formatNaira(weeklyEarnings.reduce((s, w) => s + w.amount, 0))}
          </span>
        </h3>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyEarnings.map((w, i) => {
              const pct = Math.max(4, Math.round((w.amount / maxWeekly) * 100));
              const isToday = i === weeklyEarnings.length - 1;
              return (
                <div
                  key={`${w.day}-${i}`}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <span className="text-[9px] text-white/60 font-bold">
                    {w.amount > 0 ? `${(w.amount / 1000).toFixed(1)}k` : ''}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className={`w-full rounded-t-md ${
                      isToday
                        ? 'bg-gradient-to-t from-[#38BDF8] to-[#38BDF8]/60'
                        : 'bg-gradient-to-t from-[#38BDF8]/40 to-[#38BDF8]/20'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold ${
                      isToday ? 'text-[#38BDF8]' : 'text-white/40'
                    }`}
                  >
                    {w.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Recent Deliveries */}
      {(data?.recentDeliveries?.length ?? 0) > 0 && (
        <motion.div variants={staggerItem} className="mb-6">
          <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#10E07A]" />
            Recent Deliveries
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {data!.recentDeliveries.slice(0, 8).map((o) => (
              <div
                key={o.id}
                className="glass-card rounded-2xl p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#10E07A]/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[#10E07A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">
                    {itemsSummary(o.items)}
                  </p>
                  <p className="text-white/30 text-[10px]">{timeAgo(o.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[#10E07A] text-xs font-bold">
                    +{formatNaira(Math.round(o.total * 0.15))}
                  </p>
                  <p className="text-white/30 text-[10px]">{formatNaira(o.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Go to deliveries tab button */}
      <motion.div variants={staggerItem}>
        <button
          onClick={() => setActiveTab('rider-deliveries')}
          className="w-full text-center text-[#38BDF8] text-xs font-bold py-3 hover:underline"
        >
          View delivery map →
        </button>
      </motion.div>
    </motion.main>
  );
}
