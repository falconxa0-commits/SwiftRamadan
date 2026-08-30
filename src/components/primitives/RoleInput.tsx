'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

interface RoleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  size?: InputSize;
}

/**
 * Variant → Tailwind ring/border classes, sourced from design-tokens.ts.
 *  - default: subtle white/10 border + neutral focus ring
 *  - error:   red (#EF4444) ring/border for invalid states
 *  - success: emerald (#10B981) ring/border for valid states
 */
const variantStyles: Record<InputVariant, string> = {
  default:
    'border-white/10 bg-white/[0.03] focus-visible:border-white/20 focus-visible:ring-white/40',
  error:
    'border-[#EF4444]/50 bg-[#EF4444]/[0.04] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]/50',
  success:
    'border-[#10B981]/50 bg-[#10B981]/[0.04] focus-visible:border-[#10B981] focus-visible:ring-[#10B981]/50',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-xl',
};

/**
 * RoleInput — reusable text input with consistent styling.
 *
 * Variants:
 *   - default: neutral glass tint, white focus ring
 *   - error:   red border + ring for validation failures
 *   - success: emerald border + ring for validated fields
 *
 * Sizes:
 *   - sm: 32px tall  (still 44px touch target via min-h)
 *   - md: 40px tall
 *   - lg: 48px tall
 *
 * Always enforces a 44px minimum touch target (WCAG 2.5.5),
 * shows a focus-visible ring for keyboard users, supports
 * placeholders + disabled state, and forwards the ref to
 * the underlying <input>.
 */
export const RoleInput = forwardRef<HTMLInputElement, RoleInputProps>(
  ({ variant = 'default', size = 'md', className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'inline-flex w-full items-center font-medium text-white',
          'placeholder:text-white/40',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070B]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'min-h-[44px] touch-target',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

RoleInput.displayName = 'RoleInput';
