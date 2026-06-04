'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, ChevronRight, Star, Zap, Shield, ArrowRight } from 'lucide-react';

/* ─────────────────── Floating Particle ─────────────────── */

function FloatingParticle({ delay, x, y, size, duration }: {
  delay: number; x: number; y: number; size: number; duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0) 70%)',
      }}
      animate={{
        y: [0, -20, 0],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/* ─────────────────── Animated Ring ─────────────────── */

function GlowRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="w-[300px] h-[300px] rounded-full border border-[#D4AF37]/10"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full border border-[#D4AF37]/5"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ─────────────────── Luxury Divider ─────────────────── */

function LuxuryDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40" />
      <div className="w-1 h-1 rounded-full bg-[#D4AF37]/25" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
    </div>
  );
}

/* ─────────────────── Stat Counter ─────────────────── */

function StatCounter({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-1"
    >
      <span className="text-white text-xl font-bold tracking-tight" style={{
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      <span className="text-[#D4AF37]/60 text-[10px] font-semibold uppercase tracking-[0.2em]">{label}</span>
    </motion.div>
  );
}

/* ─────────────────── Feature Card ─────────────────── */

function FeatureCard({ icon: Icon, title, desc, delay, accent }: {
  icon: React.ElementType; title: string; desc: string; delay: number; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-sm transition-all duration-500 hover:border-[#D4AF37]/20">
        {/* Top accent line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${accent}15, ${accent}08)`,
              border: `1px solid ${accent}20`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-bold tracking-tight mb-1">{title}</h3>
            <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN WELCOME SCREEN - ULTRA LUXURY
   ══════════════════════════════════════════════════════════════════ */

export default function WelcomeScreen() {
  const { setShowWelcome, setShowAuth } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = useCallback(() => {
    setShowWelcome(false);
    setShowAuth('role');
  }, [setShowWelcome, setShowAuth]);

  const handleSignIn = useCallback(() => {
    setShowWelcome(false);
    setShowAuth('login');
  }, [setShowWelcome, setShowAuth]);

  // Generate particles once
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 6,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 4 + Math.random() * 4,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden"
      style={{ background: '#030406' }}
    >
      {/* ── Layered Background ── */}
      
      {/* Deep radial glow - top center */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(212,175,55,0.08) 0%, transparent 70%)',
      }} />

      {/* Subtle emerald underglow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 50% at 50% 100%, rgba(19,236,19,0.03) 0%, transparent 60%)',
      }} />

      {/* Fine mesh texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Floating gold particles */}
      <div className="fixed inset-0 pointer-events-none">
        {mounted && particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-col min-h-screen px-6 py-8 safe-area-inset">
        
        {/* ── Section: Logo + Branding ── */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-3 pt-6"
        >
          {/* Logo Container with animated border */}
          <div className="relative">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px rgba(212,175,55,0)',
                  '0 0 30px rgba(212,175,55,0.15)',
                  '0 0 0px rgba(212,175,55,0)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-transparent flex items-center justify-center"
            >
              <img
                src="/swiftramadan-logo.png"
                alt="SwiftRamadan"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <motion.span
              initial={{ opacity: 0, letterSpacing: '0.3em' }}
              animate={{ opacity: 1, letterSpacing: '0.15em' }}
              transition={{ delay: 0.5, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-[0.15em]"
            >
              SwiftRamadan
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-white/25 text-[9px] font-medium uppercase tracking-[0.3em]"
            >
              Lagos 2026
            </motion.span>
          </div>
        </motion.div>

        {/* ── Section: Hero Text ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="flex flex-col items-center text-center mt-10 mb-6"
        >
          <GlowRing />
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10"
          >
            <h1 className="text-white text-[42px] font-extrabold leading-[0.95] tracking-[-0.02em]">
              Elevate
            </h1>
            <h1 className="text-white text-[42px] font-extrabold leading-[0.95] tracking-[-0.02em]">
              Your
            </h1>
            <h1
              className="text-[42px] font-extrabold leading-[0.95] tracking-[-0.02em]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 40%, #D4AF37 70%, #B8860B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Ramadan
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-white/35 text-sm leading-relaxed max-w-[280px] mt-5 relative z-10"
          >
            Premium Iftar deliveries. Curated meals.{'\n'}
            Timed perfectly for Maghrib.
          </motion.p>
        </motion.div>

        {/* ── Section: Feature Cards ── */}
        <div className="flex flex-col gap-3 mb-6">
          <FeatureCard
            icon={Clock}
            title="Iftar Precision Delivery"
            desc="Hot gourmet meals from top Lagos kitchens, synchronized with Maghrib adhan."
            delay={1.3}
            accent="#D4AF37"
          />
          <FeatureCard
            icon={Users}
            title="Community Group Buy"
            desc="Premium Ramadan staples at wholesale prices through community pooling."
            delay={1.5}
            accent="#13ec13"
          />
          <FeatureCard
            icon={Zap}
            title="Instant Dispatch"
            desc="Riders deployed within minutes. Real-time tracking from kitchen to doorstep."
            delay={1.7}
            accent="#3b82f6"
          />
        </div>

        {/* ── Section: Social Proof Stats ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mb-6"
        >
          <LuxuryDivider />
          <div className="flex items-center justify-around py-5">
            <StatCounter value="12K+" label="Users" delay={2.1} />
            <div className="w-px h-8 bg-white/[0.06]" />
            <StatCounter value="98%" label="On-time" delay={2.2} />
            <div className="w-px h-8 bg-white/[0.06]" />
            <StatCounter value="4.9" label="Rating" delay={2.3} />
          </div>
          <LuxuryDivider />
        </motion.div>

        {/* ── Section: Trust Badges ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.6 }}
          className="flex items-center justify-center gap-5 mb-8"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]/40" />
            <span className="text-white/25 text-[10px] font-medium tracking-wide">Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#D4AF37]/40" />
            <span className="text-white/25 text-[10px] font-medium tracking-wide">Trusted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]/40" />
            <span className="text-white/25 text-[10px] font-medium tracking-wide">Fast</span>
          </div>
        </motion.div>

        {/* ── Section: CTA Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col gap-4 mt-auto pb-4"
        >
          {/* Primary CTA - Gold Gradient */}
          <button
            onClick={handleGetStarted}
            className="relative group w-full h-[56px] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-200"
          >
            {/* Button background */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 30%, #D4AF37 60%, #B8860B 100%)',
            }} />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center gap-2 h-full">
              <span className="text-[#030406] text-base font-extrabold tracking-wide">Get Started</span>
              <ArrowRight className="w-5 h-5 text-[#030406] group-hover:translate-x-0.5 transition-transform" />
            </div>
            
            {/* Bottom glow */}
            <div className="absolute -bottom-2 left-4 right-4 h-6 blur-xl rounded-full" style={{
              background: 'rgba(212,175,55,0.3)',
            }} />
          </button>

          {/* Secondary CTA - Glass */}
          <button
            onClick={handleSignIn}
            className="group w-full h-[52px] rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-300 hover:border-[#D4AF37]/20 hover:bg-white/[0.05]"
          >
            <span className="text-white/60 text-sm font-medium">Already have an account?</span>
            <span className="text-[#D4AF37] text-sm font-bold group-hover:underline underline-offset-4">Sign In</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
