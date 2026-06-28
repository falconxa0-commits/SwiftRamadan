'use client';

import { motion, type Variants, type Transition } from 'framer-motion';
import { useState, useEffect, useContext, createContext, type ReactNode } from 'react';

/* ══════════════════════════════════════════════════════════════════
   SPRING CONFIG — Natural, snappy spring physics (iOS-like)
   ══════════════════════════════════════════════════════════════════ */

export const springConfig: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
  mass: 0.8,
};

/** Faster spring for exit animations (snappier exit so new content reveals faster) */
export const exitSpringConfig: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.6,
};

/* ══════════════════════════════════════════════════════════════════
   TAB DIRECTION CONTEXT
   Tracks previous tab index to determine forward/back direction
   ══════════════════════════════════════════════════════════════════ */

interface DirectionContextValue {
  direction: 1 | -1; // 1 = forward, -1 = back
}

const DirectionContext = createContext<DirectionContextValue>({ direction: 1 });

export function useTabDirection() {
  return useContext(DirectionContext);
}

/* ══════════════════════════════════════════════════════════════════
   TAB ORDER MAPS — Used to detect forward/back direction
   ══════════════════════════════════════════════════════════════════ */

const customerTabOrder = ['home', 'explore', 'reels', 'cart', 'offers', 'orders', 'profile'];
const riderTabOrder = ['rider-dashboard', 'rider-deliveries', 'rider-earnings', 'rider-profile'];
const vendorTabOrder = ['vendor-dashboard', 'vendor-store', 'vendor-earnings', 'vendor-profile'];

export function getTabDirection(prevTab: string, nextTab: string): 1 | -1 {
  // Try each tab order map
  for (const order of [customerTabOrder, riderTabOrder, vendorTabOrder]) {
    const prevIdx = order.indexOf(prevTab);
    const nextIdx = order.indexOf(nextTab);
    if (prevIdx !== -1 && nextIdx !== -1) {
      return nextIdx > prevIdx ? 1 : -1;
    }
  }
  // Cross-role or unknown — default forward
  return 1;
}

/* ══════════════════════════════════════════════════════════════════
   DIRECTIONAL PAGE VARIANTS
   Forward: slide from right + scale up slightly (0.98 → 1.0)
   Back: slide from left + scale down slightly (1.02 → 1.0)
   ══════════════════════════════════════════════════════════════════ */

const SLIDE_DISTANCE = 60; // px
const PARALLAX_FACTOR = 0.4; // Background moves 40% slower

export function createDirectionalVariants(direction: 1 | -1): Variants {
  const slideIn = direction * SLIDE_DISTANCE;
  const slideOut = -direction * SLIDE_DISTANCE;

  return {
    initial: {
      opacity: 0,
      x: slideIn,
      scale: direction === 1 ? 0.98 : 1.02,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      x: slideOut,
      scale: direction === 1 ? 1.02 : 0.98,
    },
  };
}

/* ══════════════════════════════════════════════════════════════════
   PARALLAX BACKGROUND LAYER
   Moves slightly slower than the main content for depth
   ══════════════════════════════════════════════════════════════════ */

export function ParallaxBackground({ direction }: { direction: 1 | -1 }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ x: direction * SLIDE_DISTANCE * PARALLAX_FACTOR, opacity: 0.3 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -direction * SLIDE_DISTANCE * PARALLAX_FACTOR, opacity: 0.3 }}
      transition={springConfig}
      aria-hidden
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE TRANSITION COMPONENT
   Wraps tab content with directional spring transitions
   ══════════════════════════════════════════════════════════════════ */

interface PageTransitionProps {
  /** Unique key for AnimatePresence (usually the tab ID) */
  tabKey: string;
  /** Direction: 1 = forward, -1 = back */
  direction: 1 | -1;
  /** Whether to show parallax background layer */
  parallax?: boolean;
  /** Additional CSS classes */
  className?: string;
  children: ReactNode;
}

export default function PageTransition({
  tabKey,
  direction,
  parallax = false,
  className = '',
  children,
}: PageTransitionProps) {
  const variants = createDirectionalVariants(direction);

  return (
    <DirectionContext.Provider value={{ direction }}>
      <motion.div
        key={tabKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={springConfig}
        className={className}
        style={{ willChange: 'transform, opacity' }}
      >
        {parallax && <ParallaxBackground direction={direction} />}
        {children}
      </motion.div>
    </DirectionContext.Provider>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SPRING SCREEN TRANSITIONS
   For welcome, auth, onboarding — more dramatic but still springy
   ══════════════════════════════════════════════════════════════════ */

export const screenVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 1.01,
    filter: 'blur(2px)',
  },
};

export const screenTransition: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 1,
};

/* ══════════════════════════════════════════════════════════════════
   REDUCED MOTION SUPPORT
   ══════════════════════════════════════════════════════════════════ */

export const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const reducedMotionTransition: Transition = {
  duration: 0.15,
};

/* ══════════════════════════════════════════════════════════════════
   HOOK: useReducedMotion
   ══════════════════════════════════════════════════════════════════ */

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/* ══════════════════════════════════════════════════════════════════
   OVERLAY VARIANTS (for modals, search, etc.)
   ══════════════════════════════════════════════════════════════════ */

export const overlaySpringVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, filter: 'blur(3px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.97, filter: 'blur(2px)' },
};
