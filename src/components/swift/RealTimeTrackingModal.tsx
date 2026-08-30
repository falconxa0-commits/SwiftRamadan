'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Bike,
  Phone,
  Star,
  Check,
  Navigation,
  X,
  Clock,
  Package,
  Store,
  User,
  Loader2,
  PartyPopper,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNavigation, useOrders, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/data';
import { useSocket } from '@/hooks/use-socket';

/* ──────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────── */

type DeliveryStatus =
  | 'preparing'
  | 'picked_up'
  | 'on_the_way'
  | 'arriving'
  | 'delivered';

interface GeoPoint {
  lat: number;
  lng: number;
}

interface Rider {
  name: string;
  phone: string;
  photo: string;
  rating: number;
  vehicle: string;
  color: string;
}

interface DeliveryState {
  orderId: string;
  rider: Rider;
  location: GeoPoint;
  status: DeliveryStatus;
  eta: number;
  progress: number;
  customer: GeoPoint;
  store: { name: string; lat: number; lng: number };
  total: number;
  items: Array<{ name: string; qty: number; price: number }>;
}

interface UpdateMessage {
  orderId: string;
  from: 'rider' | 'customer' | 'system';
  text: string;
  timestamp: number;
}

/* ──────────────────────────────────────────────────────────
   Status config
   ────────────────────────────────────────────────────────── */

const STATUS_STAGES: Array<{
  key: DeliveryStatus;
  label: string;
  desc: string;
  icon: typeof Package;
}> = [
  { key: 'preparing', label: 'Order Placed', desc: 'Restaurant preparing your meal', icon: Package },
  { key: 'picked_up', label: 'Picked Up', desc: 'Rider collected your order', icon: Store },
  { key: 'on_the_way', label: 'On The Way', desc: 'Heading to your location', icon: Bike },
  { key: 'arriving', label: 'Arriving', desc: 'Rider is at your doorstep', icon: Navigation },
  { key: 'delivered', label: 'Delivered', desc: 'Order completed - Ramadan Mubarak!', icon: Check },
];

const STATUS_ORDER: DeliveryStatus[] = [
  'preparing',
  'picked_up',
  'on_the_way',
  'arriving',
  'delivered',
];

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Map an Order.status (DB string) → internal DeliveryStatus */
function mapOrderStatus(status: string): DeliveryStatus {
  switch (status) {
    case 'Confirmed':
    case 'Preparing':
      return 'preparing';
    case 'Ready':
      return 'picked_up';
    case 'In Transit':
      return 'on_the_way';
    case 'Delivered':
      return 'delivered';
    default:
      return 'preparing';
  }
}

/** Map Order.progress (0-100) → ETA minutes (inverse) */
function progressToEta(progress: number, status: DeliveryStatus): number {
  if (status === 'delivered') return 0;
  if (status === 'arriving') return 2;
  if (status === 'on_the_way') return Math.max(3, Math.round((100 - progress) / 6));
  if (status === 'picked_up') return Math.max(5, Math.round((100 - progress) / 6));
  return Math.max(8, Math.round((100 - progress) / 6));
}

/** Generate system messages based on status */
function statusMessage(status: DeliveryStatus, riderName: string): string {
  switch (status) {
    case 'preparing':
      return 'Your order is being prepared with care 🍳';
    case 'picked_up':
      return `${riderName} has picked up your order 🏍️`;
    case 'on_the_way':
      return `${riderName} is on the way to you 📍`;
    case 'arriving':
      return `${riderName} is arriving at your location 🚪`;
    case 'delivered':
      return `Delivered! Ramadan Mubarak 🌙 — Enjoy your meal!`;
    default:
      return 'Updating...';
  }
}

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */

export default function RealTimeTrackingModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { orders } = useOrders();
  const userEmail = useAppStore(s => s.userEmail);
  const { toast } = useToast();
  const isOpen = activeModal === 'live-tracking';

  const [delivery, setDelivery] = useState<DeliveryState | null>(null);
  const [messages, setMessages] = useState<UpdateMessage[]>([]);
  const [delivered, setDelivered] = useState(false);

  // Derive the tracked order id from the store (no setState-in-effect needed)
  const trackedOrderId =
    orders.find((o) => o.status !== 'Delivered')?.id ??
    orders[0]?.id ??
    null;
  // Use a ref so the polling callback always has the latest id without re-creating it
  const trackedOrderIdRef = useRef<string | null>(trackedOrderId);
  useEffect(() => {
    trackedOrderIdRef.current = trackedOrderId;
  }, [trackedOrderId]);

  // ─── Socket.io for real-time updates ───
  // Only join the room while the modal is open; the useSocket hook
  // handles joining / leaving automatically.
  const roomId = isOpen && trackedOrderId ? `order-${trackedOrderId}` : undefined;
  const { socket, isConnected: socketConnected } = useSocket(roomId);

  // Listen for order-status-update events
  useEffect(() => {
    if (!socket) return;
    const onStatusUpdate = (payload: {
      orderId?: string;
      status?: string;
      progress?: number;
      riderName?: string;
      eta?: number;
      timestamp?: string;
    }) => {
      if (!payload || !payload.orderId) return;
      // Only react to updates for the order we're currently tracking
      if (
        trackedOrderIdRef.current &&
        payload.orderId !== trackedOrderIdRef.current
      ) {
        return;
      }
      const status = mapOrderStatus(payload.status || 'Preparing');
      const progress =
        typeof payload.progress === 'number' ? payload.progress : 0;
      const eta =
        typeof payload.eta === 'number'
          ? payload.eta
          : progressToEta(progress, status);
      const riderName = payload.riderName || 'Your Rider';

      setDelivery((prev) => {
        // Preserve existing items / store / customer if present
        const baseLat = 6.4541;
        const baseLng = 3.3947;
        const storeLat = baseLat + 0.01;
        const storeLng = baseLng - 0.012;
        const custLat = baseLat - 0.008;
        const custLng = baseLng + 0.014;
        const prevLoc = prev?.location;
        const t = Math.min(1, Math.max(0, progress / 100));
        const locLat =
          prevLoc?.lat ?? storeLat + (custLat - storeLat) * t;
        const locLng =
          prevLoc?.lng ?? storeLng + (custLng - storeLng) * t;

        const next: DeliveryState = {
          orderId: payload.orderId ?? '',
          rider: prev?.rider ?? {
            name: riderName,
            phone: '+234 800 000 0000',
            photo: '',
            rating: 4.9,
            vehicle: 'Motorcycle',
            color: '#38BDF8',
          },
          location: { lat: locLat, lng: locLng },
          status,
          eta,
          progress,
          customer: prev?.customer ?? { lat: custLat, lng: custLng },
          store:
            prev?.store ?? {
              name: 'SwiftRamadan Kitchen',
              lat: storeLat,
              lng: storeLng,
            },
          total: prev?.total ?? 0,
          items: prev?.items ?? [],
        };

        // Update rider name if changed
        if (
          payload.riderName &&
          payload.riderName !== next.rider.name
        ) {
          next.rider = { ...next.rider, name: payload.riderName };
        }

        // Push a system message if status changed
        if (lastStatusRef.current !== status) {
          const prevStatus = lastStatusRef.current;
          lastStatusRef.current = status;
          if (prevStatus !== null) {
            const msg: UpdateMessage = {
              orderId: payload.orderId ?? '',
              from: 'system',
              text: statusMessage(status, next.rider.name),
              timestamp: Date.now(),
            };
            setMessages((m) =>
              m.some((x) => x.text === msg.text && x.from === 'system')
                ? m
                : [...m, msg]
            );
          }
        }

        return next;
      });

      if (status === 'delivered') {
        setDelivered(true);
      }
    };

    const onRiderLocation = (payload: {
      orderId?: string;
      lat?: number;
      lng?: number;
      progress?: number;
    }) => {
      if (!payload || !payload.orderId) return;
      if (
        trackedOrderIdRef.current &&
        payload.orderId !== trackedOrderIdRef.current
      ) {
        return;
      }
      if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number')
        return;

      setDelivery((prev) => {
        if (!prev) return prev;
        const next: DeliveryState = {
          ...prev,
          location: { lat: payload.lat!, lng: payload.lng! },
          progress:
            typeof payload.progress === 'number'
              ? payload.progress
              : prev.progress,
        };
        return next;
      });
    };

    socket.on('order-status-update', onStatusUpdate);
    socket.on('rider-location', onRiderLocation);
    return () => {
      socket.off('order-status-update', onStatusUpdate);
      socket.off('rider-location', onRiderLocation);
    };
  }, [socket]);

  // isPolling is purely derived from whether the modal is open AND
  // the socket isn't connected (so we fall back to HTTP polling)
  const isPolling = isOpen;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastStatusRef = useRef<DeliveryStatus | null>(null);

  /* ─── Polling: fetch /api/orders every 3s when modal is open ─── */
  const pollOrder = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const json = await res.json();
      const allOrders: Array<{
        id: string;
        status: string;
        total: number;
        riderName: string | null;
        items: Array<{ name: string; qty: number; price: number }>;
        progress: number;
        createdAt: string;
      }> = json.orders ?? [];

      const match =
        allOrders.find((o) => o.id === trackedOrderIdRef.current) ??
        allOrders.find((o) => o.status !== 'Delivered') ??
        allOrders[0];

      if (!match) return;

      const status = mapOrderStatus(match.status);
      const progress = match.progress ?? 0;
      const eta = progressToEta(progress, status);

      // Derive rider info — use Order.riderName if present, else placeholder
      const riderName = match.riderName || 'Your Rider';
      const rider: Rider = {
        name: riderName,
        phone: '+234 800 000 0000',
        photo: '',
        rating: 4.9,
        vehicle: 'Motorcycle',
        color: '#38BDF8',
      };

      // Stylized Lagos coordinates around the user's area
      const baseLat = 6.4541;
      const baseLng = 3.3947;

      // Position the rider along a path from store → customer based on progress
      const storeLat = baseLat + 0.01;
      const storeLng = baseLng - 0.012;
      const custLat = baseLat - 0.008;
      const custLng = baseLng + 0.014;
      const t = Math.min(1, Math.max(0, progress / 100));
      const locLat = storeLat + (custLat - storeLat) * t;
      const locLng = storeLng + (custLng - storeLng) * t;

      const next: DeliveryState = {
        orderId: match.id,
        rider,
        location: { lat: locLat, lng: locLng },
        status,
        eta,
        progress,
        customer: { lat: custLat, lng: custLng },
        store: { name: 'SwiftRamadan Kitchen', lat: storeLat, lng: storeLng },
        total: match.total,
        items: match.items ?? [],
      };

      setDelivery((prev) => {
        // If status changed, push a system message
        if (lastStatusRef.current !== status) {
          const prevStatus = lastStatusRef.current;
          lastStatusRef.current = status;
          if (prevStatus !== null) {
            const msg: UpdateMessage = {
              orderId: match.id,
              from: 'system',
              text: statusMessage(status, riderName),
              timestamp: Date.now(),
            };
            setMessages((m) =>
              m.some((x) => x.text === msg.text && x.from === 'system')
                ? m
                : [...m, msg]
            );
          }
        }
        return next;
      });

      // Trigger delivered state
      if (status === 'delivered') {
        setDelivered(true);
      }
    } catch (err) {
      // silently handle
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Initial fetch immediately
    pollOrder();
    // Fall back to polling every 5s. If the socket is connected, the
    // realtime service pushes updates instantly and we don't need to
    // poll as aggressively — but we still poll every 5s as a safety net
    // in case the socket disconnects silently.
    const interval = setInterval(pollOrder, 5000);
    return () => {
      clearInterval(interval);
      // Don't reset delivery here so the close animation doesn't flash
    };
  }, [isOpen, pollOrder]);

  /* Auto-scroll updates to bottom */
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* ─── handlers ─── */
  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, [setActiveModal]);

  const handleCallRider = useCallback(() => {
    if (!delivery?.rider) return;
    toast({
      title: `Calling ${delivery.rider.name}... 📞`,
      description: delivery.rider.phone,
    });
  }, [delivery, toast]);

  /** Trigger the rate-delivery modal — stash order info in localStorage since
   *  store.ts cannot be modified (RateDeliveryModal owner = Agent E). */
  const handleRateRider = useCallback(() => {
    if (!delivery) return;
    try {
      localStorage.setItem(
        'rateDeliveryOrder',
        JSON.stringify({
          orderId: delivery.orderId,
          riderName: delivery.rider.name,
          total: delivery.total,
          items: delivery.items,
          userEmail,
        })
      );
    } catch (e) {
      // silently handle
    }
    setActiveModal('rate-delivery');
  }, [delivery, userEmail, setActiveModal]);

  /* ─── derived ─── */
  const currentStageIndex = useMemo(() => {
    if (!delivery) return 0;
    const idx = STATUS_ORDER.indexOf(delivery.status);
    return idx < 0 ? 0 : idx;
  }, [delivery]);

  // Map coordinates → pixel positions on the map panel (percentage)
  const mapLayout = useMemo(() => {
    if (!delivery) return null;
    const pts = [delivery.store, delivery.customer, delivery.location];
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latRange = Math.max(maxLat - minLat, 0.001);
    const lngRange = Math.max(maxLng - minLng, 0.001);
    const pad = 0.15;
    const project = (p: GeoPoint) => {
      const x = ((p.lng - minLng) / lngRange) * (1 - pad * 2) + pad;
      const y = 1 - (((p.lat - minLat) / latRange) * (1 - pad * 2) + pad);
      return { x: x * 100, y: y * 100 };
    };
    const store = project(delivery.store);
    const customer = project(delivery.customer);
    const rider = project(delivery.location);
    return { store, customer, rider };
  }, [delivery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[95]"
            onClick={handleClose}
          />

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[100] bg-[#0B0D14] flex flex-col overflow-hidden"
          >
            {/* ─── Sticky Header ─── */}
            <div className="glass-effect border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#38BDF8]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white text-base font-bold leading-tight flex items-center gap-2">
                    Live Tracking
                    {socketConnected ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-[#10E07A] inline-block"
                        title="Realtime connected"
                      />
                    ) : isPolling ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-[#38BDF8] inline-block"
                        title="Polling (socket offline)"
                      />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/30 inline-block" />
                    )}
                  </h2>
                  <p className="text-white/65 text-[11px] truncate">
                    {delivery
                      ? `Order #${delivery.orderId.slice(-6).toUpperCase()} • ${delivery.rider.name}`
                      : 'Connecting to rider...'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close live tracking"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* ─── Scrollable content ─── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Map panel */}
              <MapPanel delivery={delivery} layout={mapLayout} />

              {/* Delivered banner */}
              <AnimatePresence>
                {delivered && (
                  <motion.section
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-4 pt-4"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10E07A]/15 to-[#F5C451]/10 border border-[#10E07A]/30 p-4">
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#10E07A]/10 blur-3xl rounded-full" />
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#10E07A]/20 flex items-center justify-center shrink-0">
                          <PartyPopper className="w-6 h-6 text-[#10E07A]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-extrabold text-sm">
                            Delivered! Ramadan Mubarak 🌙
                          </h3>
                          <p className="text-white/50 text-xs mt-0.5">
                            How was your experience with {delivery?.rider.name ?? 'your rider'}?
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRateRider}
                        className="mt-3 w-full bg-[#F5C451] text-[#06070B] py-3 rounded-xl font-black text-sm hover:bg-[#F5C451]/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Star className="w-4 h-4 fill-[#06070B]" />
                        Rate your rider
                      </button>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Status Timeline */}
              <section className="px-4 pt-5">
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
                  Delivery Status
                </h3>
                <div className="bg-[#0F1118] rounded-2xl border border-white/5 p-4">
                  <div className="relative">
                    {STATUS_STAGES.map((stage, idx) => {
                      const isPast = idx < currentStageIndex;
                      const isActive = idx === currentStageIndex;
                      const isFuture = idx > currentStageIndex;
                      const Icon = stage.icon;
                      return (
                        <div key={stage.key} className="flex gap-3 relative">
                          {/* Vertical line */}
                          {idx < STATUS_STAGES.length - 1 && (
                            <div className="absolute left-[18px] top-9 bottom-0 w-[2px] bg-white/5" />
                          )}
                          {/* Marker */}
                          <div
                            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                              isActive
                                ? 'bg-[#38BDF8]/20 border-2 border-[#38BDF8] scale-110'
                                : isPast
                                  ? 'bg-[#10E07A] border-2 border-[#10E07A]'
                                  : 'bg-[#1A1D26] border-2 border-white/10'
                            }`}
                          >
                            {isPast ? (
                              <Check className="w-4 h-4 text-[#06070B]" strokeWidth={3} />
                            ) : (
                              <Icon
                                className={`w-4 h-4 ${
                                  isActive ? 'text-[#38BDF8]' : 'text-white/60'
                                }`}
                              />
                            )}
                            {isActive && (
                              <motion.div
                                animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                                transition={{ duration: 1.6, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-[#38BDF8]"
                              />
                            )}
                          </div>
                          {/* Label */}
                          <div className="flex-1 pb-5 pt-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-bold ${
                                  isActive
                                    ? 'text-white'
                                    : isPast
                                      ? 'text-[#10E07A]'
                                      : 'text-white/65'
                                }`}
                              >
                                {stage.label}
                              </p>
                              {isActive && (
                                <motion.span
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1.4, repeat: Infinity }}
                                  className="text-[10px] text-[#38BDF8] font-bold uppercase"
                                >
                                  Live
                                </motion.span>
                              )}
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isFuture ? 'text-white/60' : 'text-white/50'
                              }`}
                            >
                              {stage.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* ETA + Rider cards */}
              <section className="px-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ETA card */}
                <div className="bg-gradient-to-br from-[#38BDF8]/10 to-[#0F1118] rounded-2xl border border-[#38BDF8]/20 p-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#38BDF8]/5 blur-2xl rounded-full" />
                  <div className="flex items-center gap-2 mb-2 relative">
                    <Clock className="w-4 h-4 text-[#38BDF8]" />
                    <span className="text-white/50 text-[11px] uppercase tracking-wider font-bold">
                      Estimated arrival
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 relative">
                    <motion.span
                      key={delivery?.eta ?? 0}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-white text-4xl font-black leading-none"
                    >
                      {delivery?.status === 'delivered' ? '0' : delivery?.eta ?? '--'}
                    </motion.span>
                    <span className="text-white/50 text-sm font-medium">
                      {delivery?.status === 'delivered' ? 'Delivered' : 'min'}
                    </span>
                  </div>
                  {delivery && (
                    <p className="text-white/65 text-[11px] mt-2 relative">
                      {delivery.status === 'delivered'
                        ? 'Order completed 🎉'
                        : delivery.status === 'arriving'
                          ? 'Rider is at your doorstep!'
                          : delivery.status === 'on_the_way'
                            ? 'Rider approaching your area'
                            : delivery.status === 'picked_up'
                              ? 'Order picked up from restaurant'
                              : 'Restaurant preparing your order'}
                    </p>
                  )}
                </div>

                {/* Rider card */}
                <div className="bg-[#0F1118] rounded-2xl border border-white/5 p-4">
                  {delivery ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 font-bold text-sm"
                        style={{
                          backgroundColor: `${delivery.rider.color}22`,
                          borderColor: `${delivery.rider.color}66`,
                          color: delivery.rider.color,
                        }}
                      >
                        {initials(delivery.rider.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">
                          {delivery.rider.name}
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#F5C451] text-[#F5C451]" />
                          <span className="text-[#F5C451] text-[11px] font-bold">
                            {delivery.rider.rating}
                          </span>
                          <span className="text-white/60 text-[11px]">•</span>
                          <span className="text-white/65 text-[11px] truncate">
                            {delivery.rider.vehicle}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleCallRider}
                          className="w-10 h-10 rounded-xl bg-[#F5C451]/10 border border-[#F5C451]/30 flex items-center justify-center hover:bg-[#F5C451]/20 transition-colors"
                          aria-label="Call rider"
                        >
                          <Phone className="w-4 h-4 text-[#F5C451]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1A1D26] border-2 border-white/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-white/60" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/65 text-sm">Waiting for rider...</p>
                        <p className="text-white/60 text-xs mt-1">
                          {socketConnected
                            ? 'Realtime channel live'
                            : isPolling
                              ? 'Polling for updates...'
                              : 'No active order'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Order summary */}
              {delivery && (
                <section className="px-4 pt-4">
                  <div className="bg-[#0F1118] rounded-2xl border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-white/65" />
                      <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                        Order Summary
                      </span>
                    </div>
                    {delivery.items.length > 0 ? (
                      <div className="space-y-1.5">
                        {delivery.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-white/70">
                              {it.qty}x {it.name}
                            </span>
                            <span className="text-white/50">{formatNaira(it.price * it.qty)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/65 text-xs">No items</p>
                    )}
                    <div className="h-px bg-white/5 my-2" />
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/70">Total</span>
                      <span className="text-white">{formatNaira(delivery.total)}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Live updates feed (system messages only) */}
              <section className="px-4 pt-4 pb-6">
                <div className="bg-[#0F1118] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#38BDF8]" />
                    <span className="text-white text-sm font-bold">Delivery Updates</span>
                    <span className="ml-auto text-white/60 text-[10px]">
                      {messages.length} updates
                    </span>
                  </div>

                  {/* Updates list */}
                  <div
                    ref={chatScrollRef}
                    className="px-3 py-3 max-h-72 overflow-y-auto custom-scrollbar space-y-2"
                  >
                    {messages.length === 0 ? (
                      <div className="py-8 text-center">
                        <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
                        <p className="text-white/60 text-xs">
                          Updates will appear here as your order progresses.
                        </p>
                      </div>
                    ) : (
                      messages.map((m, idx) => (
                        <UpdateBubble key={`${m.timestamp}-${idx}`} msg={m} />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </section>
            </div>

            {/* ─── Bottom progress bar ─── */}
            <div className="border-t border-white/5 bg-[#0F1118] px-4 py-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
                  Delivery progress
                </span>
                <span className="text-[#38BDF8] text-sm font-black">
                  {delivery ? Math.round(delivery.progress) : 0}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background:
                      'linear-gradient(90deg, #38BDF8 0%, #10E07A 50%, #F5C451 100%)',
                  }}
                  animate={{
                    width: `${delivery ? delivery.progress : 0}%`,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  {delivery && delivery.status !== 'delivered' && (
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  )}
                </motion.div>
              </div>
              {isPolling && (
                <p className="text-white/60 text-[10px] mt-2 flex items-center gap-1">
                  {socketConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-[#10E07A]" />
                      <span className="text-[#10E07A]">Realtime</span>
                      <span className="text-white/60">• fallback poll every 5s</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <WifiOff className="w-3 h-3 text-[#FB7185]" />
                      <span className="text-[#FB7185]">Socket offline</span>
                      <span className="text-white/60">• polling every 5s</span>
                    </>
                  )}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────────────
   Map Panel - stylized CSS map with markers + route
   ────────────────────────────────────────────────────────── */

function MapPanel({
  delivery,
  layout,
}: {
  delivery: DeliveryState | null;
  layout: {
    store: { x: number; y: number };
    customer: { x: number; y: number };
    rider: { x: number; y: number };
  } | null;
}) {
  return (
    <div className="relative h-[280px] sm:h-[320px] overflow-hidden">
      {/* Dark base */}
      <div className="absolute inset-0 bg-[#080c12]" />

      {/* Grid pattern - streets */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 60px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 60px)
          `,
        }}
      />

      {/* Major roads */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]">
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="white" strokeWidth="3" />
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="white" strokeWidth="2" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="white" strokeWidth="2" />
        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="white" strokeWidth="3" />
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" strokeWidth="1.5" opacity="0.5" />
      </svg>

      {/* Block buildings */}
      <div className="absolute top-[12%] left-[10%] w-14 h-10 border border-white/[0.04] bg-white/[0.015] rounded-sm" />
      <div className="absolute top-[42%] left-[35%] w-16 h-8 border border-white/[0.04] bg-white/[0.015] rounded-sm" />
      <div className="absolute top-[18%] right-[15%] w-12 h-14 border border-white/[0.04] bg-white/[0.015] rounded-sm" />
      <div className="absolute bottom-[15%] left-[18%] w-20 h-10 border border-white/[0.04] bg-white/[0.015] rounded-sm" />
      <div className="absolute bottom-[25%] right-[8%] w-14 h-16 border border-white/[0.04] bg-white/[0.015] rounded-sm" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D14]/40 via-transparent to-[#0B0D14]" />
      <div className="absolute top-[20%] left-[20%] w-32 h-32 bg-[#F5C451]/5 blur-[60px] rounded-full" />
      <div className="absolute bottom-[25%] right-[20%] w-32 h-32 bg-[#38BDF8]/5 blur-[60px] rounded-full" />

      {/* Route line + markers */}
      {layout && delivery && (
        <div className="absolute inset-0">
          {/* SVG route overlay */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Dashed route from store → rider */}
            <line
              x1={layout.store.x}
              y1={layout.store.y}
              x2={layout.rider.x}
              y2={layout.rider.y}
              stroke="#F5C451"
              strokeWidth="0.6"
              strokeDasharray="2 1.5"
              opacity="0.5"
            />
            {/* Dashed route from rider → customer */}
            <line
              x1={layout.rider.x}
              y1={layout.rider.y}
              x2={layout.customer.x}
              y2={layout.customer.y}
              stroke="#38BDF8"
              strokeWidth="0.6"
              strokeDasharray="2 1.5"
              opacity="0.7"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-7"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </line>
          </svg>

          {/* Store marker */}
          <Marker
            position={layout.store}
            color="#F5C451"
            label={delivery.store.name}
            icon={<Store className="w-3.5 h-3.5 text-[#F5C451]" />}
          />

          {/* Customer marker */}
          <Marker
            position={layout.customer}
            color="#38BDF8"
            label="Your location"
            icon={<MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />}
            pulseColor="rgba(56,189,248,0.4)"
          />

          {/* Rider marker - animated position synced with progress */}
          <motion.div
            className="absolute z-10"
            animate={{
              left: `${layout.rider.x}%`,
              top: `${layout.rider.y}%`,
            }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            {/* Pulsing halo */}
            <motion.div
              animate={{ scale: [1, 2.4], opacity: [0.4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-[#38BDF8]"
            />
            <div className="relative w-9 h-9 rounded-full bg-[#38BDF8] border-2 border-[#0B0D14] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
              <Bike className="w-4 h-4 text-[#0B0D14]" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Legend */}
      {layout && delivery && (
        <div className="absolute top-3 left-3 bg-[#0F1118]/80 backdrop-blur rounded-xl border border-white/10 p-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F5C451]" />
            <span className="text-white/60 text-[10px] font-medium">Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
            <span className="text-white/60 text-[10px] font-medium">Rider</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10E07A]" />
            <span className="text-white/60 text-[10px] font-medium">You</span>
          </div>
        </div>
      )}

      {/* Empty state overlay */}
      {!delivery && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-[#38BDF8]/30 border-t-[#38BDF8] rounded-full mx-auto mb-3"
            />
            <p className="text-white/50 text-sm">Locating your rider...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Marker({
  position,
  color,
  label,
  icon,
  pulseColor,
}: {
  position: { x: number; y: number };
  color: string;
  label: string;
  icon: React.ReactNode;
  pulseColor?: string;
}) {
  return (
    <div
      className="absolute z-[5]"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {pulseColor && (
        <motion.div
          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: pulseColor }}
        />
      )}
      <div
        className="relative w-8 h-8 rounded-full flex items-center justify-center border-2"
        style={{
          backgroundColor: `${color}22`,
          borderColor: color,
        }}
      >
        {icon}
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap"
        style={{
          backgroundColor: 'rgba(15,17,23,0.9)',
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Update Bubble (system messages only — polling-based)
   ────────────────────────────────────────────────────────── */

function UpdateBubble({ msg }: { msg: UpdateMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-center"
    >
      <span className="text-[11px] text-white/60 bg-white/5 px-3 py-1.5 rounded-full text-center max-w-[90%]">
        {msg.text}
        <span className="text-white/60 ml-2">· {formatTime(msg.timestamp)}</span>
      </span>
    </motion.div>
  );
}
