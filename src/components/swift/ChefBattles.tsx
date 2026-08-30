'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Timer, Trophy, Star, Vote, ChevronRight, Crown } from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface ChefInfo {
  name: string;
  restaurant: string;
  rating: number;
  image: string;
}

interface Battle {
  id: string;
  dish: string;
  chefA: ChefInfo;
  chefB: ChefInfo;
  votesA: number;
  votesB: number;
  totalVotes: number;
  endsAt: string;
  isActive: boolean;
  winner: 'A' | 'B' | null;
}

interface LeaderboardEntry {
  rank: number;
  chef: string;
  wins: number;
  streak: number;
  rating: number;
  restaurant: string;
}

interface ChefBattlesProps {
  onClose?: () => void;
}

function ChefBattlesInner({ onClose }: ChefBattlesProps) {
  const { activeModal, setActiveModal } = useNavigation();
  const swiftPoints = useAppStore(s => s.swiftPoints);
  const setSwiftPoints = useAppStore(s => s.setSwiftPoints);
  const isOpen = activeModal === 'chef-battles';
  const { toast } = useToast();

  const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
  const [pastBattles, setPastBattles] = useState<Battle[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  const [voting, setVoting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'leaderboard'>('active');

  // Fetch battles
  const fetchBattles = useCallback(async () => {
    try {
      const res = await fetch('/api/chef-battles');
      if (res.ok) {
        const data = await res.json();
        setActiveBattles(data.activeBattles);
        setPastBattles(data.pastBattles);
        setLeaderboard(data.leaderboard);
      }
    } catch {
      // Use empty defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  // Countdown timer for selected battle
  useEffect(() => {
    if (!selectedBattle || !selectedBattle.isActive) return;

    const updateCountdown = () => {
      const now = Date.now();
      const end = new Date(selectedBattle.endsAt).getTime();
      const diff = Math.max(0, end - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);

      if (diff <= 0) {
        setCountdown('Ended');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [selectedBattle]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showResult) {
          setShowResult(false);
        } else if (selectedBattle) {
          setSelectedBattle(null);
          setUserVote(null);
        } else if (onClose) {
          onClose();
        } else {
          setActiveModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBattle, showResult, onClose, setActiveModal]);

  // Vote in a battle
  const handleVote = async (battleId: string, vote: 'A' | 'B') => {
    if (voting || userVote) return;
    setVoting(true);

    try {
      const res = await fetch('/api/chef-battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, vote }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserVote(vote);

        // Update battle data
        setActiveBattles(prev => prev.map(b =>
          b.id === battleId
            ? { ...b, votesA: data.battle.votesA, votesB: data.battle.votesB, totalVotes: data.battle.totalVotes }
            : b
        ));

        if (selectedBattle?.id === battleId) {
          setSelectedBattle(prev => prev ? {
            ...prev,
            votesA: data.battle.votesA,
            votesB: data.battle.votesB,
            totalVotes: data.battle.totalVotes,
          } : null);
        }

        // Award swift points for voting
        setSwiftPoints(swiftPoints + 50);

        // Show result after brief delay
        setTimeout(() => setShowResult(true), 800);

        toast({
          title: '🗳️ Vote Cast!',
          description: `+50 SwiftPoints`,
        });
      } else {
        const errorData = await res.json();
        toast({ title: 'Vote Error', description: errorData.error || 'Failed to vote', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to record vote', variant: 'destructive' });
    } finally {
      setVoting(false);
    }
  };

  const getVotePct = (votes: number, total: number) => {
    if (total === 0) return 50;
    return Math.round((votes / total) * 100);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0B0D14] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Chef Battles"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F5C451]/15 flex items-center justify-center border border-[#F5C451]/25">
            <Swords className="w-4 h-4 text-[#F5C451]" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Chef Battles</h2>
            <p className="text-white/65 text-[10px]">Blind taste test — pick the winner!</p>
          </div>
        </div>
        <button
          onClick={() => { if (onClose) onClose(); else setActiveModal(null); }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close chef battles"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 px-4 pt-3 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'active'
              ? 'bg-[#F5C451]/15 text-[#F5C451] border border-[#F5C451]/25'
              : 'bg-white/3 text-white/65 border border-white/5'
          }`}
          aria-label="Active battles"
        >
          <Swords className="w-3.5 h-3.5 inline mr-1" />
          Active
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-[#F5C451]/15 text-[#F5C451] border border-[#F5C451]/25'
              : 'bg-white/3 text-white/65 border border-white/5'
          }`}
          aria-label="Leaderboard"
        >
          <Trophy className="w-3.5 h-3.5 inline mr-1" />
          Leaderboard
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#F5C451]/30 border-t-[#F5C451] rounded-full animate-spin" />
          </div>
        ) : activeTab === 'active' ? (
          <>
            {/* Active Battles */}
            <div className="space-y-3 mt-2">
              {activeBattles.map((battle, i) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#0F1118] rounded-2xl border border-white/5 overflow-hidden"
                >
                  {/* Dish Header */}
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚔️</span>
                      <span className="text-white text-sm font-bold">{battle.dish}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#F5C451]">
                      <Timer className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{battle.totalVotes} votes</span>
                    </div>
                  </div>

                  {/* VS Cards */}
                  <div className="px-3 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Chef A */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSelectedBattle(battle);
                          setUserVote(null);
                        }}
                        className="bg-white/3 rounded-xl border border-white/5 p-3 text-center hover:border-[#10E07A]/30 transition-colors relative overflow-hidden"
                        aria-label={`Vote for ${battle.chefA.name}`}
                      >
                        <div className="text-3xl mb-2">{battle.chefA.image}</div>
                        <p className="text-white text-xs font-bold">{battle.chefA.name}</p>
                        <p className="text-white/60 text-[9px]">{battle.chefA.restaurant}</p>
                        <div className="flex items-center justify-center gap-0.5 mt-1.5">
                          <Star className="w-2.5 h-2.5 text-[#F5C451]" fill="#F5C451" />
                          <span className="text-[#F5C451] text-[9px] font-bold">{battle.chefA.rating}</span>
                        </div>
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-[#10E07A] flex items-center justify-center">
                          <span className="text-[8px] font-black text-[#0B0D14]">A</span>
                        </div>
                      </motion.button>

                      {/* Chef B */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSelectedBattle(battle);
                          setUserVote(null);
                        }}
                        className="bg-white/3 rounded-xl border border-white/5 p-3 text-center hover:border-[#A78BFA]/30 transition-colors relative overflow-hidden"
                        aria-label={`Vote for ${battle.chefB.name}`}
                      >
                        <div className="text-3xl mb-2">{battle.chefB.image}</div>
                        <p className="text-white text-xs font-bold">{battle.chefB.name}</p>
                        <p className="text-white/60 text-[9px]">{battle.chefB.restaurant}</p>
                        <div className="flex items-center justify-center gap-0.5 mt-1.5">
                          <Star className="w-2.5 h-2.5 text-[#F5C451]" fill="#F5C451" />
                          <span className="text-[#F5C451] text-[9px] font-bold">{battle.chefB.rating}</span>
                        </div>
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#A78BFA] flex items-center justify-center">
                          <span className="text-[8px] font-black text-white">B</span>
                        </div>
                      </motion.button>
                    </div>

                    {/* Vote CTA */}
                    <button
                      onClick={() => {
                        setSelectedBattle(battle);
                        setUserVote(null);
                      }}
                      className="w-full mt-2 py-2.5 rounded-xl bg-[#F5C451]/10 border border-[#F5C451]/20 text-[#F5C451] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#F5C451]/15 transition-colors"
                      aria-label={`Vote now for ${battle.dish}`}
                    >
                      <Vote className="w-3.5 h-3.5" />
                      Vote Now
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Past Battles */}
            {pastBattles.length > 0 && (
              <div className="mt-6">
                <p className="text-white/65 text-xs font-bold uppercase tracking-wider mb-3">Recent Results</p>
                <div className="space-y-2">
                  {pastBattles.map(battle => (
                    <div key={battle.id} className="bg-[#0F1118] rounded-xl border border-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-xs font-bold">{battle.dish}</span>
                        <span className="text-[#10E07A] text-[10px] font-bold">Winner: {battle.winner === 'A' ? battle.chefA.name : battle.chefB.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/50 text-[9px]">{battle.chefA.name}</span>
                            <span className="text-[#10E07A] text-[9px] font-bold">{getVotePct(battle.votesA, battle.totalVotes)}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-[#10E07A]" style={{ width: `${getVotePct(battle.votesA, battle.totalVotes)}%` }} />
                          </div>
                        </div>
                        <span className="text-white/20 text-[8px]">VS</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/50 text-[9px]">{battle.chefB.name}</span>
                            <span className="text-[#A78BFA] text-[9px] font-bold">{getVotePct(battle.votesB, battle.totalVotes)}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-[#A78BFA]" style={{ width: `${getVotePct(battle.votesB, battle.totalVotes)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Leaderboard */
          <div className="mt-2 space-y-2">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.chef}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-[#0F1118] rounded-xl border p-3.5 flex items-center gap-3 ${
                  i === 0 ? 'border-[#F5C451]/30' : i === 1 ? 'border-white/10' : 'border-white/5'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  i === 0 ? 'bg-[#F5C451]/15 text-[#F5C451] border border-[#F5C451]/20' :
                  i === 1 ? 'bg-white/10 text-white/70 border border-white/10' :
                  i === 2 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                  'bg-white/5 text-white/65 border border-white/5'
                }`}>
                  {i === 0 ? <Crown className="w-4 h-4" /> : entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold">{entry.chef}</p>
                  <p className="text-white/60 text-[9px]">{entry.restaurant}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#F5C451]" />
                    <span className="text-[#F5C451] text-xs font-bold">{entry.wins}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Star className="w-2.5 h-2.5 text-[#F5C451]" fill="#F5C451" />
                    <span className="text-white/50 text-[9px]">{entry.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Voting Modal */}
      <AnimatePresence>
        {selectedBattle && !showResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[110]"
              onClick={() => { setSelectedBattle(null); setUserVote(null); }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[120] bg-[#0F1118] rounded-t-3xl border-t border-white/10 p-6 pb-8"
              role="dialog"
              aria-modal="true"
              aria-label={`Vote for ${selectedBattle.dish} battle`}
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Timer className="w-4 h-4 text-[#F5C451]" />
                <span className="text-[#F5C451] text-sm font-bold">{countdown}</span>
                <span className="text-white/60 text-xs">remaining</span>
              </div>

              <h3 className="text-white text-center text-lg font-bold mb-1">
                {selectedBattle.dish} Battle
              </h3>
              <p className="text-white/65 text-center text-xs mb-5">Pick your winner — blind taste test!</p>

              {/* VS Selection */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Chef A */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVote(selectedBattle.id, 'A')}
                  disabled={!!userVote || voting}
                  className={`relative rounded-2xl border p-5 text-center transition-all ${
                    userVote === 'A'
                      ? 'bg-[#10E07A]/10 border-[#10E07A]/40'
                      : 'bg-white/3 border-white/10 hover:border-[#10E07A]/30'
                  }`}
                  aria-label={`Vote for Chef A: ${selectedBattle.chefA.name}`}
                >
                  <div className="text-4xl mb-2">{selectedBattle.chefA.image}</div>
                  <p className="text-white text-sm font-bold">{selectedBattle.chefA.name}</p>
                  <p className="text-white/60 text-[10px]">{selectedBattle.chefA.restaurant}</p>
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#10E07A] flex items-center justify-center">
                    <span className="text-[10px] font-black text-[#0B0D14]">A</span>
                  </div>
                </motion.button>

                {/* Chef B */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVote(selectedBattle.id, 'B')}
                  disabled={!!userVote || voting}
                  className={`relative rounded-2xl border p-5 text-center transition-all ${
                    userVote === 'B'
                      ? 'bg-[#A78BFA]/10 border-[#A78BFA]/40'
                      : 'bg-white/3 border-white/10 hover:border-[#A78BFA]/30'
                  }`}
                  aria-label={`Vote for Chef B: ${selectedBattle.chefB.name}`}
                >
                  <div className="text-4xl mb-2">{selectedBattle.chefB.image}</div>
                  <p className="text-white text-sm font-bold">{selectedBattle.chefB.name}</p>
                  <p className="text-white/60 text-[10px]">{selectedBattle.chefB.restaurant}</p>
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#A78BFA] flex items-center justify-center">
                    <span className="text-[10px] font-black text-white">B</span>
                  </div>
                </motion.button>
              </div>

              {/* Vote counts */}
              {userVote && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-[10px] w-16">{selectedBattle.chefA.name}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getVotePct(selectedBattle.votesA, selectedBattle.totalVotes)}%` }}
                        className="h-full rounded-full bg-[#10E07A]"
                      />
                    </div>
                    <span className="text-[#10E07A] text-[10px] font-bold">{getVotePct(selectedBattle.votesA, selectedBattle.totalVotes)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-[10px] w-16">{selectedBattle.chefB.name}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getVotePct(selectedBattle.votesB, selectedBattle.totalVotes)}%` }}
                        className="h-full rounded-full bg-[#A78BFA]"
                      />
                    </div>
                    <span className="text-[#A78BFA] text-[10px] font-bold">{getVotePct(selectedBattle.votesB, selectedBattle.totalVotes)}%</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Vote Result */}
      <AnimatePresence>
        {showResult && selectedBattle && userVote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/70 flex items-center justify-center p-6"
            onClick={() => { setShowResult(false); setSelectedBattle(null); setUserVote(null); }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-full max-w-sm relative overflow-hidden rounded-3xl border border-[#F5C451]/30"
              style={{ background: 'linear-gradient(135deg, #1A1D26, #0F1117)' }}
              role="dialog"
              aria-modal="true"
              aria-label="Vote result"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#F5C451]/20 blur-[60px]" />

              <div className="relative z-10 p-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2, stiffness: 150 }}
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border-2"
                  style={{
                    background: userVote === 'A' ? 'linear-gradient(135deg, #10E07A20, #10E07A10)' : 'linear-gradient(135deg, #A78BFA20, #A78BFA10)',
                    borderColor: userVote === 'A' ? '#10E07A50' : '#A78BFA50',
                  }}
                >
                  <Swords className="w-7 h-7" style={{ color: userVote === 'A' ? '#10E07A' : '#A78BFA' }} />
                </motion.div>

                <h3 className="text-2xl font-black text-[#F5C451] mb-1">Vote Cast! ⚔️</h3>
                <p className="text-white text-sm mb-1">
                  You chose {userVote === 'A' ? selectedBattle.chefA.name : selectedBattle.chefB.name}
                </p>
                <p className="text-white/65 text-xs mb-5">
                  {selectedBattle.totalVotes} total votes • {selectedBattle.dish}
                </p>

                <div className="bg-white/5 rounded-xl p-3 mb-5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[#10E07A] font-bold">{selectedBattle.chefA.name}: {getVotePct(selectedBattle.votesA, selectedBattle.totalVotes)}%</span>
                    <span className="text-[#A78BFA] font-bold">{selectedBattle.chefB.name}: {getVotePct(selectedBattle.votesB, selectedBattle.totalVotes)}%</span>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#10E07A] rounded-l-full" style={{ width: `${getVotePct(selectedBattle.votesA, selectedBattle.totalVotes)}%` }} />
                    <div className="bg-[#A78BFA] rounded-r-full" style={{ width: `${getVotePct(selectedBattle.votesB, selectedBattle.totalVotes)}%` }} />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowResult(false); setSelectedBattle(null); setUserVote(null); }}
                  className="w-full py-3 rounded-2xl font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #F5C451, #E5A830)',
                    color: '#0B0D14',
                    boxShadow: '0 4px 20px rgba(245,196,81,0.3)',
                  }}
                >
                  Continue Battling ⚔️
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ChefBattlesInner);
