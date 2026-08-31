import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleButton } from '@/components/primitives/RoleButton';
import { GlassCard } from '@/components/primitives/GlassCard';
import { RoleBadge } from '@/components/primitives/RoleBadge';
import * as Primitives from '@/components/primitives';

// ════════════════════════════════════════════════════════════════
// RoleButton
// ════════════════════════════════════════════════════════════════

describe('RoleButton', () => {
  it('renders a <button> with default neutral variant', () => {
    render(<RoleButton>Click me</RoleButton>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    // neutral variant has the white/5 background tint
    expect(btn.className).toContain('bg-white/5');
  });

  it('applies the correct background class for each role variant', () => {
    const variants = [
      ['customer', 'bg-[#10E07A]'],
      ['vendor', 'bg-[#F5C451]'],
      ['rider', 'bg-[#38BDF8]'],
      ['ai', 'bg-[#8B5CF6]'],
    ] as const;

    for (const [variant, expectedClass] of variants) {
      const { unmount } = render(
        <RoleButton variant={variant}>x</RoleButton>,
      );
      const btn = screen.getByRole('button');
      expect(btn.className).toContain(expectedClass);
      unmount();
    }
  });

  it('enforces a 44px minimum touch target (WCAG 2.5.5)', () => {
    render(<RoleButton>tap</RoleButton>);
    const btn = screen.getByRole('button');
    // Tailwind's `min-h-[44px]` utility renders as min-height: 2.75rem
    // (44px). The presence of this class guarantees the touch target.
    expect(btn.className).toContain('min-h-[44px]');
    // sanity: the computed style should resolve to 44px when Tailwind
    // is loaded; in jsdom we just assert the class is present (the
    // design contract) so the test does not depend on a CSS engine.
  });

  it('applies the active scale-95 micro-interaction', () => {
    render(<RoleButton>press</RoleButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('active:scale-95');
  });

  it('applies a focus-visible ring for keyboard users', () => {
    render(<RoleButton>focus</RoleButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('focus-visible:ring-2');
  });

  it('adds a glow shadow when `glow` is true', () => {
    render(
      <RoleButton variant="customer" glow>
        glow
      </RoleButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('shadow-[#10E07A]/25');
  });

  it('forwards the ref to the underlying <button>', () => {
    let refValue: HTMLButtonElement | null = null;
    render(
      <RoleButton
        ref={(el) => {
          refValue = el;
        }}
      >
        ref
      </RoleButton>,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('BUTTON');
  });

  it('applies size variants', () => {
    const sizes = [
      ['sm', 'text-xs'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
    ] as const;
    for (const [size, expectedText] of sizes) {
      const { unmount } = render(
        <RoleButton size={size}>x</RoleButton>,
      );
      const btn = screen.getByRole('button');
      expect(btn.className).toContain(expectedText);
      unmount();
    }
  });
});

// ════════════════════════════════════════════════════════════════
// GlassCard
// ════════════════════════════════════════════════════════════════

describe('GlassCard', () => {
  it('renders children and applies backdrop-blur', () => {
    render(
      <GlassCard>
        <span>card content</span>
      </GlassCard>,
    );
    const card = screen.getByText('card content').parentElement!;
    expect(card).toBeInTheDocument();
    expect(card.className).toContain('backdrop-blur');
  });

  it('uses rounded-2xl per spec', () => {
    render(<GlassCard>rounded</GlassCard>);
    const card = screen.getByText('rounded');
    expect(card.className).toContain('rounded-2xl');
  });

  it('applies the elevated surface color for the `elevated` variant', () => {
    render(<GlassCard variant="elevated">modal</GlassCard>);
    const card = screen.getByText('modal');
    expect(card.className).toContain('bg-[#161924]');
  });

  it('adds hover tint when `hover` is true', () => {
    render(<GlassCard hover>hoverable</GlassCard>);
    const card = screen.getByText('hoverable');
    expect(card.className).toContain('hover:bg-white/[0.06]');
  });

  it('forwards the ref to the underlying <div>', () => {
    let refValue: HTMLDivElement | null = null;
    render(
      <GlassCard
        ref={(el) => {
          refValue = el;
        }}
      >
        ref-card
      </GlassCard>,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('DIV');
  });
});

// ════════════════════════════════════════════════════════════════
// RoleBadge
// ════════════════════════════════════════════════════════════════

describe('RoleBadge', () => {
  it('renders with pill shape (rounded-full)', () => {
    render(<RoleBadge>NEW</RoleBadge>);
    const badge = screen.getByText('NEW');
    expect(badge.className).toContain('rounded-full');
  });

  it('applies uppercase tracking by default', () => {
    render(<RoleBadge>verified</RoleBadge>);
    const badge = screen.getByText('verified');
    expect(badge.className).toContain('uppercase');
    expect(badge.className).toContain('tracking-wider');
  });

  it('renders the correct color for each role variant', () => {
    const variants = [
      ['customer', '#10E07A'],
      ['vendor', '#F5C451'],
      ['rider', '#38BDF8'],
      ['ai', '#8B5CF6'],
      ['success', '#10B981'],
      ['warning', '#F59E0B'],
      ['error', '#EF4444'],
    ] as const;
    for (const [variant, hex] of variants) {
      const { unmount } = render(
        <RoleBadge variant={variant}>x</RoleBadge>,
      );
      const badge = screen.getByText('x');
      expect(badge.className).toContain(hex);
      unmount();
    }
  });

  it('uses the neutral variant by default', () => {
    render(<RoleBadge>default</RoleBadge>);
    const badge = screen.getByText('default');
    expect(badge.className).toContain('bg-white/5');
  });
});

// ════════════════════════════════════════════════════════════════
// Barrel export
// ════════════════════════════════════════════════════════════════

describe('primitives barrel', () => {
  it('exports all three primitives from index', () => {
    expect(Primitives.RoleButton).toBeDefined();
    expect(Primitives.GlassCard).toBeDefined();
    expect(Primitives.RoleBadge).toBeDefined();
  });
});
