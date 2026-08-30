'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'text' | 'circle' | 'rect';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Pixel width (number) or any CSS width string. Defaults to 100%. */
  width?: number | string;
  /** Pixel height (number) or any CSS height string. Defaults to 1em for text, 48 for circle, 24 for rect. */
  height?: number | string;
  /** Render N repeated skeletons (rows) stacked vertically. */
  count?: number;
  /** Gap (px) between repeated skeletons. */
  gap?: number;
}

/**
 * Skeleton — reusable shimmer placeholder.
 *
 * Variants:
 *   - text:   flat bar (default 1em tall, full width) for paragraph lines
 *   - circle: perfect square with rounded-full (avatar placeholder)
 *   - rect:   generic block (default 24px tall, full width) for cards/blocks
 *
 * Uses the `.skeleton-shimmer` class defined in globals.css, which
 * animates a soft white gradient across the surface (2s loop).
 *
 * Width/height accept either a number (px) or any CSS string
 * (e.g. '50%', '12rem'). The component composes Tailwind utilities
 * with inline style for explicit sizing so consumers can override
 * per-instance.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      count = 1,
      gap = 8,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const variantShape: Record<SkeletonVariant, string> = {
      text: 'rounded-md',
      circle: 'rounded-full aspect-square',
      rect: 'rounded-xl',
    };

    const defaultHeight: Record<SkeletonVariant, string | number> = {
      text: '1em',
      circle: 48,
      rect: 24,
    };

    const resolvedHeight = height ?? defaultHeight[variant];
    const resolvedWidth = width ?? (variant === 'circle' ? resolvedHeight : '100%');

    const toCssValue = (v: string | number) =>
      typeof v === 'number' ? `${v}px` : v;

    const node = (
      <div
        ref={ref}
        aria-busy="true"
        aria-live="polite"
        className={cn('skeleton-shimmer', variantShape[variant], className)}
        style={{
          width: toCssValue(resolvedWidth),
          height: toCssValue(resolvedHeight),
          ...style,
        }}
        {...props}
      />
    );

    if (count <= 1) return node;

    return (
      <div
        className="flex flex-col"
        style={{ gap: `${gap}px` }}
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn('skeleton-shimmer', variantShape[variant], className)}
            style={{
              width: toCssValue(resolvedWidth),
              height: toCssValue(resolvedHeight),
            }}
          />
        ))}
      </div>
    );
  },
);

Skeleton.displayName = 'Skeleton';
