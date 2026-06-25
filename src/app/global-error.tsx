'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Root-level error boundary (Next.js App Router).
 * Catches errors thrown from the root `layout.tsx`. MUST render its own
 * `<html>` and `<body>` because the root layout is bypassed when this fires.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error.tsx]', error);
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
    <html lang="en" className="dark">
      <head>
        <style>{`
          body { margin: 0; background: #05070A; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
        `}</style>
      </head>
      <body>
        <div
          className="aurora-app-bg"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: '28rem',
              width: '100%',
              textAlign: 'center',
              padding: '2rem',
              borderRadius: '1.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1rem',
                background: 'rgba(245, 196, 81, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <AlertTriangle
                style={{ width: '2rem', height: '2rem', color: '#F5C451' }}
              />
            </div>
            <h2
              style={{
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              We encountered an unexpected error. Try reloading the page.
            </p>
            {error?.message && (
              <details
                style={{
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.75rem',
                }}
              >
                <summary style={{ cursor: 'pointer' }}>Error details</summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '0.5rem',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: '8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message}
                  {error.digest ? `\n[digest: ${error.digest}]` : ''}
                </pre>
              </details>
            )}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  background: '#10E07A',
                  color: '#04140C',
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Reload
              </button>
              <button
                onClick={handleHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <Home style={{ width: '1rem', height: '1rem' }} />
                Home
              </button>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
