/**
 * Component Primitives — barrel export
 *
 * Reusable role-aware UI primitives extracted from the 122 Swift
 * components. These are ADDITIVE only — existing components remain
 * untouched; consumers opt in by importing from this barrel.
 *
 * Design tokens (color/role/glass) come from `@/lib/design-tokens.ts`
 * so the primitives stay in sync with the brand system.
 */

export { RoleButton } from './RoleButton';
export { GlassCard } from './GlassCard';
export { RoleBadge } from './RoleBadge';
export { RoleInput } from './RoleInput';
export { Skeleton } from './Skeleton';
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';
export { PageLoader } from './PageLoader';
