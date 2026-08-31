'use client';
import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface RoyalModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function RoyalModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className = '',
}: RoyalModalProps) {
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 kv-glass"
            style={{ backdropFilter: 'blur(16px)', background: 'rgba(5, 5, 5, 0.7)' }}
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden
          />

          {/* Modal panel */}
          <motion.div
            className={`kv-card relative w-full ${sizeMap[size]} p-6 sm:p-8 ${className}`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-[var(--kv-text-tertiary)] hover:text-white hover:bg-[var(--kv-glass-hover)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {(title || subtitle) && (
              <header className="mb-5 pr-10">
                {title && (
                  <h2 className="kv-gradient-text text-2xl font-extrabold tracking-tight leading-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm text-[var(--kv-text-tertiary)] mt-2">
                    {subtitle}
                  </p>
                )}
                <div className="kv-accent-line mt-4" />
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
