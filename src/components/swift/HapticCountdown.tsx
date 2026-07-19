'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Heart } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface CountdownState {
  seconds: number;
  phase: 'idle' | 'countdown' | 'ready' | 'almost' | 'iftar';
}

function computePhase(secs: number): CountdownState['phase'] {
  if (secs > 30) return 'countdown';
  if (secs > 10) return 'ready';
  if (secs > 0) return 'almost';
  return 'iftar';
}

export default function HapticCountdown() {
  const { activeModal, setActiveModal } = useAppStore();
  const isOpen = activeModal === 'haptic-countdown';

  const [state, setState] = useState<CountdownState>({ seconds: 60, phase: 'idle' });
  const [maghribSeconds, setMaghribSeconds] = useState<number | null>(null);
  const vibrationRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openRef = useRef(false);

  useEffect(() => { openRef.current = isOpen; }, [isOpen]);

  // Fetch Maghrib countdown — inline fetch to keep setState in async callback only
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    void fetch('/api/adhan')
      .then((res) => res.json())
      .then((data) => {
        const secs = data.maghribCountdown?.secondsUntil ?? 60;
        if (!cancelled && openRef.current) setMaghribSeconds(secs);
      })
      .catch(() => {
        if (!cancelled && openRef.current) setMaghribSeconds(60);
      });

    return () => { cancelled = true; };
  }, [isOpen]);

  // Countdown timer — initial phase derived from maghribSeconds via setState in interval callback
  useEffect(() => {
    if (!isOpen || maghribSeconds === null) return;

    // Compute initial state inside a microtask to avoid synchronous setState in effect
    const secs = Math.max(0, Math.min(60, maghribSeconds));
    // Use queueMicrotask so setState happens asynchronously
    queueMicrotask(() => {
      if (openRef.current) {
        setState({ seconds: secs, phase: computePhase(secs) });
      }
    });

    intervalRef.current = setInterval(() => {
      setMaghribSeconds((prev) => {
        if (prev === null) return null;
        const newSecs = Math.max(0, prev - 1);
        setState({ seconds: newSecs, phase: computePhase(newSecs) });
        return newSecs;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, maghribSeconds]);

  // Haptic feedback
  useEffect(() => {
    if (!isOpen || state.phase === 'idle' || state.phase === 'iftar') return;

    const vibrate = () => {
      if (!navigator.vibrate) return;

      if (state.phase === 'countdown') {
        navigator.vibrate([50, 100, 50]);
      } else if (state.phase === 'ready') {
        navigator.vibrate([40, 80, 40]);
      } else if (state.phase === 'almost') {
        navigator.vibrate([30, 50, 30, 50, 30]);
      }
    };

    const interval = setInterval(vibrate, state.phase === 'countdown' ? 3000 : state.phase === 'ready' ? 2000 : 1000);
    return () => clearInterval(interval);
  }, [isOpen, state.phase]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, setActiveModal]);

  // Cleanup vibration on close
  useEffect(() => {
    if (!isOpen && vibrationRef.current) {
      if (navigator.vibrate) navigator.vibrate(0);
      vibrationRef.current = false;
    }
    if (isOpen) vibrationRef.current = true;
  }, [isOpen]);

  const getMessage = () => {
    switch (state.phase) {
      case 'countdown': return { text: 'Preparing for Iftar...' };
      case 'ready': return { text: 'Get your dates ready!' };
      case 'almost': return { text: 'Almost time! 🌙' };
      case 'iftar': return { text: "IT'S IFTAR! 🎉" };
      default: return { text: '' };
    }
  };

  const getGradient = () => {
    switch (state.phase) {
      case 'countdown': return 'from-[#0B0D14] via-[#0F1118] to-[#0B0D14]';
      case 'ready': return 'from-[#0B0D14] via-[#1a1508] to-[#0B0D14]';
      case 'almost': return 'from-[#1a1508] via-[#2a1f0a] to-[#1a1508]';
      case 'iftar': return 'from-[#0a1a0d] via-[#0B0D14] to-[#0a1a0d]';
      default: return 'from-[#0B0D14] to-[#0F1118]';
    }
  };

  const getAccentColor = () => {
    switch (state.phase) {
      case 'countdown': return '#10E07A';
      case 'ready': return '#F5C451';
      case 'almost': return '#F5C451';
      case 'iftar': return '#10E07A';
      default: return '#10E07A';
    }
  };

  const msg = getMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Iftar Countdown"
        >
          {/* Full-screen aurora gradient background */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-b ${getGradient()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Aurora orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute w-96 h-96 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle, ${getAccentColor()}40, transparent 70%)`,
                  top: '20%',
                  left: '50%',
                  x: '-50%',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.15, 0.3, 0.15],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute w-64 h-64 rounded-full opacity-10"
                style={{
                  background: 'radial-gradient(circle, rgba(167,139,250,0.4), transparent 70%)',
                  bottom: '10%',
                  right: '10%',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.08, 0.18, 0.08],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            </div>
          </motion.div>

          {/* Close button */}
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
            aria-label="Close countdown"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
            {/* Heartbeat icon */}
            <motion.div
              animate={
                state.phase === 'almost'
                  ? { scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }
                  : state.phase === 'iftar'
                  ? { scale: [1, 1.4, 1] }
                  : { scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }
              }
              transition={{
                duration: state.phase === 'almost' ? 0.5 : state.phase === 'iftar' ? 0.8 : 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="mb-6"
            >
              <Heart
                className="w-10 h-10"
                style={{ color: getAccentColor() }}
                fill={state.phase === 'iftar' ? getAccentColor() : 'none'}
              />
            </motion.div>

            {/* Countdown number */}
            <div className="relative mb-4">
              {state.phase !== 'iftar' && (
                <motion.div
                  key={state.seconds}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="text-[120px] sm:text-[160px] font-black leading-none"
                  style={{ color: getAccentColor() }}
                >
                  {state.seconds}
                </motion.div>
              )}
              {state.phase === 'iftar' && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl sm:text-8xl font-black leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #10E07A 0%, #F5C451 50%, #A78BFA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  🎉
                </motion.div>
              )}
            </div>

            {/* Seconds label */}
            {state.phase !== 'iftar' && (
              <motion.p
                className="text-sm font-medium text-white/40 mb-8 tracking-widest uppercase"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                seconds remaining
              </motion.p>
            )}

            {/* Message */}
            <AnimatePresence mode="wait">
              <motion.div
                key={state.phase}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="mb-6"
              >
                <p
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: getAccentColor() }}
                >
                  {msg.text}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress ring */}
            {state.phase !== 'iftar' && (
              <div className="relative w-48 h-48 mt-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke={getAccentColor()}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 90}
                    strokeDashoffset={2 * Math.PI * 90 * (1 - state.seconds / 60)}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-white/30 mx-auto mb-1" />
                    <p className="text-xs text-white/30">to Maghrib</p>
                  </div>
                </div>
              </div>
            )}

            {/* Iftar celebration particles */}
            {state.phase === 'iftar' && (
              <div className="flex gap-3 mt-6">
                {['#10E07A', '#F5C451', '#A78BFA', '#FB7185'].map((color, i) => (
                  <motion.div
                    key={color}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.2, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
