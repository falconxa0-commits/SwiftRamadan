'use client';
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Search, X } from 'lucide-react';

export interface CommandBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'results'> {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  results?: ReactNode;
  resultsOpen?: boolean;
  onResultsClose?: () => void;
  leftIcon?: ReactNode;
  containerClassName?: string;
}

export const CommandBar = forwardRef<HTMLInputElement, CommandBarProps>(
  (
    {
      placeholder = 'Search the kingdom…',
      value,
      defaultValue,
      onValueChange,
      results,
      resultsOpen,
      onResultsClose,
      leftIcon,
      containerClassName = '',
      className = '',
      id,
      'aria-label': ariaLabel,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `kv-cmd-${reactId}`;
    const [internalOpen, setInternalOpen] = useState(false);
    const showResults = resultsOpen ?? internalOpen;
    const hasValue = (() => {
      if (value !== undefined) return value.length > 0;
      if (defaultValue !== undefined) return String(defaultValue).length > 0;
      return false;
    })();

    return (
      <div className={`relative w-full ${containerClassName}`}>
        <div className="kv-command-bar flex items-center gap-3 px-4 py-2">
          <span className="text-[var(--kv-text-tertiary)] shrink-0">
            {leftIcon ?? <Search className="w-5 h-5" />}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="text"
            role="searchbox"
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => {
              onChange?.(e);
              onValueChange?.(e.target.value);
              setInternalOpen(true);
            }}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={`flex-1 bg-transparent border-0 outline-none text-[15px] text-[var(--kv-text-primary)] placeholder:text-[var(--kv-text-muted)] ${className}`}
            {...rest}
          />
          {hasValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                onValueChange?.('');
                setInternalOpen(false);
              }}
              className="text-[var(--kv-text-tertiary)] hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showResults && results && (
          <div className="absolute top-full left-0 right-0 mt-2 kv-card p-2 z-30 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                Results
              </span>
              {onResultsClose && (
                <button
                  type="button"
                  aria-label="Close results"
                  onClick={() => {
                    onResultsClose();
                    setInternalOpen(false);
                  }}
                  className="text-[var(--kv-text-tertiary)] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {results}
          </div>
        )}
      </div>
    );
  },
);
CommandBar.displayName = 'CommandBar';
