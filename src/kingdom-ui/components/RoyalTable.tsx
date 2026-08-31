'use client';
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface RoyalTableColumn {
  /** Unique key for the column. Used to read the matching field from the
   * row object when `render` is not provided. */
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** Custom cell renderer. Receives the row and the row index. */
  render?: (row: Record<string, ReactNode>, index: number) => ReactNode;
}

export interface RoyalTableProps extends HTMLAttributes<HTMLDivElement> {
  columns: RoyalTableColumn[];
  data: Array<Record<string, ReactNode>>;
  /** Optional stable key extractor (defaults to the row index). */
  rowKey?: (row: Record<string, ReactNode>, index: number) => string;
  /** Optional content rendered when `data` is empty. */
  empty?: ReactNode;
}

/**
 * RoyalTable — premium Kingdom V2 data table.
 *
 * Renders a `kv-card` shell wrapping a horizontally-scrollable table
 * with a royal-mystic uppercase header row and hover-tinted body rows.
 * The shell forwards its ref to the outer `kv-card` div so consumers
 * can mount it inside responsive containers; the inner
 * `overflow-x-auto` wrapper handles the responsive scroll contract
 * for narrow viewports.
 */
export const RoyalTable = forwardRef<HTMLDivElement, RoyalTableProps>(
  (
    {
      columns,
      data,
      rowKey,
      empty,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const alignClass = (align?: 'left' | 'center' | 'right') =>
      align === 'center'
        ? 'text-center'
        : align === 'right'
          ? 'text-right'
          : 'text-left';

    return (
      <div
        ref={ref}
        className={`kv-card overflow-hidden ${className}`}
        {...rest}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--kv-glass-border)] bg-[var(--kv-glass)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    scope="col"
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--kv-mystic)] ${alignClass(col.align)}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-[var(--kv-text-tertiary)]"
                  >
                    {empty ?? 'No data'}
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={rowKey ? rowKey(row, i) : i}
                    className="border-b border-[var(--kv-glass-border)] last:border-b-0 hover:bg-[var(--kv-glass-hover)] transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-[var(--kv-text-secondary)] ${alignClass(col.align)}`}
                      >
                        {col.render ? col.render(row, i) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);
RoyalTable.displayName = 'RoyalTable';
