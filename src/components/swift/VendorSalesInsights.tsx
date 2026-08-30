'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Star, Clock, Users, ShoppingBag } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { vendorSalesInsights, formatNaira } from '@/lib/data';

export default function VendorSalesInsights() {
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'vendor-insights';

  const { dailyTrend } = vendorSalesInsights;
  const maxRevenue = Math.max(...dailyTrend.map((d) => d.revenue));

  const handleClose = () => {
    setActiveModal(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />

          {/* Full-Screen Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5C451]/20 flex items-center justify-center border border-[#F5C451]/30">
                    <TrendingUp className="w-5 h-5 text-[#F5C451]" />
                  </div>
                  <h2 className="text-white text-lg font-bold">Sales Insights</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Today's Revenue Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-[#1A1D26] border border-white/5 p-6 mt-4"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C451]/5 blur-[60px]" />
                <div className="relative z-10">
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Today&apos;s Revenue</p>
                  <p className="text-[#F5C451] text-4xl font-black mt-1">{formatNaira(vendorSalesInsights.todayRevenue)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10E07A]/20">
                      <ShoppingBag className="w-3 h-3 text-[#10E07A]" />
                      <span className="text-[#10E07A] text-xs font-bold">{vendorSalesInsights.todayOrders} orders</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Average Order Value */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 rounded-2xl bg-[#1A1D26] border border-white/5 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Average Order Value</p>
                    <p className="text-white text-2xl font-black mt-1">{formatNaira(vendorSalesInsights.avgOrderValue)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#10E07A]/20 flex items-center justify-center border border-[#10E07A]/20">
                    <span className="material-symbols-outlined text-[#10E07A]">payments</span>
                  </div>
                </div>
              </motion.div>

              {/* Weekly Revenue Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-4">Weekly Revenue</h4>
                <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-5">
                  <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
                    {dailyTrend.map((day, i) => {
                      const heightPct = (day.revenue / maxRevenue) * 100;
                      const isFriday = day.day === 'Fri';
                      const isToday = day.day === 'Wed';
                      return (
                        <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                          {/* Amount label for peak */}
                          {(isFriday || isToday) && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 + i * 0.06 }}
                              className={`text-[9px] font-bold whitespace-nowrap ${
                                isFriday ? 'text-[#F5C451]' : 'text-white/40'
                              }`}
                            >
                              {formatNaira(day.revenue).replace('₦', '₦')}
                            </motion.p>
                          )}
                          <div className="w-full flex flex-col justify-end" style={{ height: isFriday || isToday ? 120 : 140 }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPct}%` }}
                              transition={{ duration: 0.6, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                              className={`w-full rounded-t-lg transition-colors ${
                                isFriday
                                  ? 'bg-gradient-to-t from-[#F5C451] to-[#F5C451]/60'
                                  : isToday
                                    ? 'bg-gradient-to-t from-[#10E07A] to-[#10E07A]/40'
                                    : 'bg-gradient-to-t from-white/20 to-white/5'
                              }`}
                              style={{ minHeight: 8 }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${
                            isFriday ? 'text-[#F5C451]' : isToday ? 'text-[#10E07A]' : 'text-white/30'
                          }`}>
                            {day.day}
                          </span>
                          {isFriday && (
                            <span className="text-[8px] text-[#F5C451]/60 font-bold">Peak</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Key Metrics Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 grid grid-cols-3 gap-3"
              >
                <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#F5C451]/20 flex items-center justify-center mx-auto mb-2 border border-[#F5C451]/20">
                    <Star className="w-5 h-5 text-[#F5C451]" />
                  </div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Top Seller</p>
                  <p className="text-white text-[11px] font-bold mt-1 leading-tight">{vendorSalesInsights.topSellingItem}</p>
                </div>
                <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#10E07A]/20 flex items-center justify-center mx-auto mb-2 border border-[#10E07A]/20">
                    <Clock className="w-5 h-5 text-[#10E07A]" />
                  </div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Peak Hour</p>
                  <p className="text-white text-[11px] font-bold mt-1 leading-tight">{vendorSalesInsights.peakHour}</p>
                </div>
                <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Retention</p>
                  <p className="text-white text-[11px] font-bold mt-1">{vendorSalesInsights.customerRetention}%</p>
                </div>
              </motion.div>

              {/* Ramadan Totals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D26] to-[#0F1117] border border-[#F5C451]/20 p-6"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#F5C451]/5 blur-[60px]" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#10E07A]/5 blur-[40px]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#F5C451] text-lg">mosque</span>
                    <h4 className="text-[#F5C451] font-bold text-sm">Ramadan Totals</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Total Revenue</p>
                      <p className="text-white text-2xl font-black mt-1">{formatNaira(vendorSalesInsights.ramadanRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Total Orders</p>
                      <p className="text-white text-2xl font-black mt-1">{vendorSalesInsights.ramadanOrders.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#10E07A]" />
                      <span className="text-[#10E07A] text-xs font-bold">+24% vs last Ramadan</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
