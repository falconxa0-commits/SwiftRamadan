'use client';

import { motion, type Variants, type Transition } from 'framer-motion';
import { type ReactNode } from 'react';

/* ══════════════════════════════════════════════════════════════════
   ANIMATION STYLES — Predefined child animation variants
   ══════════════════════════════════════════════════════════════════ */

export type AnimationStyle = 'fadeInUp' | 'slideInLeft' | 'scaleIn' | 'fadeIn' | 'slideInRight';

const childVariants: Record<AnimationStyle, Variants> = {
  fadeInUp: {
    hidden: {
      opacity: 0,
      y: 16,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  },
  slideInLeft: {
    hidden: {
      opacity: 0,
      x: -24,
    },
    visible: {
      opacity: 1,
      x: 0,
    },
  },
  slideInRight: {
    hidden: {
      opacity: 0,
      x: 24,
    },
    visible: {
      opacity: 1,
      x: 0,
    },
  },
  scaleIn: {
    hidden: {
      opacity: 0,
      scale: 0.88,
    },
    visible: {
      opacity: 1,
      scale: 1,
    },
  },
  fadeIn: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
    },
  },
};

/* ══════════════════════════════════════════════════════════════════
   SPRING TRANSITION for stagger children
   ══════════════════════════════════════════════════════════════════ */

const childTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
  mass: 0.8,
};

/* ══════════════════════════════════════════════════════════════════
   STAGGER CONTAINER
   Wraps children and staggers their entrance animation
   ══════════════════════════════════════════════════════════════════ */

interface StaggerContainerProps {
  /** Animation style for each child */
  animationStyle?: AnimationStyle;
  /** Delay between each child in ms (default: 50) */
  staggerDelay?: number;
  /** Initial delay before the first child animates in (ms) */
  initialDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate on hover (default: false) */
  animateOnHover?: boolean;
  children: ReactNode;
}

export default function StaggerContainer({
  animationStyle = 'fadeInUp',
  staggerDelay = 50,
  initialDelay = 0,
  className = '',
  children,
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay / 1000, // Convert ms to seconds
        delayChildren: initialDelay / 1000,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAGGER ITEM
   Wrap each child element with this for stagger effect
   ══════════════════════════════════════════════════════════════════ */

interface StaggerItemProps {
  /** Animation style (overrides container default) */
  animationStyle?: AnimationStyle;
  /** Additional CSS classes */
  className?: string;
  children: ReactNode;
}

export function StaggerItem({
  animationStyle = 'fadeInUp',
  className = '',
  children,
}: StaggerItemProps) {
  return (
    <motion.div
      variants={childVariants[animationStyle]}
      transition={childTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CONVENIENCE: Pre-configured stagger variants for external use
   ══════════════════════════════════════════════════════════════════ */

export function createStaggerVariants(
  staggerDelay: number = 0.05,
  initialDelay: number = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };
}

export { childVariants as staggerChildVariants, childTransition as staggerChildTransition };
