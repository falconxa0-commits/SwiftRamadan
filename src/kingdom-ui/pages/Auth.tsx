'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { KingdomShell, AIOrb, RoyalInput } from '../components';

export function KingdomAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    // Hook into auth API in a later phase.
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <KingdomShell>
      <div className="min-h-screen flex items-center justify-center px-5 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="kv-card w-full max-w-md mx-auto p-6 sm:p-8"
        >
          {/* AI Orb */}
          <div className="flex justify-center mb-6">
            <AIOrb size="lg" state="idle" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="kv-gradient-text text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Welcome to the Kingdom
            </h1>
            <p className="text-sm text-[var(--kv-text-tertiary)] mt-2">
              Your AI companion for Ramadan awaits.
            </p>
            <div className="kv-accent-line mx-auto mt-4" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
            <RoyalInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@kingdom.africa"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              aria-label="Email address"
              required
            />
            <RoyalInput
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              showPasswordToggle
              aria-label="Password"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="kv-btn kv-btn-royal w-full text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Entering…' : 'Enter Kingdom'}
            </button>
            <button
              type="button"
              className="kv-btn kv-btn-ghost w-full text-base"
            >
              Create Account
            </button>
          </form>

          {/* Trust microcopy */}
          <div className="flex items-center justify-center gap-2 mb-6 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--kv-emerald)]" />
            <p className="text-[11px] text-[var(--kv-text-tertiary)] tracking-wide">
              Your data is encrypted. Your privacy is sacred.
            </p>
          </div>

          {/* Divider */}
          <div className="kv-divider mb-6" />

          {/* Social auth */}
          <p className="text-center text-xs text-[var(--kv-text-tertiary)] mb-4 uppercase tracking-wider">
            Continue with
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="kv-card kv-glass-hover px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white"
              aria-label="Continue with Google"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              className="kv-card kv-glass-hover px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white"
              aria-label="Continue with Apple"
            >
              <AppleIcon />
              Apple
            </button>
          </div>

          {/* Footer accent */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <Sparkles className="w-3 h-3 text-[var(--kv-mystic)]" />
            <p className="text-[10px] text-[var(--kv-text-muted)] tracking-wider uppercase">
              Auren Kingdom · Built for Ramadan
            </p>
          </div>
        </motion.div>
      </div>
    </KingdomShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 12S6.9 22 12 22c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.3-.9-2.3-3.5zm-2.5-6.6c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.5.6-1 1.7-.9 2.7 1 .1 2-.5 2.6-1.2z"
      />
    </svg>
  );
}
