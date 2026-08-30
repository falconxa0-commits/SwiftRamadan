'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback component to render on error */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

/**
 * Aurora Luxe styled error boundary.
 *
 * Catches render errors from child components and shows a beautiful
 * fallback UI instead of crashing the whole app. Provides:
 *  - "Reload App" button → refreshes the page
 *  - "Report Issue" button → copies error details to clipboard
 *  - Collapsible error details section (always visible, toggle to expand)
 *  - Auto-report to console with component stack trace
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Always log to console for debugging — component stack trace included
    console.error('[SwiftRamadan ErrorBoundary]', error, errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.location.reload();
  };

  handleReport = async () => {
    const errorDetails = [
      `Error: ${this.state.error?.message || 'Unknown error'}`,
      '',
      `Stack: ${this.state.error?.stack || 'No stack trace'}`,
      '',
      `Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}`,
      '',
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
      '',
      `Time: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      // Fallback: open mailto link
      const encoded = encodeURIComponent(errorDetails);
      window.open(
        `mailto:support@swiftramadan.app?subject=SwiftRamadan%20Bug%20Report&body=${encoded}`,
        '_blank',
      );
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center aurora-app-bg p-6">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-6">
            {/* Aurora glow accent */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#10E07A]/20 to-[#F5C451]/20 blur-xl" />
              <div className="relative w-20 h-20 rounded-full bg-[var(--sr-surface-raised)] border border-white/10 flex items-center justify-center">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F5C451"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-white text-2xl font-bold tracking-tight">
              Something went wrong
            </h2>

            {/* Subtitle */}
            <p className="text-white/55 text-sm leading-relaxed">
              We hit an unexpected error. Don&apos;t worry — your data is safe.
              Try reloading the app, or report the issue if it keeps happening.
            </p>

            {/* Collapsible error details */}
            {this.state.error && (
              <div className="bg-[#0A0B10] rounded-xl overflow-hidden border border-white/5">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  aria-expanded={this.state.showDetails}
                  aria-label="Toggle error details"
                >
                  <span className="text-[var(--sr-customer)] text-xs font-semibold uppercase tracking-wider">
                    Error Details
                  </span>
                  <svg
                    className={`w-4 h-4 text-white/65 transition-transform duration-200 ${this.state.showDetails ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {this.state.showDetails && (
                  <div className="px-4 pb-3 text-left">
                    <p className="text-[var(--sr-vendor)] text-xs font-mono break-all leading-relaxed">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-white/60 text-[10px] font-mono break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {this.state.error.stack.split('\n').slice(1, 6).join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full h-12 rounded-2xl bg-[var(--sr-customer)] text-[#04140C] font-bold text-sm
                           hover:bg-[var(--sr-customer)]/90 active:scale-[0.97] transition-all duration-200"
                aria-label="Reload the app"
              >
                Reload App
              </button>
              <button
                onClick={this.handleReport}
                className="w-full h-12 rounded-2xl bg-[var(--sr-surface-raised)] border border-white/10 text-white/70
                           font-semibold text-sm hover:border-white/20 hover:text-white
                           active:scale-[0.97] transition-all duration-200"
                aria-label="Copy error details to clipboard"
              >
                {this.state.copied ? '✓ Copied to Clipboard' : 'Report Issue'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
