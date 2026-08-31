'use client';

import { motion, type Transition } from 'framer-motion';
import { type ReactNode } from 'react';

/* ══════════════════════════════════════════════════════════════════
   SHARED ELEMENT TRANSITION WRAPPER
   
   Uses Framer Motion layoutId for shared-element transitions.
   When a product card is tapped, it morphs smoothly into the detail view.
   
   Usage:
   // In the product grid card:
   <SharedElement layoutId={`product-image-${product.id}`}>
     <img src={product.image} />
   </SharedElement>
   
   // In the product detail modal:
   <SharedElement layoutId={`product-image-${product.id}`}>
     <img src={product.image} />
   </SharedElement>
   ══════════════════════════════════════════════════════════════════ */

/** Shared spring config for smooth layout animations */
const sharedSpringConfig: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
  mass: 0.8,
};

/** Faster spring for image-only shared elements (less jank) */
const imageSpringConfig: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.6,
};

interface SharedElementProps {
  /** Unique layout ID — must match between source and destination */
  layoutId: string;
  /** Whether this is an image element (uses faster spring) */
  isImage?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom transition config (overrides default) */
  transition?: Transition;
  /** Whether to disable the transition (e.g., reduced motion) */
  disabled?: boolean;
  children: ReactNode;
}

export default function SharedElement({
  layoutId,
  isImage = false,
  className = '',
  transition,
  disabled = false,
  children,
}: SharedElementProps) {
  // If disabled (e.g., reduced motion), render without layout animation
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const springTransition = transition || (isImage ? imageSpringConfig : sharedSpringConfig);

  return (
    <motion.div
      layoutId={layoutId}
      transition={springTransition}
      className={`${className} sm:transform-gpu`}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SHARED ELEMENT IMAGE — Optimized for image morphing
   ══════════════════════════════════════════════════════════════════ */

interface SharedElementImageProps {
  layoutId: string;
  src: string;
  alt: string;
  className?: string;
  disabled?: boolean;
}

export function SharedElementImage({
  layoutId,
  src,
  alt,
  className = '',
  disabled = false,
}: SharedElementImageProps) {
  if (disabled) {
    return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />;
  }

  return (
    <motion.img
      layoutId={layoutId}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      transition={imageSpringConfig}
      style={{ willChange: 'transform' }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   SHARED ELEMENT TEXT — For morphing text elements (e.g., price, name)
   ══════════════════════════════════════════════════════════════════ */

interface SharedElementTextProps {
  layoutId: string;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}

export function SharedElementText({
  layoutId,
  className = '',
  disabled = false,
  children,
}: SharedElementTextProps) {
  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      layoutId={layoutId}
      transition={sharedSpringConfig}
      className={className}
      style={{ willChange: 'transform, opacity', display: 'inline-block' }}
    >
      {children}
    </motion.span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SHARED ELEMENT CONTAINER — Groups multiple shared elements
   with a layout animation for the container itself
   ══════════════════════════════════════════════════════════════════ */

interface SharedElementContainerProps {
  layoutId?: string;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}

export function SharedElementContainer({
  layoutId,
  className = '',
  disabled = false,
  children,
}: SharedElementContainerProps) {
  if (disabled || !layoutId) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={layoutId}
      transition={sharedSpringConfig}
      className={className}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT ID GENERATOR — Helper to create consistent layout IDs
   ══════════════════════════════════════════════════════════════════ */

export const LayoutIds = {
  productImage: (id: number) => `product-img-${id}`,
  productName: (id: number) => `product-name-${id}`,
  productPrice: (id: number) => `product-price-${id}`,
  productCard: (id: number) => `product-card-${id}`,
  vendorLogo: (id: number) => `vendor-logo-${id}`,
  categoryIcon: (id: string) => `category-icon-${id}`,
} as const;
