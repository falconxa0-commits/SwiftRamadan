'use client';

import { ButtonHTMLAttributes, HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ErrorStateVariant = 'inline' | 'full' | 'card';

interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ErrorStateVariant;
  /** Optional icon node; defaults to a small inline triangle glyph if omitted. */
  icon?: ReactNode;
  /** Short error headline. */
  title?: string;
  /** Detailed error message. */
  message: string;
  /** Retry handler. When provided, a Retry button is rendered. */
  onRetry?: () => void;
  /** Customize the retry button label (default "Retry"). */
  retryLabel?: string;
}

/**
 * ErrorState — failure placeholder used by lists / dashboards / pages.
 *
 * Variants:
 *   - inline: compact row, used inside cards/list items
 *   - full:   centered full-height block, used for full-page errors
 *   - card:   bordered glass card with extra padding, used in panels
 *
 * Layout is always centered. An inline SVG triangle is rendered when
 * no `icon` is supplied. If `onRetry` is provided, a retry button is
 * rendered with a focus-visible ring and active:scale-95 micro-
 * interaction; it stops propagation so callers can nest it inside
 * click-handling parents safely.
 */
const variantContainer: Record<ErrorStateVariant, string> = {
  inline: 'p-4 gap-2 text-left items-start',
  full: 'p-12 gap-4 items-center justify-center min-h-[60vh] w-full',
  card: 'p-8 gap-4 items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-[12px]',
};

const DefaultIcon = () => (
  <svg
    role="img"
    aria-label="error"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type RetryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const RetryButton = forwardRef<HTMLButtonElement, RetryButtonProps>(
  ({ className, children, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'min-h-[44px] touch-target',
          'px-4 py-2 text-sm font-semibold rounded-xl',
          'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
          'transition-all duration-200 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070B] focus-visible:ring-white/40',
          'disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
        {...props}
      >
        {children ?? 'Retry'}
      </button>
    );
  },
);
RetryButton.displayName = 'RetryButton';

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      variant = 'card',
      icon,
      title,
      message,
      onRetry,
      retryLabel = 'Retry',
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex flex-col text-center',
          variantContainer[variant],
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-full',
            'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]',
            'w-12 h-12',
          )}
        >
          {icon ?? <DefaultIcon />}
        </div>
        {title ? (
          <h3 className="text-base font-semibold text-white tracking-tight">
            {title}
          </h3>
        ) : null}
        <p className="text-sm text-white/60 leading-relaxed max-w-md">
          {message}
        </p>
        {onRetry ? (
          <RetryButton onClick={onRetry}>{retryLabel}</RetryButton>
        ) : null}
      </div>
    );
  },
);

ErrorState.displayName = 'ErrorState';
