'use client';
import { ComponentType } from 'react';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function RoyalNavigation({ items, active, onChange }: {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
      <div className="kv-glass rounded-2xl border border-white/8 p-1.5 flex gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-300 min-h-[56px] ${
                isActive ? 'text-[var(--kv-mystic)]' : 'text-[var(--kv-text-tertiary)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="kv-nav-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-medium relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
