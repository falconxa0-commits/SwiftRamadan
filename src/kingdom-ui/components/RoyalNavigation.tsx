'use client';
import { ComponentType } from 'react';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Optional numeric badge (e.g. cart count) shown over the icon. */
  badge?: number;
}

interface RoyalNavigationProps {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * RoyalNavigation — Kingdom V2 primary tab bar.
 *
 * - 56px min touch targets
 * - Safe-area-inset aware (iOS notch / home indicator)
 * - Optional per-item badge (e.g. cart count) rendered as a gold pill
 * - Backward compatible: badge defaults to 0 (hidden)
 */
export function RoyalNavigation({ items, active, onChange }: RoyalNavigationProps) {
  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      aria-label="Primary"
    >
      <div className="kv-glass rounded-2xl border border-white/8 p-1.5 flex gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          const showBadge = typeof item.badge === 'number' && item.badge > 0;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-300 min-h-[56px] ${
                isActive ? 'text-[var(--kv-mystic)]' : 'text-[var(--kv-text-tertiary)]'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="kv-nav-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--kv-gold)',
                      color: 'var(--kv-void)',
                      boxShadow: '0 0 8px var(--kv-gold-glow)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
