'use client';

import { ReactNode } from 'react';

/* ─────────────────────────────────────────────────────
   Premium Shimmer Skeleton Components
   Aurora Luxe palette: base #1A1D26 → highlight #252833 → base #1A1D26
   Animation: translateX(-100% to 100%) over 1.5s, infinite, ease-in-out
   ───────────────────────────────────────────────────── */

// The shimmer CSS is injected via globals.css (.shimmer-sweep class)

interface ShimmerBaseProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  ariaLabel?: string;
}

/* ─── ShimmerBlock — A single shimmer block ─── */
export function ShimmerBlock({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
  ariaLabel = 'Loading',
}: ShimmerBaseProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`shimmer-sweep ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
    />
  );
}

/* ─── ShimmerCircle — Circular shimmer for avatars/icons ─── */
export function ShimmerCircle({
  size = 40,
  className = '',
  ariaLabel = 'Loading',
}: { size?: number; className?: string; ariaLabel?: string }) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`shimmer-sweep ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
      }}
    />
  );
}

/* ─── ShimmerText — Simulates text lines ─── */
export function ShimmerText({
  lines = 2,
  lineHeight = 14,
  gap = 8,
  widths,
  borderRadius = 6,
  className = '',
  ariaLabel = 'Loading text',
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  widths?: number[]; // percentage widths for each line, e.g. [100, 75, 50]
  borderRadius?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const defaultWidths = [100, 80, 65, 50, 40];
  return (
    <div role="status" aria-label={ariaLabel} className={className} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer-sweep"
          style={{
            width: `${widths?.[i] ?? defaultWidths[i] ?? 45}%`,
            height: `${lineHeight}px`,
            borderRadius: `${borderRadius}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── ShimmerCard — Simulates a product card ─── */
export function ShimmerCard({
  imageHeight = 130,
  className = '',
  ariaLabel = 'Loading card',
}: {
  imageHeight?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`bg-[#1A1D26] border border-white/5 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Image block */}
      <div
        className="shimmer-sweep"
        style={{
          width: '100%',
          height: `${imageHeight}px`,
          borderRadius: 0,
        }}
      />
      {/* Content */}
      <div className="p-3 space-y-2.5">
        {/* Title */}
        <div
          className="shimmer-sweep"
          style={{ width: '75%', height: '14px', borderRadius: '6px' }}
        />
        {/* Subtitle */}
        <div
          className="shimmer-sweep"
          style={{ width: '50%', height: '10px', borderRadius: '6px' }}
        />
        {/* Price + Button row */}
        <div className="flex justify-between items-center pt-1">
          <div
            className="shimmer-sweep"
            style={{ width: '30%', height: '18px', borderRadius: '6px' }}
          />
          <div
            className="shimmer-sweep"
            style={{ width: '28%', height: '28px', borderRadius: '8px' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── ShimmerList — Simulates a list of items ─── */
export function ShimmerList({
  count = 4,
  stagger = 0.08,
  className = '',
  ariaLabel = 'Loading list',
}: {
  count?: number;
  stagger?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="status" aria-label={ariaLabel} className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#1A1D26] border border-white/5 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4"
          style={{ animationDelay: `${i * stagger}s` }}
        >
          {/* Thumbnail */}
          <div
            className="shimmer-sweep shrink-0"
            style={{ width: '72px', height: '72px', borderRadius: '12px' }}
          />
          {/* Content */}
          <div className="flex-1 space-y-2.5 py-0.5">
            <div
              className="shimmer-sweep"
              style={{ width: '70%', height: '14px', borderRadius: '6px' }}
            />
            <div
              className="shimmer-sweep"
              style={{ width: '45%', height: '10px', borderRadius: '6px' }}
            />
            <div className="flex items-center gap-2 pt-1">
              <div
                className="shimmer-sweep"
                style={{ width: '50px', height: '20px', borderRadius: '10px' }}
              />
              <div
                className="shimmer-sweep"
                style={{ width: '40px', height: '20px', borderRadius: '10px' }}
              />
              <div
                className="shimmer-sweep ml-auto"
                style={{ width: '52px', height: '24px', borderRadius: '12px' }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── ShimmerGrid — Simulates a product grid ─── */
export function ShimmerGrid({
  columns = 2,
  rows = 2,
  className = '',
  ariaLabel = 'Loading grid',
}: {
  columns?: number;
  rows?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`grid grid-cols-${columns} gap-3 ${className}`}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}

/* ─── ShimmerBanner — Simulates a hero banner/slide ─── */
export function ShimmerBanner({
  height = 192,
  className = '',
  ariaLabel = 'Loading banner',
}: {
  height?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`shimmer-sweep ${className}`}
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '16px',
      }}
    />
  );
}

/* ─── ShimmerPill — Simulates a category pill/circle ─── */
export function ShimmerPill({
  width = 76,
  height = 90,
  className = '',
  ariaLabel = 'Loading',
}: {
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`flex flex-col items-center gap-2 shrink-0 ${className}`}
      style={{ minWidth: `${width}px` }}
    >
      <div
        className="shimmer-sweep"
        style={{
          width: `${Math.min(width, 64)}px`,
          height: `${Math.min(width, 64)}px`,
          borderRadius: '50%',
        }}
      />
      <div
        className="shimmer-sweep"
        style={{ width: '40px', height: '10px', borderRadius: '6px' }}
      />
    </div>
  );
}

/* ─── ShimmerSectionHeader — Simulates a section heading ─── */
export function ShimmerSectionHeader({
  width = 160,
  className = '',
  ariaLabel = 'Loading section',
}: {
  width?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="status" aria-label={ariaLabel} className={`flex justify-between items-end mb-3 px-1 ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className="shimmer-sweep"
          style={{ width: '28px', height: '28px', borderRadius: '8px' }}
        />
        <div
          className="shimmer-sweep"
          style={{ width: `${width}px`, height: '20px', borderRadius: '8px' }}
        />
      </div>
      <div
        className="shimmer-sweep"
        style={{ width: '52px', height: '12px', borderRadius: '6px' }}
      />
    </div>
  );
}
