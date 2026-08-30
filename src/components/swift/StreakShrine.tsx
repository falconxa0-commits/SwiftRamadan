'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Share2, ChevronRight, Star, Building2 } from 'lucide-react';
import { useNavigation, useLoyalty } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface ShrineStageInfo {
  id: string;
  name: string;
  dayRange: [number, number];
  description: string;
  color: string;
  unlockedMessage: string;
  progress: number;
}

interface StreakData {
  current: number;
  longest: number;
  lastDate: string;
}

interface ShrineData {
  currentStage: ShrineStageInfo;
  unlockedStages: ShrineStageInfo[];
  nextStage: ShrineStageInfo | null;
  overallProgress: number;
}

interface StreakShrineProps {
  onClose?: () => void;
}

// SVG mosque builder - progressive stages
function MosqueSVG({ stage, progress, streak }: { stage: string; progress: number; streak: number }) {
  const green = '#10E07A';
  const gold = '#F5C451';
  const purple = '#A78BFA';
  const bg = '#0F1118';
  const wallBase = '#1A1D26';

  return (
    <svg viewBox="0 0 300 350" className="w-full h-full" aria-label={`Mosque at ${stage} stage, ${streak} days`}>
      {/* Sky background */}
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B0D14" />
          <stop offset="100%" stopColor="#0F1118" />
        </linearGradient>
        <linearGradient id="domeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.9" />
          <stop offset="100%" stopColor={gold} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E2130" />
          <stop offset="100%" stopColor={wallBase} />
        </linearGradient>
        <radialGradient id="glowGreen" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={green} stopOpacity="0.3" />
          <stop offset="100%" stopColor={green} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowGold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowPurple" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={purple} stopOpacity="0.3" />
          <stop offset="100%" stopColor={purple} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="300" height="350" fill="url(#skyGrad)" />

      {/* Stars */}
      {Array.from({ length: 15 }).map((_, i) => (
        <circle
          key={`star-${i}`}
          cx={20 + (i * 37) % 280}
          cy={10 + (i * 23) % 80}
          r={0.5 + (i % 3) * 0.5}
          fill="white"
          opacity={0.2 + (i % 5) * 0.1}
        />
      ))}

      {/* Moon */}
      <circle cx="250" cy="40" r="15" fill={gold} opacity="0.3" />
      <circle cx="255" cy="37" r="13" fill="#0B0D14" />

      {/* Ground */}
      <rect x="0" y="290" width="300" height="60" fill="#0D0F16" />
      <line x1="0" y1="290" x2="300" y2="290" stroke={green} strokeWidth="0.5" opacity="0.3" />

      {/* Stage 1: Foundation (Days 1-5) */}
      {streak >= 1 && (
        <g opacity={streak >= 1 ? 1 : 0.1}>
          <rect x="60" y="270" width="180" height="20" rx="2" fill="url(#wallGrad)" stroke={green} strokeWidth="0.8" strokeOpacity="0.4" />
          {/* Foundation glow */}
          <ellipse cx="150" cy="280" rx="100" ry="30" fill="url(#glowGreen)" />
          {/* Foundation lines */}
          <line x1="80" y1="275" x2="220" y2="275" stroke={green} strokeWidth="0.5" opacity="0.3" />
          <line x1="80" y1="280" x2="220" y2="280" stroke={green} strokeWidth="0.5" opacity="0.2" />
          <line x1="80" y1="285" x2="220" y2="285" stroke={green} strokeWidth="0.5" opacity="0.1" />
        </g>
      )}

      {/* Stage 2: Walls (Days 6-10) */}
      {streak >= 6 && (
        <g>
          {/* Left wall */}
          <rect x="60" y="190" width="50" height="80" fill="url(#wallGrad)" stroke={green} strokeWidth="0.8" strokeOpacity="0.4" />
          {/* Right wall */}
          <rect x="190" y="190" width="50" height="80" fill="url(#wallGrad)" stroke={green} strokeWidth="0.8" strokeOpacity="0.4" />
          {/* Center section */}
          <rect x="110" y="210" width="80" height="60" fill="url(#wallGrad)" stroke={green} strokeWidth="0.8" strokeOpacity="0.4" />
          {/* Door */}
          <rect x="135" y="240" width="30" height="30" rx="15" fill="#0B0D14" stroke={gold} strokeWidth="0.8" strokeOpacity="0.5" />
          {/* Windows */}
          <rect x="72" y="215" width="15" height="20" rx="7.5" fill="#0B0D14" stroke={gold} strokeWidth="0.5" strokeOpacity="0.3" />
          <rect x="213" y="215" width="15" height="20" rx="7.5" fill="#0B0D14" stroke={gold} strokeWidth="0.5" strokeOpacity="0.3" />
          {/* Wall glow */}
          <ellipse cx="150" cy="230" rx="80" ry="40" fill="url(#glowGreen)" />
        </g>
      )}

      {/* Stage 3: Arches (Days 11-15) */}
      {streak >= 11 && (
        <g>
          {/* Main arch */}
          <path d="M 120 210 Q 150 170 180 210" fill="none" stroke={gold} strokeWidth="2" strokeOpacity="0.6" />
          {/* Inner arch detail */}
          <path d="M 125 210 Q 150 178 175 210" fill="none" stroke={gold} strokeWidth="1" strokeOpacity="0.3" />
          {/* Side arches */}
          <path d="M 60 270 Q 75 250 90 270" fill="none" stroke={gold} strokeWidth="1.5" strokeOpacity="0.4" />
          <path d="M 210 270 Q 225 250 240 270" fill="none" stroke={gold} strokeWidth="1.5" strokeOpacity="0.4" />
          {/* Arch glow */}
          <ellipse cx="150" cy="190" rx="50" ry="30" fill="url(#glowGold)" />
        </g>
      )}

      {/* Stage 4: Dome (Days 16-20) */}
      {streak >= 16 && (
        <g>
          {/* Main dome */}
          <ellipse cx="150" cy="170" rx="55" ry="45" fill="url(#domeGrad)" />
          {/* Dome outline */}
          <ellipse cx="150" cy="170" rx="55" ry="45" fill="none" stroke={gold} strokeWidth="1" strokeOpacity="0.6" />
          {/* Dome ribs */}
          <path d="M 150 125 Q 150 170 150 215" fill="none" stroke={gold} strokeWidth="0.5" strokeOpacity="0.3" />
          <path d="M 120 135 Q 135 170 120 205" fill="none" stroke={gold} strokeWidth="0.5" strokeOpacity="0.2" />
          <path d="M 180 135 Q 165 170 180 205" fill="none" stroke={gold} strokeWidth="0.5" strokeOpacity="0.2" />
          {/* Dome base */}
          <rect x="95" y="205" width="110" height="8" fill="url(#wallGrad)" stroke={gold} strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Dome glow */}
          <ellipse cx="150" cy="160" rx="70" ry="50" fill="url(#glowGold)" />
        </g>
      )}

      {/* Stage 5: Minaret (Days 21-25) */}
      {streak >= 21 && (
        <g>
          {/* Left minaret */}
          <rect x="40" y="100" width="18" height="170" fill="url(#wallGrad)" stroke={purple} strokeWidth="0.8" strokeOpacity="0.4" />
          <ellipse cx="49" cy="100" rx="12" ry="10" fill="url(#wallGrad)" stroke={purple} strokeWidth="0.8" strokeOpacity="0.5" />
          {/* Minaret balcony */}
          <rect x="35" y="140" width="28" height="5" rx="1" fill="url(#wallGrad)" stroke={purple} strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Right minaret */}
          <rect x="242" y="100" width="18" height="170" fill="url(#wallGrad)" stroke={purple} strokeWidth="0.8" strokeOpacity="0.4" />
          <ellipse cx="251" cy="100" rx="12" ry="10" fill="url(#wallGrad)" stroke={purple} strokeWidth="0.8" strokeOpacity="0.5" />
          {/* Minaret balcony */}
          <rect x="237" y="140" width="28" height="5" rx="1" fill="url(#wallGrad)" stroke={purple} strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Minaret windows */}
          <rect x="45" y="160" width="8" height="12" rx="4" fill="#0B0D14" stroke={gold} strokeWidth="0.5" strokeOpacity="0.3" />
          <rect x="247" y="160" width="8" height="12" rx="4" fill="#0B0D14" stroke={gold} strokeWidth="0.5" strokeOpacity="0.3" />
          {/* Minaret glow */}
          <ellipse cx="49" cy="130" rx="30" ry="50" fill="url(#glowPurple)" />
          <ellipse cx="251" cy="130" rx="30" ry="50" fill="url(#glowPurple)" />
        </g>
      )}

      {/* Stage 6: Crescent & Complete (Days 26-30) */}
      {streak >= 26 && (
        <g>
          {/* Left crescent */}
          <circle cx="49" cy="88" r="6" fill={gold} opacity="0.9" />
          <circle cx="52" cy="86" r="5" fill="#0B0D14" />
          {/* Right crescent */}
          <circle cx="251" cy="88" r="6" fill={gold} opacity="0.9" />
          <circle cx="254" cy="86" r="5" fill="#0B0D14" />
          {/* Top crescent (main dome) */}
          <circle cx="150" cy="118" r="10" fill={gold} opacity="0.9" />
          <circle cx="154" cy="115" r="8" fill="#0B0D14" />
          {/* Crescent glow */}
          <ellipse cx="150" cy="110" rx="30" ry="25" fill="url(#glowGold)" />
          {/* Completion rays */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`ray-${i}`}
              x1="150"
              y1="100"
              x2={150 + Math.cos((i * 45 * Math.PI) / 180) * 25}
              y2={100 + Math.sin((i * 45 * Math.PI) / 180) * 25}
              stroke={gold}
              strokeWidth="0.5"
              opacity="0.2"
            />
          ))}
        </g>
      )}

      {/* Streak counter at bottom */}
      <text x="150" y="320" textAnchor="middle" fill={green} fontSize="16" fontWeight="bold" fontFamily="system-ui">
        {streak} {streak === 1 ? 'Day' : 'Days'}
      </text>
      <text x="150" y="340" textAnchor="middle" fill="white" fontSize="9" opacity="0.3" fontFamily="system-ui">
        Fasting Streak
      </text>
    </svg>
  );
}

function StreakShrineInner({ onClose }: StreakShrineProps) {
  const { activeModal, setActiveModal } = useNavigation();
  const { dailyStreak } = useLoyalty();
  const isOpen = activeModal === 'streak-shrine';
  const { toast } = useToast();

  const [streak, setStreak] = useState<StreakData | null>(null);
  const [shrine, setShrine] = useState<ShrineData | null>(null);
  const [stages, setStages] = useState<ShrineStageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const shrineRef = useRef<HTMLDivElement>(null);

  // Derive shrine stage from store's dailyStreak
  const shrineStage = dailyStreak <= 2 ? 'candle'
    : dailyStreak <= 6 ? 'lamp'
    : dailyStreak <= 13 ? 'lantern'
    : 'beacon';

  // Fetch streak data for supplementary info (longest streak, etc.)
  const fetchStreak = useCallback(async () => {
    try {
      const res = await fetch('/api/streak-shrine');
      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak);
        setShrine({
          ...data.shrine,
          // Override the currentStage to reflect the store-based stage
          currentStage: {
            ...data.shrine.currentStage,
            id: shrineStage,
            name: shrineStage === 'candle' ? 'Candle' : shrineStage === 'lamp' ? 'Lamp' : shrineStage === 'lantern' ? 'Lantern' : 'Beacon',
            progress: Math.min(100, Math.round((dailyStreak / 30) * 100)),
          },
          overallProgress: Math.min(100, Math.round((dailyStreak / 30) * 100)),
        });
        setStages(data.stages);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, [shrineStage, dailyStreak]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSharePreview) {
          setShowSharePreview(false);
        } else if (onClose) {
          onClose();
        } else {
          setActiveModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSharePreview, onClose, setActiveModal]);

  // Mark today's fast
  const handleMarkFast = async () => {
    if (marking) return;
    setMarking(true);

    try {
      const res = await fetch('/api/streak-shrine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });

      if (res.ok) {
        const data = await res.json();
        setStreak(prev => prev ? { ...prev, current: data.streak.current, longest: data.streak.longest } : null);

        toast({
          title: data.message,
          description: data.stageUnlocked || `Day ${data.streak.current} of 30`,
        });

        // Refresh data
        fetchStreak();
      } else {
        const errorData = await res.json();
        toast({ title: 'Already Logged', description: errorData.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to mark fast', variant: 'destructive' });
    } finally {
      setMarking(false);
    }
  };

  // Share the shrine
  const handleShare = () => {
    setShowSharePreview(true);
    toast({ title: 'Share Link Copied! 🔗', description: 'Your Streak Shrine is ready to share' });
  };

  const currentStageColor = shrine?.currentStage?.color || '#10E07A';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Streak Shrine"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ backgroundColor: `${currentStageColor}15`, borderColor: `${currentStageColor}25` }}>
            <Building2 className="w-4 h-4" style={{ color: currentStageColor }} />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Streak Shrine</h2>
            <p className="text-white/65 text-[10px]">Build your mosque, one fast at a time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Share streak shrine"
          >
            <Share2 className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={() => { if (onClose) onClose(); else setActiveModal(null); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close streak shrine"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--sr-customer)]/30 border-t-[#10E07A] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Mosque SVG Illustration */}
            <motion.div
              ref={shrineRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="mt-4 mx-auto max-w-[280px] aspect-[300/350] relative"
            >
              <MosqueSVG
                stage={shrine?.currentStage?.id || 'foundation'}
                progress={shrine?.currentStage?.progress || 0}
                streak={dailyStreak || 1}
              />
            </motion.div>

            {/* Streak Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
            >
              <div className="bg-[var(--sr-surface-raised)] rounded-xl border border-white/5 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-3.5 h-3.5 text-[var(--sr-vendor)]" />
                  <span className="text-[var(--sr-vendor)] text-lg font-black">{dailyStreak}</span>
                </div>
                <p className="text-white/60 text-[9px]">Current Streak</p>
              </div>
              <div className="bg-[var(--sr-surface-raised)] rounded-xl border border-white/5 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 text-[var(--sr-ai)]" />
                  <span className="text-[var(--sr-ai)] text-lg font-black">{streak?.longest || 0}</span>
                </div>
                <p className="text-white/60 text-[9px]">Longest Streak</p>
              </div>
              <div className="bg-[var(--sr-surface-raised)] rounded-xl border border-white/5 p-3 text-center">
                <span className="text-[var(--sr-customer)] text-lg font-black">{shrine?.overallProgress || 0}%</span>
                <p className="text-white/60 text-[9px]">Complete</p>
              </div>
            </motion.div>

            {/* Current Stage Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-2xl border p-3 sm:p-4"
              style={{
                background: `linear-gradient(135deg, ${currentStageColor}10, #0F1118)`,
                borderColor: `${currentStageColor}25`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${currentStageColor}15`, borderColor: `${currentStageColor}25` }}>
                  <Building2 className="w-5 h-5" style={{ color: currentStageColor }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-sm font-bold">{shrine?.currentStage?.name || 'Foundation'}</h3>
                  <p className="text-white/65 text-[10px]">{shrine?.currentStage?.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[10px]">Day {shrine?.currentStage?.dayRange?.[0]}-{shrine?.currentStage?.dayRange?.[1]}</p>
                  <p style={{ color: currentStageColor }} className="text-sm font-black">{shrine?.currentStage?.progress || 0}%</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${shrine?.currentStage?.progress || 0}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: currentStageColor }}
                />
              </div>
            </motion.div>

            {/* Next Milestone */}
            {shrine?.nextStage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-3 bg-[var(--sr-surface-raised)] rounded-xl border border-white/5 p-3 flex items-center gap-3"
              >
                <ChevronRight className="w-4 h-4 text-white/20" />
                <div className="flex-1">
                  <p className="text-white/50 text-[10px]">Next Milestone</p>
                  <p className="text-white text-xs font-bold">{shrine.nextStage.name} (Day {shrine.nextStage.dayRange[0]})</p>
                </div>
                <span className="text-white/60 text-[10px]">{shrine.nextStage.dayRange[0] - dailyStreak} days to go</span>
              </motion.div>
            )}

            {/* Mark Fast Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-5"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleMarkFast}
                disabled={marking}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                style={{
                  background: marking
                    ? 'linear-gradient(135deg, #555, #444)'
                    : `linear-gradient(135deg, ${currentStageColor}, ${currentStageColor}CC)`,
                  color: '#0B0D14',
                  boxShadow: marking ? 'none' : `0 4px 20px ${currentStageColor}40`,
                }}
                aria-label="Mark today's fast"
              >
                {marking ? (
                  <div className="w-5 h-5 border-2 border-[#0B0D14]/30 border-t-[#0B0D14] rounded-full animate-spin" />
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    Mark Today&apos;s Fast
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Stage Timeline */}
            <div className="mt-6">
              <p className="text-white/65 text-xs font-bold uppercase tracking-wider mb-3">Mosque Stages</p>
              <div className="space-y-1.5">
                {stages.map((stage, i) => {
                  const isUnlocked = shrine?.unlockedStages?.some(s => s.id === stage.id) || false;
                  const isCurrent = shrine?.currentStage?.id === stage.id;

                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-white/5 border-white/10'
                          : isUnlocked
                          ? 'bg-white/2 border-white/5'
                          : 'bg-transparent border-transparent opacity-40'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isUnlocked ? `${stage.color}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isUnlocked ? `${stage.color}40` : 'rgba(255,255,255,0.05)'}`,
                        }}
                      >
                        {isUnlocked ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={stage.color} strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-white/20 text-[8px]">{stage.dayRange[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-bold ${isUnlocked ? 'text-white/80' : 'text-white/60'}`}>
                          {stage.name}
                        </p>
                        <p className="text-white/20 text-[8px]">Day {stage.dayRange[0]}-{stage.dayRange[1]}</p>
                      </div>
                      {isCurrent && (
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: stage.color }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Share Preview */}
      <AnimatePresence>
        {showSharePreview && streak && shrine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-6"
            onClick={() => setShowSharePreview(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-full max-w-xs relative overflow-hidden rounded-3xl border border-[var(--sr-customer)]/30"
              style={{ background: 'linear-gradient(135deg, #1A1D26, #0F1117)' }}
              role="dialog"
              aria-modal="true"
              aria-label="Share your streak shrine"
            >
              <div className="p-6 text-center">
                <div className="mx-auto max-w-[200px] aspect-[300/350] mb-4">
                  <MosqueSVG
                    stage={shrine.currentStage.id}
                    progress={shrine.currentStage.progress}
                    streak={dailyStreak}
                  />
                </div>
                <h3 className="text-white text-lg font-bold mb-1">My Streak Shrine 🕌</h3>
                <p className="text-[var(--sr-customer)] text-sm font-bold">{dailyStreak} Day Fasting Streak</p>
                <p className="text-white/65 text-xs mt-1">{shrine.currentStage.name} Stage • {shrine.overallProgress}% Complete</p>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSharePreview(false)}
                  className="mt-5 w-full py-3 rounded-2xl font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #10E07A, #0CC06A)',
                    color: '#0B0D14',
                    boxShadow: '0 4px 20px rgba(16,224,122,0.3)',
                  }}
                >
                  Share Shrine 🔗
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(StreakShrineInner);
