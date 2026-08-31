'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  /** Stable key for the React list. */
  id: string;
  /** Short headline (e.g. "Order #1234 placed"). */
  title: string;
  /** Human-readable timestamp (e.g. "2 min ago", "Today 14:32"). */
  timestamp: string;
  /** Optional supporting description rendered below the title. */
  description?: string;
  /** Optional lucide-react icon rendered in the timeline node tile. */
  icon?: React.ComponentType<{ className?: string }>;
}

interface TimelineProps extends HTMLAttributes<HTMLDivElement> {
  /** Ordered activity entries. Rendered top → bottom. */
  items: TimelineItem[];
}

/**
 * Timeline — vertical activity feed used in dashboards and order
 * history surfaces.
 *
 * Layout (per item):
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  ●────  Title  · 2 min ago                              │
 *   │  │     optional description line                        │
 *   │  ●────  next item...                                    │
 *   └────────────────────────────────────────────────────────┘
 *
 * The vertical connector line is a 2px royal-purple bar sourced
 * from `var(--auren-royal)` (the Auren Kingdom signature color),
 * so the timeline reads as part of the Auren design system without
 * a custom hex value living in the component.
 *
 * Each item's node is a 32px circular tile; if an `icon` is
 * provided it's rendered inside the tile with `text-white`,
 * otherwise the tile shows a small 6px royal dot.
 *
 * Items are rendered inside an `<ol>` so screen readers announce
 * the list semantics; each row is a `<li>` with the tile and the
 * text block laid out as a 2-column grid (tile | text).
 */
export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ items, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        <ol className="relative flex flex-col gap-0">
          {/* Royal purple vertical connector line — sits behind the
              nodes, between the left column (icon tile) and the right
              column (text block). It is anchored to the icon column
              center (16px from the left edge). */}
          <div
            aria-hidden="true"
            className="absolute top-4 bottom-4 w-px"
            style={{
              left: '15px',
              background: 'var(--auren-royal)',
              opacity: 0.5,
            }}
          />

          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className="relative flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative z-10 flex items-center justify-center shrink-0',
                    'w-8 h-8 rounded-full',
                    'bg-[var(--auren-royal-light)]',
                    'border border-[var(--auren-royal-border)]',
                    'text-[var(--auren-mystic)]',
                  )}
                >
                  {Icon ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--auren-royal)' }}
                    />
                  )}
                </span>

                <div className="flex flex-col gap-0.5 min-w-0 pt-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                    <span className="text-sm font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="text-xs text-white/50 tabular-nums">
                      {item.timestamp}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="text-xs text-white/60 leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  },
);

Timeline.displayName = 'Timeline';

export type { TimelineItem, TimelineProps };
