'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'customer'
  | 'vendor'
  | 'rider'
  | 'ai'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

type BadgeSize = 'sm' | 'md';

interface RoleBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Disables the uppercase + letter-spacing treatment (e.g. for numbers) */
  plain?: boolean;
}

/**
 * Variant → Tailwind classes, sourced from design-tokens.ts color system.
 *  - customer: emerald (#10E07A)
 *  - vendor:   gold     (#F5C451)
 *  - rider:    sky      (#38BDF8)
 *  - ai:       purple   (#8B5CF6)
 *  - success:  emerald  (#10B981)
 *  - warning:  amber    (#F59E0B)
 *  - error:    red      (#EF4444)
 *  - neutral:  white/10 (subtle)
 *
 * Each badge is rendered as a "pill" (rounded-full) with a tinted
 * background and matching text/border. The default text treatment
 * is uppercase + tracking-wide per the brand spec; pass `plain` to
 * keep the original casing (useful for numeric values like order IDs).
 */
const variantStyles: Record<BadgeVariant, string> = {
  customer:
    'bg-[#10E07A]/15 text-[#10E07A] border border-[#10E07A]/30',
  vendor:
    'bg-[#F5C451]/15 text-[#F5C451] border border-[#F5C451]/30',
  rider:
    'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30',
  ai: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30',
  success:
    'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30',
  warning:
    'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
  error:
    'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
  neutral:
    'bg-white/5 text-white/70 border border-white/10',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const RoleBadge = forwardRef<HTMLSpanElement, RoleBadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      plain = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1 rounded-full font-semibold whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          !plain && 'uppercase tracking-wider',
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

RoleBadge.displayName = 'RoleBadge';
