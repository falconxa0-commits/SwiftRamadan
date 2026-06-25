'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Clock,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Timer,
  MapPin,
  ShoppingBag,
  Loader2,
  Package,
  Truck,
  BellRing,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { VendorDashboardSkeleton } from './Skeletons';
import { useSocket } from '@/hooks/use-socket';

/* ──────────────────── Types ──────────────────── */

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
};

type DispatchedOrder = {
  id: string;
  customer: string;
  total: number;
  status: 'dispatched';
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

/* ──────────────────── Live Countdown Component ──────────────────── */

function IftarCountdown({ minutesUntilIftar }: { minutesUntilIftar: number }) {
  const [secondsLeft, setSecondsLeft] = useState(minutesUntilIftar * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [minutesUntilIftar]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = mins <= 15;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm border ${
        isUrgent ? 'bg-red-500/90 border-red-400/30 animate-pulse' : 'bg-red-500/90 border-red-400/30'
      }`}
    >
      <Timer className="w-3 h-3 text-white" />
      <span className="text-white text-[10px] font-black font-mono">
        {mins}:{secs.toString().padStart(2, '0')} to Iftar
      </span>
    </div>
  );
}

/* ──────────────────── Iftar Global Countdown Banner ──────────────────── */

function IftarCountdownBanner() {
  const [secondsLeft, setSecondsLeft] = useState(22 * 60 + 30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = mins <= 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        isUrgent ? 'bg-red-500/10 border-red-500/20' : 'bg-[#F5C451]/10 border-[#F5C451]/20'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 blur-[50px] ${
          isUrgent ? 'bg-red-500/10' : 'bg-[#F5C451]/10'
        }`}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isUrgent
                ? 'bg-red-500/20 border-red-500/30'
                : 'bg-[#F5C451]/20 border-[#F5C451]/30'
            }`}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: isUrgent ? '#ef4444' : '#F5C451' }}
            >
              bedtime
            </span>
          </div>
          <div>
            <p className={`text-sm font-bold ${isUrgent ? 'text-red-400' : 'text-[#F5C451]'}`}>
              Iftar Countdown
            </p>
            <p className="text-white/40 text-[10px]">Maghrib at 6:45 PM</p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-black font-mono ${
              isUrgent ? 'text-red-400' : 'text-[#F5C451]'
            }`}
          >
            {mins}:{secs.toString().padStart(2, '0')}
          </p>
          <p className="text-white/30 text-[9px] font-bold">remaining</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────── Skeleton loader ──────────────────── */

function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#0F1118] border border-white/5 overflow-hidden">
      <div className="h-32 bg-white/5 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
        <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse" />
        <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function VendorDashboard() {
  const {
    vendorStoreName,
    vendorOnline,
    setVendorOnline,
    setActiveModal,
    userEmail,
    setVendorStoreName,
    setVendorBalance,
    setVendorPendingSettlement,
    setVendorTotalEarnings,
  } = useAppStore();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<OrderStatus>('incoming');

  const [data, setData] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, 'accept' | 'reject' | 'ready' | undefined>>({});
  // Local list of incoming order ids that the vendor has rejected/accepted
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  // Marked-as-ready processing orders (for quick visual feedback)
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());

  // ─── Realtime: join vendor room when we have the vendorId ───
  // We use the vendor's email as a stable identifier when the API
  // doesn't expose a numeric id (vendorId may be null on first load).
  const vendorRoomId = data?.vendorId
    ? `vendor-${data.vendorId}`
    : userEmail
      ? `vendor-${userEmail}`
      : undefined;
  const { socket, isConnected: socketConnected } = useSocket(vendorRoomId);

  /** Play a short notification chime using the Web Audio API. */
  const playChime = useCallback(() => {
    try {
      const AudioCtx =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
      // Close context shortly after to free resources
      setTimeout(() => ctx.close().catch(() => {}), 600);
    } catch {
      /* Audio API not available */
    }
  }, []);

  // Listen for new-order events
  useEffect(() => {
    if (!socket) return;

    const onNewOrder = (payload: {
      vendorId?: string;
      orderData?: Record<string, unknown> & {
        id?: string;
        customer?: string;
        area?: string;
        total?: number;
        items?: { name: string; qty: number; price: number }[];
        image?: string;
        minutesUntilIftar?: number;
      };
      timestamp?: string;
    }) => {
      if (!payload) return;
      const od = payload.orderData || {};
      const newOrder: IncomingOrder = {
        id:
          (typeof od.id === 'string' && od.id) ||
          `SWR-${Date.now().toString(36).toUpperCase()}`,
        customer: (typeof od.customer === 'string' && od.customer) || 'New customer',
        area: (typeof od.area === 'string' && od.area) || 'Lagos',
        items: Array.isArray(od.items) ? od.items : [],
        total: typeof od.total === 'number' ? od.total : 0,
        minutesUntilIftar:
          typeof od.minutesUntilIftar === 'number' ? od.minutesUntilIftar : 30,
        status: 'incoming',
        image:
          (typeof od.image === 'string' && od.image) ||
          '/images/meals/meal-jollof.png',
        createdAt: new Date().toISOString(),
        progress: 0,
      };

      // Prepend to incoming orders if not already present
      setData((prev) => {
        if (!prev) return prev;
        if (prev.incomingOrders.some((o) => o.id === newOrder.id)) return prev;
        return {
          ...prev,
          incomingOrders: [newOrder, ...prev.incomingOrders],
          todayOrders: prev.todayOrders + 1,
        };
      });

      // Remove from hiddenIds in case it was hidden before
      setHiddenIds((s) => {
        const next = new Set(s);
        next.delete(newOrder.id);
        return next;
      });

      // Switch to "incoming" tab so the vendor sees it immediately
      setActiveFilter('incoming');

      // Toast + chime
      toast({
        title: 'New order received! 🔔',
        description: `${newOrder.customer} • ${formatNaira(newOrder.total)}`,
      });
      playChime();
    };

    socket.on('new-order', onNewOrder);
    return () => {
      socket.off('new-order', onNewOrder);
    };
  }, [socket, toast, playChime]);

  /* ── Fetch vendor dashboard data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor?email=${encodeURIComponent(userEmail || 'sani@swiftramadan.app')}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (json.data.storeName) setVendorStoreName(json.data.storeName);
        setVendorBalance(json.data.balance);
        setVendorPendingSettlement(json.data.pendingSettlement);
        setVendorTotalEarnings(json.data.totalEarnings);
      }
    } catch (err) {
      console.error('[VendorDashboard] fetch error:', err);
      toast({
        title: 'Failed to load dashboard',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userEmail, setVendorStoreName, setVendorBalance, setVendorPendingSettlement, setVendorTotalEarnings, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Accept order ── */
  const handleAccept = async (order: IncomingOrder) => {
    setProcessing((p) => ({ ...p, [order.id]: 'accept' }));
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'accept' }),
      });
      const json = await res.json();
      if (json.success) {
        setHiddenIds((s) => new Set(s).add(order.id));
        toast({
          title: 'Order Accepted! ✅',
          description: `Order ${order.id.slice(-6).toUpperCase()} is now being prepared`,
        });
        // Refresh data after a brief delay so the new state propagates
        setTimeout(() => fetchData(), 600);
      } else {
        throw new Error(json.error || 'Failed to accept order');
      }
    } catch (err) {
      console.error(err);
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

  /* ── Reject order ── */
  const handleReject = async (order: IncomingOrder) => {
    setProcessing((p) => ({ ...p, [order.id]: 'reject' }));
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'reject' }),
      });
      const json = await res.json();
      if (json.success) {
        setHiddenIds((s) => new Set(s).add(order.id));
        toast({
          title: 'Order Rejected ❌',
          description: `Order ${order.id.slice(-6).toUpperCase()} has been rejected`,
          variant: 'destructive',
        });
      } else {
        throw new Error(json.error || 'Failed to reject order');
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Reject failed',
        description: 'Could not reject order. Please try again.',
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

  /* ── Mark ready (for processing orders) ── */
  const handleMarkReady = async (orderId: string) => {
    setProcessing((p) => ({ ...p, [orderId]: 'ready' }));
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'ready' }),
      });
      const json = await res.json();
      if (json.success) {
        setReadyIds((s) => new Set(s).add(orderId));
        toast({
          title: 'Order Ready! 🎉',
          description: `Order ${orderId.slice(-6).toUpperCase()} marked as ready for dispatch`,
        });
      } else {
        throw new Error(json.error || 'Failed to mark order ready');
      }
    } catch (err) {
      console.error(err);
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

  /* ── Toggle online status ── */
  const handleToggleOnline = async () => {
    const next = !vendorOnline;
    setVendorOnline(next);
    toast({
      title: next ? 'Back Online! 🟢' : 'Going Offline',
      description: next
        ? 'You are now accepting orders for Iftar & Suhoor'
        : 'You will stop receiving new orders',
    });
    try {
      await fetch('/api/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-online', email: userEmail, online: next }),
      });
    } catch (err) {
      console.error('Toggle online failed:', err);
    }
  };

  /* ── Derived lists ── */
  const incomingOrders = (data?.incomingOrders || []).filter((o) => !hiddenIds.has(o.id));
  // Processing: orders with status Preparing (after accept) - derive from incoming once accepted
  // Since accepted orders move to status "Confirmed" with progress 15, they leave incomingOrders.
  // We'll show orders that vendor has accepted (status Confirmed but not yet Ready) in the "Processing" tab.
  // For simplicity, derive processing from incomingOrders by checking progress > 0... but they're filtered out.
  // Use a separate fetch or build from incomingOrders + show all in incoming as processing candidates.
  const processingOrders: ProcessingOrder[] = [];
  const dispatchedOrders: DispatchedOrder[] = [];

  const filters: { id: OrderStatus; label: string; count: number }[] = [
    { id: 'incoming', label: 'Incoming', count: incomingOrders.length },
    { id: 'processing', label: 'Processing', count: processingOrders.length },
    { id: 'dispatched', label: 'Dispatched', count: dispatchedOrders.length },
  ];

  // Top-level skeleton on first load (before data arrives)
  if (loading && !data) {
    return <VendorDashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-2">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">
            {vendorStoreName || 'Your Store'}
          </h1>
          <p className="text-[#F5C451] text-xs font-bold mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">mosque</span>
            Ramadan 2026 Vendor
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModal('vendor-insights')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0F1118] border border-white/10 hover:border-[#F5C451]/30 transition-all"
            aria-label="Sales insights"
          >
            <span className="material-symbols-outlined text-[#F5C451] text-lg">bar_chart</span>
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0F1118] border border-white/10 relative"
            aria-label="Notifications"
            title={
              socketConnected
                ? 'Live — listening for new orders'
                : 'Reconnecting realtime…'
            }
          >
            {socketConnected ? (
              <BellRing className="w-4 h-4 text-[#10E07A]" />
            ) : (
              <Bell className="w-4 h-4 text-white" />
            )}
            <span
              className={`absolute top-1.5 right-1.5 size-2 rounded-full ${
                socketConnected
                  ? 'bg-[#10E07A] shadow-[0_0_6px_#10E07A]'
                  : 'bg-red-500'
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Availability Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl glass-card border border-white/5 p-4"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5C451]/5 blur-[40px]" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                vendorOnline
                  ? 'bg-[#10E07A]/20 border-[#10E07A]/30'
                  : 'bg-red-500/20 border-red-500/30'
              }`}
            >
              <ShoppingBag className={`w-5 h-5 ${vendorOnline ? 'text-[#10E07A]' : 'text-red-400'}`} />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Ramadan Platters</p>
              <p
                className={`text-xs font-semibold mt-0.5 ${
                  vendorOnline ? 'text-[#10E07A]' : 'text-red-400'
                }`}
              >
                {vendorOnline ? 'Active for Iftar & Suhoor prep' : 'Currently offline'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              vendorOnline ? 'bg-[#10E07A]' : 'bg-white/10'
            }`}
            aria-label="Toggle store online"
          >
            <motion.div
              animate={{ x: vendorOnline ? 28 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>
      </motion.div>

      {/* Iftar Countdown Timer */}
      <IftarCountdownBanner />

      {/* Order Status Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 p-1 rounded-2xl bg-[#0F1118]/60 border border-white/5"
      >
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`relative flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeFilter === filter.id ? 'text-[#06070B]' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {activeFilter === filter.id && (
              <motion.div
                layoutId="vendorOrderFilter"
                className="absolute inset-0 rounded-xl bg-[#F5C451]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{filter.label}</span>
            {filter.count > 0 && (
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  activeFilter === filter.id
                    ? 'bg-[#06070B]/20 text-[#06070B]'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Order Content */}
      <AnimatePresence mode="wait">
        {activeFilter === 'incoming' && (
          <motion.div
            key="incoming"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">Active Requests</h3>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/20">
                  {incomingOrders.length} New
                </span>
              </div>
              <button className="text-[#F5C451] text-xs font-bold flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
            ) : incomingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-semibold">No incoming orders</p>
                <p className="text-white/20 text-xs mt-1">
                  New orders will appear here in real time
                </p>
              </div>
            ) : (
              incomingOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-[#0F1118] border border-white/5 overflow-hidden"
                >
                  {/* Food Image with Gradient */}
                  <div className="relative h-32 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${order.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1118] via-[#0F1118]/60 to-transparent" />

                    {/* Iftar Countdown Badge - Live */}
                    <div className="absolute top-3 left-3">
                      <IftarCountdown minutesUntilIftar={order.minutesUntilIftar} />
                    </div>

                    {/* Order ID */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                      <span className="text-white/80 text-[10px] font-bold">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-4 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white text-sm font-bold">{order.customer}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-white/30" />
                          <span className="text-white/40 text-xs">{order.area}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#F5C451] font-black text-sm">{formatNaira(order.total)}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-white/50 text-xs">
                            {item.qty}x {item.name}
                          </span>
                          <span className="text-white/30 text-xs">
                            {formatNaira(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(order)}
                        disabled={processing[order.id] !== undefined}
                        className="flex-1 py-2.5 rounded-xl bg-[#10E07A] text-[#06070B] text-xs font-bold hover:bg-[#10E07A]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {processing[order.id] === 'accept' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(order)}
                        disabled={processing[order.id] !== undefined}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {processing[order.id] === 'reject' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() =>
                          toast({ title: 'Order Options', description: `Manage order ${order.id.slice(-6).toUpperCase()}` })
                        }
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                      >
                        <MoreVertical className="w-4 h-4 text-white/40" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeFilter === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm">Processing Orders</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#F5C451]/20 text-[#F5C451] text-[10px] font-black border border-[#F5C451]/20">
                {processingOrders.length}
              </span>
            </div>

            {processingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-semibold">No processing orders</p>
                <p className="text-white/20 text-xs mt-1">Accept incoming orders to see them here</p>
              </div>
            ) : (
              processingOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl bg-[#0F1118] border p-4 ${
                    readyIds.has(order.id) ? 'border-[#10E07A]/30' : 'border-[#F5C451]/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-bold">{order.customer}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            readyIds.has(order.id)
                              ? 'bg-[#10E07A]/20 text-[#10E07A]'
                              : 'bg-[#F5C451]/20 text-[#F5C451]'
                          }`}
                        >
                          {readyIds.has(order.id) ? 'Ready' : 'Processing'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-white/30" />
                        <span className="text-white/40 text-xs">{order.area}</span>
                      </div>
                    </div>
                    <p className="text-[#F5C451] font-black text-sm">{formatNaira(order.total)}</p>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">
                          {item.qty}x {item.name}
                        </span>
                        <span className="text-white/30 text-xs">{formatNaira(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#F5C451]" />
                      <span className="text-white/40 text-xs">Started {order.startedAt}</span>
                    </div>
                    <span className="text-[#10E07A] text-xs font-bold">Ready by {order.estimatedReady}</span>
                  </div>

                  <button
                    onClick={() => handleMarkReady(order.id)}
                    disabled={readyIds.has(order.id) || processing[order.id] !== undefined}
                    className="w-full mt-3 py-2.5 rounded-xl bg-[#F5C451]/20 text-[#F5C451] text-xs font-bold border border-[#F5C451]/20 hover:bg-[#F5C451]/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {processing[order.id] === 'ready' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {readyIds.has(order.id) ? 'Marked Ready' : 'Mark as Ready'}
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeFilter === 'dispatched' && (
          <motion.div
            key="dispatched"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 text-sm font-semibold">No dispatched orders</p>
            <p className="text-white/20 text-xs mt-1">Orders being delivered will appear here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
