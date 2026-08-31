'use client';
import { forwardRef, type CSSProperties } from 'react';

export interface RoyalSkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: number | string;
  height?: number | string;
  count?: number;
  className?: string;
  style?: CSSProperties;
}

export const RoyalSkeleton = forwardRef<HTMLDivElement, RoyalSkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      count = 1,
      className = '',
      style,
    },
    ref,
  ) => {
    const variantClass =
      variant === 'circle'
        ? 'kv-skeleton-circle'
        : variant === 'rect'
          ? 'kv-skeleton-rect'
          : 'kv-skeleton-text';

    const resolvedStyle: CSSProperties = {
      width: width ?? (variant === 'circle' ? 40 : '100%'),
      height: height ?? (variant === 'text' ? 12 : variant === 'circle' ? 40 : 80),
      ...style,
    };

    if (count <= 1) {
      return (
        <div
          ref={ref}
          className={`kv-skeleton ${variantClass} ${className}`}
          style={resolvedStyle}
          aria-busy="true"
          aria-live="polite"
        />
      );
    }

    return (
      <div ref={ref} className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`kv-skeleton ${variantClass} ${className}`}
            style={i === count - 1 && variant === 'text' ? { ...resolvedStyle, width: '80%' } : resolvedStyle}
          />
        ))}
      </div>
    );
  },
);
RoyalSkeleton.displayName = 'RoyalSkeleton';
