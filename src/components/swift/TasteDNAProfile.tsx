'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dna, RefreshCw, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigation, useMood } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface TasteEvolution {
  date: string;
  smoky: number;
  sweet: number;
  spicy: number;
  umami: number;
  fresh: number;
  rich: number;
}

const TASTE_LABELS: Record<keyof TasteEvolution & string, string> = {
  date: '',
  smoky: 'Smoky',
  sweet: 'Sweet',
  spicy: 'Spicy',
  umami: 'Umami',
  fresh: 'Fresh',
  rich: 'Rich',
};

const TASTE_COLORS: Record<string, string> = {
  smoky: '#F5C451',
  sweet: '#10E07A',
  spicy: '#EF4444',
  umami: '#A78BFA',
  fresh: '#38BDF8',
  rich: '#F97316',
};

const TASTE_KEYS = ['smoky', 'sweet', 'spicy', 'umami', 'fresh', 'rich'] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function RadarChart({ data, size = 260 }: { data: Record<string, number>; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const n = TASTE_KEYS.length;
  const angleStep = 360 / n;

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data points
  const points = TASTE_KEYS.map((key, i) => {
    const val = (data[key] || 0) / 100;
    const r = maxR * val;
    const angle = i * angleStep;
    return polarToCartesian(cx, cy, r, angle);
  });

  const pointsPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Axis lines and labels
  const axes = TASTE_KEYS.map((key, i) => {
    const angle = i * angleStep;
    const outer = polarToCartesian(cx, cy, maxR, angle);
    const labelPos = polarToCartesian(cx, cy, maxR + 24, angle);
    return { key, outer, labelPos, angle };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid rings */}
      {rings.map((ring, i) => {
        const ringPoints = TASTE_KEYS.map((_, j) => {
          const r = maxR * ring;
          const angle = j * angleStep;
          return polarToCartesian(cx, cy, r, angle);
        });
        const path = ringPoints.map((p) => `${p.x},${p.y}`).join(' ');
        return (
          <polygon
            key={i}
            points={path}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {axes.map((axis) => (
        <line
          key={axis.key}
          x1={cx}
          y1={cy}
          x2={axis.outer.x}
          y2={axis.outer.y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Data polygon - glow */}
      <polygon
        points={pointsPath}
        fill="rgba(16,224,122,0.08)"
        stroke="#10E07A"
        strokeWidth={2}
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Data polygon - main */}
      <polygon
        points={pointsPath}
        fill="rgba(16,224,122,0.12)"
        stroke="#10E07A"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={TASTE_COLORS[TASTE_KEYS[i]]}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
        />
      ))}

      {/* Labels */}
      {axes.map((axis) => (
        <text
          key={axis.key}
          x={axis.labelPos.x}
          y={axis.labelPos.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white/60 text-[11px] font-medium"
          style={{ fontFamily: 'system-ui' }}
        >
          {TASTE_LABELS[axis.key]}
        </text>
      ))}

      {/* Glow filter */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

function TasteBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-14 text-right">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-white/70 text-xs font-mono w-8">{value}</span>
    </div>
  );
}

export default function TasteDNAProfile() {
  const { tasteProfile, setTasteProfile } = useMood();
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'taste-dna';
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [evolution, setEvolution] = useState<TasteEvolution[]>([]);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showBars, setShowBars] = useState(false);

  useEffect(() => {
    // Generate mock evolution data
    const evo: TasteEvolution[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      evo.push({
        date: d.toLocaleDateString('en-US', { month: 'short' }),
        smoky: Math.max(10, tasteProfile.smoky + Math.floor(Math.random() * 20 - 10)),
        sweet: Math.max(10, tasteProfile.sweet + Math.floor(Math.random() * 20 - 10)),
        spicy: Math.max(10, tasteProfile.spicy + Math.floor(Math.random() * 20 - 10)),
        umami: Math.max(10, tasteProfile.umami + Math.floor(Math.random() * 20 - 10)),
        fresh: Math.max(10, tasteProfile.fresh + Math.floor(Math.random() * 20 - 10)),
        rich: Math.max(10, tasteProfile.rich + Math.floor(Math.random() * 20 - 10)),
      });
    }
    // Last entry is current profile
    evo[evo.length - 1] = {
      date: now.toLocaleDateString('en-US', { month: 'short' }),
      ...tasteProfile,
    };
    setEvolution(evo);
  }, [tasteProfile]);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/taste-dna', { method: 'POST' });
      const data = await res.json();
      if (data.profile) {
        setTasteProfile(data.profile);
        toast({ title: 'Taste DNA Updated', description: 'Your profile has been refreshed based on recent orders.' });
      }
    } catch {
      toast({ title: 'Update Failed', description: 'Could not update taste profile. Try again.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  }, [setTasteProfile, toast]);

  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, [setActiveModal]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  // Find dominant taste
  const dominant = TASTE_KEYS.reduce((a, b) =>
    (tasteProfile[a] || 0) > (tasteProfile[b] || 0) ? a : b
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Taste DNA Profile"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/8 shadow-2xl"
          style={{ backgroundColor: '#0F1118' }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/8" style={{ backgroundColor: '#0F1118' }}>
            <div className="flex items-center gap-2">
              <Dna className="w-5 h-5" style={{ color: '#10E07A' }} />
              <h2 className="text-white font-bold text-lg">Taste DNA</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Dominant Badge */}
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/8"
              style={{ backgroundColor: '#0B0D14' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#F5C451' }} />
              <span className="text-white/50 text-sm">Dominant Taste:</span>
              <span className="font-semibold text-sm" style={{ color: TASTE_COLORS[dominant] }}>
                {TASTE_LABELS[dominant]}
              </span>
              <span className="ml-auto text-white/30 text-xs">{tasteProfile[dominant]}/100</span>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <RadarChart data={tasteProfile} />
            </motion.div>

            {/* Toggle Bars / Evolution */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowBars(false); setShowEvolution(false); }}
                className={`flex-1 text-xs py-2 rounded-lg transition-colors ${!showBars && !showEvolution ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                Radar
              </button>
              <button
                onClick={() => { setShowBars(true); setShowEvolution(false); }}
                className={`flex-1 text-xs py-2 rounded-lg transition-colors ${showBars ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                Breakdown
              </button>
              <button
                onClick={() => { setShowEvolution(true); setShowBars(false); }}
                className={`flex-1 text-xs py-2 rounded-lg transition-colors ${showEvolution ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                Evolution
              </button>
            </div>

            {/* Taste Bars */}
            <AnimatePresence mode="wait">
              {showBars && (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {TASTE_KEYS.map((key) => (
                    <TasteBar
                      key={key}
                      label={TASTE_LABELS[key]}
                      value={tasteProfile[key] || 0}
                      color={TASTE_COLORS[key]}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Evolution Timeline */}
            <AnimatePresence mode="wait">
              {showEvolution && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {evolution.map((entry, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3 text-xs"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <span className="text-white/30 w-10">{entry.date}</span>
                      <div className="flex-1 flex gap-1">
                        {TASTE_KEYS.map((key) => (
                          <div
                            key={key}
                            className="h-3 rounded-sm flex-1"
                            style={{
                              backgroundColor: TASTE_COLORS[key],
                              opacity: (entry[key] || 0) / 100,
                              width: `${entry[key] || 0}%`,
                            }}
                            title={`${TASTE_LABELS[key]}: ${entry[key]}`}
                          />
                        ))}
                      </div>
                      <ChevronRight className="w-3 h-3 text-white/20" />
                    </motion.div>
                  ))}
                  <p className="text-white/30 text-[10px] text-center pt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    Based on your order history over the past 6 months
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Update Button */}
            <motion.button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: '#10E07A', color: '#0B0D14' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isUpdating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isUpdating ? 'Analyzing Orders...' : 'Update Profile'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
