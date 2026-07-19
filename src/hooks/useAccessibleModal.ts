'use client';

import { useEffect, useId, useRef, useCallback } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

interface UseAccessibleModalOptions {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

interface UseAccessibleModalReturn {
  modalRef: (node: HTMLElement | null) => void;
  modalProps: {
    role: 'dialog';
    'aria-modal': true;
    'aria-labelledby'?: string;
    tabIndex: -1;
    onKeyDown: (e: ReactKeyboardEvent) => void;
  };
  titleId: string;
}

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
    (el) => el.offsetParent !== null, // visible only
  );
}

/**
 * Hook that adds accessibility features to existing modal components:
 * - `role="dialog"` and `aria-modal="true"`
 * - Focus trapping (Tab/Shift+Tab cycle within modal)
 * - Escape key dismissal
 * - Focus management (focus first element on open, restore on close)
 * - Body scroll lock
 *
 * Usage:
 * ```tsx
 * const { modalRef, modalProps, titleId } = useAccessibleModal({
 *   isOpen: activeModal === 'settings',
 *   onClose: () => setActiveModal(null),
 *   title: 'Settings',
 * });
 *
 * return (
 *   <div ref={modalRef} {...modalProps}>
 *     <h2 id={titleId}>Settings</h2>
 *     ...
 *   </div>
 * );
 * ```
 */
export function useAccessibleModal({
  isOpen,
  onClose,
  title,
}: UseAccessibleModalOptions): UseAccessibleModalReturn {
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep onClose ref current to avoid stale closures
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Handle Escape key globally when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  // Focus management & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Save current focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into modal after a tick (allow rendering)
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
      // Restore focus
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        try {
          previousFocusRef.current.focus();
        } catch {
          // Element may have been removed from DOM
        }
      }
    };
  }, [isOpen]);

  // Focus trap handler for Tab/Shift+Tab
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    },
    [],
  );

  // Callback ref to store container reference
  const modalRef = useCallback(
    (node: HTMLElement | null) => {
      containerRef.current = node;
    },
    [],
  );

  const modalProps: UseAccessibleModalReturn['modalProps'] = {
    role: 'dialog' as const,
    'aria-modal': true as const,
    ...(title ? { 'aria-labelledby': titleId } : {}),
    tabIndex: -1,
    onKeyDown: handleKeyDown,
  };

  return { modalRef, modalProps, titleId };
}
