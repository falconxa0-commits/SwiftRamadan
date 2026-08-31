'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type OrbSize = 'sm' | 'md' | 'lg';
type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AIOrbProps extends HTMLAttributes<HTMLDivElement> {
  /** Pixel diameter — sm (32), md (48), lg (72). */
  size?: OrbSize;
  /** Animation / visual state. */
  state?: OrbState;
  /** Optional label rendered below the orb (e.g. "Listening…"). */
  label?: string;
}

/**
 * Size → pixel diameter. The `.auren-ai-orb` CSS class hard-codes
 * 48×48px (the md size), so the sm/lg variants override the size via
 * inline style while keeping the radial gradient + breathing glow.
 */
const sizePx: Record<OrbSize, number> = {
  sm: 32,
  md: 48,
  lg: 72,
};

/**
 * State → modifier classes layered on top of `.auren-ai-orb`.
 *
 *   - idle:      default breathing glow (no extra class)
 *   - listening: brighter ring (extra royal glow + 1.1x saturation)
 *   - thinking:  3-dot thinking indicator overlay using
 *                `.auren-thinking` keyframes
 *   - speaking:  rapid pulse — short breathing animation
 */
const stateClass: Record<OrbState, string> = {
  idle: 'auren-ai-orb',
  listening: 'auren-ai-orb auren-ai-orb--listening',
  thinking: 'auren-ai-orb auren-ai-orb--thinking',
  speaking: 'auren-ai-orb auren-ai-orb--speaking',
};

/**
 * AIOrb — the signature Auren Kingdom AI orb.
 *
 * Renders a radial-gradient sphere using the `.auren-ai-orb` class
 * from `globals.css` (which sources its gradient from
 * `var(--auren-mystic)`, `var(--auren-royal)` and
 * `var(--auren-imperial)`). The orb breathes (auren-breathe
 * keyframe) at idle, brightens while listening, shows three pulsing
 * dots while thinking, and pulses rapidly while speaking.
 *
 * The optional `label` is rendered below the orb as secondary text
 * (e.g. "Listening…", "Thinking…") so screen readers and sighted
 * users both get a state cue. The orb element itself is exposed to
 * assistive tech as `role="img"` with a state-specific `aria-label`.
 */
export const AIOrb = forwardRef<HTMLDivElement, AIOrbProps>(
  (
    {
      size = 'md',
      state = 'idle',
      label,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const px = sizePx[size];

    const stateLabel: Record<OrbState, string> = {
      idle: 'AI orb idle',
      listening: 'AI orb listening',
      thinking: 'AI orb thinking',
      speaking: 'AI orb speaking',
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex flex-col items-center gap-2', className)}
        {...props}
      >
        <div
          role="img"
          aria-label={stateLabel[state]}
          className={stateClass[state]}
          style={{ width: px, height: px, ...style }}
        >
          {state === 'thinking' ? (
            <span
              className="auren-thinking absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </span>
          ) : null}
        </div>
        {label ? (
          <span className="text-xs font-medium text-white/70">{label}</span>
        ) : null}
      </div>
    );
  },
);

AIOrb.displayName = 'AIOrb';
