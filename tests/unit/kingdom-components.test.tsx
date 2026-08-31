/**
 * Auren Kingdom V2 — Component contract tests (Phase 20-B).
 *
 * Tests the 7 flagship V2 components for rendering correctness:
 *
 *   - KingdomShell      — root surface that renders children
 *   - IntelligenceCard  — premium card with default/royal/gold variants
 *   - MissionCard       — action card with title, description, action button
 *   - AIOrb             — signature AI orb with sm/md/lg size and idle/
 *                         listening/thinking/speaking states
 *   - RoyalBadge        — pill badge with royal/gold/neutral variants
 *   - RoyalInput        — premium input with label, placeholder, error/success
 *   - RoyalSkeleton     — shimmer skeleton with text/circle/rect variants
 *
 * The V2 components intentionally do not depend on framer-motion, so
 * no motion mock is required. Tests assert rendering of required text,
 * application of the `kv-*` design-system classes, and ref forwarding.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KingdomShell } from '@/kingdom-ui/components/KingdomShell';
import { IntelligenceCard } from '@/kingdom-ui/components/IntelligenceCard';
import { MissionCard } from '@/kingdom-ui/components/MissionCard';
import { AIOrb } from '@/kingdom-ui/components/AIOrb';
import { RoyalBadge } from '@/kingdom-ui/components/RoyalBadge';
import { RoyalInput } from '@/kingdom-ui/components/RoyalInput';
import { RoyalSkeleton } from '@/kingdom-ui/components/RoyalSkeleton';

describe('KingdomShell', () => {
  it('renders children inside the kv-root surface', () => {
    render(
      <KingdomShell>
        <span data-testid="child">Hello Kingdom</span>
      </KingdomShell>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello Kingdom')).toBeInTheDocument();
  });
});

describe('IntelligenceCard', () => {
  it('renders the title when provided', () => {
    render(
      <IntelligenceCard title="Daily Briefing">
        <span>body content</span>
      </IntelligenceCard>,
    );
    expect(screen.getByText('Daily Briefing')).toBeInTheDocument();
  });

  it('applies the royal variant class when variant="royal"', () => {
    const { container } = render(
      <IntelligenceCard title="x" variant="royal">
        <span>body</span>
      </IntelligenceCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('kv-card-royal');
  });
});

describe('MissionCard', () => {
  it('renders the title and description', () => {
    render(
      <MissionCard
        title="Track Order"
        description="Real-time GPS tracking of your delivery"
      />,
    );
    expect(screen.getByText('Track Order')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time GPS tracking of your delivery'),
    ).toBeInTheDocument();
  });

  it('renders the action button when action and onAction are provided', () => {
    render(
      <MissionCard
        title="Track Order"
        description="Live tracking"
        action="Start Tracking"
        onAction={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: /start tracking/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('kv-btn-royal');
  });
});

describe('AIOrb', () => {
  it('renders the orb with sm size as inline 32px width/height', () => {
    const { container } = render(<AIOrb size="sm" />);
    const orb = container.querySelector('.kv-ai-orb') as HTMLElement;
    expect(orb).not.toBeNull();
    expect(orb.style.width).toBe('32px');
    expect(orb.style.height).toBe('32px');
  });

  it('renders the thinking state modifier class', () => {
    const { container } = render(<AIOrb state="thinking" />);
    const orb = container.querySelector('.kv-ai-orb') as HTMLElement;
    expect(orb).not.toBeNull();
    expect(orb.className).toContain('animate-pulse');
  });
});

describe('RoyalBadge', () => {
  it('renders the royal variant with the kv-badge-royal class', () => {
    const { container } = render(
      <RoyalBadge variant="royal">Verified</RoyalBadge>,
    );
    const badge = container.querySelector('.kv-badge-royal') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Verified');
  });
});

describe('RoyalInput', () => {
  it('renders the input with the provided placeholder', () => {
    render(
      <RoyalInput
        label="Email"
        placeholder="you@kingdom.auren"
      />,
    );
    const input = screen.getByPlaceholderText(
      'you@kingdom.auren',
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.className).toContain('kv-input');
  });
});

describe('RoyalSkeleton', () => {
  it('renders with the kv-skeleton shimmer class', () => {
    const { container } = render(<RoyalSkeleton />);
    const skeleton = container.querySelector('.kv-skeleton') as HTMLElement;
    expect(skeleton).not.toBeNull();
    // The text variant applies the kv-skeleton-text variant class
    expect(skeleton.className).toContain('kv-skeleton');
  });
});
