'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type RoleVariant = 'customer' | 'vendor' | 'rider' | 'ai' | 'neutral';
type RoleSize = 'sm' | 'md' | 'lg';

interface RoleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RoleVariant;
  size?: RoleSize;
  glow?: boolean;
}

const variantStyles: Record<RoleVariant, string> = {
  customer: 'bg-[#10E07A] hover:bg-[#0EA05A] text-[#05070B]',
  vendor: 'bg-[#F5C451] hover:bg-[#E8B447] text-[#05070B]',
  rider: 'bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#05070B]',
  ai: 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white',
  neutral: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
};

const sizeStyles: Record<RoleSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const glowStyles: Record<RoleVariant, string> = {
  customer: 'shadow-lg shadow-[#10E07A]/25',
  vendor: 'shadow-lg shadow-[#F5C451]/25',
  rider: 'shadow-lg shadow-[#38BDF8]/25',
  ai: 'shadow-lg shadow-[#8B5CF6]/25',
  neutral: '',
};

export const RoleButton = forwardRef<HTMLButtonElement, RoleButtonProps>(
  ({ variant = 'neutral', size = 'md', glow = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070B]',
          'disabled:opacity-50 disabled:pointer-events-none',
          'min-h-[44px] touch-target',
          variantStyles[variant],
          sizeStyles[size],
          glow && glowStyles[variant],
          className,
        )}
        {...props}
      />
    );
  }
);

RoleButton.displayName = 'RoleButton';
