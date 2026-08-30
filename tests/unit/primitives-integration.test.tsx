/**
 * Primitives integration smoke tests.
 *
 * Distinct from `primitives.test.tsx` (per-variant assertions for
 * RoleButton/GlassCard/RoleBadge) and `primitives-extra.test.tsx`
 * (per-variant assertions for RoleInput/Skeleton/EmptyState/ErrorState/
 * PageLoader). These tests exercise each primitive across *all* of its
 * declared variants in a single assertion, plus cover the two cross-
 * cutting contracts that the per-variant suites don't check together:
 *
 *   1. every primitive accepts and merges a `className` override, and
 *   2. every primitive forwards its ref to the underlying DOM node.
 *
 * Together with the existing two suites, this file rounds out coverage
 * so the primitive barrel is exercised against every declared variant
 * shape and the two cross-cutting contracts that downstream consumers
 * depend on.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RoleButton,
  GlassCard,
  RoleBadge,
  RoleInput,
  Skeleton,
  EmptyState,
  ErrorState,
  PageLoader,
} from '@/components/primitives';

// ════════════════════════════════════════════════════════════════
// All-variants smoke tests — one assertion per primitive
// ════════════════════════════════════════════════════════════════

describe('all-variants smoke', () => {
  it('RoleButton renders all 5 variants (customer, vendor, rider, ai, neutral)', () => {
    const variants = ['customer', 'vendor', 'rider', 'ai', 'neutral'] as const;
    const expected = {
      customer: 'bg-[#10E07A]',
      vendor: 'bg-[#F5C451]',
      rider: 'bg-[#38BDF8]',
      ai: 'bg-[#8B5CF6]',
      neutral: 'bg-white/5',
    };
    for (const v of variants) {
      const { unmount } = render(<RoleButton variant={v}>{v}</RoleButton>);
      const btn = screen.getByRole('button', { name: v });
      expect(btn.className).toContain(expected[v]);
      unmount();
    }
  });

  it('GlassCard renders all 3 variants (default, raised, elevated)', () => {
    const variants = ['default', 'raised', 'elevated'] as const;
    const markers = {
      default: 'bg-white/[0.03]',
      raised: 'bg-[#0F1118]',
      elevated: 'bg-[#161924]',
    };
    for (const v of variants) {
      const { unmount } = render(<GlassCard variant={v}>{v}</GlassCard>);
      const card = screen.getByText(v);
      expect(card.className).toContain(markers[v]);
      // every variant also keeps the rounded-2xl design contract
      expect(card.className).toContain('rounded-2xl');
      unmount();
    }
  });

  it('RoleBadge renders all 8 variants (4 role + 4 semantic)', () => {
    const variants = [
      'customer',
      'vendor',
      'rider',
      'ai',
      'success',
      'warning',
      'error',
      'neutral',
    ] as const;
    const markers: Record<string, string> = {
      customer: '#10E07A',
      vendor: '#F5C451',
      rider: '#38BDF8',
      ai: '#8B5CF6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: 'bg-white/5',
    };
    for (const v of variants) {
      const { unmount } = render(<RoleBadge variant={v}>{v}</RoleBadge>);
      const badge = screen.getByText(v);
      expect(badge.className).toContain(markers[v]);
      // every variant keeps the pill shape contract
      expect(badge.className).toContain('rounded-full');
      unmount();
    }
  });

  it('RoleInput renders all 3 variants (default, error, success)', () => {
    const variants = ['default', 'error', 'success'] as const;
    const markers = {
      default: 'border-white/10',
      error: '#EF4444',
      success: '#10B981',
    };
    for (const v of variants) {
      const { unmount } = render(
        <RoleInput variant={v} aria-label={v} placeholder={v} />,
      );
      const input = screen.getByLabelText(v);
      expect(input.className).toContain(markers[v]);
      // every variant keeps the 44px touch target contract
      expect(input.className).toContain('min-h-[44px]');
      unmount();
    }
  });

  it('Skeleton renders all 3 variants (text, circle, rect)', () => {
    const variants = ['text', 'circle', 'rect'] as const;
    const markers = {
      text: 'rounded-md',
      circle: 'rounded-full',
      rect: 'rounded-xl',
    };
    for (const v of variants) {
      const { container, unmount } = render(<Skeleton variant={v} />);
      const node = container.firstChild as HTMLElement;
      expect(node.className).toContain('skeleton-shimmer');
      expect(node.className).toContain(markers[v]);
      unmount();
    }
  });

  it('EmptyState renders with a CTA button in the action slot', () => {
    render(
      <EmptyState
        title="No orders"
        description="When you place an order it will appear here."
        action={
          <button type="button" onClick={() => {}}>
            Browse restaurants
          </button>
        }
      />,
    );
    expect(screen.getByText('No orders')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /browse restaurants/i }),
    ).toBeInTheDocument();
  });

  it('ErrorState renders with a retry button that fires onRetry', () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Something went wrong"
        message="We couldn't load your orders. Please retry."
        onRetry={onRetry}
      />,
    );
    const retry = screen.getByRole('button', { name: /retry/i });
    expect(retry).toBeInTheDocument();
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('PageLoader renders with a CSS-only spinner', () => {
    const { container } = render(<PageLoader />);
    // Tailwind's animate-spin keyframe is pure CSS (no JS driver)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
    expect((spinner as HTMLElement).className).toContain('rounded-full');
    // overlay is fixed and covers the viewport
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
  });
});

// ════════════════════════════════════════════════════════════════
// Cross-cutting contracts — apply to every primitive
// ════════════════════════════════════════════════════════════════

describe('cross-cutting contracts', () => {
  it('all primitives accept and merge a className override', () => {
    const custom = 'my-custom-class';

    // RoleButton — className ends up in the merged class string
    const { unmount: u1 } = render(
      <RoleButton className={custom}>btn</RoleButton>,
    );
    expect(screen.getByRole('button').className).toContain(custom);
    u1();

    // GlassCard
    const { unmount: u2 } = render(
      <GlassCard className={custom}>card</GlassCard>,
    );
    expect(screen.getByText('card').className).toContain(custom);
    u2();

    // RoleBadge
    const { unmount: u3 } = render(
      <RoleBadge className={custom}>badge</RoleBadge>,
    );
    expect(screen.getByText('badge').className).toContain(custom);
    u3();

    // RoleInput
    const { unmount: u4 } = render(
      <RoleInput className={custom} aria-label="i" />,
    );
    expect(screen.getByLabelText('i').className).toContain(custom);
    u4();

    // Skeleton
    const { container: c5, unmount: u5 } = render(
      <Skeleton className={custom} />,
    );
    expect((c5.firstChild as HTMLElement).className).toContain(custom);
    u5();

    // EmptyState
    const { unmount: u6 } = render(
      <EmptyState title="t" className={custom} />,
    );
    const root6 = screen.getByText('t').parentElement!;
    expect(root6.className).toContain(custom);
    u6();

    // ErrorState
    const { container: c7, unmount: u7 } = render(
      <ErrorState message="m" className={custom} />,
    );
    expect((c7.firstChild as HTMLElement).className).toContain(custom);
    u7();

    // PageLoader
    const { container: c8, unmount: u8 } = render(
      <PageLoader className={custom} />,
    );
    expect((c8.firstChild as HTMLElement).className).toContain(custom);
    u8();
  });

  it('all primitives forward the ref to the underlying DOM node', () => {
    let btnRef: HTMLButtonElement | null = null;
    render(<RoleButton ref={(el) => { btnRef = el; }}>r</RoleButton>);
    expect(btnRef).toBeInstanceOf(HTMLButtonElement);

    let cardRef: HTMLDivElement | null = null;
    render(
      <GlassCard ref={(el) => { cardRef = el; }}>card</GlassCard>,
    );
    expect(cardRef).toBeInstanceOf(HTMLDivElement);

    let badgeRef: HTMLSpanElement | null = null;
    render(
      <RoleBadge ref={(el) => { badgeRef = el; }}>badge</RoleBadge>,
    );
    expect(badgeRef).toBeInstanceOf(HTMLSpanElement);

    let inputRef: HTMLInputElement | null = null;
    render(
      <RoleInput ref={(el) => { inputRef = el; }} aria-label="r" />,
    );
    expect(inputRef).toBeInstanceOf(HTMLInputElement);

    let skeletonRef: HTMLDivElement | null = null;
    const { unmount: u5 } = render(
      <Skeleton ref={(el) => { skeletonRef = el; }} />,
    );
    expect(skeletonRef).toBeInstanceOf(HTMLDivElement);
    u5();

    let emptyRef: HTMLDivElement | null = null;
    const { unmount: u6 } = render(
      <EmptyState ref={(el) => { emptyRef = el; }} title="t" />,
    );
    expect(emptyRef).toBeInstanceOf(HTMLDivElement);
    u6();

    let errorRef: HTMLDivElement | null = null;
    const { unmount: u7 } = render(
      <ErrorState ref={(el) => { errorRef = el; }} message="m" />,
    );
    expect(errorRef).toBeInstanceOf(HTMLDivElement);
    u7();

    let loaderRef: HTMLDivElement | null = null;
    const { unmount: u8 } = render(
      <PageLoader ref={(el) => { loaderRef = el; }} />,
    );
    expect(loaderRef).toBeInstanceOf(HTMLDivElement);
    u8();
  });
});
