'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Clock, ChefHat } from 'lucide-react';
import { useAppStore } from '@/lib/store';

/**
 * Live Iftar / Sahur Countdown Widget
 * Shows a beautiful countdown to the next key Ramadan meal time.
 * - Before Maghrib (~18:45 Lagos): countdown to Iftar
 * - After Maghrib until ~05:23 (Fajr/Sahur end): countdown to Sahur (next pre-dawn)
 * Uses Lagos prayer times (approximate, matches PrayerTimesModal).
 */

interface Countdown {
  label: string;
  meal: 'iftar' | 'sahur';
  hours: number;
  minutes: number;
  seconds: number;
  progress: number; // 0-100, how far through the current fasting period
}

const MAGHRIB_H = 18;
const MAGHRIB_M = 45;
const FAJR_H = 5;
const FAJR_M = 23;

function computeCountdown(now: Date): Countdown {
  const cur = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const maghrib = MAGHRIB_H * 3600 + MAGHRIB_M * 60;
  const fajr = FAJR_H * 3600 + FAJR_M * 60;

  if (cur < fajr) {
    // Before Fajr → counting to Sahur (end of eating window)
    const target = fajr;
    const diff = target - cur;
    const total = fajr; // from midnight
    return {
      label: 'Sahur ends in',
      meal: 'sahur',
      hours: Math.floor(diff / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
      progress: Math.min(100, (cur / total) * 100),
    };
  } else if (cur < maghrib) {
    // Between Fajr and Maghrib → fasting, counting to Iftar
    const diff = maghrib - cur;
    const total = maghrib - fajr;
    return {
      label: 'Iftar in',
      meal: 'iftar',
      hours: Math.floor(diff / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
      progress: Math.min(100, ((cur - fajr) / total) * 100),
    };
  } else {
    // After Maghrib → counting to next Sahur (tomorrow's Fajr)
    const target = fajr + 24 * 3600;
    const diff = target - cur;
    const total = 24 * 3600 - maghrib + fajr;
    return {
      label: 'Sahur begins in',
      meal: 'sahur',
      hours: Math.floor(diff / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
      progress: Math.min(100, ((cur - maghrib) / total) * 100),
    };
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function RamadanCountdown() {
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const [countdown, setCountdown] = useState<Countdown>(() =>
    computeCountdown(new Date())
  );
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setCountdown(computeCountdown(new Date()));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const isIftar = countdown.meal === 'iftar';
  const accent = isIftar ? '#10E07A' : '#F5C451';
  const Icon = isIftar ? Moon : Sun;

  const hh = pad(countdown.hours);
  const mm = pad(countdown.minutes);
  const ss = pad(countdown.seconds);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: isIftar
          ? 'linear-gradient(135deg, rgba(16,224,122,0.10) 0%, rgba(15,17,23,0.9) 60%)'
          : 'linear-gradient(135deg, rgba(245,196,81,0.10) 0%, rgba(15,17,23,0.9) 60%)',
      }}
    >
      {/* Decorative glow */}
      <motion.div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl pointer-events-none"
        style={{ background: accent, opacity: 0.15 }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10 p-3 sm:p-4">
        {/* Top row: icon + label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}22`, border: `1px solid ${accent}40` }}
            >
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">
                {countdown.label}
              </p>
              <p className="text-white/65 text-[10px] mt-0.5">
                {isIftar ? 'Time to break your fast' : 'Pre-dawn meal window'}
              </p>
            </div>
          </div>
          <span
            className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: `${accent}1a`, color: accent, border: `1px solid ${accent}33` }}
          >
            {isIftar ? 'Fasting' : 'Eating'}
          </span>
        </div>

        {/* Countdown digits */}
        <div className="flex items-end gap-1 mb-3">
          <div className="flex flex-col items-center">
            <span
              className="text-3xl font-black tabular-nums leading-none tracking-tighter"
              style={{ color: accent, textShadow: `0 0 20px ${accent}40` }}
            >
              {hh}
            </span>
            <span className="text-white/60 text-[9px] font-bold uppercase mt-1">hrs</span>
          </div>
          <span className="text-2xl font-black text-white/20 mb-4">:</span>
          <div className="flex flex-col items-center">
            <span
              className="text-3xl font-black tabular-nums leading-none tracking-tighter"
              style={{ color: accent, textShadow: `0 0 20px ${accent}40` }}
            >
              {mm}
            </span>
            <span className="text-white/60 text-[9px] font-bold uppercase mt-1">min</span>
          </div>
          <span className="text-2xl font-black text-white/20 mb-4">:</span>
          <div className="flex flex-col items-center">
            <span
              className="text-3xl font-black tabular-nums leading-none tracking-tighter"
              style={{ color: accent, textShadow: `0 0 20px ${accent}40` }}
            >
              {ss}
            </span>
            <span className="text-white/60 text-[9px] font-bold uppercase mt-1">sec</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${accent}, ${accent}aa)` }}
            animate={{ width: `${countdown.progress}%` }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </div>

        {/* Bottom row: CTA */}
        <button
          onClick={() => setActiveModal('smart-kitchen')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
        >
          <ChefHat className="w-4 h-4 text-[var(--sr-customer)]" />
          <span className="text-white/80 text-xs font-bold">
            {isIftar ? 'Plan your Iftar with Chef Safa' : 'Prep Sahur with Chef Safa'}
          </span>
          <motion.span
            className="text-[var(--sr-customer)] text-xs"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </button>
      </div>
    </motion.div>
  );
}
