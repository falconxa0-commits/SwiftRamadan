'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Heart,
  ChevronRight,
  Flame,
  Moon,
  Utensils,
  Truck,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════
   WELCOME SCREEN — ULTRA LUXURY, WARM & GENIUS
   ══════════════════════════════════════════════════════════════════ */

/* ─────────────── Aurora Gradient Mesh ─────────────── */
function AuroraMesh() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(165deg, #080B12 0%, #0A0F1C 25%, #0D1117 50%, #0F0E0A 80%, #0A0806 100%)',
      }} />

      {/* Warm top-right aurora */}
      <motion.div
        className="absolute -top-[40%] -right-[20%] w-[80vw] h-[80vh] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.02) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -15, 10, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Warm bottom-left aurora */}
      <motion.div
        className="absolute -bottom-[30%] -left-[20%] w-[70vw] h-[70vh] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(180,120,40,0.06) 0%, rgba(19,236,19,0.02) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -15, 10, 0],
          y: [0, 20, -10, 0],
          scale: [1, 0.95, 1.03, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center warm glow */}
      <motion.div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[60vw] h-[50vh] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.04) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />
    </div>
  );
}

/* ─────────────── Floating Sparkle ─────────────── */
function Sparkle({ delay, x, y, size }: {
  delay: number; x: number; y: number; size: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
      }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 10 10" className="w-full h-full">
        <path
          d="M5 0L5.5 4.5L10 5L5.5 5.5L5 10L4.5 5.5L0 5L4.5 4.5Z"
          fill="rgba(212,175,55,0.7)"
        />
      </svg>
    </motion.div>
  );
}

/* ─────────────── Breathing Ring ─────────────── */
function BreathingRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="w-[280px] h-[280px] rounded-full"
        style={{
          border: '1px solid rgba(212,175,55,0.08)',
          boxShadow: '0 0 60px rgba(212,175,55,0.04) inset, 0 0 60px rgba(212,175,55,0.02)',
        }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.4, 0.15, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full"
        style={{
          border: '1px solid rgba(212,175,55,0.04)',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[480px] h-[480px] rounded-full"
        style={{
          border: '1px solid rgba(19,236,19,0.03)',
        }}
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.15, 0.05, 0.15],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ─────────────── Elegant Divider ─────────────── */
function ElegantDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <motion.div
        className="h-px flex-1"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 2.2, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.div
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 45 }}
        transition={{ delay: 2.4, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-1.5 h-1.5 rotate-45"
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #B8860B)',
          boxShadow: '0 0 8px rgba(212,175,55,0.3)',
        }}
      />
      <motion.div
        className="h-px flex-1"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 2.2, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  );
}

/* ─────────────── Category Card ─────────────── */
function CategoryPill({ icon: Icon, label, delay, color }: {
  icon: React.ElementType; label: string; delay: number; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          border: `1px solid ${color}25`,
          boxShadow: `0 0 20px ${color}08`,
        }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

/* ─────────────── Feature Showcase Card ─────────────── */
function FeatureShowcase({ icon: Icon, title, desc, delay, accent, tag }: {
  icon: React.ElementType; title: string; desc: string; delay: number; accent: string; tag: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      <div
        className="relative overflow-hidden rounded-2xl p-4 transition-all duration-500 hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Top accent glow */}
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}40, transparent)`,
          }}
        />

        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${accent}15, ${accent}08)`,
              border: `1px solid ${accent}20`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white text-sm font-bold tracking-tight">{title}</h3>
              <span
                className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  color: accent,
                  background: `${accent}15`,
                  border: `1px solid ${accent}20`,
                }}
              >
                {tag}
              </span>
            </div>
            <p className="text-white/35 text-xs leading-relaxed">{desc}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Social Proof Stat ─────────────── */
function ProofStat({ value, label, sub, delay }: {
  value: string; label: string; sub: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-1"
    >
      <span
        className="text-2xl font-black tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #F5E6A3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {value}
      </span>
      <span className="text-white/60 text-xs font-bold">{label}</span>
      <span className="text-white/25 text-[9px] font-medium">{sub}</span>
    </motion.div>
  );
}

/* ─────────────── Testimonial Card ─────────────── */
function TestimonialCard({ name, area, text, delay }: {
  name: string; area: string; text: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(212,175,55,0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex -space-x-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-3 h-3 text-[#D4AF37]" fill="#D4AF37" />
          ))}
        </div>
      </div>
      <p className="text-white/50 text-xs leading-relaxed mb-3 italic">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 flex items-center justify-center">
          <span className="text-[8px] font-black text-[#D4AF37]">{name[0]}</span>
        </div>
        <div>
          <span className="text-white/60 text-[10px] font-bold">{name}</span>
          <span className="text-white/25 text-[10px] ml-1">{area}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN WELCOME SCREEN
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

  // Sparkle positions - useMemo to avoid re-renders
  const sparkles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      delay: Math.random() * 8,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 6 + Math.random() * 8,
    })),
  []);

  // Spring config for smooth animations
  const springConfig = { type: 'spring' as const, damping: 20, stiffness: 120 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden"
      style={{ background: '#080B12' }}
    >
      {/* ── Aurora Background ── */}
      <AuroraMesh />

      {/* ── Floating Sparkles ── */}
      <div className="fixed inset-0 pointer-events-none">
        {mounted && sparkles.map((s) => (
          <Sparkle key={s.id} {...s} />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-col min-h-screen px-6 py-6 safe-area-inset">

        {/* ═══ Section 1: Logo + Branding ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-2 pt-4"
        >
          {/* Logo */}
          <motion.div
            {...springConfig}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: 'spring', damping: 15, stiffness: 100 }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px rgba(212,175,55,0)',
                  '0 0 40px rgba(212,175,55,0.12)',
                  '0 0 0px rgba(212,175,55,0)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center"
              style={{
                border: '1.5px solid rgba(212,175,55,0.25)',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))',
                boxShadow: '0 8px 32px rgba(212,175,55,0.08)',
              }}
            >
              <img
                src="/swiftramadan-logo.png"
                alt="SwiftRamadan"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col items-center gap-0.5"
          >
            <span
              className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.25em]"
              style={{
                textShadow: '0 0 20px rgba(212,175,55,0.15)',
              }}
            >
              SwiftRamadan
            </span>
            <span className="text-white/20 text-[9px] font-medium uppercase tracking-[0.35em]">
              Lagos &bull; 2026
            </span>
          </motion.div>
        </motion.div>

        {/* ═══ Section 2: Hero Text with Islamic Greeting ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="flex flex-col items-center text-center mt-8 mb-5 relative"
        >
          <BreathingRing />

          {/* Arabic Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 mb-4"
          >
            <span
              className="text-[#D4AF37]/50 text-lg font-light tracking-wide"
              style={{
                textShadow: '0 0 30px rgba(212,175,55,0.1)',
              }}
            >
              ٱلسَّلَامُ عَلَيْكُمْ
            </span>
          </motion.div>

          {/* Main Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10"
          >
            <h1 className="text-white text-[36px] font-extrabold leading-[0.95] tracking-[-0.025em]">
              Your Ramadan,
            </h1>
            <h1
              className="text-[38px] font-extrabold leading-[0.95] tracking-[-0.025em]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 30%, #D4AF37 60%, #C5962C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.15))',
              }}
            >
              Elevated.
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-white/40 text-sm leading-relaxed max-w-[300px] mt-4 relative z-10"
          >
            From Iftar to Sahur, every meal delivered{'\n'}
            with care, warmth & perfect timing.
          </motion.p>
        </motion.div>

        {/* ═══ Section 3: Category Showcase ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mb-5"
        >
          <div className="flex items-center justify-around px-2">
            <CategoryPill icon={Utensils} label="Iftar" delay={1.7} color="#D4AF37" />
            <CategoryPill icon={Moon} label="Sahur" delay={1.8} color="#8B9DC3" />
            <CategoryPill icon={Flame} label="Grills" delay={1.9} color="#E8652D" />
            <CategoryPill icon={Truck} label="Delivery" delay={2.0} color="#13ec13" />
            <CategoryPill icon={Sparkles} label="Premium" delay={2.1} color="#9B59B6" />
          </div>
        </motion.div>

        {/* ═══ Section 4: Feature Cards ═══ */}
        <div className="flex flex-col gap-3 mb-5">
          <FeatureShowcase
            icon={Clock}
            title="Iftar Precision Delivery"
            desc="Hot gourmet meals from top Lagos kitchens, timed to the Maghrib adhan."
            delay={2.0}
            accent="#D4AF37"
            tag="Signature"
          />
          <FeatureShowcase
            icon={Users}
            title="Community Group Buy"
            desc="Premium Ramadan staples at wholesale prices through neighborhood pooling."
            delay={2.15}
            accent="#13ec13"
            tag="Popular"
          />
          <FeatureShowcase
            icon={Zap}
            title="Lightning Dispatch"
            desc="Riders deployed within minutes. Real-time tracking from kitchen to doorstep."
            delay={2.3}
            accent="#3b82f6"
            tag="Fast"
          />
        </div>

        {/* ═══ Section 5: Social Proof ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.8 }}
          className="mb-4"
        >
          <ElegantDivider />
          <div className="flex items-center justify-around py-4 px-2">
            <ProofStat value="12K+" label="Families" sub="served daily" delay={2.4} />
            <div className="w-px h-12 bg-white/[0.06]" />
            <ProofStat value="98%" label="On-time" sub="Iftar delivery" delay={2.5} />
            <div className="w-px h-12 bg-white/[0.06]" />
            <ProofStat value="4.9" label="Rating" sub="from Lagos" delay={2.6} />
          </div>
          <ElegantDivider />
        </motion.div>

        {/* ═══ Section 6: Testimonial ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.6 }}
          className="mb-5"
        >
          <TestimonialCard
            name="Amina B."
            area="Lekki"
            text="My iftar was still steaming when it arrived. SwiftRamadan made Ramadan so much easier for my family."
            delay={2.7}
          />
        </motion.div>

        {/* ═══ Section 7: Trust Badges ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.6 }}
          className="flex items-center justify-center gap-6 mb-6"
        >
          {[
            { Icon: Shield, label: 'Secure' },
            { Icon: Heart, label: 'Trusted' },
            { Icon: Star, label: 'Rated #1' },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-[#D4AF37]/30" />
              <span className="text-white/20 text-[10px] font-medium tracking-wide">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* ═══ Section 8: CTA Buttons ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.0, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col gap-3 mt-auto pb-4"
        >
          {/* Primary CTA - Gold Gradient with Shimmer */}
          <button
            onClick={handleGetStarted}
            className="relative group w-full h-[58px] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-200"
          >
            {/* Button gradient */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 25%, #D4AF37 50%, #C5962C 75%, #D4AF37 100%)',
            }} />

            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)',
                backgroundSize: '250% 100%',
              }}
              animate={{ backgroundPosition: ['250% 0', '-250% 0'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center gap-2 h-full">
              <span className="text-[#080B12] text-base font-extrabold tracking-wide">Begin Your Journey</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-5 h-5 text-[#080B12]" />
              </motion.div>
            </div>

            {/* Bottom glow */}
            <div className="absolute -bottom-3 left-6 right-6 h-8 blur-xl rounded-full" style={{
              background: 'rgba(212,175,55,0.25)',
            }} />
          </button>

          {/* Secondary CTA - Glass with Warm Accent */}
          <button
            onClick={handleSignIn}
            className="group w-full h-[52px] rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-300 hover:border-[#D4AF37]/15 hover:bg-white/[0.04]"
          >
            <span className="text-white/45 text-sm font-medium">Already part of the family?</span>
            <span className="text-[#D4AF37] text-sm font-bold group-hover:underline underline-offset-4">Sign In</span>
            <ChevronRight className="w-4 h-4 text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
