/**
 * Auren Kingdom Primitives — Phase 17-B component contract tests.
 *
 * This file covers the 5 new premium primitives that wire the Auren
 * Kingdom design tokens (`var(--auren-*)` custom properties in
 * `globals.css`) into reusable React surfaces:
 *
 *   - MetricCard  — premium dashboard metric tile (default/royal/gold)
 *   - AIOrb       — signature Auren AI orb with idle/listening/thinking/speaking states
 *   - LuxuryHeader — premium section header with royal purple accent line
 *   - Timeline    — vertical activity feed with royal purple connector
 *   - DataCard    — header + content card (default/royal/gold)
 *
 * Tests assert:
 *   - rendering of required text (labels, values, titles, children),
 *   - application of the `var(--auren-*)`-derived Tailwind arbitrary
 *     value classes (e.g. `border-[var(--auren-royal-border)]`), which
 *     is the contract that keeps these primitives in sync with the
 *     Auren design system,
 *   - the `.auren-ai-orb` base class plus state modifier classes,
 *   - inline-style sizing for AIOrb sm/md/lg (the CSS class hard-codes
 *     48px, sm/lg override via inline style),
 *   - ref forwarding for all 5 primitives,
 *   - the barrel export re-exports all 5 new primitives.
 *
 * Distinct from `primitives.test.tsx` (18 tests) and
 * `primitives-extra.test.tsx` (28 tests) which cover the original
 * 8 primitives — this file only covers the Phase 17-B additions.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MetricCard,
  AIOrb,
  LuxuryHeader,
  Timeline,
  DataCard,
} from '@/components/primitives';
import * as Primitives from '@/components/primitives';
import { TrendingUp, TrendingDown, Sparkles, Bell } from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// MetricCard
// ════════════════════════════════════════════════════════════════

describe('MetricCard', () => {
  it('renders the label and the value', () => {
    render(<MetricCard label="Revenue" value={12345} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('renders the value with text-3xl + font-bold per spec', () => {
    render(<MetricCard label="x" value="99" />);
    const value = screen.getByText('99');
    expect(value.className).toContain('text-3xl');
    expect(value.className).toContain('font-bold');
  });

  it('renders the label with uppercase tracking-wider per spec', () => {
    render(<MetricCard label="Active Users" value="42" />);
    const label = screen.getByText('Active Users');
    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('tracking-wider');
  });

  it('renders a trend chip when `trend` is provided (up)', () => {
    render(
      <MetricCard
        label="Sales"
        value="1k"
        trend={{ direction: 'up', value: '12%' }}
      />,
    );
    // The percentage text is rendered with a leading "+"
    expect(screen.getByText('+12%')).toBeInTheDocument();
    // The TrendingUp lucide icon is rendered (it has the
    // `lucide-trending-up` class on its <svg>).
    const svg = document.querySelector('.lucide-trending-up');
    expect(svg).not.toBeNull();
  });

  it('renders a down trend with a minus prefix and TrendingDown icon', () => {
    render(
      <MetricCard
        label="Sales"
        value="1k"
        trend={{ direction: 'down', value: '5%' }}
      />,
    );
    expect(screen.getByText('−5%')).toBeInTheDocument();
    expect(document.querySelector('.lucide-trending-down')).not.toBeNull();
  });

  it('applies the royal variant border + shadow via var(--auren-*)', () => {
    render(<MetricCard label="x" value="1" variant="royal" />);
    const card = screen.getByText('1').parentElement!;
    expect(card.className).toContain('border-[var(--auren-royal-border)]');
    expect(card.className).toContain('shadow-[var(--auren-shadow-royal)]');
  });

  it('applies the gold variant border + shadow via var(--auren-*)', () => {
    render(<MetricCard label="x" value="1" variant="gold" />);
    const card = screen.getByText('1').parentElement!;
    expect(card.className).toContain('border-[var(--auren-gold-border)]');
    expect(card.className).toContain('shadow-[var(--auren-shadow-gold)]');
  });

  it('renders the optional icon inside a tinted tile', () => {
    render(<MetricCard label="x" value="1" icon={Sparkles} />);
    // The icon is rendered as an SVG with the lucide-sparkles class.
    const svg = document.querySelector('.lucide-sparkles');
    expect(svg).not.toBeNull();
    // The icon's wrapping tile should be a 9x9 (w-9 h-9) container.
    const tile = svg?.parentElement;
    expect(tile?.className).toContain('w-9');
    expect(tile?.className).toContain('h-9');
  });

  it('forwards the ref to the underlying <div>', () => {
    let refValue: HTMLDivElement | null = null;
    render(
      <MetricCard
        ref={(el) => {
          refValue = el;
        }}
        label="x"
        value="1"
      />,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('DIV');
  });
});

// ════════════════════════════════════════════════════════════════
// AIOrb
// ════════════════════════════════════════════════════════════════

describe('AIOrb', () => {
  it('renders the .auren-ai-orb base class on the orb element', () => {
    const { container } = render(<AIOrb />);
    const orb = container.querySelector('.auren-ai-orb');
    expect(orb).not.toBeNull();
  });

  it('applies the size as inline width/height (sm=32, md=48, lg=72)', () => {
    const cases = [
      ['sm', 32],
      ['md', 48],
      ['lg', 72],
    ] as const;
    for (const [size, px] of cases) {
      const { container, unmount } = render(<AIOrb size={size} />);
      const orb = container.querySelector('.auren-ai-orb') as HTMLElement;
      expect(orb.style.width).toBe(`${px}px`);
      expect(orb.style.height).toBe(`${px}px`);
      unmount();
    }
  });

  it('applies the state modifier class for each state', () => {
    const cases = [
      'idle',
      'listening',
      'thinking',
      'speaking',
    ] as const;
    for (const state of cases) {
      const { container, unmount } = render(<AIOrb state={state} />);
      const orb = container.querySelector('.auren-ai-orb') as HTMLElement;
      if (state === 'idle') {
        expect(orb.className).toContain('auren-ai-orb');
        // idle has no extra state modifier class
        expect(orb.className).not.toContain('auren-ai-orb--');
      } else {
        expect(orb.className).toContain(`auren-ai-orb--${state}`);
      }
      unmount();
    }
  });

  it('exposes role="img" and a state-specific aria-label', () => {
    const { container } = render(<AIOrb state="listening" />);
    const orb = container.querySelector('.auren-ai-orb') as HTMLElement;
    expect(orb.getAttribute('role')).toBe('img');
    expect(orb.getAttribute('aria-label')).toBe('AI orb listening');
  });

  it('renders the optional label below the orb', () => {
    render(<AIOrb label="Listening…" />);
    expect(screen.getByText('Listening…')).toBeInTheDocument();
  });

  it('renders the .auren-thinking dots overlay when state="thinking"', () => {
    const { container } = render(<AIOrb state="thinking" />);
    const thinking = container.querySelector('.auren-thinking');
    expect(thinking).not.toBeNull();
    // 3 dot spans inside the .auren-thinking wrapper
    const dots = thinking?.querySelectorAll('span');
    expect(dots?.length).toBe(3);
  });

  it('forwards the ref to the underlying wrapper <div>', () => {
    let refValue: HTMLDivElement | null = null;
    render(
      <AIOrb
        ref={(el) => {
          refValue = el;
        }}
      />,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('DIV');
  });
});

// ════════════════════════════════════════════════════════════════
// LuxuryHeader
// ════════════════════════════════════════════════════════════════

describe('LuxuryHeader', () => {
  it('renders the title as an h2 with text-2xl font-bold', () => {
    render(<LuxuryHeader title="Vendor Dashboard" />);
    const title = screen.getByRole('heading', {
      level: 2,
      name: /vendor dashboard/i,
    });
    expect(title.className).toContain('text-2xl');
    expect(title.className).toContain('font-bold');
  });

  it('renders the subtitle when provided', () => {
    render(
      <LuxuryHeader
        title="Orders"
        subtitle="Last 30 days of activity"
      />,
    );
    expect(
      screen.getByText('Last 30 days of activity'),
    ).toBeInTheDocument();
  });

  it('renders the optional action slot on the right', () => {
    render(
      <LuxuryHeader
        title="Orders"
        action={<button type="button">View all</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: /view all/i }),
    ).toBeInTheDocument();
  });

  it('renders the royal purple accent line under the title', () => {
    const { container } = render(<LuxuryHeader title="x" />);
    // The accent line is a div with inline `background: var(--auren-royal)`
    const accent = container.querySelector(
      '[style*="var(--auren-royal)"]',
    ) as HTMLElement | null;
    expect(accent).not.toBeNull();
    expect(accent?.style.background).toContain('var(--auren-royal)');
  });

  it('renders the optional icon in a tinted royal tile', () => {
    const { container } = render(
      <LuxuryHeader title="x" icon={Sparkles} />,
    );
    const svg = container.querySelector('.lucide-sparkles');
    expect(svg).not.toBeNull();
    const tile = svg?.parentElement;
    expect(tile?.className).toContain('bg-[var(--auren-royal-light)]');
    expect(tile?.className).toContain('border-[var(--auren-royal-border)]');
  });

  it('forwards the ref to the underlying <div>', () => {
    let refValue: HTMLDivElement | null = null;
    render(
      <LuxuryHeader
        ref={(el) => {
          refValue = el;
        }}
        title="x"
      />,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('DIV');
  });
});

// ════════════════════════════════════════════════════════════════
// Timeline
// ════════════════════════════════════════════════════════════════

describe('Timeline', () => {
  const items = [
    {
      id: 'a',
      title: 'Order #1234 placed',
      timestamp: '2 min ago',
      description: 'Customer selected express delivery.',
      icon: Bell,
    },
    {
      id: 'b',
      title: 'Rider assigned',
      timestamp: '5 min ago',
    },
  ];

  it('renders all item titles', () => {
    render(<Timeline items={items} />);
    expect(screen.getByText('Order #1234 placed')).toBeInTheDocument();
    expect(screen.getByText('Rider assigned')).toBeInTheDocument();
  });

  it('renders all item timestamps', () => {
    render(<Timeline items={items} />);
    expect(screen.getByText('2 min ago')).toBeInTheDocument();
    expect(screen.getByText('5 min ago')).toBeInTheDocument();
  });

  it('renders the optional description for items that include one', () => {
    render(<Timeline items={items} />);
    expect(
      screen.getByText('Customer selected express delivery.'),
    ).toBeInTheDocument();
  });

  it('renders the royal purple vertical connector line', () => {
    const { container } = render(<Timeline items={items} />);
    const line = container.querySelector(
      '[style*="var(--auren-royal)"]',
    ) as HTMLElement | null;
    expect(line).not.toBeNull();
    expect(line?.style.background).toContain('var(--auren-royal)');
  });

  it('renders the lucide icon inside the node tile when provided', () => {
    const { container } = render(<Timeline items={items} />);
    expect(container.querySelector('.lucide-bell')).not.toBeNull();
  });

  it('renders a royal dot fallback when no icon is provided', () => {
    const onlyNoIcon = [
      { id: 'x', title: 'No icon item', timestamp: 'just now' },
    ];
    const { container } = render(<Timeline items={onlyNoIcon} />);
    // The fallback dot is a span with inline background: var(--auren-royal)
    const dot = container.querySelector(
      '[style*="var(--auren-royal)"]',
    ) as HTMLElement | null;
    expect(dot).not.toBeNull();
  });

  it('forwards the ref to the underlying <div>', () => {
    let refValue: HTMLDivElement | null = null;
    render(
      <Timeline
        ref={(el) => {
          refValue = el;
        }}
        items={items}
      />,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('DIV');
  });
});

// ════════════════════════════════════════════════════════════════
// DataCard
// ════════════════════════════════════════════════════════════════

describe('DataCard', () => {
  it('renders the title and children', () => {
    render(
      <DataCard title="Recent Orders">
        <span>child content</span>
      </DataCard>,
    );
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders the optional subtitle in the header', () => {
    render(
      <DataCard title="Orders" subtitle="12 active">
        <span>body</span>
      </DataCard>,
    );
    expect(screen.getByText('12 active')).toBeInTheDocument();
  });

  it('renders the optional action in the header right slot', () => {
    render(
      <DataCard
        title="Orders"
        action={<button type="button">Export</button>}
      >
        <span>body</span>
      </DataCard>,
    );
    expect(
      screen.getByRole('button', { name: /export/i }),
    ).toBeInTheDocument();
  });

  it('applies the royal variant border + shadow via var(--auren-*)', () => {
    const { container } = render(
      <DataCard title="x" variant="royal">
        <span>body</span>
      </DataCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-[var(--auren-royal-border)]');
    expect(card.className).toContain('shadow-[var(--auren-shadow-royal)]');
  });

  it('applies the gold variant border + shadow via var(--auren-*)', () => {
    const { container } = render(
      <DataCard title="x" variant="gold">
        <span>body</span>
      </DataCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-[var(--auren-gold-border)]');
    expect(card.className).toContain('shadow-[var(--auren-shadow-gold)]');
  });

  it('renders the optional icon in a tinted header tile', () => {
    const { container } = render(
      <DataCard title="x" icon={Sparkles}>
        <span>body</span>
      </DataCard>,
    );
    expect(container.querySelector('.lucide-sparkles')).not.toBeNull();
  });

  it('uses the glass surface (backdrop-blur + translucent tint)', () => {
    const { container } = render(
      <DataCard title="x">
        <span>body</span>
      </DataCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('backdrop-blur-[12px]');
    expect(card.className).toContain('bg-white/[0.03]');
  });

  it('forwards the ref to the underlying <div>', () => {
    let refValue: HTMLDivElement | null = null;
    render(
      <DataCard
        ref={(el) => {
          refValue = el;
        }}
        title="x"
      >
        <span>body</span>
      </DataCard>,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('DIV');
  });
});

// ════════════════════════════════════════════════════════════════
// Barrel export (Phase 17-B additions)
// ════════════════════════════════════════════════════════════════

describe('primitives barrel (Auren Kingdom — Phase 17-B)', () => {
  it('exports all 5 new Auren primitives from the barrel', () => {
    expect(Primitives.MetricCard).toBeDefined();
    expect(Primitives.AIOrb).toBeDefined();
    expect(Primitives.LuxuryHeader).toBeDefined();
    expect(Primitives.Timeline).toBeDefined();
    expect(Primitives.DataCard).toBeDefined();
  });

  it('preserves the original 8 primitives in the barrel', () => {
    expect(Primitives.RoleButton).toBeDefined();
    expect(Primitives.GlassCard).toBeDefined();
    expect(Primitives.RoleBadge).toBeDefined();
    expect(Primitives.RoleInput).toBeDefined();
    expect(Primitives.Skeleton).toBeDefined();
    expect(Primitives.EmptyState).toBeDefined();
    expect(Primitives.ErrorState).toBeDefined();
    expect(Primitives.PageLoader).toBeDefined();
  });
});
