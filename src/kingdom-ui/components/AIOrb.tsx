'use client';
import { forwardRef } from 'react';

interface AIOrbProps {
  size?: 'sm' | 'md' | 'lg';
  state?: 'idle' | 'listening' | 'thinking' | 'speaking';
  className?: string;
}

const sizeMap = { sm: '32px', md: '48px', lg: '72px' };

export const AIOrb = forwardRef<HTMLDivElement, AIOrbProps>(
  ({ size = 'md', state = 'idle', className = '' }, ref) => {
    const stateStyle = state === 'listening' ? 'brightness-125' : state === 'thinking' ? 'animate-pulse' : state === 'speaking' ? 'scale-105' : '';
    return (
      <div
        ref={ref}
        className={`kv-ai-orb ${stateStyle} ${className}`}
        style={{ width: sizeMap[size], height: sizeMap[size] }}
        role="img"
        aria-label={`AI assistant ${state}`}
      />
    );
  }
);
AIOrb.displayName = 'AIOrb';
