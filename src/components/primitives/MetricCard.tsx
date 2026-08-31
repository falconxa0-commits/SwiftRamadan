'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type MetricVariant = 'default' | 'royal' | 'gold';

interface Trend {
  direction: 'up' | 'down';
  value: string;
}

interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Short uppercase label rendered above the value. */
  label: string;
  /** The headline metric — large text value (number or pre-formatted string). */
  value: string | number;
  /** Optional trend indicator (up/down arrow + percentage string). */
  trend?: Trend;
  /** Optional lucide-react icon rendered in a tinted tile on the right. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Visual variant — default neutral glass, royal purple border, or gold border. */
  variant?: MetricVariant;
}

/**
 * Variant → surface tokens.
 *
 * Each variant builds on the Auren glass base
 * (bg-white/[0.03] + backdrop-blur + border-white/[0.08]) and layers a
 * premium edge treatment sourced from `--auren-*` custom properties:
 *
 *   - default: plain glass card, no accent border / no glow
 *   - royal:   royal purple border + subtle royal glow shadow
 *   - gold:    gold border + subtle gold glow shadow
 *
 * The `var(--auren-*)` references resolve at runtime against the
 * `:root` custom properties declared in `globals.css`, so the
 * MetricCard stays in sync with the Auren Kingdom design system
 * without duplicating hex values.
 */
const variantStyles: Record<MetricVariant, string> = {
  default: '',
  royal: 'border-[var(--auren-royal-border)] shadow-[var(--auren-shadow-royal)]',
  gold: 'border-[var(--auren-gold-border)] shadow-[var(--auren-shadow-gold)]',
};

const variantIconTile: Record<MetricVariant, string> = {
  default:
    'bg-white/5 text-white/70 border border-white/10',
  royal:
    'bg-[var(--auren-royal-light)] text-[var(--auren-mystic)] border border-[var(--auren-royal-border)]',
  gold:
    'bg-[var(--auren-gold-light)] text-[var(--auren-gold)] border border-[var(--auren-gold-border)]',
};

/**
 * MetricCard — premium dashboard metric tile.
 *
 * Layout (top → bottom):
 *   1. Row: label (left) + icon tile (right, optional)
 *   2. Large value (text-3xl font-bold)
 *   3. Trend chip (optional) — emerald for up, red for down
 *
 * The card uses the Auren glass surface (backdrop-blur + translucent
 * white tint) and accepts a `variant` that switches the border /
 * shadow between default, royal (purple) and gold accent treatments
 * via `var(--auren-*)` design tokens.
 */
export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      label,
      value,
      trend,
      icon: Icon,
      variant = 'default',
      className,
      ...props
    },
    ref,
  ) => {
    const isUp = trend?.direction === 'up';

    return (
      <div
        ref={ref}
        className={cn(
          'auren-card-hover',
          'flex flex-col gap-2 p-5 rounded-2xl',
          'bg-white/[0.03] backdrop-blur-[12px]',
          'border border-white/[0.08]',
          'transition-all duration-200',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs uppercase tracking-wider text-white/60 font-semibold">
            {label}
          </span>
          {Icon ? (
            <span
              aria-hidden="true"
              className={cn(
                'flex items-center justify-center',
                'w-9 h-9 rounded-lg',
                variantIconTile[variant],
              )}
            >
              <Icon className="w-4 h-4" />
            </span>
          ) : null}
        </div>

        <div className="text-3xl font-bold text-white tracking-tight tabular-nums">
          {value}
        </div>

        {trend ? (
          <div
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold',
              isUp
                ? 'text-[var(--auren-emerald)]'
                : 'text-[var(--auren-danger)]',
            )}
          >
            {isUp ? (
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {isUp ? '+' : '−'}
              {trend.value}
            </span>
          </div>
        ) : null}
      </div>
    );
  },
);

MetricCard.displayName = 'MetricCard';
