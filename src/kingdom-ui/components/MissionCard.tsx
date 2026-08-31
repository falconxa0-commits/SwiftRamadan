'use client';
import { ComponentType, ReactNode } from 'react';

interface MissionCardProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function MissionCard({ icon: Icon, title, description, action, onAction, children }: MissionCardProps) {
  return (
    <div className="kv-card p-5 sm:p-6 flex flex-col gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--kv-royal-light)' }}>
          <Icon className="w-6 h-6 text-[var(--kv-mystic)]" />
        </div>
      )}
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-sm text-[var(--kv-text-tertiary)] mt-1">{description}</p>
      </div>
      {children}
      {action && onAction && (
        <button onClick={onAction} className="kv-btn kv-btn-royal mt-2 text-sm py-2.5 px-5">
          {action}
        </button>
      )}
    </div>
  );
}
