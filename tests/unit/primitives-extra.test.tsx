import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RoleInput,
  Skeleton,
  EmptyState,
  ErrorState,
  PageLoader,
} from '@/components/primitives';
import * as Primitives from '@/components/primitives';

// ════════════════════════════════════════════════════════════════
// RoleInput
// ════════════════════════════════════════════════════════════════

describe('RoleInput', () => {
  it('renders an <input type="text"> by default', () => {
    render(<RoleInput placeholder="Email" />);
    const input = screen.getByPlaceholderText('Email') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('text');
  });

  it('applies the correct ring/border class for each variant', () => {
    const cases = [
      ['default', 'border-white/10'],
      ['error', '#EF4444'],
      ['success', '#10B981'],
    ] as const;
    for (const [variant, marker] of cases) {
      const { unmount } = render(
        <RoleInput variant={variant} aria-label={variant} />,
      );
      const input = screen.getByLabelText(variant);
      expect(input.className).toContain(marker);
      unmount();
    }
  });

  it('enforces a 44px minimum touch target (WCAG 2.5.5)', () => {
    render(<RoleInput aria-label="tap" />);
    const input = screen.getByLabelText('tap');
    expect(input.className).toContain('min-h-[44px]');
  });

  it('shows a focus-visible ring for keyboard users', () => {
    render(<RoleInput aria-label="focus" />);
    const input = screen.getByLabelText('focus');
    expect(input.className).toContain('focus-visible:ring-2');
  });

  it('applies the correct padding/text-size for each size', () => {
    const cases = [
      ['sm', 'text-xs'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
    ] as const;
    for (const [size, marker] of cases) {
      const { unmount } = render(
        <RoleInput size={size} aria-label={size} />,
      );
      const input = screen.getByLabelText(size);
      expect(input.className).toContain(marker);
      unmount();
    }
  });

  it('forwards the ref to the underlying <input>', () => {
    let refValue: HTMLInputElement | null = null;
    render(
      <RoleInput
        ref={(el) => {
          refValue = el;
        }}
        aria-label="ref"
      />,
    );
    expect(refValue).not.toBeNull();
    expect((refValue as unknown as HTMLElement).tagName).toBe('INPUT');
  });

  it('renders the placeholder text', () => {
    render(<RoleInput placeholder="Search vendors…" />);
    expect(
      screen.getByPlaceholderText('Search vendors…'),
    ).toBeInTheDocument();
  });

  it('applies disabled state classes when disabled', () => {
    render(<RoleInput disabled aria-label="disabled" />);
    const input = screen.getByLabelText('disabled') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.className).toContain('disabled:opacity-50');
  });
});

// ════════════════════════════════════════════════════════════════
// Skeleton
// ════════════════════════════════════════════════════════════════

describe('Skeleton', () => {
  it('applies the .skeleton-shimmer class from globals.css', () => {
    const { container } = render(<Skeleton />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('skeleton-shimmer');
  });

  it('renders text variant with rounded-md by default', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'rounded-md',
    );
  });

  it('renders circle variant with rounded-full + aspect-square', () => {
    const { container } = render(<Skeleton variant="circle" />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('rounded-full');
    expect(node.className).toContain('aspect-square');
  });

  it('renders multiple skeletons when count > 1', () => {
    const { container } = render(<Skeleton count={4} />);
    const shimmerNodes = container.querySelectorAll('.skeleton-shimmer');
    expect(shimmerNodes.length).toBe(4);
  });

  it('applies explicit width/height as inline styles', () => {
    const { container } = render(
      <Skeleton width={120} height={24} />,
    );
    const node = container.firstChild as HTMLElement;
    expect(node.style.width).toBe('120px');
    expect(node.style.height).toBe('24px');
  });
});

// ════════════════════════════════════════════════════════════════
// EmptyState
// ════════════════════════════════════════════════════════════════

describe('EmptyState', () => {
  it('renders the title, description and action slot', () => {
    render(
      <EmptyState
        title="No orders yet"
        description="Your delivery history will appear here."
        action={<button>Place an order</button>}
      />,
    );
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
    expect(
      screen.getByText('Your delivery history will appear here.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /place an order/i }),
    ).toBeInTheDocument();
  });

  it('applies the premium glass background + border', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('bg-white/[0.03]');
    expect(node.className).toContain('backdrop-blur-[12px]');
    expect(node.className).toContain('border-white/[0.08]');
  });

  it('wraps the icon in a rounded-full tinted container', () => {
    render(
      <EmptyState
        title="Inbox"
        icon={<span data-testid="ic">★</span>}
      />,
    );
    const iconWrap = screen.getByTestId('ic').parentElement!;
    expect(iconWrap.className).toContain('rounded-full');
    expect(iconWrap.className).toContain('bg-white/5');
  });

  it('applies compact padding when variant="compact"', () => {
    const { container } = render(
      <EmptyState variant="compact" title="compact" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      'p-5',
    );
  });
});

// ════════════════════════════════════════════════════════════════
// ErrorState
// ════════════════════════════════════════════════════════════════

describe('ErrorState', () => {
  it('renders the error message', () => {
    render(<ErrorState message="Failed to load orders." />);
    expect(
      screen.getByText('Failed to load orders.'),
    ).toBeInTheDocument();
  });

  it('uses role="alert" for accessibility', () => {
    const { container } = render(
      <ErrorState message="boom" />,
    );
    expect((container.firstChild as HTMLElement).getAttribute('role')).toBe(
      'alert',
    );
  });

  it('renders a Retry button when onRetry is provided', () => {
    render(<ErrorState message="x" onRetry={() => {}} />);
    expect(
      screen.getByRole('button', { name: /retry/i }),
    ).toBeInTheDocument();
  });

  it('omits the Retry button when onRetry is not provided', () => {
    render(<ErrorState message="x" />);
    expect(
      screen.queryByRole('button', { name: /retry/i }),
    ).not.toBeInTheDocument();
  });

  it('invokes the onRetry handler when the Retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="x" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('supports a custom retry label', () => {
    render(
      <ErrorState
        message="x"
        onRetry={() => {}}
        retryLabel="Try again"
      />,
    );
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════
// PageLoader
// ════════════════════════════════════════════════════════════════

describe('PageLoader', () => {
  it('renders a fixed full-screen overlay with glass background', () => {
    const { container } = render(<PageLoader />);
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
    expect(overlay.className).toContain('backdrop-blur-[24px]');
  });

  it('renders an animate-spin spinner (pure CSS)', () => {
    const { container } = render(<PageLoader />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
    expect((spinner as HTMLElement).className).toContain('rounded-full');
  });

  it('exposes role="status" + aria-busy for screen readers', () => {
    const { container } = render(<PageLoader />);
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.getAttribute('role')).toBe('status');
    expect(overlay.getAttribute('aria-busy')).toBe('true');
  });

  it('renders the optional message below the spinner', () => {
    render(<PageLoader message="Loading your orders…" />);
    expect(
      screen.getByText('Loading your orders…'),
    ).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════
// Barrel export
// ════════════════════════════════════════════════════════════════

describe('primitives barrel (extra)', () => {
  it('exports all 5 new primitives from index', () => {
    expect(Primitives.RoleInput).toBeDefined();
    expect(Primitives.Skeleton).toBeDefined();
    expect(Primitives.EmptyState).toBeDefined();
    expect(Primitives.ErrorState).toBeDefined();
    expect(Primitives.PageLoader).toBeDefined();
  });
});
