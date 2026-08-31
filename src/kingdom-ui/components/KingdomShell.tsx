'use client';
import { ReactNode } from 'react';

export function KingdomShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`kv-root min-h-screen ${className}`}>
      {children}
    </div>
  );
}
