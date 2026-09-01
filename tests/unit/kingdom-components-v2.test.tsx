/**
 * Auren Kingdom V2 — Phase 22-A component contract tests.
 *
 * This file covers the 5 new premium V2 component primitives added in
 * Phase 22-A:
 *
 *   - RoyalSelect  — premium glass dropdown built on a native <select>,
 *                    52px min-height inherited from `.kv-input`, royal
 *                    focus ring, chevron affordance, ref-forwarded to the
 *                    underlying <select>.
 *   - RoyalTabs    — tab navigation rendered with the `.kv-tab-bar` glass
 *                    container, `role="tablist"` on the wrapper, a royal
 *                    active state, and a Framer Motion `layoutId` glide
 *                    indicator.
 *   - RoyalDrawer  — bottom-sheet / side-drawer using `.kv-backdrop`, an
 *                    AnimatePresence-driven spring enter/exit, a drag
 *                    handle affordance, and `role="dialog"` for a11y.
 *   - RoyalChart   — chart container built on `.kv-card` with title,
 *                    subtitle, an optional right-aligned action slot, and
 *                    the royal `.kv-accent-line` divider.
 *   - RoyalTable   — data table with a columns config + row array, glass
 *                    surface, royal-mystic uppercase header, hover-tinted
 *                    rows, and a responsive horizontal scroll wrapper.
 *
 * The 10 tests below cover the per-component contract (rendering of
 * required text, application of `kv-*` design-system classes, ref
 * forwarding, and a11y attributes) plus the two cross-cutting contracts
 * ("All accept className" and "All forward refs") that downstream
 * consumers depend on.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RoyalSelect,
  RoyalTabs,
  RoyalDrawer,
  RoyalChart,
  RoyalTable,
} from '@/kingdom-ui/components';
import type {
  RoyalSelectOption,
  RoyalTabItem,
  RoyalTableColumn,
} from '@/kingdom-ui/components';

// ════════════════════════════════════════════════════════════════
// Per-component contracts (one test per primitive)
// ════════════════════════════════════════════════════════════════

describe('Phase 22-A V2 primitives — per-component', () => {
  it('RoyalSelect renders with options', () => {
    const options: RoyalSelectOption[] = [
      { value: 'lagos', label: 'Lagos' },
      { value: 'abuja', label: 'Abuja' },
      { value: 'kano', label: 'Kano' },
    ];
    render(
      <RoyalSelect aria-label="City" options={options} defaultValue="lagos" />,
    );
    // The native <select> exposes role="combobox".
    const select = screen.getByRole('combobox', {
      name: 'City',
    }) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBe(3);
    expect(select.options[0].value).toBe('lagos');
    expect(select.options[0].textContent).toBe('Lagos');
    expect(select.options[1].value).toBe('abuja');
    expect(select.options[2].value).toBe('kano');
    // The select inherits the `kv-input` design-system class (which
    // carries the 52px min-height contract via kingdom.css).
    expect(select.className).toContain('kv-input');
  });

  it('RoyalTabs renders with active state', () => {
    const items: RoyalTabItem[] = [
      { id: 'home', label: 'Home' },
      { id: 'orders', label: 'Orders' },
      { id: 'profile', label: 'Profile' },
    ];
    render(<RoyalTabs items={items} active="orders" onChange={() => {}} />);
    // The wrapper exposes role="tablist" + the kv-tab-bar class.
    const tablist = screen.getByRole('tablist');
    expect(tablist.className).toContain('kv-tab-bar');
    // All three tabs render as role="tab".
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    // The active tab gets the `active` modifier class + aria-selected=true.
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveTextContent('Orders');
    expect(activeTab.className).toContain('active');
    expect(activeTab.getAttribute('aria-selected')).toBe('true');
    // Non-active tabs do not have the active class.
    const homeTab = screen.getByRole('tab', { name: 'Home' });
    expect(homeTab.className).not.toContain('active');
    expect(homeTab.getAttribute('aria-selected')).toBe('false');
  });

  it('RoyalDrawer renders with drag handle', () => {
    const { container } = render(
      <RoyalDrawer open onClose={() => {}} title="Filter results">
        <span>drawer content</span>
      </RoyalDrawer>,
    );
    // The drag handle is the element with the `kv-drag-handle` class.
    const handle = container.querySelector('.kv-drag-handle');
    expect(handle).not.toBeNull();
    // The drawer body also renders.
    expect(screen.getByText('drawer content')).toBeInTheDocument();
    // The title is surfaced for screen readers.
    expect(screen.getByText('Filter results')).toBeInTheDocument();
  });

  it('RoyalChart renders with title', () => {
    const { container } = render(
      <RoyalChart title="Revenue (30 days)" subtitle="Daily net revenue">
        <svg data-testid="chart-body" />
      </RoyalChart>,
    );
    expect(screen.getByText('Revenue (30 days)')).toBeInTheDocument();
    expect(screen.getByText('Daily net revenue')).toBeInTheDocument();
    // Outer container is the kv-card.
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('kv-card');
    // The royal accent line is rendered.
    expect(container.querySelector('.kv-accent-line')).not.toBeNull();
    // The chart body is rendered inside.
    expect(screen.getByTestId('chart-body')).toBeInTheDocument();
  });

  it('RoyalTable renders with data', () => {
    const columns: RoyalTableColumn[] = [
      { key: 'name', header: 'Name' },
      { key: 'orders', header: 'Orders', align: 'right' },
    ];
    const data = [
      { name: 'Suya Republic', orders: 124 },
      { name: 'Iftar Bites', orders: 88 },
    ];
    const { container } = render(<RoyalTable columns={columns} data={data} />);
    // Headers render.
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    // All cells render across both rows.
    expect(screen.getByText('Suya Republic')).toBeInTheDocument();
    expect(screen.getByText('124')).toBeInTheDocument();
    expect(screen.getByText('Iftar Bites')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
    // Outer shell is the kv-card.
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('kv-card');
  });
});

// ════════════════════════════════════════════════════════════════
// A11y attribute contracts
// ════════════════════════════════════════════════════════════════

describe('Phase 22-A V2 primitives — a11y attributes', () => {
  it('RoyalSelect has aria-label', () => {
    render(
      <RoyalSelect
        aria-label="Pick a neighborhood"
        options={[{ value: 'ikoyi', label: 'Ikoyi' }]}
      />,
    );
    const select = screen.getByLabelText(
      'Pick a neighborhood',
    ) as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    expect(select.getAttribute('aria-label')).toBe('Pick a neighborhood');
  });

  it('RoyalTabs has role=tablist', () => {
    render(
      <RoyalTabs
        items={[{ id: 'a', label: 'A' }]}
        active="a"
        onChange={() => {}}
      />,
    );
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    expect(tablist.tagName).toBe('DIV');
    // The role attribute is set explicitly (not just implicit).
    expect(tablist.getAttribute('role')).toBe('tablist');
  });

  it('RoyalDrawer has role=dialog', () => {
    render(
      <RoyalDrawer open onClose={() => {}} title="My Drawer">
        <span>body</span>
      </RoyalDrawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.tagName).toBe('DIV');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('My Drawer');
  });
});

// ════════════════════════════════════════════════════════════════
// Cross-cutting contracts — apply to every Phase-22 V2 primitive
// ════════════════════════════════════════════════════════════════

describe('Phase 22-A V2 primitives — cross-cutting contracts', () => {
  it('All accept className', () => {
    const custom = 'kv-test-custom';

    // RoyalSelect — className lands on the underlying <select>.
    const { unmount: u1 } = render(
      <RoyalSelect
        className={custom}
        aria-label="c"
        options={[{ value: 'a', label: 'A' }]}
      />,
    );
    expect(screen.getByRole('combobox').className).toContain(custom);
    u1();

    // RoyalTabs — className lands on the role="tablist" wrapper.
    const { unmount: u2 } = render(
      <RoyalTabs
        className={custom}
        items={[{ id: 'a', label: 'A' }]}
        active="a"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('tablist').className).toContain(custom);
    u2();

    // RoyalDrawer — className lands on the role="dialog" sheet.
    const { unmount: u3 } = render(
      <RoyalDrawer className={custom} open onClose={() => {}} title="t">
        <span>x</span>
      </RoyalDrawer>,
    );
    expect(screen.getByRole('dialog').className).toContain(custom);
    u3();

    // RoyalChart — className lands on the outer kv-card div.
    const { container: c4, unmount: u4 } = render(
      <RoyalChart className={custom} title="t">
        <span>x</span>
      </RoyalChart>,
    );
    expect((c4.firstChild as HTMLElement).className).toContain(custom);
    u4();

    // RoyalTable — className lands on the outer kv-card div.
    const { container: c5, unmount: u5 } = render(
      <RoyalTable
        className={custom}
        columns={[{ key: 'a', header: 'A' }]}
        data={[{ a: 'v' }]}
      />,
    );
    expect((c5.firstChild as HTMLElement).className).toContain(custom);
    u5();
  });

  it('All forward refs', () => {
    // RoyalSelect — ref forwards to the underlying <select>.
    let selectRef: HTMLSelectElement | null = null;
    render(
      <RoyalSelect
        ref={(el) => {
          selectRef = el;
        }}
        aria-label="r"
        options={[{ value: 'a', label: 'A' }]}
      />,
    );
    expect(selectRef).toBeInstanceOf(HTMLSelectElement);

    // RoyalTabs — ref forwards to the role="tablist" wrapper div.
    let tabsRef: HTMLDivElement | null = null;
    render(
      <RoyalTabs
        ref={(el) => {
          tabsRef = el;
        }}
        items={[{ id: 'a', label: 'A' }]}
        active="a"
        onChange={() => {}}
      />,
    );
    expect(tabsRef).toBeInstanceOf(HTMLDivElement);
    expect((tabsRef as unknown as HTMLElement)?.getAttribute('role')).toBe('tablist');

    // RoyalDrawer — ref forwards to the role="dialog" sheet (open).
    let drawerRef: HTMLDivElement | null = null;
    const { unmount: u3 } = render(
      <RoyalDrawer
        ref={(el) => {
          drawerRef = el;
        }}
        open
        onClose={() => {}}
        title="r"
      >
        <span>x</span>
      </RoyalDrawer>,
    );
    expect(drawerRef).toBeInstanceOf(HTMLDivElement);
    expect((drawerRef as unknown as HTMLElement)?.getAttribute('role')).toBe('dialog');
    u3();

    // RoyalChart — ref forwards to the outer kv-card div.
    let chartRef: HTMLDivElement | null = null;
    const { unmount: u4 } = render(
      <RoyalChart
        ref={(el) => {
          chartRef = el;
        }}
        title="r"
      >
        <span>x</span>
      </RoyalChart>,
    );
    expect(chartRef).toBeInstanceOf(HTMLDivElement);
    u4();

    // RoyalTable — ref forwards to the outer kv-card div.
    let tableRef: HTMLDivElement | null = null;
    const { unmount: u5 } = render(
      <RoyalTable
        ref={(el) => {
          tableRef = el;
        }}
        columns={[{ key: 'a', header: 'A' }]}
        data={[{ a: 'v' }]}
      />,
    );
    expect(tableRef).toBeInstanceOf(HTMLDivElement);
    u5();
  });
});
