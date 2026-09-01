'use client';
import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';

export interface RoyalSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RoyalSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: RoyalSelectOption[];
  label?: string;
  hint?: string;
  containerClassName?: string;
  /**
   * Optional content rendered to the left of the chevron (e.g. a leading
   * icon). Kept as a slot so the premium select can be composed without
   * needing a separate icon-aware variant.
   */
  leading?: ReactNode;
}

/**
 * RoyalSelect — premium Kingdom V2 dropdown.
 *
 * Built on top of the native `<select>` element for accessibility, then
 * skinned with the `kv-input` glass surface. Inherits the 52px min-height
 * contract from `.kv-input`, surfaces a royal-purple focus ring, and
 * appends a chevron affordance. forwards a ref to the underlying
 * `<select>` element so consumers can programmatically focus/value it.
 */
export const RoyalSelect = forwardRef<HTMLSelectElement, RoyalSelectProps>(
  (
    {
      options,
      label,
      hint,
      leading,
      containerClassName = '',
      className = '',
      id,
      'aria-label': ariaLabel,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const selectId = id ?? `royal-select-${reactId}`;
    const hintId = `${selectId}-hint`;

    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[var(--kv-text-secondary)] tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leading && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--kv-text-tertiary)] pointer-events-none flex items-center">
              {leading}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            aria-label={ariaLabel ?? label}
            aria-describedby={hint ? hintId : undefined}
            className={`kv-input appearance-none cursor-pointer ${
              leading ? 'pl-12' : ''
            } pr-12 ${className}`}
            {...rest}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[var(--kv-night)] text-[var(--kv-text-primary)]"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--kv-text-tertiary)]"
            aria-hidden
          />
        </div>

        {hint && (
          <p
            id={hintId}
            className="text-xs font-medium text-[var(--kv-text-tertiary)] flex items-center gap-1"
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);
RoyalSelect.displayName = 'RoyalSelect';
