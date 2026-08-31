'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface PageLoaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional message rendered below the spinner. */
  message?: string;
  /** Override the spinner size (default 48px). Accepts any CSS length. */
  spinnerSize?: number | string;
}

/**
 * PageLoader — full-screen loading state.
 *
 * Renders a fixed overlay that covers the viewport with the
 * premium glass background (bg-[#06070B]/80 + backdrop-blur-[24px])
 * and a pure-CSS animated spinner (Tailwind's `animate-spin` keyframes
 * are defined in Tailwind's base CSS — no JS animation driver).
 *
 * The spinner is a 48px (default) circular div with a 4px partially-
 * transparent border and a white accent border on the top edge so
 * it reads as a "ring" rotating around its center. ARIA live region
 * announces the loading state to assistive tech.
 *
 * Consumers can pass an optional `message` rendered below the
 * spinner (e.g. "Loading your orders…") and override the spinner
 * size via `spinnerSize` (any CSS length: 64, '4rem', '10vh', …).
 */
const toCssValue = (v: string | number) =>
  typeof v === 'number' ? `${v}px` : v;

export const PageLoader = forwardRef<HTMLDivElement, PageLoaderProps>(
  ({ message, spinnerSize = 48, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(
          'fixed inset-0 z-[60]',
          'flex flex-col items-center justify-center gap-4',
          'bg-[#06070B]/80 backdrop-blur-[24px]',
          className,
        )}
        style={style}
        {...props}
      >
        <div
          className="animate-spin rounded-full border-4 border-white/10 border-t-white"
          style={{
            width: toCssValue(spinnerSize),
            height: toCssValue(spinnerSize),
          }}
          aria-hidden="true"
        />
        {message ? (
          <p className="text-sm font-medium text-white/70">{message}</p>
        ) : null}
        <span className="sr-only">Loading</span>
      </div>
    );
  },
);

PageLoader.displayName = 'PageLoader';
