'use client';

import { useEffect, useId, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showOverlay?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.offsetParent !== null,
  );
}

/**
 * Fully accessible modal component with:
 * - WAI-ARIA dialog role, aria-modal, aria-labelledby
 * - Focus trapping (Tab/Shift+Tab cycle within modal)
 * - Escape key dismissal
 * - Focus management (auto-focus first element, restore on close)
 * - Body scroll lock
 * - prefers-reduced-motion support
 * - Aurora Luxe design system styling
 */
export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showOverlay = true,
  size = 'md',
}: AccessibleModalProps) {
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useRef(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  // Focus management & scroll lock
  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      if (containerRef.current) {
        const focusable = getFocusableElements(containerRef.current);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          containerRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      if (previousFocusRef.current) {
        try { previousFocusRef.current.focus(); } catch { /* removed from DOM */ }
      }
    };
  }, [isOpen]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !containerRef.current) return;
    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length === 0) { e.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  // eslint-disable-next-line react-hooks/refs
  const animationConfig: import('framer-motion').Transition = prefersReducedMotion.current
    ? { duration: 0 }
    : { type: 'spring', damping: 25, stiffness: 300 };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={animationConfig}
              className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />
          )}

          {/* Modal container */}
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={containerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              onKeyDown={handleKeyDown}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={animationConfig}
              className={`
                pointer-events-auto w-full ${sizeClasses[size]}
                bg-[#0F1117] border border-white/10 rounded-2xl
                shadow-2xl shadow-black/50
                max-h-[90vh] overflow-y-auto
                ${className}
              `}
            >
              {/* Title (visually hidden if no title prop, but still in DOM for aria) */}
              {title && (
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <h2 id={titleId} className="text-lg font-semibold text-white">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
