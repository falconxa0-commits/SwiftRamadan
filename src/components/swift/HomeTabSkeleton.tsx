'use client';

import {
  ShimmerBlock,
  ShimmerCircle,
  ShimmerText,
  ShimmerBanner,
  ShimmerCard,
  ShimmerPill,
  ShimmerSectionHeader,
} from './ShimmerSkeleton';

/* ─────────────────────────────────────────────────────
   HomeTabSkeleton — Matches the exact HomeTab layout
   Aurora Luxe shimmer: base var(--sr-surface-elevated) → highlight var(--sr-surface-elevated)
   ───────────────────────────────────────────────────── */

export function HomeTabSkeleton() {
  return (
    <div className="space-y-7 pb-32" aria-label="Loading home page" role="status">
      {/* ── Greeting + Beta Badge ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="shimmer-sweep"
            style={{ width: '36px', height: '36px', borderRadius: '10px' }}
          />
          <div className="flex items-center gap-1.5">
            <div
              className="shimmer-sweep"
              style={{ width: '110px', height: '18px', borderRadius: '6px' }}
            />
            <div
              className="shimmer-sweep"
              style={{ width: '36px', height: '16px', borderRadius: '8px' }}
            />
          </div>
        </div>
        <div className="space-y-1.5 text-right">
          <div
            className="shimmer-sweep ml-auto"
            style={{ width: '100px', height: '10px', borderRadius: '4px' }}
          />
          <div
            className="shimmer-sweep ml-auto"
            style={{ width: '140px', height: '14px', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* ── Search Bar + Visual Search Button ── */}
      <div className="px-5 flex items-center gap-2.5">
        <div
          className="shimmer-sweep flex-1"
          style={{ height: '48px', borderRadius: '16px' }}
        />
        <div
          className="shimmer-sweep shrink-0"
          style={{ width: '48px', height: '48px', borderRadius: '16px' }}
        />
      </div>

      {/* ── Smart Kitchen Hero Card ── */}
      <div className="px-5">
        <div className="bg-[var(--sr-surface-elevated)] border border-white/5 rounded-2xl overflow-hidden p-5 space-y-4">
          {/* Top row: icon + LIVE badge */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="shimmer-sweep"
                style={{ width: '48px', height: '48px', borderRadius: '12px' }}
              />
              <div className="flex items-center gap-1.5">
                <div
                  className="shimmer-sweep"
                  style={{ width: '14px', height: '14px', borderRadius: '50%' }}
                />
                <div
                  className="shimmer-sweep"
                  style={{ width: '10px', height: '10px', borderRadius: '50%' }}
                />
              </div>
            </div>
            <div
              className="shimmer-sweep"
              style={{ width: '52px', height: '22px', borderRadius: '11px' }}
            />
          </div>
          {/* Title */}
          <div className="space-y-2">
            <div
              className="shimmer-sweep"
              style={{ width: '55%', height: '26px', borderRadius: '8px' }}
            />
            <div
              className="shimmer-sweep"
              style={{ width: '40%', height: '14px', borderRadius: '6px' }}
            />
            <div
              className="shimmer-sweep"
              style={{ width: '80%', height: '14px', borderRadius: '6px' }}
            />
          </div>
          {/* CTA button */}
          <div
            className="shimmer-sweep"
            style={{ width: '100%', height: '48px', borderRadius: '16px' }}
          />
        </div>
      </div>

      {/* ── Countdown skeleton ── */}
      <div className="px-5">
        <div
          className="shimmer-sweep"
          style={{ width: '100%', height: '56px', borderRadius: '16px' }}
        />
      </div>

      {/* ── Quick Actions Row ── */}
      <div className="px-5">
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <ShimmerPill key={i} width={76} height={90} />
          ))}
        </div>
      </div>

      {/* ── SwiftReel link skeleton ── */}
      <div className="px-5">
        <div className="bg-[var(--sr-surface-elevated)] border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
          <div
            className="shimmer-sweep shrink-0"
            style={{ width: '56px', height: '56px', borderRadius: '16px' }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="shimmer-sweep"
              style={{ width: '60%', height: '16px', borderRadius: '6px' }}
            />
            <div
              className="shimmer-sweep"
              style={{ width: '80%', height: '12px', borderRadius: '6px' }}
            />
          </div>
          <div
            className="shimmer-sweep shrink-0"
            style={{ width: '64px', height: '36px', borderRadius: '18px' }}
          />
        </div>
      </div>

      {/* ── Hero Carousel ── */}
      <div className="px-5">
        <ShimmerBanner height={180} />
        {/* Slide indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="shimmer-sweep"
              style={{
                width: i === 0 ? '24px' : '6px',
                height: '6px',
                borderRadius: '3px',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Category Circles ── */}
      <div className="px-5">
        <div className="flex gap-5 overflow-hidden pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerPill key={i} width={70} height={86} />
          ))}
        </div>
      </div>

      {/* ── Featured Ramadan Box ── */}
      <div className="px-5">
        <div className="bg-[var(--sr-surface-elevated)] border border-white/5 rounded-2xl overflow-hidden p-5 space-y-4">
          {/* Top section */}
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div
                className="shimmer-sweep"
                style={{ width: '80px', height: '22px', borderRadius: '11px' }}
              />
              <div
                className="shimmer-sweep"
                style={{ width: '140px', height: '28px', borderRadius: '8px' }}
              />
            </div>
            <div className="space-y-1.5 text-right">
              <div
                className="shimmer-sweep ml-auto"
                style={{ width: '60px', height: '10px', borderRadius: '4px' }}
              />
              <div
                className="shimmer-sweep ml-auto"
                style={{ width: '80px', height: '24px', borderRadius: '6px' }}
              />
            </div>
          </div>
          {/* 2x2 Image grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shimmer-sweep aspect-square"
                style={{ borderRadius: '16px' }}
              />
            ))}
          </div>
          {/* Badge */}
          <div
            className="shimmer-sweep"
            style={{ width: '70%', height: '36px', borderRadius: '12px' }}
          />
          {/* Buttons row */}
          <div className="flex gap-3">
            <div
              className="shimmer-sweep flex-1"
              style={{ height: '48px', borderRadius: '16px' }}
            />
            <div
              className="shimmer-sweep flex-1"
              style={{ height: '48px', borderRadius: '16px' }}
            />
          </div>
        </div>
      </div>

      {/* ── Flash Sales ── */}
      <div className="px-5">
        <ShimmerSectionHeader width={120} />
        <div className="flex gap-3 overflow-hidden pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[var(--sr-surface-elevated)] border border-white/5 min-w-[200px] rounded-2xl overflow-hidden shrink-0">
              <div
                className="shimmer-sweep aspect-[4/3]"
                style={{ borderRadius: 0 }}
              />
              <div className="p-3 space-y-2">
                <div
                  className="shimmer-sweep"
                  style={{ width: '70%', height: '14px', borderRadius: '6px' }}
                />
                <div className="flex items-center gap-2">
                  <div
                    className="shimmer-sweep"
                    style={{ width: '40%', height: '14px', borderRadius: '6px' }}
                  />
                  <div
                    className="shimmer-sweep"
                    style={{ width: '25%', height: '10px', borderRadius: '4px' }}
                  />
                </div>
                <div
                  className="shimmer-sweep"
                  style={{ width: '100%', height: '6px', borderRadius: '3px' }}
                />
                <div
                  className="shimmer-sweep"
                  style={{ width: '100%', height: '28px', borderRadius: '8px' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trending Iftar Meals ── */}
      <div className="px-5">
        <ShimmerSectionHeader width={130} />
        <div className="space-y-3 max-h-96 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--sr-surface-elevated)] border border-white/5 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4">
              <div
                className="shimmer-sweep shrink-0"
                style={{ width: '80px', height: '80px', borderRadius: '12px' }}
              />
              <div className="flex-1 space-y-2.5 py-0.5">
                <div className="flex justify-between">
                  <div
                    className="shimmer-sweep"
                    style={{ width: '55%', height: '16px', borderRadius: '6px' }}
                  />
                  <div
                    className="shimmer-sweep"
                    style={{ width: '25%', height: '16px', borderRadius: '6px' }}
                  />
                </div>
                <div
                  className="shimmer-sweep"
                  style={{ width: '90%', height: '10px', borderRadius: '4px' }}
                />
                <div className="flex items-center gap-2">
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
      </div>

      {/* ── Community CTA ── */}
      <div className="px-5">
        <div className="bg-[var(--sr-surface-elevated)] border border-white/5 rounded-3xl p-5 flex items-center gap-3 sm:gap-4">
          <div
            className="shimmer-sweep shrink-0"
            style={{ width: '56px', height: '56px', borderRadius: '14px' }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="shimmer-sweep"
              style={{ width: '60%', height: '18px', borderRadius: '6px' }}
            />
            <div
              className="shimmer-sweep"
              style={{ width: '85%', height: '12px', borderRadius: '4px' }}
            />
          </div>
          <div
            className="shimmer-sweep shrink-0"
            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
          />
        </div>
      </div>
    </div>
  );
}
