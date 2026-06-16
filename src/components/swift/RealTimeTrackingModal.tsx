'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, type Socket } from 'socket.io-client';
import {
  MapPin,
  Bike,
  Phone,
  MessageSquare,
  Send,
  Star,
  Check,
  Navigation,
  X,
  Clock,
  Package,
  Store,
  User,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

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
}

interface ChatMessage {
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

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */

export default function RealTimeTrackingModal() {
  const { activeModal, setActiveModal, orders } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'live-tracking';

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [delivery, setDelivery] = useState<DeliveryState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [activeOrderId, setActiveOrderId] = useState<string>(
    () => useAppStore.getState().orders?.[0]?.id ?? 'SWR-2847'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Keep latest activeOrderId available to socket handlers without re-running effect
  const activeOrderIdRef = useRef(activeOrderId);
  useEffect(() => {
    activeOrderIdRef.current = activeOrderId;
  }, [activeOrderId]);

  /* Connect to socket.io when modal opens */
  useEffect(() => {
    if (!isOpen) return;

    // CRITICAL: must use relative path with XTransformPort - never use absolute URL
    const sock = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = sock;

    sock.on('connect', () => {
      setIsConnected(true);
    });

    sock.on('disconnect', () => {
      setIsConnected(false);
    });

    // Server sends snapshot of all active deliveries on connect
    sock.on('active_deliveries', (list: DeliveryState[]) => {
      if (!list || list.length === 0) return;
      // Prefer the user's selected order, else pick the first
      const match = list.find((d) => d.orderId === activeOrderIdRef.current);
      const chosen = match || list[0];
      setDelivery(chosen);
      setActiveOrderId(chosen.orderId);
      sock.emit('subscribe_order', chosen.orderId);
    });

    sock.on('location_update', (update: DeliveryState) => {
      if (!update) return;
      setDelivery((prev) => {
        // If we have no delivery yet, adopt this one if it's our active order
        if (!prev) {
          if (update.orderId === activeOrderIdRef.current) return update;
          return prev;
        }
        if (update.orderId !== prev.orderId) return prev;
        return update;
      });
    });

    sock.on('delivery_assigned', (assigned: DeliveryState) => {
      if (!assigned) return;
      setActiveOrderId(assigned.orderId);
      setDelivery(assigned);
      toast({
        title: `${assigned.rider.name} assigned! 🏍️`,
        description: `${assigned.rider.vehicle} • Rating ${assigned.rider.rating}★`,
      });
    });

    sock.on('chat_history', (history: ChatMessage[]) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    });

    sock.on('new_message', (msg: ChatMessage) => {
      if (!msg) return;
      setMessages((prev) => {
        // de-dupe by timestamp+text+from
        if (
          prev.some(
            (m) =>
              m.timestamp === msg.timestamp &&
              m.text === msg.text &&
              m.from === msg.from
          )
        ) {
          return prev;
        }
        return [...prev, msg];
      });
    });

    return () => {
      sock.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isOpen]);

  /* Auto-subscribe when activeOrderId changes (after first connect) */
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock || !isConnected || !activeOrderId) return;
    sock.emit('subscribe_order', activeOrderId);
  }, [isConnected, activeOrderId]);

  /* Auto-scroll chat to bottom on new messages */
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

  const handleSendMessage = useCallback(() => {
    const text = chatInput.trim();
    const sock = socketRef.current;
    if (!text || !sock || !delivery) return;
    sock.emit('send_message', {
      orderId: delivery.orderId,
      from: 'customer',
      text,
    });
    // Optimistically show our own message immediately
    setMessages((prev) => {
      if (
        prev.some(
          (m) =>
            m.text === text &&
            m.from === 'customer' &&
            Date.now() - m.timestamp < 5000
        )
      ) {
        return prev;
      }
      return [
        ...prev,
        {
          orderId: delivery.orderId,
          from: 'customer',
          text,
          timestamp: Date.now(),
        },
      ];
    });
    setChatInput('');
  }, [chatInput, delivery]);

  const handleRequestRider = useCallback(() => {
    const sock = socketRef.current;
    if (!sock) return;
    setDelivery(null);
    setMessages([]);
    sock.emit('request_rider', {});
    toast({
      title: 'Finding a rider... 🌙',
      description: 'Connecting you with the nearest SwiftRamadan rider',
    });
  }, [toast]);

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
    const pad = 0.15; // 15% padding
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
            className="fixed inset-0 z-[100] bg-[#05070A] flex flex-col overflow-hidden"
          >
            {/* ─── Sticky Header ─── */}
            <div className="glass-effect border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#13ec13]/10 border border-[#13ec13]/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#13ec13]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white text-base font-bold leading-tight flex items-center gap-2">
                    Live Tracking
                    {isConnected ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-[#13ec13] inline-block"
                      />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/30 inline-block" />
                    )}
                  </h2>
                  <p className="text-white/40 text-[11px] truncate">
                    {delivery
                      ? `Order #${delivery.orderId} • ${delivery.rider.name}`
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
              <MapPanel
                delivery={delivery}
                layout={mapLayout}
              />

              {/* Status Timeline */}
              <section className="px-4 pt-5">
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
                  Delivery Status
                </h3>
                <div className="bg-[#0F1117] rounded-2xl border border-white/5 p-4">
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
                                ? 'bg-[#13ec13]/20 border-2 border-[#13ec13] scale-110'
                                : isPast
                                  ? 'bg-[#13ec13] border-2 border-[#13ec13]'
                                  : 'bg-[#1A1D26] border-2 border-white/10'
                            }`}
                          >
                            {isPast ? (
                              <Check className="w-4 h-4 text-[#05070A]" strokeWidth={3} />
                            ) : (
                              <Icon
                                className={`w-4 h-4 ${
                                  isActive ? 'text-[#13ec13]' : 'text-white/30'
                                }`}
                              />
                            )}
                            {isActive && (
                              <motion.div
                                animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                                transition={{ duration: 1.6, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-[#13ec13]"
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
                                      ? 'text-[#13ec13]'
                                      : 'text-white/40'
                                }`}
                              >
                                {stage.label}
                              </p>
                              {isActive && (
                                <motion.span
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1.4, repeat: Infinity }}
                                  className="text-[10px] text-[#13ec13] font-bold uppercase"
                                >
                                  Live
                                </motion.span>
                              )}
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isFuture ? 'text-white/30' : 'text-white/50'
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
                <div className="bg-gradient-to-br from-[#13ec13]/10 to-[#0F1117] rounded-2xl border border-[#13ec13]/20 p-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#13ec13]/5 blur-2xl rounded-full" />
                  <div className="flex items-center gap-2 mb-2 relative">
                    <Clock className="w-4 h-4 text-[#13ec13]" />
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
                    <p className="text-white/40 text-[11px] mt-2 relative">
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
                <div className="bg-[#0F1117] rounded-2xl border border-white/5 p-4">
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
                          <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                          <span className="text-[#FFD700] text-[11px] font-bold">
                            {delivery.rider.rating}
                          </span>
                          <span className="text-white/30 text-[11px]">•</span>
                          <span className="text-white/40 text-[11px] truncate">
                            {delivery.rider.vehicle}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleCallRider}
                          className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center hover:bg-[#FFD700]/20 transition-colors"
                          aria-label="Call rider"
                        >
                          <Phone className="w-4 h-4 text-[#FFD700]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1A1D26] border-2 border-white/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-white/30" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/40 text-sm">Waiting for rider...</p>
                        <button
                          onClick={handleRequestRider}
                          className="text-[#13ec13] text-xs font-bold mt-1 hover:underline"
                        >
                          Request a rider →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Live chat */}
              <section className="px-4 pt-4 pb-6">
                <div className="bg-[#0F1117] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#13ec13]" />
                    <span className="text-white text-sm font-bold">Chat with rider</span>
                    <span className="ml-auto text-white/30 text-[10px]">
                      {messages.length} messages
                    </span>
                  </div>

                  {/* Messages list */}
                  <div
                    ref={chatScrollRef}
                    className="px-3 py-3 max-h-72 overflow-y-auto custom-scrollbar space-y-2"
                  >
                    {messages.length === 0 ? (
                      <div className="py-8 text-center">
                        <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
                        <p className="text-white/30 text-xs">
                          No messages yet. Say salam to your rider!
                        </p>
                      </div>
                    ) : (
                      messages.map((m, idx) => (
                        <ChatBubble key={`${m.timestamp}-${idx}`} msg={m} rider={delivery?.rider} />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-white/5 p-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      disabled={!delivery}
                      className="flex-1 bg-[#1A1D26] border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#13ec13]/40 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || !delivery}
                      className="w-11 h-11 rounded-xl bg-[#13ec13] flex items-center justify-center hover:bg-[#13ec13]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4 text-[#05070A]" />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* ─── Bottom progress bar ─── */}
            <div className="border-t border-white/5 bg-[#0F1117] px-4 py-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
                  Delivery progress
                </span>
                <span className="text-[#13ec13] text-sm font-black">
                  {delivery ? Math.round(delivery.progress) : 0}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: 'linear-gradient(90deg, #13ec13 0%, #FFD700 100%)',
                  }}
                  animate={{
                    width: `${delivery ? delivery.progress : 0}%`,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/40 via-transparent to-[#05070A]" />
      <div className="absolute top-[20%] left-[20%] w-32 h-32 bg-[#FFD700]/5 blur-[60px] rounded-full" />
      <div className="absolute bottom-[25%] right-[20%] w-32 h-32 bg-[#13ec13]/5 blur-[60px] rounded-full" />

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
              stroke="#FFD700"
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
              stroke="#13ec13"
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
            color="#FFD700"
            label={delivery.store.name}
            icon={<Store className="w-3.5 h-3.5 text-[#FFD700]" />}
          />

          {/* Customer marker */}
          <Marker
            position={layout.customer}
            color="#3b82f6"
            label="Your location"
            icon={<MapPin className="w-3.5 h-3.5 text-[#3b82f6]" />}
            pulseColor="rgba(59,130,246,0.4)"
          />

          {/* Rider marker - animated position */}
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
              className="absolute inset-0 rounded-full bg-[#13ec13]"
            />
            <div className="relative w-9 h-9 rounded-full bg-[#13ec13] border-2 border-[#05070A] flex items-center justify-center shadow-[0_0_20px_rgba(19,236,19,0.5)]">
              <Bike className="w-4 h-4 text-[#05070A]" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Legend */}
      {layout && delivery && (
        <div className="absolute top-3 left-3 bg-[#0F1117]/80 backdrop-blur rounded-xl border border-white/10 p-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
            <span className="text-white/60 text-[10px] font-medium">Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#13ec13]" />
            <span className="text-white/60 text-[10px] font-medium">Rider</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
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
              className="w-10 h-10 border-2 border-[#13ec13]/30 border-t-[#13ec13] rounded-full mx-auto mb-3"
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
   Chat Bubble
   ────────────────────────────────────────────────────────── */

function ChatBubble({ msg, rider }: { msg: ChatMessage; rider?: Rider }) {
  if (msg.from === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-white/40 bg-white/5 px-3 py-1 rounded-full">
          {msg.text}
        </span>
      </div>
    );
  }

  const isCustomer = msg.from === 'customer';
  const accentColor = rider?.color ?? '#13ec13';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border"
        style={{
          backgroundColor: isCustomer ? '#13ec1322' : `${accentColor}22`,
          borderColor: isCustomer ? '#13ec1366' : `${accentColor}66`,
          color: isCustomer ? '#13ec13' : accentColor,
        }}
      >
        {isCustomer ? (
          'ME'
        ) : (
          <Bike className="w-3.5 h-3.5" />
        )}
      </div>
      {/* Bubble */}
      <div className={`max-w-[75%] ${isCustomer ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isCustomer
              ? 'bg-[#13ec13] text-[#05070A] rounded-br-sm'
              : 'bg-[#1A1D26] text-white rounded-bl-sm border border-white/5'
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[9px] text-white/30 mt-0.5 px-1">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
