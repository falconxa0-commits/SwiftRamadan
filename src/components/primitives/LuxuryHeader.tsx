'use client';

import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LuxuryHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Large title rendered as h2 (text-2xl font-bold). */
  title: string;
  /** Optional subtitle / supporting line under the title. */
  subtitle?: string;
  /** Optional lucide-react icon rendered in a tinted tile on the left. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional action slot rendered on the right (button/link/etc). */
  action?: ReactNode;
}

/**
 * LuxuryHeader — premium section header used at the top of dashboards,
 * detail pages and Auren Kingdom marketing surfaces.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │ [icon]  TITLE ................................. [action] │
 *   │        subtitle line                                    │
 *   │        ──── royal purple accent line ────               │
 *   └──────────────────────────────────────────────────────┘
 *
 * The accent line under the title is a 2px bar sourced from
 * `var(--auren-royal)` (the kingdom's signature purple) so every
 * header in the app shares the same purple underline — a small but
 * very strong brand signal.
 *
 * The optional `icon` (a lucide-react component) renders inside a
 * 40px rounded-2xl tinted tile using
 * `var(--auren-royal-light)` background and `var(--auren-royal)`
 * border tokens, so it reads as a hero mark.
 *
 * The optional `action` slot is rendered on the right side of the
 * header row (e.g. a "View all" link or a primary button).
 */
export const LuxuryHeader = forwardRef<HTMLDivElement, LuxuryHeaderProps>(
  (
    { title, subtitle, icon: Icon, action, className, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-3 w-full',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {Icon ? (
              <span
                aria-hidden="true"
                className={cn(
                  'flex items-center justify-center shrink-0',
                  'w-10 h-10 rounded-2xl',
                  'bg-[var(--auren-royal-light)]',
                  'border border-[var(--auren-royal-border)]',
                  'text-[var(--auren-mystic)]',
                )}
              >
                <Icon className="w-5 h-5" />
              </span>
            ) : null}
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-sm text-white/60 leading-relaxed">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          {action ? (
            <div className="shrink-0 self-center">{action}</div>
          ) : null}
        </div>

        {/* Royal purple accent line */}
        <div
          aria-hidden="true"
          className="h-0.5 w-16 rounded-full"
          style={{ background: 'var(--auren-royal)' }}
        />
      </div>
    );
  },
);

LuxuryHeader.displayName = 'LuxuryHeader';
