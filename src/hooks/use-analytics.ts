'use client';
import { track, flushAnalytics } from '@/lib/analytics';
import { useEffect } from 'react';

export function useAnalytics() {
  // Flush analytics on page unload + periodic flush + initial page_view
  useEffect(() => {
    const handler = () => flushAnalytics();
    window.addEventListener('beforeunload', handler);

    // Track page view on mount
    track('page_view');

    // Periodic flush every 30 seconds
    const interval = setInterval(flushAnalytics, 30000);

    return () => {
      window.removeEventListener('beforeunload', handler);
      clearInterval(interval);
    };
  }, []);

  return { track };
}
