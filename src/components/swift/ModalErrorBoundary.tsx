'use client';

import React, { ReactNode } from 'react';
import { captureException } from '@/lib/monitoring/sentry';

interface Props {
  children: ReactNode;
  name: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Modal-specific error boundary. Wraps individual modals to isolate errors
 * so a crash inside one modal doesn't bring down the whole app.
 * Automatically reports errors to Sentry with the modal's name as a tag.
 */
export class ModalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, {
      tags: { component: `Modal:${this.props.name}`, boundary: 'modal' },
      extra: { componentStack: errorInfo.componentStack },
    }).catch(() => {});
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-white/70 text-sm mb-1">This section encountered an error</p>
          {this.state.error && (
            <p className="text-white/65 text-xs mb-3">{this.state.error.message}</p>
          )}
          <button
            onClick={this.handleDismiss}
            className="px-4 py-1.5 bg-white/5 text-white/60 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModalErrorBoundary;
