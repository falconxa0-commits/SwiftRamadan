'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, Users, Gift, ChevronRight, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const leaderboardData = [
  { name: 'Khadijah A.', count: 12, avatar: 'K' },
  { name: 'Bolaji A.', count: 3, avatar: 'B', isYou: true },
  { name: 'Tunde O.', count: 8, avatar: 'T' },
  { name: 'Aisha M.', count: 6, avatar: 'A' },
  { name: 'Yusuf B.', count: 5, avatar: 'Y' },
];

const socialProofMessages = [
  'Amina just earned ₦1,000!',
  'Ibrahim referred 3 friends!',
  'Fatima unlocked Gold tier!',
  'Sule just earned ₦1,000!',
  'Zainab referred 5 friends!',
  'Mustapha unlocked Platinum tier!',
];

export default function ReferEarnModal() {
  const { activeModal, setActiveModal, referralCode, referralCount } = useAppStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  const isOpen = activeModal === 'refer';
  const referralLink = `https://swiftramadan.com/r/${referralCode}`;
  const earnedAmount = referralCount * 1000;
  const nextTier = 5;
  const progressPercent = Math.min((referralCount / nextTier) * 100, 100);

  const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.count - a.count);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % socialProofMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: 'Link Copied! 📋', description: 'Share with friends to earn ₦1,000 each' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Link Copied! 📋', description: 'Share with friends to earn ₦1,000 each' });
    }
  }, [referralLink, toast]);

  const handleWhatsAppShare = useCallback(() => {
    const message = `Salam! 🌙 Get ₦1,000 off your first SwiftRamadan order with my link: ${referralLink} You'll love the Iftar & Sahur deliveries! 🍛`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }, [referralLink]);

  const handleClose = () => setActiveModal(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-white text-lg font-bold">Refer & Earn</h2>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D26] to-[#0F1117] border border-white/10 p-6 mt-4 text-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C451]/10 blur-[60px]" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#10E07A]/10 blur-[40px]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#10E07A]/20 flex items-center justify-center border border-[#10E07A]/30">
                      <Users className="w-7 h-7 text-[#10E07A]" />
                    </div>
                    <div className="text-[#F5C451] text-3xl font-black">+</div>
                    <div className="w-14 h-14 rounded-full bg-[#F5C451]/20 flex items-center justify-center border border-[#F5C451]/30">
                      <Gift className="w-7 h-7 text-[#F5C451]" />
                    </div>
                  </div>
                  <h3 className="text-white text-2xl font-black mb-1">
                    Give <span className="text-[#F5C451]">₦1,000</span>, Get <span className="text-[#F5C451]">₦1,000</span>
                  </h3>
                  <p className="text-white/50 text-sm">Share SwiftRamadan with friends. Both of you earn ₦1,000!</p>
                </div>
              </motion.div>

              {/* Share Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Share Your Link</h4>
                <div className="bg-[#1A1D26] rounded-xl border border-white/5 p-4">
                  <p className="text-white/40 text-xs mb-2">Your unique referral link</p>
                  <div className="flex items-center gap-2 bg-[#0F1117] rounded-lg p-3 border border-white/5">
                    <p className="text-[#10E07A] text-sm font-mono flex-1 truncate">{referralLink}</p>
                    <button
                      onClick={handleCopyLink}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10E07A]/10 border border-[#10E07A]/20 text-[#10E07A] text-xs font-bold hover:bg-[#10E07A]/20 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={handleWhatsAppShare}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share via WhatsApp
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Referral Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Your Referral Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1A1D26] rounded-xl border border-white/5 p-4 text-center">
                    <p className="text-[#10E07A] text-3xl font-black">{referralCount}</p>
                    <p className="text-white/40 text-xs mt-1">Referrals</p>
                  </div>
                  <div className="bg-[#1A1D26] rounded-xl border border-white/5 p-4 text-center">
                    <p className="text-[#F5C451] text-3xl font-black">₦{earnedAmount.toLocaleString()}</p>
                    <p className="text-white/40 text-xs mt-1">Earned</p>
                  </div>
                </div>
                <div className="mt-3 bg-[#1A1D26] rounded-xl border border-white/5 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-xs">Next reward tier ({nextTier} referrals)</span>
                    <span className="text-[#F5C451] text-xs font-bold">Gold Badge</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="gold-gradient h-2.5 rounded-full"
                    />
                  </div>
                  <p className="text-white/30 text-[10px] mt-1.5">{nextTier - referralCount} more referrals to unlock Gold Badge</p>
                </div>
              </motion.div>

              {/* Neighborhood Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Neighborhood Leaderboard</h4>
                <div className="bg-[#1A1D26] rounded-xl border border-white/5 overflow-hidden">
                  {sortedLeaderboard.map((person, i) => (
                    <div
                      key={person.name}
                      className={`flex items-center gap-3 p-3.5 ${i < sortedLeaderboard.length - 1 ? 'border-b border-white/5' : ''} ${person.isYou ? 'bg-[#10E07A]/5' : ''}`}
                    >
                      <span className={`w-6 text-center text-xs font-black ${i === 0 ? 'text-[#F5C451]' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/30'}`}>
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10E07A]/30 to-[#10E07A]/10 flex items-center justify-center border border-white/10 shrink-0">
                        <span className="text-white text-xs font-bold">{person.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-bold">
                          {person.name}
                          {person.isYou && <span className="text-[#10E07A] text-xs ml-1.5">(You)</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{person.count}</p>
                        <p className="text-white/30 text-[10px]">referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Social Proof Ticker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <div className="bg-[#1A1D26] rounded-xl border border-white/5 p-3 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-2 h-2 bg-[#10E07A] rounded-full animate-pulse" />
                    <div className="relative overflow-hidden flex-1 h-5">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={tickerIndex}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-white/70 text-xs whitespace-nowrap"
                        >
                          {socialProofMessages[tickerIndex]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 mb-4"
              >
                <h4 className="text-white font-bold text-sm mb-3">How It Works</h4>
                <div className="space-y-3">
                  {[
                    { step: 1, title: 'Share your link', desc: 'Send your unique link to friends and family', icon: Share2 },
                    { step: 2, title: 'Friend signs up', desc: 'They create an account using your referral link', icon: Users },
                    { step: 3, title: 'Both earn ₦1,000', desc: 'You and your friend each get ₦1,000 credit', icon: Gift },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.step} className="flex items-start gap-3 bg-[#1A1D26] rounded-xl border border-white/5 p-4">
                        <div className="w-10 h-10 rounded-full bg-[#10E07A]/10 flex items-center justify-center border border-[#10E07A]/20 shrink-0">
                          <Icon className="w-5 h-5 text-[#10E07A]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#10E07A] text-xs font-black">Step {item.step}</span>
                            <ChevronRight className="w-3 h-3 text-white/20" />
                            <span className="text-white font-bold text-sm">{item.title}</span>
                          </div>
                          <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
