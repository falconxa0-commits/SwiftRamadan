'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Route-level error boundary (Next.js App Router).
 * Catches errors thrown while rendering the route's `page.tsx`. Receives the
 * thrown `error` and a `reset` callback from Next.js.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route error.tsx]', error);
  }, [error]);

  const handleReload = () => {
    reset();
    if (typeof window !== 'undefined') window.location.reload();
  };

  const handleHome = () => {
    reset();
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center aurora-app-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#F5C451]/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-[#F5C451]" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">
          Something went wrong
        </h2>
        <p className="text-white/50 text-sm mb-6">
          We encountered an unexpected error. Try reloading the page.
        </p>
        {error?.message && (
          <details className="mb-6 text-left">
            <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-black/30 rounded-lg text-red-400 text-xs overflow-auto max-h-32">
              {error.message}
              {error.digest ? `\n[digest: ${error.digest}]` : ''}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#10E07A] text-[#04140C] rounded-xl font-bold text-sm hover:bg-[#0FC070] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload
          </button>
          <button
            onClick={handleHome}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
