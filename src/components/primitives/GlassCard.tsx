'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type GlassVariant = 'default' | 'raised' | 'elevated';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  hover?: boolean;
  /** Strong backdrop blur (24px) instead of default (12px) */
  strongBlur?: boolean;
}

/**
 * Variant → surface tokens (from design-tokens.ts).
 * - default:  transparent glass tint over the parent surface
 * - raised:   #0F1118 surface with a subtle border
 * - elevated: #161924 surface with a stronger shadow (used by modals/dialogs)
 */
const variantStyles: Record<GlassVariant, string> = {
  default:
    'bg-white/[0.03] border border-white/[0.08] backdrop-blur-[12px]',
  raised:
    'bg-[#0F1118]/80 border border-white/[0.08] backdrop-blur-[12px] shadow-md shadow-black/30',
  elevated:
    'bg-[#161924]/90 border border-white/[0.08] backdrop-blur-[16px] shadow-lg shadow-black/40',
};

/**
 * GlassCard — reusable frosted-glass surface used across the app.
 *
 * Variants:
 *   - default:  translucent tint (no surface color)
 *   - raised:   #0F1118 card surface, subtle shadow
 *   - elevated: #161924 modal/dialog surface, stronger shadow
 *
 * Options:
 *   - hover:        adds a hover tint + border lift
 *   - strongBlur:   swaps the 12px blur for 24px (modals over video)
 *
 * Always renders with rounded-2xl (28px) per design-tokens.ts.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      hover = false,
      strongBlur = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variantStyles[variant],
          // Override blur if strongBlur requested
          strongBlur && 'backdrop-blur-[24px]',
          // Hover lift
          hover &&
            'hover:bg-white/[0.06] hover:border-white/[0.12] cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = 'GlassCard';
