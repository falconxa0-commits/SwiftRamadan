'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

/* ─────────────────────────────────────────────────────
   OrderCelebration — Premium canvas-confetti effect
   Brand colors: var(--sr-customer) (green), var(--sr-vendor) (gold), var(--sr-rider) (blue), var(--sr-ai) (purple)
   ───────────────────────────────────────────────────── */

const BRAND_COLORS = ['var(--sr-customer)', 'var(--sr-vendor)', 'var(--sr-rider)', 'var(--sr-ai)'];

/**
 * Trigger a premium order celebration confetti effect.
 * Can be called from anywhere — no React component needed.
 *
 * Celebration sequence (~3 seconds):
 * 1. Big center burst (150 particles)
 * 2. Left cannon from bottom-left
 * 3. Right cannon from bottom-right
 * 4. A second smaller star-burst for extra delight
 */
export function triggerOrderCelebration() {
  // ── 1. Big center burst ──
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.45, x: 0.5 },
    colors: BRAND_COLORS,
    startVelocity: 45,
    gravity: 0.8,
    scalar: 1.1,
    shapes: ['circle', 'star'],
    ticks: 200,
  });

  // ── 2. Left cannon (bottom-left) ──
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.95 },
      colors: BRAND_COLORS,
      startVelocity: 55,
      gravity: 0.9,
      shapes: ['circle', 'star'],
      ticks: 180,
    });
  }, 200);

  // ── 3. Right cannon (bottom-right) ──
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.95 },
      colors: BRAND_COLORS,
      startVelocity: 55,
      gravity: 0.9,
      shapes: ['circle', 'star'],
      ticks: 180,
    });
  }, 350);

  // ── 4. Second smaller star-burst (center, slight delay) ──
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.35, x: 0.5 },
      colors: BRAND_COLORS,
      startVelocity: 30,
      gravity: 1.0,
      scalar: 0.9,
      shapes: ['star'],
      ticks: 150,
    });
  }, 700);

  // ── 5. Final left-right quick burst for extra pizzazz ──
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 50,
      spread: 40,
      origin: { x: 0, y: 0.9 },
      colors: [BRAND_COLORS[0], BRAND_COLORS[1]],
      startVelocity: 45,
      gravity: 1.1,
      shapes: ['circle'],
      ticks: 120,
    });
    confetti({
      particleCount: 30,
      angle: 130,
      spread: 40,
      origin: { x: 1, y: 0.9 },
      colors: [BRAND_COLORS[2], BRAND_COLORS[3]],
      startVelocity: 45,
      gravity: 1.1,
      shapes: ['circle'],
      ticks: 120,
    });
  }, 1100);
}

/* ─── OrderCelebration React Component ─── */
interface OrderCelebrationProps {
  /** Automatically fire confetti on mount? Default: true */
  autoFire?: boolean;
  /** Order number to display */
  orderNumber?: string;
  className?: string;
}

export default function OrderCelebration({
  autoFire = true,
  orderNumber,
  className = '',
}: OrderCelebrationProps) {
  const fireCelebration = useCallback(() => {
    triggerOrderCelebration();
  }, []);

  useEffect(() => {
    if (autoFire) {
      // Small delay to let the modal animate in first
      const timer = setTimeout(fireCelebration, 400);
      return () => clearTimeout(timer);
    }
  }, [autoFire, fireCelebration]);

  return (
    <div className={`relative flex flex-col items-center text-center py-6 sm:py-8 space-y-4 sm:space-y-6 ${className}`}>
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
        className="w-24 h-24 bg-[var(--sr-customer)]/20 rounded-full flex items-center justify-center border border-[var(--sr-customer)]/30 shadow-[0_0_32px_rgba(16,224,122,0.25)]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 10 }}
        >
          <PartyPopper className="w-12 h-12 text-[var(--sr-customer)]" />
        </motion.div>
      </motion.div>

      <div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-white text-2xl font-black mb-2"
        >
          Order Placed! 🎉
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-white/50 text-sm"
        >
          Your Ramadan order is being prepared
        </motion.p>
        {orderNumber && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[var(--sr-customer)]/60 text-xs font-mono mt-1"
          >
            {orderNumber}
          </motion.p>
        )}
      </div>
    </div>
  );
}
