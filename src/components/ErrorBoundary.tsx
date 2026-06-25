'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic client-side error boundary. Catches render-time errors anywhere in
 * the children subtree and shows a friendly fallback. Can also be used with a
 * custom `fallback` prop for component-level isolation.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

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
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-black/30 rounded-lg text-red-400 text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#10E07A] text-[#04140C] rounded-xl font-bold text-sm hover:bg-[#0FC070] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
              <button
                onClick={this.handleHome}
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

    return this.props.children;
  }
}

export default ErrorBoundary;
