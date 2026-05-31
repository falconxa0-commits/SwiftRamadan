'use client';

import { Package, Truck, CheckCircle, Clock, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { myOrders, formatNaira, prayerTimes } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface Order {
  id: string;
  status: string;
  item: string;
  eta: string;
  total: number;
  rider: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  progress: number;
}

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  'In Transit': { color: 'text-[#13ec13]', icon: Truck },
  'Preparing': { color: 'text-[#FFD700]', icon: Clock },
  'Delivered': { color: 'text-white/40', icon: CheckCircle },
};

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(data.orders || myOrders);
      } catch {
        setOrders(myOrders);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
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
          <div className="relative overflow-hidden rounded-2xl bg-[#1A1D26] border border-[#13ec13]/20 p-5">
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

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold">{activeOrder.item}</p>
                  <p className="text-[#13ec13] text-sm font-medium">{activeOrder.eta}</p>
                </div>
                <span className="text-white font-bold">{formatNaira(activeOrder.total)}</span>
              </div>

              {activeOrder.rider && (
                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#13ec13]/20 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-[#13ec13]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{activeOrder.rider}</p>
                      <p className="text-white/40 text-xs">Your rider</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCallRider(activeOrder.rider)}
                    className="w-10 h-10 bg-[#13ec13]/10 rounded-full flex items-center justify-center border border-[#13ec13]/20 hover:bg-[#13ec13]/20 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#13ec13]" />
                  </button>
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
                    onClick={() => toggleExpand(order.id)}
                    className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 w-full text-left hover:border-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className={`w-6 h-6 ${config?.color}`} />
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
                    </div>
                    <div className="shrink-0 ml-2">
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
              <div key={order.id} className="flex items-center gap-4 p-4 bg-[#1A1D26]/20 rounded-2xl border border-white/5 opacity-70">
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
