'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, ChevronRight, MoreVertical, Check, X, Timer, MapPin, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { vendorIncomingOrders, vendorProcessingOrders, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type OrderStatus = 'incoming' | 'processing' | 'dispatched';

export default function VendorDashboard() {
  const { vendorStoreName, vendorOnline, setVendorOnline, setActiveModal } = useAppStore();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<OrderStatus>('incoming');

  const filters: { id: OrderStatus; label: string; count: number }[] = [
    { id: 'incoming', label: 'Incoming', count: vendorIncomingOrders.length },
    { id: 'processing', label: 'Processing', count: vendorProcessingOrders.length },
    { id: 'dispatched', label: 'Dispatched', count: 0 },
  ];

  const handleAcceptOrder = (orderId: string) => {
    toast({
      title: 'Order Accepted! ✅',
      description: `Order ${orderId} is now being prepared`,
    });
  };

  const handleMoreOptions = (orderId: string) => {
    toast({
      title: 'Order Options',
      description: `Manage order ${orderId}`,
    });
  };

  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-2">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">{vendorStoreName}</h1>
          <p className="text-[#FFD700] text-xs font-bold mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">mosque</span>
            Ramadan 2026 Vendor
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModal('vendor-insights')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1D26] border border-white/10 hover:border-[#FFD700]/30 transition-all"
          >
            <span className="material-symbols-outlined text-[#FFD700] text-lg">bar_chart</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1D26] border border-white/10 relative">
            <Bell className="w-4 h-4 text-white" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </motion.div>

      {/* Availability Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl bg-[#1A1D26] border border-white/5 p-4"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD700]/5 blur-[40px]" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              vendorOnline
                ? 'bg-[#13ec13]/20 border-[#13ec13]/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}>
              <ShoppingBag className={`w-5 h-5 ${vendorOnline ? 'text-[#13ec13]' : 'text-red-400'}`} />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Ramadan Platters</p>
              <p className={`text-xs font-semibold mt-0.5 ${vendorOnline ? 'text-[#13ec13]' : 'text-red-400'}`}>
                {vendorOnline ? 'Active for Iftar & Suhoor prep' : 'Currently offline'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setVendorOnline(!vendorOnline);
              toast({
                title: vendorOnline ? 'Going Offline' : 'Back Online! 🟢',
                description: vendorOnline
                  ? 'You will stop receiving new orders'
                  : 'You are now accepting orders for Iftar & Suhoor',
              });
            }}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              vendorOnline ? 'bg-[#13ec13]' : 'bg-white/10'
            }`}
          >
            <motion.div
              animate={{ x: vendorOnline ? 28 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>
      </motion.div>

      {/* Order Status Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 p-1 rounded-2xl bg-[#1A1D26]/60 border border-white/5"
      >
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`relative flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeFilter === filter.id
                ? 'text-[#05070A]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {activeFilter === filter.id && (
              <motion.div
                layoutId="vendorOrderFilter"
                className="absolute inset-0 rounded-xl bg-[#FFD700]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{filter.label}</span>
            {filter.count > 0 && (
              <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeFilter === filter.id
                  ? 'bg-[#05070A]/20 text-[#05070A]'
                  : 'bg-white/10 text-white/40'
              }`}>
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
            {/* Active Requests Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">Active Requests</h3>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/20">
                  {vendorIncomingOrders.length} New
                </span>
              </div>
              <button className="text-[#FFD700] text-xs font-bold flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Incoming Order Cards */}
            {vendorIncomingOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-[#1A1D26] border border-white/5 overflow-hidden"
              >
                {/* Food Image with Gradient */}
                <div className="relative h-32 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${order.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D26] via-[#1A1D26]/60 to-transparent" />

                  {/* Iftar Countdown Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm border border-red-400/30">
                    <Timer className="w-3 h-3 text-white" />
                    <span className="text-white text-[10px] font-black">{order.minutesUntilIftar} min to Iftar</span>
                  </div>

                  {/* Order ID */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                    <span className="text-white/80 text-[10px] font-bold">{order.id}</span>
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
                      <p className="text-[#FFD700] font-black text-sm">{formatNaira(order.total)}</p>
                    </div>
                  </div>

                  {/* Items */}
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

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="flex-1 py-2.5 rounded-xl bg-[#13ec13] text-[#05070A] text-xs font-bold hover:bg-[#13ec13]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      Accept Order
                    </button>
                    <button
                      onClick={() => handleMoreOptions(order.id)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <MoreVertical className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
              <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-black border border-[#FFD700]/20">
                {vendorProcessingOrders.length}
              </span>
            </div>

            {vendorProcessingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-semibold">No processing orders</p>
                <p className="text-white/20 text-xs mt-1">Accept incoming orders to see them here</p>
              </div>
            ) : (
              vendorProcessingOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-[#1A1D26] border border-[#FFD700]/20 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-bold">{order.customer}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-bold">
                          Processing
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-white/30" />
                        <span className="text-white/40 text-xs">{order.area}</span>
                      </div>
                    </div>
                    <p className="text-[#FFD700] font-black text-sm">{formatNaira(order.total)}</p>
                  </div>

                  {/* Items */}
                  <div className="space-y-1 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">{item.qty}x {item.name}</span>
                        <span className="text-white/30 text-xs">{formatNaira(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span className="text-white/40 text-xs">Started {order.startedAt}</span>
                    </div>
                    <span className="text-[#13ec13] text-xs font-bold">Ready by {order.estimatedReady}</span>
                  </div>

                  {/* Mark Ready Button */}
                  <button
                    onClick={() => toast({ title: 'Order Ready! 🎉', description: `${order.id} marked as ready for dispatch` })}
                    className="w-full mt-3 py-2.5 rounded-xl bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold border border-[#FFD700]/20 hover:bg-[#FFD700]/30 active:scale-[0.98] transition-all"
                  >
                    Mark as Ready
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
              <span className="material-symbols-outlined text-white/20 text-3xl">local_shipping</span>
            </div>
            <p className="text-white/40 text-sm font-semibold">No dispatched orders</p>
            <p className="text-white/20 text-xs mt-1">Orders being delivered will appear here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
