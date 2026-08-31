'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Star, Clock, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store-selectors';
import {
  formatNaira,
  riderEarningsBreakdown,
  riderPerformanceMetrics,
} from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useState, useRef, useEffect } from 'react';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface HourlyTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { hour: string; amount: number; isIftar: boolean } }>;
}

function HourlyTooltip({ active, payload }: HourlyTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-white text-xs font-bold">{d.hour}</p>
      <p className={d.isIftar ? 'text-[var(--sr-vendor)] text-sm font-black' : 'text-[var(--sr-customer)] text-sm font-black'}>
        {formatNaira(d.amount)}
      </p>
      {d.isIftar && <p className="text-[var(--sr-vendor)]/60 text-[9px] font-bold">2x Iftar Bonus</p>}
    </div>
  );
}

export default function RiderEarningsHub() {
  const riderEarnings = useAppStore(s => s.riderEarnings);
  const data = riderEarningsBreakdown;
  const perf = riderPerformanceMetrics;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setChartReady(width > 0 && height > 0);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chartData = data.hourlyData.map(h => ({
    hour: h.hour,
    amount: h.amount,
    isIftar: h.hour === 'Iftar',
  }));

  const handleCashOut = () => {
    toast({
      title: 'Cash Out Initiated 💰',
      description: `${formatNaira(riderEarnings)} will be sent to your GTBank ****4821 within 24hrs.`,
    });
  };

  // Circular progress for on-time rate
  const onTimeRate = perf.completionRate;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (onTimeRate / 100) * circumference;

  return (
    <motion.main
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex-1 overflow-y-auto pb-32 px-4 pt-4"
    >
      {/* Onboarding Guidance — only when no earnings */}
      {riderEarnings === 0 && data.today === 0 && (
        <motion.div variants={staggerItem} className="mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--sr-customer)]/15 via-[var(--sr-customer)]/5 to-[#1A1D26] border border-[var(--sr-customer)]/20 p-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--sr-customer)]/5 blur-[60px]" />
            <div className="relative z-10">
              <h3 className="text-white text-lg font-black mb-1">Start Earning 🏍️</h3>
              <p className="text-white/50 text-sm mb-4">Complete deliveries to earn money</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--sr-customer)]/20 flex items-center justify-center shrink-0">
                    <span className="text-[var(--sr-customer)] text-xs font-black">1</span>
                  </div>
                  <span className="text-white/70 text-sm">Go online to receive delivery requests</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--sr-customer)]/20 flex items-center justify-center shrink-0">
                    <span className="text-[var(--sr-customer)] text-xs font-black">2</span>
                  </div>
                  <span className="text-white/70 text-sm">Accept and complete deliveries</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--sr-customer)]/20 flex items-center justify-center shrink-0">
                    <span className="text-[var(--sr-customer)] text-xs font-black">3</span>
                  </div>
                  <span className="text-white/70 text-sm">Get paid — earnings show up here</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Stats Card */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--sr-vendor)]/20 via-[var(--sr-vendor)]/5 to-[#1A1D26] border border-[var(--sr-vendor)]/20 p-5 gold-glow">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--sr-vendor)]/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--sr-vendor)]/5 blur-[60px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-[var(--sr-vendor)]" />
              <span className="text-[var(--sr-vendor)] text-xs font-bold uppercase tracking-widest">Today&apos;s Earnings</span>
            </div>
            <p className="text-white text-4xl font-black mt-2">{formatNaira(data.today)}</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--sr-customer)]" />
              <span className="text-[var(--sr-customer)] text-xs font-bold">+18% from yesterday</span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white/65 text-xs">{data.completedDeliveries} deliveries</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hourly Performance Chart (Recharts) */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/65" />
          Hourly Performance
        </h3>
        <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4">
          <div ref={chartContainerRef} style={{ width: '100%', height: 200 }}>
            {chartReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                    tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<HourlyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isIftar ? '#F5C451' : 'rgba(16,224,122,0.5)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/20 text-xs">Loading chart...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sr-customer)]/40" />
              <span className="text-white/60 text-[9px]">Regular</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sr-vendor)]" />
              <span className="text-[var(--sr-vendor)] text-[9px] font-bold">Iftar Peak (2x Bonus)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earnings Breakdown */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3">Earnings Breakdown</h3>
        <div className="space-y-2">
          {/* Base Pay */}
          <div className="bg-[var(--sr-surface-elevated)] rounded-xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--sr-customer)]/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[var(--sr-customer)]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Base Pay</p>
                <p className="text-white/60 text-[10px]">{data.completedDeliveries} completed deliveries</p>
              </div>
            </div>
            <p className="text-white font-extrabold">{formatNaira(data.basePay)}</p>
          </div>

          {/* Iftar Bonuses - highlighted */}
          <div className="bg-[var(--sr-surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--sr-vendor)]/20 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--sr-vendor)]/5 blur-[40px]" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-[var(--sr-vendor)]/15 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--sr-vendor)] text-xl">bedtime</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-bold">Iftar Bonuses</p>
                  <span className="px-1.5 py-0.5 bg-[var(--sr-vendor)]/15 text-[var(--sr-vendor)] text-[8px] font-black rounded uppercase">
                    Active
                  </span>
                </div>
                <p className="text-white/60 text-[10px]">2x multiplier on Iftar deliveries</p>
              </div>
            </div>
            <p className="text-[var(--sr-vendor)] font-extrabold relative z-10">{formatNaira(data.iftarBonuses)}</p>
          </div>

          {/* Customer Tips */}
          <div className="bg-[var(--sr-surface-elevated)] rounded-xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--sr-customer)]/10 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-[var(--sr-customer)]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Customer Tips</p>
                <p className="text-white/60 text-[10px]">{data.gratefulCustomers} grateful customers</p>
              </div>
            </div>
            <p className="text-white font-extrabold">{formatNaira(data.tips)}</p>
          </div>
        </div>
      </motion.div>

      {/* Performance Section */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3">Performance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* On-Time Rate - Circular Progress */}
          <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4 flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10E07A"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-lg font-black">{onTimeRate}%</p>
              </div>
            </div>
            <p className="text-white/65 text-[10px] font-bold mt-2">On-Time Rate</p>
            <span className="text-[var(--sr-customer)] text-[9px] font-bold">{perf.completionTrend}</span>
          </div>

          {/* Average Rating */}
          <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-[var(--sr-vendor)]/10 rounded-2xl flex items-center justify-center mb-2">
              <Star className="w-7 h-7 text-[var(--sr-vendor)]" />
            </div>
            <p className="text-white text-2xl font-black">{perf.rating}</p>
            <p className="text-white/65 text-[10px] font-bold mt-0.5">Avg Rating</p>
            <span className="text-[var(--sr-customer)] text-[9px] font-bold">{perf.ratingTrend}</span>
          </div>
        </div>
      </motion.div>

      {/* Incentive Progress */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-[var(--sr-vendor)]/10 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--sr-vendor)]" />
              <span className="text-white text-sm font-bold">Ramadan Bonus</span>
            </div>
            <span className="text-[var(--sr-vendor)] text-xs font-bold">{perf.incentiveProgress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-3 mb-2">
            <motion.div
              className="bg-gradient-to-r from-[var(--sr-vendor)] to-[#f4c025] h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${perf.incentiveProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/65 text-[10px]">{perf.incentiveRemaining}</p>
            <p className="text-[var(--sr-vendor)] text-[10px] font-bold">{perf.incentiveGoal}</p>
          </div>
        </div>
      </motion.div>

      {/* Top Compliments */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3">
          Customer Compliments ({perf.compliments})
        </h3>
        <div className="space-y-2">
          {perf.topCompliments.map((comp) => (
            <motion.div
              key={comp.title}
              variants={staggerItem}
              className="bg-[var(--sr-surface-elevated)] rounded-xl p-3 border border-white/5 flex items-start gap-3"
            >
              <div className="w-9 h-9 bg-[var(--sr-customer)]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[var(--sr-customer)] text-base">{comp.icon}</span>
              </div>
              <div>
                <p className="text-white text-xs font-bold">{comp.title}</p>
                <p className="text-white/60 text-[10px] mt-0.5 italic">&ldquo;{comp.quote}&rdquo;</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Cash Out Button */}
      <motion.div variants={staggerItem} className="mb-4">
        <button
          onClick={handleCashOut}
          className="w-full bg-[var(--sr-customer)] text-[var(--sr-surface-base)] py-4 rounded-2xl font-black text-sm hover:bg-[var(--sr-customer)]/90 transition-colors flex items-center justify-center gap-2 green-glow"
        >
          <DollarSign className="w-5 h-5" />
          Cash Out {formatNaira(riderEarnings)}
        </button>
        <p className="text-white/20 text-[10px] text-center mt-2">Funds arrive within 24 hours to your bank account</p>
      </motion.div>
    </motion.main>
  );
}
