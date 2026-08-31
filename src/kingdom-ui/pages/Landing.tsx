'use client';

import { motion } from 'framer-motion';
import { KingdomShell, AIOrb } from '../components';
import { Sparkles, Utensils, Truck, Shield, Users, Brain } from 'lucide-react';

export function KingdomLanding() {
  return (
    <KingdomShell>
      <div className="max-w-md mx-auto px-5 pb-32">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="kv-hero-glow pt-20 pb-12 text-center"
        >
          <div className="flex justify-center mb-6">
            <AIOrb size="lg" state="idle" />
          </div>
          <h1 className="kv-gradient-text text-4xl sm:text-5xl font-extrabold tracking-tight">
            SwiftRamadan
          </h1>
          <p className="text-[var(--kv-text-secondary)] text-base mt-3 max-w-xs mx-auto">
            AI-powered halal marketplace for Ramadan. Delivered before Maghrib.
          </p>
          <div className="kv-accent-line mx-auto mt-6" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3 mb-16"
        >
          <button className="kv-btn kv-btn-royal w-full text-base">
            Begin Your Journey
          </button>
          <button className="kv-btn kv-btn-ghost w-full text-base">
            I Have an Account
          </button>
        </motion.div>

        {/* Features */}
        <div className="kv-stagger space-y-4 mb-16">
          {[
            { icon: Brain, title: 'AI Kitchen Intelligence', desc: 'Your personal AI companion for Ramadan dining.' },
            { icon: Utensils, title: 'Halal Marketplace', desc: 'Verified halal vendors across Lagos.' },
            { icon: Truck, title: 'Iftar Guarantee', desc: 'Delivered before Maghrib or your meal is free.' },
            { icon: Shield, title: 'Trust & Safety', desc: 'Every vendor verified. Every meal protected.' },
            { icon: Users, title: 'Community', desc: 'Break fast together. Share meals. Build bonds.' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="kv-card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--kv-royal-light)' }}>
                  <Icon className="w-5 h-5 text-[var(--kv-mystic)]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{f.title}</h3>
                  <p className="text-xs text-[var(--kv-text-tertiary)] mt-1">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust */}
        <div className="kv-card p-6 text-center mb-8">
          <p className="kv-gradient-gold text-2xl font-extrabold">12,000+</p>
          <p className="text-xs text-[var(--kv-text-tertiary)] uppercase tracking-wider mt-1">Families Served</p>
          <div className="kv-divider my-4" />
          <p className="kv-gradient-text text-2xl font-extrabold">98%</p>
          <p className="text-xs text-[var(--kv-text-tertiary)] uppercase tracking-wider mt-1">On-Time Delivery</p>
          <div className="kv-divider my-4" />
          <p className="text-2xl font-extrabold text-[var(--kv-emerald)]">4.9★</p>
          <p className="text-xs text-[var(--kv-text-tertiary)] uppercase tracking-wider mt-1">User Rating</p>
        </div>

        {/* Footer */}
        <div className="kv-divider mb-6" />
        <p className="text-center text-xs text-[var(--kv-text-muted)]">
          SwiftRamadan · Auren Kingdom · 2026
        </p>
      </div>
    </KingdomShell>
  );
}
