'use client';

import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type DataCardVariant = 'default' | 'royal' | 'gold';

interface DataCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Header title rendered in semibold white. */
  title: string;
  /** Optional small text rendered next to the title (e.g. item count). */
  subtitle?: string;
  /** Optional action rendered on the right of the header (button/link). */
  action?: ReactNode;
  /** Optional lucide-react icon rendered in a tinted tile left of the title. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Visual variant — default glass, royal purple border, or gold border. */
  variant?: DataCardVariant;
}

/**
 * Variant → surface tokens (built on top of the Auren glass base).
 *
 *   - default: plain glass card, neutral white border
 *   - royal:   royal purple border + subtle royal glow shadow
 *   - gold:    gold border + subtle gold glow shadow
 *
 * Both royal and gold are sourced from `var(--auren-*)` custom
 * properties so the DataCard stays in sync with the Auren Kingdom
 * design tokens without duplicating hex values.
 */
const variantStyles: Record<DataCardVariant, string> = {
  default: '',
  royal: 'border-[var(--auren-royal-border)] shadow-[var(--auren-shadow-royal)]',
  gold: 'border-[var(--auren-gold-border)] shadow-[var(--auren-shadow-gold)]',
};

const variantIconTile: Record<DataCardVariant, string> = {
  default:
    'bg-white/5 text-white/70 border border-white/10',
  royal:
    'bg-[var(--auren-royal-light)] text-[var(--auren-mystic)] border border-[var(--auren-royal-border)]',
  gold:
    'bg-[var(--auren-gold-light)] text-[var(--auren-gold)] border border-[var(--auren-gold-border)]',
};

/**
 * DataCard — generic content card with a header + body region.
 *
 * Layout:
 *
 *   ┌───────────────────────────────────────────────────┐
 *   │ [icon] Title  ·  subtitle  ............... [action] │
 *   ├───────────────────────────────────────────────────┤
 *   │ children (content area, padded)                    │
 *   └───────────────────────────────────────────────────┘
 *
 * The card uses the Auren glass surface (translucent white tint +
 * 12px backdrop blur) and accepts a `variant` that switches the
 * border + shadow between default, royal (purple) and gold accent
 * treatments via `var(--auren-*)` design tokens.
 *
 * The header row uses a 12px bottom border that divides header
 * from content; the divider color matches the card border so the
 * card reads as one cohesive surface.
 */
export const DataCard = forwardRef<HTMLDivElement, DataCardProps>(
  (
    {
      title,
      subtitle,
      action,
      icon: Icon,
      variant = 'default',
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
          'flex flex-col rounded-2xl overflow-hidden',
          'bg-white/[0.03] backdrop-blur-[12px]',
          'border border-white/[0.08]',
          'transition-all duration-200',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-3',
            'px-5 py-4',
            'border-b border-white/[0.08]',
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {Icon ? (
              <span
                aria-hidden="true"
                className={cn(
                  'flex items-center justify-center shrink-0',
                  'w-8 h-8 rounded-lg',
                  variantIconTile[variant],
                )}
              >
                <Icon className="w-4 h-4" />
              </span>
            ) : null}
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-semibold text-white tracking-tight truncate">
                {title}
              </h3>
              {subtitle ? (
                <span className="text-xs text-white/50 truncate">
                  {subtitle}
                </span>
              ) : null}
            </div>
          </div>
          {action ? (
            <div className="shrink-0">{action}</div>
          ) : null}
        </div>

        <div className="px-5 py-4">{children}</div>
      </div>
    );
  },
);

DataCard.displayName = 'DataCard';
