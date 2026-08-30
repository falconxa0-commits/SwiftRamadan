'use client';

import { Package, Truck, CheckCircle, Clock, Phone, ChevronDown, ChevronUp, MapPin, ShoppingBag, Navigation, XCircle, Download, RotateCcw } from 'lucide-react';
import { myOrders, formatNaira, prayerTimes } from '@/lib/data';
import { useAppStore, type OrderItem } from '@/lib/store';
import { useOrders } from '@/lib/store-selectors';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { OrdersTabSkeleton } from './Skeletons';

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  'In Transit': { color: 'text-[var(--sr-customer)]', bgColor: 'bg-[var(--sr-customer)]/10', icon: Truck, label: 'In Transit' },
  'Preparing': { color: 'text-[var(--sr-vendor)]', bgColor: 'bg-[var(--sr-vendor)]/10', icon: Clock, label: 'Preparing' },
  'Delivered': { color: 'text-white/65', bgColor: 'bg-white/5', icon: CheckCircle, label: 'Delivered' },
  'Confirmed': { color: 'text-[var(--sr-rider)]', bgColor: 'bg-[var(--sr-rider)]/10', icon: Package, label: 'Confirmed' },
  'Ready': { color: 'text-[#A78BFA]', bgColor: 'bg-[#A78BFA]/10', icon: CheckCircle, label: 'Ready for Pickup' },
  'Cancelled': { color: 'text-[#FB7185]', bgColor: 'bg-[#FB7185]/10', icon: XCircle, label: 'Cancelled' },
};

const progressSteps = [
  { key: 'confirmed', label: 'Confirmed', threshold: 10 },
  { key: 'preparing', label: 'Preparing', threshold: 35 },
  { key: 'ready', label: 'Ready', threshold: 55 },
  { key: 'transit', label: 'In Transit', threshold: 75 },
  { key: 'delivered', label: 'Delivered', threshold: 100 },
];

function OrderProgressTracker({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        {progressSteps.map((step, i) => {
          const isActive = progress >= step.threshold;
          const isCurrentStep = status === 'Preparing' && step.key === 'preparing' ||
            status === 'In Transit' && step.key === 'transit' ||
            status === 'Delivered' && step.key === 'delivered' ||
            status === 'Confirmed' && step.key === 'confirmed' ||
            status === 'Ready' && step.key === 'ready';
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive
                    ? isCurrentStep
                      ? 'border-[var(--sr-customer)] bg-[var(--sr-customer)]'
                      : 'border-[var(--sr-customer)]/50 bg-[var(--sr-customer)]/20'
                    : 'border-white/10 bg-[var(--sr-surface-raised)]'
                }`}>
                  {isActive && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isCurrentStep ? 'bg-[var(--sr-surface-base)]' : 'bg-[var(--sr-customer)]'}`} />
                  )}
                </div>
                <span className={`text-[8px] mt-1 font-bold whitespace-nowrap ${
                  isActive ? 'text-[var(--sr-customer)]' : 'text-white/20'
                }`}>{step.label}</span>
              </div>
              {i < progressSteps.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${progress >= progressSteps[i + 1].threshold ? 'bg-[var(--sr-customer)]/40' : 'bg-white/5'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type OrderTab = 'active' | 'past';

export default function OrdersTab() {
  const { orders, setOrders } = useOrders();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>('active');
  const { toast } = useToast();

  // Initialize orders from store, falling back to mock data
  useEffect(() => {
    const initOrders = async () => {
      try {
        // If store has orders, use those; otherwise try API then mock
        if (orders.length > 0) {
          setIsLoading(false);
          return;
        }
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
        } else {
          // Use mock data as fallback - add them to the store
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

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const pastOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');
  const activeOrder = activeOrders[0];

  const handleCallRider = (riderName: string | null) => {
    toast({ title: 'Calling Rider 📞', description: `Connecting to ${riderName || 'your rider'}...` });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleActiveOrderClick = (order: OrderItem) => {
    useAppStore.getState().setActiveModal('live-tracking');
  };

  const handleReorder = (order: OrderItem) => {
    const { addToCart } = useAppStore.getState();
    order.items.forEach(item => {
      addToCart({
        id: parseInt(item.name.replace(/\D/g, '')) || Math.floor(Math.random() * 1000) + 500,
        name: item.name,
        price: item.price,
        image: '/images/meals/meal-jollof.png',
        quantity: item.qty,
      });
    });
    toast({ title: 'Items Added! 🛒', description: `${order.items.length} item(s) from order ${order.id} added to cart` });
  };

  const handleCancelOrder = async (order: OrderItem) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'Cancelled', progress: 0 }),
      });
      if (res.ok) {
        // Update local store: move from active to past (filtered out as Cancelled)
        const { orders, setOrders } = useAppStore.getState();
        setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'Cancelled', progress: 0 } : o));
        toast({ title: 'Order Cancelled', description: `Order ${order.id} has been cancelled` });
      } else {
        toast({ title: 'Could not cancel', description: 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Could not cancel', description: 'Network error — please try again', variant: 'destructive' });
    }
  };

  const handleDownloadReceipt = (order: OrderItem) => {
    const date = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    const itemsList = order.items
      .map(item => `  • ${item.name} x${item.qty} — ${formatNaira(item.price * item.qty)}`)
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
      toast({ title: 'Receipt Downloaded 📄', description: `Saved as SwiftRamadan-Receipt-${order.id}.txt` });
    } catch {
      toast({ title: 'Download Failed', description: 'Could not generate receipt', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto pb-32">
        <OrdersTabSkeleton />
      </main>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-5 pt-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight heading-accent">Your Orders</h1>
          <p className="text-white/50 text-sm mt-1">Track and manage your Ramadan deliveries</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center mb-6 icon-tile float-soft">
            <ShoppingBag className="w-10 h-10 text-white/20 relative z-10" />
          </div>
          <h3 className="text-white text-lg font-bold mb-2 tracking-tight">No orders yet</h3>
          <p className="text-white/65 text-sm text-center mb-6 max-w-xs">
            Start ordering Iftar meals, Sahur boxes, and more to see your orders here
          </p>
          <button
            onClick={() => useAppStore.getState().setActiveTab('home')}
            className="bg-[var(--sr-customer)] text-[#06070B] font-bold py-3 px-8 rounded-xl text-sm active:scale-[0.98] transition-transform green-glow flex items-center gap-2"
          >
            Start Ordering
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight heading-accent">Your Orders</h1>
        <p className="text-white/50 text-sm mt-1">Track and manage your Ramadan deliveries</p>
      </div>

      {/* Tabs: Active / Past */}
      <div className="px-5 mt-4">
        <div className="inline-flex p-1 glass-card rounded-2xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-[var(--sr-customer)] text-[#06070B] green-glow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Active
            {activeOrders.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === 'active' ? 'bg-[var(--sr-surface-base)]/20 text-[#06070B]' : 'bg-[var(--sr-customer)]/15 text-[var(--sr-customer)]'
              }`}>
                {activeOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'past'
                ? 'bg-[var(--sr-customer)] text-[#06070B] green-glow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Past
            {pastOrders.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === 'past' ? 'bg-[var(--sr-surface-base)]/20 text-[#06070B]' : 'bg-white/10 text-white/60'
              }`}>
                {pastOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'active' ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Live Tracking Widget */}
            {activeOrder && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 mt-4"
              >
                <div
                  className="relative overflow-hidden rounded-2xl premium-card p-5 cursor-pointer hover:border-white/15 transition-colors"
                  onClick={() => handleActiveOrderClick(activeOrder)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--sr-customer)]/10 blur-[60px]" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex size-full rounded-full bg-[var(--sr-customer)] opacity-60 pulse-soft" />
                          <span className="relative inline-flex size-2 rounded-full bg-[var(--sr-customer)]" />
                        </span>
                        <span className="text-[var(--sr-customer)] text-xs font-bold uppercase tracking-widest">Live Tracking</span>
                      </div>
                      <span className="text-white/60 text-xs font-mono">{activeOrder.id}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 rounded-full h-2 mb-4 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-[#10E07A] to-[#F5C451] h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${activeOrder.progress}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                    </div>

                    {/* Progress Tracker */}
                    <OrderProgressTracker progress={activeOrder.progress} status={activeOrder.status} />

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-white font-bold tracking-tight">{activeOrder.item}</p>
                        <p className="text-[var(--sr-customer)] text-sm font-medium">{activeOrder.eta}</p>
                      </div>
                      <span className="text-white font-bold">{formatNaira(activeOrder.total)}</span>
                    </div>

                    {activeOrder.rider && (
                      <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5 mt-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--sr-customer)]/20 rounded-full flex items-center justify-center icon-tile">
                            <Truck className="w-5 h-5 text-[var(--sr-customer)] relative z-10" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-bold">{activeOrder.rider}</p>
                            <p className="text-white/65 text-xs">Your rider</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallRider(activeOrder.rider);
                            }}
                            className="w-10 h-10 bg-[var(--sr-customer)]/10 rounded-full flex items-center justify-center border border-[var(--sr-customer)]/20 hover:bg-[var(--sr-customer)]/20 transition-colors active:scale-90"
                            aria-label="Call rider"
                          >
                            <Phone className="w-4 h-4 text-[var(--sr-customer)]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              useAppStore.getState().setActiveModal('live-tracking');
                            }}
                            className="flex items-center gap-2 px-4 h-10 bg-[var(--sr-vendor)]/10 rounded-full border border-[var(--sr-vendor)]/20 hover:bg-[var(--sr-vendor)]/20 transition-colors active:scale-95"
                          >
                            <MapPin className="w-4 h-4 text-[var(--sr-vendor)]" />
                            <span className="text-[var(--sr-vendor)] text-xs font-bold">Track</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div className="px-5 mt-6">
                <h3 className="text-white text-lg font-extrabold mb-4 heading-accent">Active Orders</h3>
                <div className="space-y-3">
                  {activeOrders.map((order) => {
                    const config = statusConfig[order.status];
                    const Icon = config?.icon || Package;
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <div key={order.id}>
                        <button
                          onClick={() => handleActiveOrderClick(order)}
                          className="flex items-center gap-4 p-4 glass-card rounded-2xl w-full text-left hover:border-white/15 transition-colors active:scale-[0.99]"
                        >
                          <div className={`w-12 h-12 ${config?.bgColor || 'bg-white/5'} rounded-xl flex items-center justify-center shrink-0 icon-tile border border-white/5`}>
                            <Icon className={`w-6 h-6 relative z-10 ${config?.color || 'text-white/50'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-bold text-sm tracking-tight">{order.item}</p>
                                <p className="text-white/65 text-xs mt-0.5">{order.eta}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-xs font-bold ${config?.color}`}>{order.status}</span>
                                {order.status === 'In Transit' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); useAppStore.getState().setActiveModal('live-tracking-map'); }}
                                    className="block ml-auto mt-0.5 text-[10px] font-bold text-[var(--sr-rider)] hover:text-[var(--sr-rider)]/80 transition-colors"
                                  >
                                    View Map →
                                  </button>
                                )}
                                <p className="text-white/60 text-xs font-bold">{formatNaira(order.total)}</p>
                              </div>
                            </div>
                            {/* Mini progress bar for each active order */}
                            <div className="w-full bg-white/5 rounded-full h-1 mt-2 overflow-hidden">
                              <div
                                className={`h-1 rounded-full transition-all ${
                                  order.status === 'In Transit' ? 'bg-[var(--sr-customer)]' :
                                  order.status === 'Preparing' ? 'bg-[var(--sr-vendor)]' : 'bg-[var(--sr-rider)]'
                                }`}
                                style={{ width: `${order.progress}%` }}
                              />
                            </div>
                          </div>
                          <div
                            className="shrink-0 ml-2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(order.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-white/65" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-white/65" />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && order.items && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="glass-card rounded-b-2xl border border-t-0 p-4 space-y-2 mt-1">
                                {order.items.map((item, i) => (
                                  <div key={`${item.name}-${i}`} className="flex justify-between text-xs">
                                    <span className="text-white/60">{item.name} x{item.qty}</span>
                                    <span className="text-white/65">{formatNaira(item.price * item.qty)}</span>
                                  </div>
                                ))}
                                <div className="h-px bg-white/5 my-1" />
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-white/80">Total</span>
                                  <span className="text-[var(--sr-customer)]">{formatNaira(order.total)}</span>
                                </div>
                                {/* Reorder + Cancel + Receipt buttons */}
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReorder(order);
                                    }}
                                    className="bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] py-2 rounded-lg text-[11px] font-bold hover:bg-[var(--sr-customer)]/20 transition-colors active:scale-95 flex items-center justify-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reorder
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelOrder(order);
                                    }}
                                    className="bg-[#FB7185]/10 border border-[#FB7185]/20 text-[#FB7185] py-2 rounded-lg text-[11px] font-bold hover:bg-[#FB7185]/20 transition-colors active:scale-95 flex items-center justify-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Cancel
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadReceipt(order);
                                    }}
                                    className="bg-white/5 border border-white/10 text-white/70 py-2 rounded-lg text-[11px] font-bold hover:bg-white/10 hover:text-white transition-colors active:scale-95 flex items-center justify-center gap-1"
                                  >
                                    <Download className="w-3 h-3" />
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
              </div>
            )}

            {/* No active orders */}
            {activeOrders.length === 0 && (
              <div className="px-5 mt-8">
                <div className="glass-card rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/30 flex items-center justify-center mx-auto mb-3 icon-tile">
                    <CheckCircle className="w-7 h-7 text-[var(--sr-customer)] relative z-10" />
                  </div>
                  <p className="text-white font-bold text-sm">No active orders</p>
                  <p className="text-white/65 text-xs mt-1">All your deliveries are complete. Browse past orders or start a new one.</p>
                  <button
                    onClick={() => useAppStore.getState().setActiveTab('home')}
                    className="mt-4 bg-[var(--sr-customer)] text-[#06070B] font-bold py-2.5 px-6 rounded-xl text-xs active:scale-[0.98] transition-transform green-glow"
                  >
                    Start New Order
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="past"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Past Orders */}
            {pastOrders.length > 0 ? (
              <div className="px-5 mt-6">
                <h3 className="text-white text-lg font-extrabold mb-4 heading-accent">Past Orders</h3>
                <div className="space-y-3">
                  {pastOrders.map((order) => (
                    <div key={order.id} className="glass-card rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-4 p-4">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center icon-tile border border-white/5">
                          <CheckCircle className="w-6 h-6 text-white/60 relative z-10" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white/70 font-bold text-sm tracking-tight">{order.item}</p>
                              <p className="text-white/60 text-xs">{order.eta}</p>
                            </div>
                            <div className="text-right">
                              <span className="soft-chip">Delivered</span>
                              <p className="text-white/65 text-xs font-bold mt-0.5">{formatNaira(order.total)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Reorder + Receipt for past orders */}
                      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleReorder(order)}
                          className="bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] py-2 rounded-lg text-xs font-bold hover:bg-[var(--sr-customer)]/20 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reorder
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(order)}
                          className="bg-white/5 border border-white/10 text-white/60 py-2 rounded-lg text-xs font-bold hover:bg-white/10 hover:text-white/80 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-5 mt-8">
                <div className="glass-card rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-center mx-auto mb-3 icon-tile">
                    <Clock className="w-7 h-7 text-[#A78BFA] relative z-10" />
                  </div>
                  <p className="text-white font-bold text-sm">No past orders yet</p>
                  <p className="text-white/65 text-xs mt-1">Your completed orders will appear here for easy reordering.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prayer Times Widget */}
      <div className="px-5 mt-8 mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 to-[#06070B] border border-emerald-500/20 p-5 aurora-soft">
          <h3 className="text-[var(--sr-vendor)] text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">mosque</span>
            Prayer Times - Lagos
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {prayerTimes.map((prayer) => {
              const now = new Date();
              const hours = now.getHours();
              const isNext = (prayer.name === 'Maghrib' && hours >= 12 && hours < 19) ||
                (prayer.name === 'Fajr' && hours >= 0 && hours < 6) ||
                (prayer.name === 'Isha' && hours >= 19);
              return (
                <div
                  key={prayer.name}
                  className={`bg-black/30 p-3 rounded-xl border text-center transition-colors ${
                    isNext ? 'border-[var(--sr-vendor)]/30 bg-[var(--sr-vendor)]/5' : 'border-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[var(--sr-vendor)] text-lg">{prayer.icon}</span>
                  <p className="text-white text-xs font-bold mt-1">{prayer.name}</p>
                  <p className="text-white/50 text-[10px]">{prayer.time}</p>
                  {isNext && <span className="text-[var(--sr-vendor)] text-[8px] font-bold uppercase">Next</span>}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => useAppStore.getState().setActiveModal('prayer-times')}
            className="w-full mt-4 bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/20 text-[var(--sr-vendor)] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--sr-vendor)]/20 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">schedule</span>
            View Full Schedule
          </button>
        </div>
      </div>
    </main>
  );
}
