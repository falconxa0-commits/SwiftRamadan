'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Flame, Star, Check, Lock, ChevronRight, Award } from 'lucide-react';
import { useNavigation, useChallenges, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  day: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  badge: string | null;
  completed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

interface ChallengeStats {
  completed: number;
  total: number;
  percentage: number;
  pointsEarned: number;
  totalPoints: number;
}

interface Badge {
  day: number;
  badge: string;
  title: string;
}

interface ChallengeBoardProps {
  onClose?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  explore: '#10E07A',
  cook: '#F5C451',
  social: '#A78BFA',
  gift: '#38BDF8',
  eco: '#10E07A',
};

export default function ChallengeBoard({ onClose }: ChallengeBoardProps) {
  const { challengeProgress, completeChallenge } = useChallenges();
  const hasanatPoints = useAppStore(s => s.hasanatPoints);
  const setHasanatPoints = useAppStore(s => s.setHasanatPoints);
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'challenge-board';
  const { toast } = useToast();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  // Fetch challenges from API
  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch('/api/challenges');
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges);
        setStats(data.stats);
        setBadges(data.badges);
        setCurrentDay(data.currentDay);

        // Sync with local store
        data.challenges.forEach((c: Challenge) => {
          if (c.completed && !challengeProgress[c.id]) {
            completeChallenge(c.id);
          }
        });
      }
    } catch {
      // Fallback: use local store data
    } finally {
      setLoading(false);
    }
  }, [challengeProgress, completeChallenge]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedChallenge) {
          setSelectedChallenge(null);
        } else if (onClose) {
          onClose();
        } else {
          setActiveModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChallenge, onClose, setActiveModal]);

  // Complete a challenge
  const handleComplete = async (challenge: Challenge) => {
    if (challenge.completed || challenge.isLocked || completing) return;
    setCompleting(true);

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      if (res.ok) {
        const data = await res.json();
        completeChallenge(challenge.id);

        // Award hasanat points for completing the challenge
        setHasanatPoints(hasanatPoints + challenge.points);

        // Update local state
        setChallenges(prev => prev.map(c =>
          c.id === challenge.id ? { ...c, completed: true } : c
        ));
        setStats(prev => prev ? {
          ...prev,
          completed: data.stats.completed,
          percentage: data.stats.percentage,
          pointsEarned: prev.pointsEarned + challenge.points,
        } : null);

        if (challenge.badge) {
          setBadges(prev => [...prev, { day: challenge.day, badge: challenge.badge!, title: challenge.title }]);
        }

        toast({
          title: '🏆 Challenge Complete!',
          description: `+${challenge.points} Hasanat Points${challenge.badge ? ` • Earned the ${challenge.badge} badge!` : ''}`,
        });

        setSelectedChallenge(null);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to complete challenge', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  // Merge API data with local store completions
  const mergedChallenges = challenges.map(c => ({
    ...c,
    completed: c.completed || !!challengeProgress[c.id],
  }));

  const completedCount = mergedChallenges.filter(c => c.completed).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0B0D14] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Ramadan Challenge Board"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F5C451]/15 flex items-center justify-center border border-[#F5C451]/25">
            <Trophy className="w-4 h-4 text-[#F5C451]" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Challenge Board</h2>
            <p className="text-white/40 text-[10px]">30 Days of Ramadan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBadges(!showBadges)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="View badges"
          >
            <Award className="w-4 h-4 text-[#F5C451]" />
          </button>
          <button
            onClick={() => { if (onClose) onClose(); else setActiveModal(null); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close challenge board"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F5C451]" />
            <span className="text-white/60 text-xs font-semibold">Day {currentDay} of 30</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#F5C451]" />
            <span className="text-[#F5C451] text-xs font-bold">{stats?.pointsEarned || 0} pts</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats?.percentage || 0}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #10E07A, #F5C451)' }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-white/30 text-[10px]">{completedCount}/30 completed</span>
          <span className="text-[#10E07A] text-[10px] font-bold">{stats?.percentage || 0}%</span>
        </div>
      </div>

      {/* Badges Panel */}
      <AnimatePresence>
        {showBadges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden border-b border-white/8"
          >
            <div className="px-4 py-3">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Earned Badges</p>
              {badges.length === 0 ? (
                <p className="text-white/20 text-xs">Complete challenges to earn badges!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <motion.div
                      key={b.day}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#F5C451]/10 border border-[#F5C451]/20"
                    >
                      <span className="text-sm">{b.badge}</span>
                      <span className="text-white/70 text-[10px] font-semibold">{b.title}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Grid - GitHub contribution graph style */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#10E07A]/30 border-t-[#10E07A] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Grid Header - Week labels */}
            <div className="mb-3">
              <p className="text-white/40 text-xs font-semibold mb-3">Your Ramadan Journey</p>

              {/* Contribution Grid - 6 rows x 5 cols = 30 days */}
              <div className="grid grid-cols-6 gap-2">
                {mergedChallenges.map((challenge, i) => {
                  const catColor = CATEGORY_COLORS[challenge.category] || '#10E07A';
                  const isCompleted = challenge.completed;
                  const isCurrent = challenge.isCurrent;
                  const isLocked = challenge.isLocked;

                  return (
                    <motion.button
                      key={challenge.id}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.015, type: 'spring', stiffness: 200 }}
                      onClick={() => {
                        if (!isLocked) setSelectedChallenge(challenge);
                      }}
                      disabled={isLocked}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all ${
                        isLocked
                          ? 'bg-white/3 border-white/5 opacity-40'
                          : isCompleted
                          ? 'border-transparent cursor-pointer'
                          : isCurrent
                          ? 'bg-white/5 border-[#F5C451]/30 cursor-pointer'
                          : 'bg-[#0F1118] border-white/8 cursor-pointer hover:border-white/15'
                      }`}
                      style={isCompleted ? {
                        background: `linear-gradient(135deg, ${catColor}25, ${catColor}10)`,
                        borderColor: `${catColor}40`,
                        boxShadow: `0 0 12px ${catColor}20`,
                      } : {}}
                      aria-label={`Day ${challenge.day}: ${challenge.title}${isCompleted ? ' (completed)' : isLocked ? ' (locked)' : ''}`}
                    >
                      {/* Day number */}
                      <span className={`text-[9px] font-bold ${isCompleted ? 'text-white/90' : isLocked ? 'text-white/20' : 'text-white/50'}`}>
                        D{challenge.day}
                      </span>

                      {/* Icon */}
                      <span className={`text-base ${isLocked ? 'grayscale opacity-30' : ''}`}>
                        {isLocked ? <Lock className="w-3.5 h-3.5 text-white/20" /> : challenge.icon}
                      </span>

                      {/* Completed checkmark */}
                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10E07A] flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 text-[#0B0D14]" />
                        </motion.div>
                      )}

                      {/* Current day pulse */}
                      {isCurrent && !isCompleted && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-[#F5C451]/50"
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* List View */}
            <div className="mt-4">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Today&apos;s Challenge</p>
              {mergedChallenges.filter(c => c.isCurrent).map(challenge => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0F1118] rounded-2xl border border-[#F5C451]/20 p-4 mb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#F5C451]/10 flex items-center justify-center border border-[#F5C451]/20 text-2xl shrink-0">
                      {challenge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-sm font-bold">{challenge.title}</h3>
                      <p className="text-white/40 text-xs mt-0.5">{challenge.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                  </div>
                </motion.div>
              ))}

              {/* Upcoming Challenges */}
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3 mt-5">Upcoming</p>
              <div className="space-y-2">
                {mergedChallenges
                  .filter(c => !c.completed && !c.isLocked && !c.isCurrent)
                  .slice(0, 5)
                  .map((challenge, i) => (
                    <motion.button
                      key={challenge.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedChallenge(challenge)}
                      className="w-full bg-[#0F1118] rounded-xl border border-white/5 p-3 flex items-center gap-3 hover:border-white/15 transition-colors text-left"
                      aria-label={`View challenge: ${challenge.title}`}
                    >
                      <span className="text-lg shrink-0">{challenge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-semibold truncate">{challenge.title}</p>
                        <p className="text-white/30 text-[10px]">Day {challenge.day} • +{challenge.points} pts</p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[challenge.category] || '#10E07A' }}
                      />
                    </motion.button>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Challenge Detail Sheet */}
      <AnimatePresence>
        {selectedChallenge && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[110]"
              onClick={() => setSelectedChallenge(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[120] bg-[#0F1118] rounded-t-3xl border-t border-white/10 p-6 pb-8"
              role="dialog"
              aria-modal="true"
              aria-label={`Challenge: ${selectedChallenge.title}`}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[selectedChallenge.category] || '#10E07A'}15`,
                    borderColor: `${CATEGORY_COLORS[selectedChallenge.category] || '#10E07A'}25`,
                  }}
                >
                  {selectedChallenge.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                      Day {selectedChallenge.day}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[selectedChallenge.category] || '#10E07A' }}
                    />
                  </div>
                  <h3 className="text-white text-lg font-bold">{selectedChallenge.title}</h3>
                  <p className="text-white/50 text-sm mt-1">{selectedChallenge.description}</p>
                </div>
              </div>

              {/* Points and badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5C451]/10 border border-[#F5C451]/20">
                  <Star className="w-3 h-3 text-[#F5C451]" />
                  <span className="text-[#F5C451] text-xs font-bold">+{selectedChallenge.points} pts</span>
                </div>
                {selectedChallenge.badge && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20">
                    <Award className="w-3 h-3 text-[#A78BFA]" />
                    <span className="text-[#A78BFA] text-xs font-bold">{selectedChallenge.badge}</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              {selectedChallenge.completed ? (
                <div className="w-full py-3.5 rounded-2xl bg-[#10E07A]/15 border border-[#10E07A]/30 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-[#10E07A]" />
                  <span className="text-[#10E07A] text-sm font-bold">Completed!</span>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleComplete(selectedChallenge)}
                  disabled={completing}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                  style={{
                    background: completing
                      ? 'linear-gradient(135deg, #555, #444)'
                      : 'linear-gradient(135deg, #10E07A, #0CC06A)',
                    color: '#0B0D14',
                    boxShadow: completing ? 'none' : '0 4px 20px rgba(16,224,122,0.3)',
                  }}
                  aria-label={`Complete challenge: ${selectedChallenge.title}`}
                >
                  {completing ? 'Completing...' : 'Mark Complete ✓'}
                </motion.button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
