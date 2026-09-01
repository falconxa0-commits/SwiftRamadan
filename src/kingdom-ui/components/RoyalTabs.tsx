'use client';
import {
  forwardRef,
  type ComponentType,
  type HTMLAttributes,
} from 'react';
import { motion } from 'framer-motion';

export interface RoyalTabItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface RoyalTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: RoyalTabItem[];
  active: string;
  onChange: (id: string) => void;
  /**
   * The Framer Motion `layoutId` shared between the active indicators so
   * the royal highlight glides between tabs when the active item changes.
   * Defaults to `kv-royal-tabs-active`.
   */
  layoutId?: string;
}

/**
 * RoyalTabs — premium Kingdom V2 tab navigation.
 *
 * Renders the `kv-tab-bar` glass container with one `kv-tab-item` button
 * per tab. The active tab receives the `active` modifier class plus a
 * Framer Motion `layoutId` highlight that smoothly slides between
 * tabs when the active id changes. The container exposes
 * `role="tablist"` for screen readers, each button is `role="tab"` with
 * `aria-selected` reflecting the active state.
 */
export const RoyalTabs = forwardRef<HTMLDivElement, RoyalTabsProps>(
  (
    {
      items,
      active,
      onChange,
      layoutId = 'kv-royal-tabs-active',
      className = '',
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="tablist"
        aria-label="Royal tabs"
        className={`kv-tab-bar ${className}`}
        {...rest}
      >
        {items.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`kv-tab-panel-${item.id}`}
              id={`kv-tab-${item.id}`}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={`kv-tab-item relative ${
                isActive ? 'active' : ''
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: 'var(--kv-royal-light)',
                    border: '1px solid var(--kv-royal-border)',
                    borderRadius: 'var(--kv-radius-lg)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {Icon && <Icon className="w-5 h-5 relative z-10" />}
              <span className="text-[11px] font-semibold relative z-10">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);
RoyalTabs.displayName = 'RoyalTabs';
