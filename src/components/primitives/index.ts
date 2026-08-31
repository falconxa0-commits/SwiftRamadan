/**
 * Component Primitives — barrel export
 *
 * Reusable role-aware UI primitives extracted from the 122 Swift
 * components. These are ADDITIVE only — existing components remain
 * untouched; consumers opt in by importing from this barrel.
 *
 * Design tokens (color/role/glass) come from `@/lib/design-tokens.ts`
 * so the primitives stay in sync with the brand system.
 *
 * Auren Kingdom primitives (Phase 17-B) consume `var(--auren-*)`
 * custom properties from `globals.css` so the premium royal/gold
 * accent treatments stay in sync with the Auren design system.
 */

export { RoleButton } from './RoleButton';
export { GlassCard } from './GlassCard';
export { RoleBadge } from './RoleBadge';
export { RoleInput } from './RoleInput';
export { Skeleton } from './Skeleton';
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';
export { PageLoader } from './PageLoader';

// Auren Kingdom primitives (Phase 17-B) — premium dashboard surfaces
// wired to the `var(--auren-*)` design tokens.
export { MetricCard } from './MetricCard';
export { AIOrb } from './AIOrb';
export { LuxuryHeader } from './LuxuryHeader';
export { Timeline } from './Timeline';
export { DataCard } from './DataCard';
