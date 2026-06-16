'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Star, Clock, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
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
    <div className="bg-[#1A1D26] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-white text-xs font-bold">{d.hour}</p>
      <p className={d.isIftar ? 'text-[#FFD700] text-sm font-black' : 'text-[#13ec13] text-sm font-black'}>
        {formatNaira(d.amount)}
      </p>
      {d.isIftar && <p className="text-[#FFD700]/60 text-[9px] font-bold">2x Iftar Bonus</p>}
    </div>
  );
}

export default function RiderEarningsHub() {
  const { riderEarnings } = useAppStore();
  const data = riderEarningsBreakdown;
  const perf = riderPerformanceMetrics;

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
      {/* Hero Stats Card */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFD700]/20 via-[#FFD700]/5 to-[#1A1D26] border border-[#FFD700]/20 p-5 gold-glow">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFD700]/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FFD700]/5 blur-[60px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-[#FFD700]" />
              <span className="text-[#FFD700] text-xs font-bold uppercase tracking-widest">Today&apos;s Earnings</span>
            </div>
            <p className="text-white text-4xl font-black mt-2">{formatNaira(data.today)}</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#13ec13]" />
              <span className="text-[#13ec13] text-xs font-bold">+18% from yesterday</span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white/40 text-xs">{data.completedDeliveries} deliveries</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hourly Performance Chart (Recharts) */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/40" />
          Hourly Performance
        </h3>
        <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4">
          <div style={{ width: '100%', height: 200 }}>
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
                      fill={entry.isIftar ? '#FFD700' : 'rgba(19,236,19,0.5)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#13ec13]/40" />
              <span className="text-white/30 text-[9px]">Regular</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              <span className="text-[#FFD700] text-[9px] font-bold">Iftar Peak (2x Bonus)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earnings Breakdown */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3">Earnings Breakdown</h3>
        <div className="space-y-2">
          {/* Base Pay */}
          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#13ec13]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Base Pay</p>
                <p className="text-white/30 text-[10px]">{data.completedDeliveries} completed deliveries</p>
              </div>
            </div>
            <p className="text-white font-extrabold">{formatNaira(data.basePay)}</p>
          </div>

          {/* Iftar Bonuses - highlighted */}
          <div className="bg-[#1A1D26] rounded-xl p-4 border border-[#FFD700]/20 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#FFD700]/5 blur-[40px]" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-[#FFD700]/15 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#FFD700] text-xl">bedtime</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-bold">Iftar Bonuses</p>
                  <span className="px-1.5 py-0.5 bg-[#FFD700]/15 text-[#FFD700] text-[8px] font-black rounded uppercase">
                    Active
                  </span>
                </div>
                <p className="text-white/30 text-[10px]">2x multiplier on Iftar deliveries</p>
              </div>
            </div>
            <p className="text-[#FFD700] font-extrabold relative z-10">{formatNaira(data.iftarBonuses)}</p>
          </div>

          {/* Customer Tips */}
          <div className="bg-[#1A1D26] rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-[#13ec13]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Customer Tips</p>
                <p className="text-white/30 text-[10px]">{data.gratefulCustomers} grateful customers</p>
              </div>
            </div>
            <p className="text-white font-extrabold">{formatNaira(data.tips)}</p>
          </div>
        </div>
      </motion.div>

      {/* Performance Section */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3">Performance</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* On-Time Rate - Circular Progress */}
          <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 flex flex-col items-center">
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
                  stroke="#13ec13"
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
            <p className="text-white/40 text-[10px] font-bold mt-2">On-Time Rate</p>
            <span className="text-[#13ec13] text-[9px] font-bold">{perf.completionTrend}</span>
          </div>

          {/* Average Rating */}
          <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center mb-2">
              <Star className="w-7 h-7 text-[#FFD700]" />
            </div>
            <p className="text-white text-2xl font-black">{perf.rating}</p>
            <p className="text-white/40 text-[10px] font-bold mt-0.5">Avg Rating</p>
            <span className="text-[#13ec13] text-[9px] font-bold">{perf.ratingTrend}</span>
          </div>
        </div>
      </motion.div>

      {/* Incentive Progress */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="bg-[#1A1D26] rounded-2xl border border-[#FFD700]/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFD700]" />
              <span className="text-white text-sm font-bold">Ramadan Bonus</span>
            </div>
            <span className="text-[#FFD700] text-xs font-bold">{perf.incentiveProgress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-3 mb-2">
            <motion.div
              className="bg-gradient-to-r from-[#FFD700] to-[#f4c025] h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${perf.incentiveProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-[10px]">{perf.incentiveRemaining}</p>
            <p className="text-[#FFD700] text-[10px] font-bold">{perf.incentiveGoal}</p>
          </div>
        </div>
      </motion.div>

      {/* Top Compliments */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3">
          Customer Compliments ({perf.compliments})
        </h3>
        <div className="space-y-2">
          {perf.topCompliments.map((comp, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="bg-[#1A1D26] rounded-xl p-3 border border-white/5 flex items-start gap-3"
            >
              <div className="w-9 h-9 bg-[#13ec13]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[#13ec13] text-base">{comp.icon}</span>
              </div>
              <div>
                <p className="text-white text-xs font-bold">{comp.title}</p>
                <p className="text-white/30 text-[10px] mt-0.5 italic">&ldquo;{comp.quote}&rdquo;</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Cash Out Button */}
      <motion.div variants={staggerItem} className="mb-4">
        <button
          onClick={handleCashOut}
          className="w-full bg-[#13ec13] text-[#05070A] py-4 rounded-2xl font-black text-sm hover:bg-[#13ec13]/90 transition-colors flex items-center justify-center gap-2 green-glow"
        >
          <DollarSign className="w-5 h-5" />
          Cash Out {formatNaira(riderEarnings)}
        </button>
        <p className="text-white/20 text-[10px] text-center mt-2">Funds arrive within 24 hours to your bank account</p>
      </motion.div>
    </motion.main>
  );
}
