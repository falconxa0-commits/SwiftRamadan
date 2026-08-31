'use client';
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface RoyalChartProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  /**
   * When `true` (default) renders the royal purple `kv-accent-line`
   * under the title block. Set to `false` to suppress the accent for
   * inline / dense layouts.
   */
  accent?: boolean;
  /**
   * Optional content rendered in the top-right of the header (e.g.
   * a legend toggle or timeframe selector).
   */
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * RoyalChart — premium Kingdom V2 chart container.
 *
 * A `kv-card` shell with an optional title + subtitle header, a royal
 * `kv-accent-line` divider, an optional right-aligned action slot, and
 * a flexible body that hosts any chart (recharts, custom SVG, etc.).
 * Forwards the ref to the outer `kv-card` div so consumers can measure
 * the chart container (e.g. for responsive width via ResizeObserver).
 */
export const RoyalChart = forwardRef<HTMLDivElement, RoyalChartProps>(
  (
    {
      title,
      subtitle,
      accent = true,
      action,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`kv-card p-5 sm:p-6 ${className}`}
        {...rest}
      >
        {(title || subtitle || action) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-[var(--kv-text-tertiary)] mt-1">
                  {subtitle}
                </p>
              )}
              {accent && <div className="kv-accent-line mt-3" />}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div className="w-full">{children}</div>
      </div>
    );
  },
);
RoyalChart.displayName = 'RoyalChart';
