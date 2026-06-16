'use client';

import { Package, Truck, CheckCircle, Clock, Phone, ChevronDown, ChevronUp, MapPin, ShoppingBag, Star, CircleDot } from 'lucide-react';
import { myOrders, formatNaira, prayerTimes } from '@/lib/data';
import { useAppStore, type OrderItem } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  'In Transit': { color: 'text-[#13ec13]', bgColor: 'bg-[#13ec13]/10', icon: Truck, label: 'In Transit' },
  'Preparing': { color: 'text-[#FFD700]', bgColor: 'bg-[#FFD700]/10', icon: Clock, label: 'Preparing' },
  'Delivered': { color: 'text-white/40', bgColor: 'bg-white/5', icon: CheckCircle, label: 'Delivered' },
  'Confirmed': { color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', icon: Package, label: 'Confirmed' },
  'Ready': { color: 'text-purple-400', bgColor: 'bg-purple-400/10', icon: CheckCircle, label: 'Ready for Pickup' },
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
                      ? 'border-[#13ec13] bg-[#13ec13]'
                      : 'border-[#13ec13]/50 bg-[#13ec13]/20'
                    : 'border-white/10 bg-[#1A1D26]'
                }`}>
                  {isActive && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isCurrentStep ? 'bg-black' : 'bg-[#13ec13]'}`} />
                  )}
                </div>
                <span className={`text-[8px] mt-1 font-bold whitespace-nowrap ${
                  isActive ? 'text-[#13ec13]' : 'text-white/20'
                }`}>{step.label}</span>
              </div>
              {i < progressSteps.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${progress >= progressSteps[i + 1].threshold ? 'bg-[#13ec13]/40' : 'bg-white/5'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersTab() {
  const { orders, setOrders } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
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

  const activeOrders = orders.filter(o => o.status !== 'Delivered');
  const pastOrders = orders.filter(o => o.status === 'Delivered');
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

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold">Your Orders</h1>
          <p className="text-white/50 text-sm">Track and manage your Ramadan deliveries</p>
        </div>
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-24 bg-[#1A1D26] rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold">Your Orders</h1>
          <p className="text-white/50 text-sm">Track and manage your Ramadan deliveries</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-24 h-24 bg-[#1A1D26] rounded-full flex items-center justify-center mb-6 border border-white/5">
            <ShoppingBag className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-white text-lg font-bold mb-2">No orders yet</h3>
          <p className="text-white/40 text-sm text-center mb-6">
            Start ordering Iftar meals, Sahur boxes, and more to see your orders here
          </p>
          <button
            onClick={() => useAppStore.getState().setActiveTab('home')}
            className="bg-[#13ec13] text-[#05070A] font-bold py-3 px-8 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            Start Ordering
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold">Your Orders</h1>
        <p className="text-white/50 text-sm">Track and manage your Ramadan deliveries</p>
      </div>

      {/* Live Tracking Widget */}
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mt-4"
        >
          <div
            className="relative overflow-hidden rounded-2xl bg-[#1A1D26] border border-[#13ec13]/20 p-5 cursor-pointer hover:border-[#13ec13]/40 transition-colors"
            onClick={() => handleActiveOrderClick(activeOrder)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#13ec13]/5 blur-[60px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 bg-[#13ec13] rounded-full animate-pulse" />
                  <span className="text-[#13ec13] text-xs font-bold uppercase tracking-widest">Live Tracking</span>
                </div>
                <span className="text-white/30 text-xs font-mono">{activeOrder.id}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-[#13ec13] h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeOrder.progress}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>

              {/* Progress Tracker */}
              <OrderProgressTracker progress={activeOrder.progress} status={activeOrder.status} />

              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-white font-bold">{activeOrder.item}</p>
                  <p className="text-[#13ec13] text-sm font-medium">{activeOrder.eta}</p>
                </div>
                <span className="text-white font-bold">{formatNaira(activeOrder.total)}</span>
              </div>

              {activeOrder.rider && (
                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5 mt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#13ec13]/20 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-[#13ec13]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{activeOrder.rider}</p>
                      <p className="text-white/40 text-xs">Your rider</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallRider(activeOrder.rider);
                      }}
                      className="w-10 h-10 bg-[#13ec13]/10 rounded-full flex items-center justify-center border border-[#13ec13]/20 hover:bg-[#13ec13]/20 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#13ec13]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        useAppStore.getState().setActiveModal('live-tracking');
                      }}
                      className="flex items-center gap-2 px-4 h-10 bg-[#FFD700]/10 rounded-full border border-[#FFD700]/20 hover:bg-[#FFD700]/20 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-[#FFD700]" />
                      <span className="text-[#FFD700] text-xs font-bold">Track</span>
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
        <div className="px-4 mt-6">
          <h3 className="text-white text-lg font-extrabold mb-4">Active Orders</h3>
          <div className="space-y-3">
            {activeOrders.map((order) => {
              const config = statusConfig[order.status];
              const Icon = config?.icon || Package;
              const isExpanded = expandedOrder === order.id;
              return (
                <div key={order.id}>
                  <button
                    onClick={() => handleActiveOrderClick(order)}
                    className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 w-full text-left hover:border-[#13ec13]/20 transition-colors"
                  >
                    <div className={`w-12 h-12 ${config?.bgColor || 'bg-white/5'} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${config?.color || 'text-white/50'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-bold text-sm">{order.item}</p>
                          <p className="text-white/40 text-xs mt-0.5">{order.eta}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold ${config?.color}`}>{order.status}</span>
                          <p className="text-white/60 text-xs font-bold">{formatNaira(order.total)}</p>
                        </div>
                      </div>
                      {/* Mini progress bar for each active order */}
                      <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            order.status === 'In Transit' ? 'bg-[#13ec13]' :
                            order.status === 'Preparing' ? 'bg-[#FFD700]' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                    </div>
                    <div
                      className="shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(order.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-white/30" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/30" />
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
                        <div className="bg-[#1A1D26]/20 rounded-b-2xl border border-t-0 border-white/5 p-4 space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-white/60">{item.name} x{item.qty}</span>
                              <span className="text-white/40">{formatNaira(item.price * item.qty)}</span>
                            </div>
                          ))}
                          <div className="h-px bg-white/5 my-1" />
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-white/80">Total</span>
                            <span className="text-[#13ec13]">{formatNaira(order.total)}</span>
                          </div>
                          {/* Reorder button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(order);
                            }}
                            className="w-full mt-2 bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] py-2 rounded-lg text-xs font-bold hover:bg-[#13ec13]/20 transition-colors"
                          >
                            Reorder Items
                          </button>
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

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div className="px-4 mt-8">
          <h3 className="text-white text-lg font-extrabold mb-4">Past Orders</h3>
          <div className="space-y-3">
            {pastOrders.map((order) => (
              <div key={order.id} className="bg-[#1A1D26]/20 rounded-2xl border border-white/5 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white/30" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white/70 font-bold text-sm">{order.item}</p>
                        <p className="text-white/30 text-xs">{order.eta}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white/30 text-xs font-bold">Delivered</span>
                        <p className="text-white/40 text-xs font-bold">{formatNaira(order.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Reorder for past orders */}
                <div className="px-4 pb-3">
                  <button
                    onClick={() => handleReorder(order)}
                    className="w-full bg-white/5 border border-white/5 text-white/50 py-2 rounded-lg text-xs font-bold hover:bg-white/10 hover:text-white/70 transition-colors"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prayer Times Widget */}
      <div className="px-4 mt-8 mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b]/30 to-[#05070A] border border-[#064e3b]/20 p-5">
          <h3 className="text-[#FFD700] text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
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
                  className={`bg-black/30 p-3 rounded-xl border text-center ${
                    isNext ? 'border-[#FFD700]/30 bg-[#FFD700]/5' : 'border-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[#FFD700] text-lg">{prayer.icon}</span>
                  <p className="text-white text-xs font-bold mt-1">{prayer.name}</p>
                  <p className="text-white/50 text-[10px]">{prayer.time}</p>
                  {isNext && <span className="text-[#FFD700] text-[8px] font-bold uppercase">Next</span>}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => useAppStore.getState().setActiveModal('prayer')}
            className="w-full mt-4 bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#FFD700]/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">schedule</span>
            View Full Schedule
          </button>
        </div>
      </div>
    </main>
  );
}
