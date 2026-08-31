'use client';
import { ReactNode, forwardRef } from 'react';

interface IntelligenceCardProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'royal' | 'gold';
  children: ReactNode;
  className?: string;
}

export const IntelligenceCard = forwardRef<HTMLDivElement, IntelligenceCardProps>(
  ({ title, subtitle, variant = 'default', children, className = '' }, ref) => {
    const variantClass = variant === 'royal' ? 'kv-card-royal' : variant === 'gold' ? 'kv-card-gold' : '';
    return (
      <div ref={ref} className={`kv-card ${variantClass} p-5 sm:p-6 ${className}`}>
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-[var(--kv-text-tertiary)] mt-1">{subtitle}</p>}
            <div className="kv-accent-line mt-3" />
          </div>
        )}
        {children}
      </div>
    );
  }
);
IntelligenceCard.displayName = 'IntelligenceCard';
