'use client';
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export interface RoyalInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  variant?: 'default' | 'error' | 'success';
  showPasswordToggle?: boolean;
  leftIcon?: ReactNode;
  containerClassName?: string;
}

export const RoyalInput = forwardRef<HTMLInputElement, RoyalInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      variant = 'default',
      showPasswordToggle = false,
      leftIcon,
      containerClassName = '',
      className = '',
      type = 'text',
      id,
      'aria-label': ariaLabel,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `royal-input-${reactId}`;
    const [revealed, setRevealed] = useState(false);

    const resolvedVariant = error
      ? 'error'
      : success
        ? 'success'
        : variant;

    const isPassword = type === 'password';
    const resolvedType = isPassword && revealed ? 'text' : type;

    const variantClass =
      resolvedVariant === 'error'
        ? 'kv-input-error'
        : resolvedVariant === 'success'
          ? 'kv-input-success'
          : '';

    const messageColor =
      resolvedVariant === 'error'
        ? 'text-[var(--kv-danger)]'
        : resolvedVariant === 'success'
          ? 'text-[var(--kv-emerald)]'
          : 'text-[var(--kv-text-tertiary)]';

    const MessageIcon =
      resolvedVariant === 'error'
        ? AlertCircle
        : resolvedVariant === 'success'
          ? CheckCircle2
          : null;

    const describedBy =
      error || success || hint
        ? `${inputId}-message`
        : undefined;

    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--kv-text-secondary)] tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--kv-text-tertiary)] pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-label={ariaLabel ?? label}
            aria-invalid={resolvedVariant === 'error' || undefined}
            aria-describedby={describedBy}
            className={`kv-input ${variantClass} ${leftIcon ? 'pl-12' : ''} ${
              showPasswordToggle || resolvedVariant !== 'default' ? 'pr-12' : ''
            } ${className}`}
            {...rest}
          />

          {(resolvedVariant !== 'default' || showPasswordToggle) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {MessageIcon && (
                <MessageIcon
                  className={`w-4 h-4 ${messageColor}`}
                  aria-hidden
                />
              )}
              {showPasswordToggle && isPassword && (
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  aria-label={revealed ? 'Hide password' : 'Show password'}
                  className="text-[var(--kv-text-tertiary)] hover:text-[var(--kv-mystic)] transition-colors"
                >
                  {revealed ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {(error || success || hint) && (
          <p
            id={describedBy}
            className={`text-xs font-medium ${messageColor} flex items-center gap-1`}
          >
            {error || success || hint}
          </p>
        )}
      </div>
    );
  },
);
RoyalInput.displayName = 'RoyalInput';
