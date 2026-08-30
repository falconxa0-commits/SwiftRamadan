'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, Star, Send, Award, Bike, Clock, Users,
  Check, Coffee, HandHeart, Sparkles, MessageCircle, Shield
} from 'lucide-react';
import { formatNaira } from '@/lib/data';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface RiderStats {
  name: string;
  initials: string;
  iftarsDelivered: number;
  rating: number;
  totalTips: number;
  yearsActive: number;
  avatarColor: string;
}

const riderStats: RiderStats = {
  name: 'Ibrahim A.',
  initials: 'IA',
  iftarsDelivered: 847,
  rating: 4.9,
  totalTips: 245000,
  yearsActive: 3,
  avatarColor: '#10E07A',
};

const presetTipAmounts = [100, 200, 500];

const thankYouMessages = [
  'May Allah bless your hustle! 🤲',
  'Your dedication feeds families ❤️',
  'Ramadan Mubarak, hero! 🌙',
  'You make Iftar possible! 🙏',
  'JazakAllah Khair! 💚',
];

export default function TippingKiosk() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'tippingKiosk';

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [tipSent, setTipSent] = useState(false);
  const [thankYouMsg, setThankYouMsg] = useState('');

  const handleClose = useCallback(() => {
    setActiveModal(null);
    setSelectedTip(null);
    setCustomAmount('');
    setIsCustom(false);
    setTipSent(false);
    setThankYouMsg('');
  }, [setActiveModal]);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  const handleSelectPreset = (amount: number) => {
    setSelectedTip(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setSelectedTip(null);
  };

  const getTipAmount = (): number => {
    if (isCustom) {
      const parsed = parseInt(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedTip ?? 0;
  };

  const handleSendTip = async () => {
    const amount = getTipAmount();
    if (amount <= 0) {
      toast({ title: 'Enter an amount', description: 'Please select or enter a tip amount', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderName: riderStats.name, amount }),
      });
      const data = await res.json();

      if (res.ok) {
        setTipSent(true);
        setThankYouMsg(thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)]);
        toast({ title: 'Tip Sent! 💚', description: `${formatNaira(amount)} sent to ${riderStats.name}. Riders keep 100%!` });
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send tip', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#0B0D14] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Tipping Kiosk - tip your delivery rider"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0B0D14]/80 border-b border-white/8">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10E07A]/10 rounded-xl flex items-center justify-center border border-[#10E07A]/20">
                  <HandHeart className="w-5 h-5 text-[#10E07A]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Tip Your Rider</h2>
                  <p className="text-white/65 text-xs">100% goes to your rider</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[#0F1118] border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close tipping kiosk"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="px-4 pt-8 pb-8 max-w-lg mx-auto">
            <AnimatePresence mode="wait">
              {!tipSent ? (
                <motion.div
                  key="tip-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Rider Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="bg-[#0F1118] rounded-2xl border border-white/8 p-6 mb-6 text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#10E07A]/5 to-transparent pointer-events-none" />

                    {/* Avatar */}
                    <div className="relative z-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black border-4"
                        style={{
                          backgroundColor: `${riderStats.avatarColor}15`,
                          borderColor: `${riderStats.avatarColor}40`,
                          color: riderStats.avatarColor,
                        }}
                      >
                        {riderStats.initials}
                      </motion.div>

                      <h3 className="text-white font-bold text-xl mb-1">{riderStats.name}</h3>

                      <div className="flex items-center justify-center gap-1 mb-4">
                        <Star className="w-4 h-4 text-[#F5C451] fill-[#F5C451]" />
                        <span className="text-[#F5C451] font-bold text-sm">{riderStats.rating}</span>
                        <span className="text-white/60 text-xs">· {riderStats.yearsActive} years</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Rider Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-[#0F1118] rounded-xl border border-white/8 p-3 text-center"
                    >
                      <Coffee className="w-5 h-5 text-[#F5C451] mx-auto mb-1.5" />
                      <p className="text-white font-black text-lg">{riderStats.iftarsDelivered.toLocaleString()}</p>
                      <p className="text-white/60 text-[10px]">Iftars Delivered</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-[#0F1118] rounded-xl border border-white/8 p-3 text-center"
                    >
                      <Bike className="w-5 h-5 text-[#10E07A] mx-auto mb-1.5" />
                      <p className="text-white font-black text-lg">{riderStats.yearsActive}</p>
                      <p className="text-white/60 text-[10px]">Years Active</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-[#0F1118] rounded-xl border border-white/8 p-3 text-center"
                    >
                      <Heart className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
                      <p className="text-white font-black text-lg">{formatNaira(riderStats.totalTips)}</p>
                      <p className="text-white/60 text-[10px]">Total Tips</p>
                    </motion.div>
                  </div>

                  {/* Fun Fact */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#10E07A]/5 border border-[#10E07A]/15 rounded-xl p-4 mb-6 flex items-start gap-3"
                  >
                    <Sparkles className="w-5 h-5 text-[#10E07A] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#10E07A] font-bold text-xs mb-0.5">Did you know?</p>
                      <p className="text-white/60 text-xs">
                        How many Iftars has {riderStats.name.split(' ')[0]} delivered? <span className="text-[#F5C451] font-bold">{riderStats.iftarsDelivered.toLocaleString()}!</span> That&apos;s a lot of happy families breaking fast on time.
                      </p>
                    </div>
                  </motion.div>

                  {/* Tip Selection */}
                  <div className="mb-6">
                    <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#F5C451]" />
                      Choose a tip amount
                    </h4>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {presetTipAmounts.map((amount, i) => (
                        <motion.button
                          key={amount}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                          onClick={() => handleSelectPreset(amount)}
                          className={`py-4 rounded-xl font-bold text-base transition-all ${
                            selectedTip === amount && !isCustom
                              ? 'bg-[#10E07A] text-[#0B0D14] border-2 border-[#10E07A]'
                              : 'bg-[#0F1118] border border-white/8 text-white hover:bg-white/5'
                          }`}
                          aria-label={`Tip ${formatNaira(amount)}`}
                        >
                          {formatNaira(amount)}
                        </motion.button>
                      ))}
                    </div>

                    {/* Custom Amount */}
                    <button
                      onClick={handleCustomSelect}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        isCustom
                          ? 'bg-[#A78BFA]/10 border-2 border-[#A78BFA] text-[#A78BFA]'
                          : 'bg-[#0F1118] border border-white/8 text-white/50 hover:bg-white/5'
                      }`}
                      aria-label="Enter custom tip amount"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Custom Amount
                    </button>

                    <AnimatePresence>
                      {isCustom && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/65 font-bold">₦</span>
                            <input
                              type="number"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder="Enter amount"
                              className="w-full bg-[#0F1118] border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white font-bold text-lg focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
                              min="50"
                              aria-label="Custom tip amount in Naira"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 100% to rider badge */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Shield className="w-4 h-4 text-[#10E07A]" />
                    <span className="text-[#10E07A] text-xs font-bold">Riders keep 100% of tips</span>
                  </div>

                  {/* Send Button */}
                  <motion.button
                    onClick={handleSendTip}
                    disabled={isSending || getTipAmount() <= 0}
                    className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor: getTipAmount() > 0 ? '#10E07A' : 'rgba(255,255,255,0.05)',
                      color: getTipAmount() > 0 ? '#0B0D14' : 'rgba(255,255,255,0.3)',
                    }}
                    whileTap={getTipAmount() > 0 ? { scale: 0.98 } : {}}
                    aria-label={`Send ${formatNaira(getTipAmount())} tip to ${riderStats.name}`}
                  >
                    {isSending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#0B0D14]/30 border-t-[#0B0D14] rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {getTipAmount() > 0
                          ? `Send ${formatNaira(getTipAmount())} Tip`
                          : 'Select a tip amount'}
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ) : (
                /* Success State */
                <motion.div
                  key="tip-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-center py-8"
                >
                  {/* Celebration Heart */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: '#10E07A15', border: '3px solid #10E07A40' }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                    >
                      <Heart className="w-14 h-14 text-[#10E07A] fill-[#10E07A]" />
                    </motion.div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-black text-2xl mb-2"
                  >
                    Tip Sent!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-[#10E07A] font-bold text-lg mb-2"
                  >
                    {formatNaira(getTipAmount())}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/50 text-sm mb-6"
                  >
                    sent to {riderStats.name}
                  </motion.p>

                  {/* Thank you message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#0F1118] rounded-2xl border border-white/8 p-6 mb-6"
                  >
                    <p className="text-[#F5C451] font-bold text-lg mb-3">{thankYouMsg}</p>
                    <p className="text-white/65 text-xs leading-relaxed">
                      Your generosity makes a real difference. {riderStats.name.split(' ')[0]} will receive every kobo of your tip. 
                      May Allah reward your kindness this Ramadan.
                    </p>
                  </motion.div>

                  {/* Delivery Stats Reminder */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-[#10E07A]/5 border border-[#10E07A]/15 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#10E07A]" />
                      <span className="text-white/60 text-xs">{riderStats.iftarsDelivered.toLocaleString()} iftars</span>
                    </div>
                    <span className="text-white/10">·</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#10E07A]" />
                      <span className="text-white/60 text-xs">Always on time</span>
                    </div>
                    <span className="text-white/10">·</span>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#10E07A]" />
                      <span className="text-white/60 text-xs">100% tips kept</span>
                    </div>
                  </motion.div>

                  {/* Done Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    onClick={handleClose}
                    className="mt-8 px-8 py-3 rounded-xl bg-[#0F1118] border border-white/8 text-white/70 font-bold text-sm hover:bg-white/5 transition-colors"
                    aria-label="Close tipping kiosk"
                  >
                    Done
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
