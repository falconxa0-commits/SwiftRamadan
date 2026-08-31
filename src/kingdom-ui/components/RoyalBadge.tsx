'use client';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface RoyalBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'royal' | 'gold' | 'neutral';
  children: ReactNode;
  icon?: ReactNode;
}

export const RoyalBadge = forwardRef<HTMLSpanElement, RoyalBadgeProps>(
  ({ variant = 'royal', icon, children, className = '', ...rest }, ref) => {
    const variantClass =
      variant === 'royal'
        ? 'kv-badge-royal'
        : variant === 'gold'
          ? 'kv-badge-gold'
          : 'kv-badge-neutral';

    return (
      <span
        ref={ref}
        className={`${variantClass} ${className}`}
        {...rest}
      >
        {icon && <span className="inline-flex">{icon}</span>}
        {children}
      </span>
    );
  },
);
RoyalBadge.displayName = 'RoyalBadge';
