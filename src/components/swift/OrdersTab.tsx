'use client';

import { Package, Truck, CheckCircle, Clock, Phone } from 'lucide-react';
import { myOrders, formatNaira } from '@/lib/data';
import { motion } from 'framer-motion';

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  'In Transit': { color: 'text-[#13ec13]', icon: Truck },
  'Preparing': { color: 'text-[#FFD700]', icon: Clock },
  'Delivered': { color: 'text-white/40', icon: CheckCircle },
};

export default function OrdersTab() {
  const activeOrder = myOrders.find(o => o.status !== 'Delivered');
  const pastOrders = myOrders.filter(o => o.status === 'Delivered');

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
                <div className="bg-[#13ec13] h-2 rounded-full transition-all duration-1000" style={{ width: activeOrder.status === 'In Transit' ? '75%' : '35%' }} />
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
                  <button className="w-10 h-10 bg-[#13ec13]/10 rounded-full flex items-center justify-center border border-[#13ec13]/20">
                    <Phone className="w-4 h-4 text-[#13ec13]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Orders */}
      <div className="px-4 mt-6">
        <h3 className="text-white text-lg font-extrabold mb-4">Active Orders</h3>
        <div className="space-y-3">
          {myOrders.filter(o => o.status !== 'Delivered').map((order) => {
            const config = statusConfig[order.status];
            const Icon = config?.icon || Package;
            return (
              <div key={order.id} className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${config?.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold text-sm">{order.item}</p>
                      <p className="text-white/40 text-xs mt-0.5">{order.eta}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${config?.color}`}>{order.status}</span>
                      <p className="text-white/60 text-xs font-bold">{formatNaira(order.total)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Orders */}
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

      {/* Prayer Times Widget */}
      <div className="px-4 mt-8 mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b]/30 to-[#05070A] border border-[#064e3b]/20 p-5">
          <h3 className="text-[#FFD700] text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">mosque</span>
            Prayer Times
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Fajr', time: '5:23 AM', icon: 'dark_mode' },
              { name: 'Maghrib', time: '6:45 PM', icon: 'nights_stay' },
              { name: 'Isha', time: '8:05 PM', icon: 'dark_mode' },
            ].map((prayer) => (
              <div key={prayer.name} className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="material-symbols-outlined text-[#FFD700] text-lg">{prayer.icon}</span>
                <p className="text-white text-xs font-bold mt-1">{prayer.name}</p>
                <p className="text-white/50 text-[10px]">{prayer.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
