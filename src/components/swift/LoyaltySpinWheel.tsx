'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Sparkles, Clock, RotateCcw, Flame } from 'lucide-react';
import { useAppStore, useSpinWheel, useLoyalty } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

// Prize configuration (must match the API)
const WHEEL_PRIZES = [
  { id: 1, type: 'discount', value: 500, label: '₦500 Off', color: '#10E07A', icon: '💰', probability: 0.20 },
  { id: 2, type: 'swiftPoints', value: 50, label: '50 SwiftPoints', color: '#F5C451', icon: '⭐', probability: 0.20 },
  { id: 3, type: 'freeDelivery', value: 1, label: 'Free Delivery', color: '#38BDF8', icon: '🚀', probability: 0.10 },
  { id: 4, type: 'discount', value: 1000, label: '₦1,000 Off', color: '#10E07A', icon: '💰', probability: 0.10 },
  { id: 5, type: 'swiftPoints', value: 100, label: '100 SwiftPoints', color: '#F5C451', icon: '⭐', probability: 0.10 },
  { id: 6, type: 'multiplier', value: 2, label: '2x Points', color: '#A78BFA', icon: '✨', probability: 0.10 },
  { id: 7, type: 'discount', value: 2500, label: '₦2,500 Off', color: '#F5C451', icon: '💎', probability: 0.05, rare: true },
  { id: 8, type: 'jackpot', value: 500, label: '500pts+₦500', color: '#10E07A', icon: '🎰', probability: 0.05, jackpot: true },
];

const SEGMENT_ANGLE = 360 / WHEEL_PRIZES.length; // 45 degrees

interface SpinResult {
  prize: {
    id: number;
    type: string;
    value: number;
    label: string;
    rare: boolean;
    jackpot: boolean;
  };
  canSpin: boolean;
  streak: number;
  spinDate: string;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  size: number;
  angle: number;
}

interface LoyaltySpinWheelProps {
  onClose?: () => void;
}

export default function LoyaltySpinWheel({ onClose }: LoyaltySpinWheelProps) {
  const {
    lastSpinDate,
    setLastSpinDate,
    spinStreak,
    setSpinStreak,
    addPendingReward,
  } = useSpinWheel();
  const {
    swiftPoints,
    setSwiftPoints,
    hasanatPoints,
    setHasanatPoints,
  } = useLoyalty();

  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [ledPhase, setLedPhase] = useState(0);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Check if user can spin today
  const checkCanSpin = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return lastSpinDate !== today;
  }, [lastSpinDate]);

  // Update canSpin state
  useEffect(() => {
    setCanSpin(checkCanSpin());
  }, [checkCanSpin]);

  // Countdown timer to next available spin
  useEffect(() => {
    if (canSpin) return;

    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);

      // Re-check when countdown reaches zero
      if (diff <= 0) {
        setCanSpin(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [canSpin]);

  // LED animation during spin
  useEffect(() => {
    if (!isSpinning) return;
    const interval = setInterval(() => {
      setLedPhase(prev => (prev + 1) % 3);
    }, 100);
    return () => clearInterval(interval);
  }, [isSpinning]);

  // Generate confetti
  const generateConfetti = useCallback(() => {
    const colors = ['#10E07A', '#F5C451', '#38BDF8', '#A78BFA', '#FF6B6B', '#FFF'];
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100 - 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        angle: Math.random() * 360,
      });
    }
    setConfetti(particles);
  }, []);

  // Perform the spin
  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;

    setIsSpinning(true);
    setResult(null);
    setShowCelebration(false);

    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastSpinDate,
          spinStreak,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({ title: 'Spin Error', description: errorData.error || 'Something went wrong', variant: 'destructive' });
        setIsSpinning(false);
        return;
      }

      const data: SpinResult = await response.json();
      setResult(data);

      // Calculate the rotation to land on the winning segment
      const prizeIndex = WHEEL_PRIZES.findIndex(p => p.id === data.prize.id);
      // Each segment is SEGMENT_ANGLE degrees. We want the winning segment to be at the top (12 o'clock).
      // The pointer is at the top. Segment 0 starts at the top-right.
      // To land on segment i, the rotation should put segment i at the top.
      // We need to rotate such that the center of segment i is at 0 degrees (top).
      const segmentCenter = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      // The wheel needs to rotate so this segment center aligns with the top pointer
      // Plus extra full rotations for the spinning effect
      const extraRotations = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
      const targetRotation = extraRotations * 360 + (360 - segmentCenter);

      setRotation(prev => prev + targetRotation);

      // Wait for spin animation to finish
      setTimeout(() => {
        setIsSpinning(false);
        setShowCelebration(true);
        generateConfetti();

        // Update store
        setLastSpinDate(data.spinDate);
        setSpinStreak(data.streak);
        addPendingReward({
          type: data.prize.type,
          value: data.prize.value,
          label: data.prize.label,
        });
      }, 4200);
    } catch {
      toast({ title: 'Network Error', description: 'Please check your connection and try again', variant: 'destructive' });
      setIsSpinning(false);
    }
  };

  // Claim reward from celebration overlay
  const handleClaim = () => {
    if (!result) return;

    // Apply the reward based on type
    switch (result.prize.type) {
      case 'swiftPoints':
        setSwiftPoints(swiftPoints + result.prize.value);
        setHasanatPoints(hasanatPoints + Math.floor(result.prize.value / 2));
        toast({
          title: 'Points Added! 🎉',
          description: `+${result.prize.value} SwiftPoints & +${Math.floor(result.prize.value / 2)} Hasanat Points`,
        });
        break;
      case 'discount':
        toast({
          title: 'Discount Applied! 💰',
          description: `${result.prize.label} added to your rewards`,
        });
        break;
      case 'freeDelivery':
        toast({
          title: 'Free Delivery! 🚀',
          description: 'Your next delivery is on us!',
        });
        break;
      case 'multiplier':
        toast({
          title: '2x Points Tomorrow! ✨',
          description: 'Come back tomorrow for double points!',
        });
        break;
      case 'jackpot':
        setSwiftPoints(swiftPoints + 500);
        setHasanatPoints(hasanatPoints + 250);
        toast({
          title: 'JACKPOT! 🎰🌙',
          description: '+500 SwiftPoints, +250 Hasanat Points & ₦500 discount!',
        });
        break;
    }

    setShowCelebration(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0D14] flex flex-col items-center overflow-hidden">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 pt-4 pb-2 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--sr-vendor)]/20 flex items-center justify-center border border-[var(--sr-vendor)]/30">
            <Sparkles className="w-4 h-4 text-[var(--sr-vendor)]" />
          </div>
          <h2 className="text-white text-lg font-bold">Daily Spin & Win</h2>
        </div>
        <button
          onClick={() => {
            if (onClose) onClose();
            else useAppStore.getState().setActiveModal('rewards');
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Streak Badge */}
      {spinStreak > 0 && (
        <div className="flex items-center gap-2 mt-2 mb-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/20">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[var(--sr-vendor)] text-xs font-bold">{spinStreak} Day Streak</span>
          </div>
          {spinStreak >= 3 && (
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20">
              <Zap className="w-3 h-3 text-[#A78BFA]" />
              <span className="text-[#A78BFA] text-[10px] font-bold">2x Bonus</span>
            </div>
          )}
        </div>
      )}

      {/* Wheel Container */}
      <div className="flex-1 flex flex-col items-center justify-center relative -mt-4">
        {/* Pointer Arrow */}
        <div className="absolute z-20 top-0 left-1/2 -translate-x-1/2" style={{ marginTop: '0px' }}>
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-[#F5C451] drop-shadow-[0_2px_8px_rgba(245,196,81,0.5)]" />
        </div>

        {/* Outer LED Ring */}
        <div className="relative" style={{ width: 'min(340px, 85vw)', height: 'min(340px, 85vw)' }}>
          {/* LED dots around the wheel */}
          <div className="absolute inset-0">
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const isActive = isSpinning
                ? (i + ledPhase) % 3 === 0
                : false;
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full transition-all duration-100"
                  style={{
                    top: `${50 - 48 * Math.cos((angle * Math.PI) / 180)}%`,
                    left: `${50 + 48 * Math.sin((angle * Math.PI) / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                    background: isActive ? '#F5C451' : 'rgba(245,196,81,0.2)',
                    boxShadow: isActive ? '0 0 8px #F5C451, 0 0 16px rgba(245,196,81,0.4)' : 'none',
                  }}
                />
              );
            })}
          </div>

          {/* Gold Border Ring */}
          <div
            className="absolute rounded-full border-2 border-[var(--sr-vendor)]/40"
            style={{
              inset: '6px',
              boxShadow: isSpinning
                ? '0 0 30px rgba(245,196,81,0.3), inset 0 0 30px rgba(245,196,81,0.1)'
                : '0 0 15px rgba(245,196,81,0.1)',
            }}
          />

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="absolute rounded-full overflow-hidden"
            style={{
              inset: '10px',
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                : 'none',
            }}
          >
            {/* Segments */}
            {WHEEL_PRIZES.map((prize, i) => {
              const startAngle = i * SEGMENT_ANGLE;
              const isEven = i % 2 === 0;
              // Use alternating shades from the prize color
              const bgColor = isEven ? prize.color : `${prize.color}CC`;
              const darkBg = isEven ? `${prize.color}30` : `${prize.color}20`;

              return (
                <div
                  key={prize.id}
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.sin(((startAngle + SEGMENT_ANGLE) * Math.PI) / 180)}% ${50 - 50 * Math.cos(((startAngle + SEGMENT_ANGLE) * Math.PI) / 180)}%)`,
                    background: `linear-gradient(${startAngle + 22.5}deg, ${bgColor}, ${darkBg})`,
                    opacity: !canSpin && !isSpinning ? 0.3 : 1,
                  }}
                >
                  {/* Segment text */}
                  <div
                    className="absolute text-center"
                    style={{
                      top: '22%',
                      left: '50%',
                      transform: `rotate(${startAngle + SEGMENT_ANGLE / 2}deg) translateX(-50%)`,
                      transformOrigin: '50% 200%',
                      width: '70px',
                    }}
                  >
                    <span className="text-lg block">{prize.icon}</span>
                    <span className="text-[8px] font-bold text-white block leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {prize.label}
                    </span>
                    {prize.rare && (
                      <span className="text-[7px] font-bold text-[var(--sr-vendor)] block mt-0.5">RARE</span>
                    )}
                    {prize.jackpot && (
                      <span className="text-[7px] font-bold text-[var(--sr-vendor)] block mt-0.5 animate-pulse">JACKPOT</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Segment divider lines */}
            {WHEEL_PRIZES.map((_, i) => {
              const angle = i * SEGMENT_ANGLE;
              return (
                <div
                  key={`line-${i}`}
                  className="absolute top-1/2 left-1/2 bg-[var(--sr-vendor)]/30"
                  style={{
                    width: '1px',
                    height: '50%',
                    transformOrigin: '0 0',
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              );
            })}
          </div>

          {/* Center Hub */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              onClick={handleSpin}
              disabled={isSpinning || !canSpin}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#F5C451]/50"
              style={{
                background: canSpin
                  ? 'linear-gradient(135deg, #F5C451, #E5A830)'
                  : 'linear-gradient(135deg, #555, #444)',
                boxShadow: canSpin
                  ? '0 4px 20px rgba(245,196,81,0.5), 0 0 40px rgba(245,196,81,0.2)'
                  : '0 2px 10px rgba(0,0,0,0.3)',
              }}
              aria-label={canSpin ? 'Spin the wheel' : 'Already spun today'}
            >
              {isSpinning ? (
                <RotateCcw className="w-6 h-6 text-[#0B0D14] animate-spin" />
              ) : (
                <span className="text-[#0B0D14] font-black text-sm sm:text-base">
                  {canSpin ? 'SPIN' : '✓'}
                </span>
              )}
              {/* Hub border ring */}
              <div className="absolute inset-0 rounded-full border-2 border-[#0B0D14]/20" />
              {/* Inner ring */}
              <div className="absolute inset-1 rounded-full border border-white/20" />
            </button>
          </div>
        </div>

        {/* Status Text */}
        <div className="mt-6 text-center">
          {canSpin && !isSpinning && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/60 text-sm"
            >
              Tap <span className="text-[var(--sr-vendor)] font-bold">SPIN</span> to win a prize!
            </motion.p>
          )}
          {isSpinning && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[var(--sr-vendor)] text-sm font-bold animate-pulse"
            >
              Spinning... 🎰
            </motion.p>
          )}
          {!canSpin && !isSpinning && (
            <div className="text-center">
              <p className="text-white/65 text-sm mb-1">You&apos;ve already spun today!</p>
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--sr-vendor)]/60" />
                <span className="text-[var(--sr-vendor)] text-sm font-mono font-bold">{countdown}</span>
              </div>
              <p className="text-white/60 text-xs mt-1">until next free spin</p>
            </div>
          )}
        </div>
      </div>

      {/* Prize Legend */}
      <div className="w-full px-4 pb-6 mt-4">
        <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Prize List</p>
          <div className="grid grid-cols-4 gap-2">
            {WHEEL_PRIZES.map((prize) => (
              <div key={prize.id} className="flex flex-col items-center gap-1 py-1.5">
                <span className="text-base">{prize.icon}</span>
                <span className="text-white/70 text-[9px] font-semibold text-center leading-tight">{prize.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && result && (
          <>
            {/* Confetti */}
            <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
              {confetti.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{
                    x: `${particle.x}vw`,
                    y: '-10vh',
                    opacity: 1,
                    rotate: 0,
                  }}
                  animate={{
                    y: '110vh',
                    opacity: [1, 1, 0],
                    rotate: particle.angle + 720,
                  }}
                  transition={{
                    duration: 2.5,
                    delay: particle.delay,
                    ease: 'easeIn',
                  }}
                  className="absolute"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    background: particle.color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  }}
                />
              ))}
            </div>

            {/* Celebration Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 40 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="w-full max-w-sm relative overflow-hidden rounded-3xl border border-[var(--sr-vendor)]/30"
                style={{ background: 'linear-gradient(135deg, #1A1D26, #0F1117)' }}
              >
                {/* Glow effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px]" style={{ background: result.prize.jackpot ? '#F5C451' : '#10E07A', opacity: 0.2 }} />
                <div className="absolute -bottom-20 -left-20 w-32 h-32 rounded-full bg-[#A78BFA]/20 blur-[40px]" />

                <div className="relative z-10 p-8 text-center">
                  {/* Prize icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2, stiffness: 150 }}
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-2"
                    style={{
                      background: result.prize.jackpot ? 'linear-gradient(135deg, #F5C451/20, #F5C451/10)' : 'linear-gradient(135deg, #10E07A/20, #10E07A/10)',
                      borderColor: result.prize.jackpot ? '#F5C451/50' : '#10E07A/50',
                    }}
                  >
                    <span className="text-4xl">
                      {result.prize.jackpot ? '🎰' : result.prize.rare ? '💎' : '🎁'}
                    </span>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-black mb-1"
                    style={{ color: result.prize.jackpot ? '#F5C451' : '#10E07A' }}
                  >
                    {result.prize.jackpot ? 'JACKPOT! 🌙' : result.prize.rare ? 'RARE WIN!' : 'You Won! 🎉'}
                  </motion.h3>

                  {/* Prize label */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white text-xl font-bold mb-2"
                  >
                    {result.prize.label}
                  </motion.p>

                  {/* Streak info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 mb-6"
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-white/60 text-sm font-semibold">{result.streak} Day Spin Streak</span>
                    {result.streak >= 3 && (
                      <span className="text-[#A78BFA] text-xs font-bold">(2x Active!)</span>
                    )}
                  </motion.div>

                  {/* Claim button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaim}
                    className="w-full py-3.5 rounded-2xl text-[#0B0D14] font-black text-base transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #10E07A, #0CC06A)',
                      boxShadow: '0 4px 20px rgba(16,224,122,0.4)',
                    }}
                  >
                    Claim Reward 🎁
                  </motion.button>

                  <p className="text-white/60 text-xs mt-3">Reward added to your account</p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
