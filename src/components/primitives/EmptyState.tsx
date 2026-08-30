'use client';

import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateVariant = 'default' | 'compact' | 'large';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: EmptyStateVariant;
  /** Optional icon node. Wrap any lucide-react icon (e.g. <Inbox />). */
  icon?: ReactNode;
  /** Required title — short headline (e.g. "No orders yet"). */
  title: string;
  /** Optional supporting description. */
  description?: string;
  /** Optional call-to-action slot (button/link). */
  action?: ReactNode;
}

/**
 * EmptyState — friendly placeholder for empty lists / dashboards.
 *
 * Variants:
 *   - default: medium padding, 64px icon tile, balanced for typical use
 *   - compact: tight padding, 40px icon, used in narrow panels / sidebars
 *   - large:   generous padding, 96px icon, used in main content areas
 *
 * Layout is always centered with the premium glass background
 * (bg-white/[0.03] + backdrop-blur-[12px] + border-white/[0.08]).
 *
 * The icon, when provided, sits inside a circular tinted container
 * so it reads as a hero mark; `title` is rendered semibold white,
 * `description` is rendered as secondary text, and the optional
 * `action` slot sits below.
 */
const variantContainer: Record<EmptyStateVariant, string> = {
  default: 'p-8 gap-4',
  compact: 'p-5 gap-2.5',
  large: 'p-12 gap-6',
};

const variantIcon: Record<EmptyStateVariant, string> = {
  default: 'w-16 h-16',
  compact: 'w-10 h-10',
  large: 'w-24 h-24',
};

const variantTitle: Record<EmptyStateVariant, string> = {
  default: 'text-lg',
  compact: 'text-sm',
  large: 'text-2xl',
};

const variantDesc: Record<EmptyStateVariant, string> = {
  default: 'text-sm',
  compact: 'text-xs',
  large: 'text-base',
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      variant = 'default',
      icon,
      title,
      description,
      action,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          'flex flex-col items-center justify-center text-center',
          'rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-[12px]',
          variantContainer[variant],
          className,
        )}
        {...props}
      >
        {icon ? (
          <div
            className={cn(
              'flex items-center justify-center rounded-full',
              'bg-white/5 border border-white/10 text-white/70',
              variantIcon[variant],
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
        <h3
          className={cn(
            'font-semibold text-white tracking-tight',
            variantTitle[variant],
          )}
        >
          {title}
        </h3>
        {description ? (
          <p
            className={cn(
              'text-white/60 max-w-md leading-relaxed',
              variantDesc[variant],
            )}
          >
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';
