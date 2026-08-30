'use client';
import { Skeleton } from '@/components/ui/skeleton';

/* ─────────── Product Card Skeleton ─────────── */
export function ProductCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-3 sm:p-4 space-y-3">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/* ─────────── Home Tab Skeleton ─────────── */
export function HomeTabSkeleton() {
  return (
    <div className="space-y-6 p-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      {/* Search bar */}
      <Skeleton className="h-12 w-full rounded-2xl" />
      {/* Hero carousel */}
      <Skeleton className="h-48 w-full rounded-3xl" />
      {/* Categories row */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-20 rounded-2xl shrink-0" />
        ))}
      </div>
      {/* Section heading */}
      <Skeleton className="h-6 w-40 rounded-lg" />
      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ─────────── Orders Tab Skeleton ─────────── */
export function OrdersTabSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-9 w-48 rounded-full" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 sm:p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Cart Tab Skeleton (brief flash) ─────────── */
export function CartTabSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-8 w-24 rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-3 sm:p-4 flex gap-3">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Vendor Dashboard Skeleton ─────────── */
export function VendorDashboardSkeleton() {
  return (
    <div className="space-y-4 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 sm:p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      {/* Section title */}
      <Skeleton className="h-8 w-40 rounded-lg" />
      {/* Incoming order cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 sm:p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Rider Dashboard Skeleton ─────────── */
export function RiderDashboardSkeleton() {
  return (
    <div className="space-y-4 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-2 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      {/* Map / banner */}
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-8 w-40 rounded-lg" />
      {/* Delivery cards */}
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 sm:p-4 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Reels Tab Skeleton ─────────── */
export function ReelsTabSkeleton() {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <Skeleton className="h-[80vh] w-full max-w-md rounded-3xl" />
    </div>
  );
}
