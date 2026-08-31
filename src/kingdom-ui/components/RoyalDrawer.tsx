'use client';
import {
  forwardRef,
  useEffect,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface RoyalDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /**
   * When `true` (default), clicking the backdrop dismisses the drawer.
   */
  closeOnBackdrop?: boolean;
  /**
   * Side the sheet enters from. Defaults to `"bottom"` (mobile-first
   * bottom sheet). `"right"` produces a side-drawer.
   */
  side?: 'bottom' | 'right';
  className?: string;
}

/**
 * RoyalDrawer — premium Kingdom V2 bottom sheet / side drawer.
 *
 * Uses the `kv-backdrop` overlay (blurred, dimmed) and a `kv-card` sheet
 * with a drag handle affordance. Enter/exit transitions are driven by
 * Framer Motion `AnimatePresence` so the sheet can be mounted and
 * unmounted with the `open` prop. The sheet exposes `role="dialog"` and
 * `aria-modal="true"`, locks body scroll while open, and dismisses on
 * Escape / backdrop click (the latter is configurable).
 *
 * The ref is attached to the inner sheet element so consumers can
 * programmatically scroll or focus within it.
 */
export const RoyalDrawer = forwardRef<HTMLDivElement, RoyalDrawerProps>(
  (
    {
      open,
      onClose,
      title,
      subtitle,
      children,
      footer,
      closeOnBackdrop = true,
      side = 'bottom',
      className = '',
    },
    ref,
  ) => {
    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }, [open, onClose]);

    const isBottom = side === 'bottom';

    const initial = isBottom ? { y: '100%' } : { x: '100%' };
    const animate = isBottom ? { y: 0 } : { x: 0 };
    const exit = isBottom ? { y: '100%' } : { x: '100%' };

    return (
      <AnimatePresence>
        {open && (
          <div
            className={`fixed inset-0 z-50 flex ${
              isBottom
                ? 'items-end justify-center sm:items-center sm:p-6'
                : 'items-stretch justify-end'
            }`}
          >
            <motion.div
              className="absolute inset-0 kv-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeOnBackdrop ? onClose : undefined}
              aria-hidden
            />

            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-label={title ?? 'Royal drawer'}
              className={`relative kv-card ${
                isBottom
                  ? 'w-full sm:max-w-md rounded-b-none sm:rounded-b-[var(--kv-radius-xl)]'
                  : 'h-full w-full max-w-md rounded-l-[var(--kv-radius-xl)]'
              } p-6 ${className}`}
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {/* Drag handle — visible affordance that signals the sheet is
                  dismissible. Has the `kv-drag-handle` class so tests and
                  downstream styling can target it. */}
              <div
                aria-hidden
                className="kv-drag-handle mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--kv-glass-border)]"
              />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-[var(--kv-text-tertiary)] hover:text-white hover:bg-[var(--kv-glass-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {(title || subtitle) && (
                <header className="mb-4 pr-10">
                  {title && (
                    <h2 className="kv-gradient-text text-xl font-extrabold tracking-tight leading-tight">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-[var(--kv-text-tertiary)] mt-1">
                      {subtitle}
                    </p>
                  )}
                  <div className="kv-accent-line mt-3" />
                </header>
              )}

              <div className="text-sm text-[var(--kv-text-secondary)]">
                {children}
              </div>

              {footer && (
                <footer className="mt-6 pt-4 border-t border-[var(--kv-glass-border)]">
                  {footer}
                </footer>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  },
);
RoyalDrawer.displayName = 'RoyalDrawer';
