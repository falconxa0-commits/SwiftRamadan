'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, Share2 } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { prayerTimes, dailyDuas, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface CountdownTime {
  hours: number;
  minutes: number;
  label: string;
}

export default function PrayerTimesModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'prayer-times';

  const [athanEnabled, setAthanEnabled] = useState(false);
  const [countdown, setCountdown] = useState<CountdownTime>({ hours: 0, minutes: 0, label: '' });
  const [dailyDuaIndex] = useState(() => Math.floor(Math.random() * dailyDuas.length));

  useEffect(() => {
    if (!isOpen) return;

    const calculateCountdown = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      let nextPrayer = '';
      let targetHours = 0;
      let targetMinutes = 0;

      if (hours < 5 || (hours === 5 && minutes < 23)) {
        nextPrayer = 'Fajr';
        targetHours = 5;
        targetMinutes = 23;
      } else if (hours < 12 || (hours === 12 && minutes < 45)) {
        nextPrayer = 'Dhuhr';
        targetHours = 12;
        targetMinutes = 45;
      } else if (hours < 16 || (hours === 16 && minutes < 10)) {
        nextPrayer = 'Asr';
        targetHours = 16;
        targetMinutes = 10;
      } else if (hours < 18 || (hours === 18 && minutes < 45)) {
        nextPrayer = 'Maghrib';
        targetHours = 18;
        targetMinutes = 45;
      } else {
        nextPrayer = 'Isha';
        targetHours = 20;
        targetMinutes = 5;
      }

      let diffMinutes = (targetHours * 60 + targetMinutes) - (hours * 60 + minutes);
      if (diffMinutes < 0) diffMinutes += 24 * 60;

      setCountdown({
        hours: Math.floor(diffMinutes / 60),
        minutes: diffMinutes % 60,
        label: nextPrayer,
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const getNextPrayerIndex = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    const prayerMinutes = [
      5 * 60 + 23,   // Fajr
      12 * 60 + 45,  // Dhuhr
      16 * 60 + 10,  // Asr
      18 * 60 + 45,  // Maghrib
      20 * 60 + 5,   // Isha
    ];

    for (let i = 0; i < prayerMinutes.length; i++) {
      if (currentTime < prayerMinutes[i]) return i;
    }
    return 0; // Next day Fajr
  };

  const nextPrayerIdx = getNextPrayerIndex();

  const ramadanEssentials = [
    { icon: 'menu_book', name: 'Daily Dua', action: () => toast({ title: 'Daily Dua 📖', description: dailyDuas[dailyDuaIndex] }) },
    { icon: 'calculate', name: 'Zakat Tracker', action: () => setActiveModal('charity') },
    { icon: 'restaurant', name: 'Iftar Menus', action: () => setActiveModal('recipes') },
    { icon: 'mosque', name: 'Mosque Finder', action: () => setActiveModal('mosque') },
  ];

  const handleShareDua = () => {
    toast({ title: 'Dua Shared! 📤', description: 'May Allah accept our prayers' });
  };

  const handleClose = () => {
    setActiveModal(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[70]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[90vh] bg-[#05070A] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#F5C451]">mosque</span>
                <h2 className="text-white font-bold text-lg">Prayer Times</h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Next Prayer Countdown */}
              <div className="px-4 pt-4">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b]/50 to-[#05070A] border border-[#10E07A]/20 p-6 text-center green-glow">
                  <div className="absolute top-0 left-0 w-full h-full bg-[#10E07A]/5 blur-[80px]" />
                  <div className="relative">
                    <p className="text-white/65 text-xs uppercase tracking-widest mb-1">Next Prayer</p>
                    <p className="text-[#10E07A] text-2xl font-black">{countdown.label}</p>
                    <motion.div
                      key={`${countdown.hours}-${countdown.minutes}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-3"
                    >
                      <p className="text-white text-4xl font-black tracking-tighter">
                        {countdown.hours}h {countdown.minutes}m
                      </p>
                    </motion.div>
                    <p className="text-white/60 text-xs mt-1">until adhan</p>
                  </div>
                </div>
              </div>

              {/* Prayer Schedule */}
              <div className="px-4 mt-6">
                <h3 className="text-white font-bold text-base mb-3">Today&apos;s Schedule</h3>
                <div className="space-y-2">
                  {prayerTimes.map((prayer, i) => {
                    const isNext = i === nextPrayerIdx;
                    return (
                      <motion.div
                        key={prayer.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          isNext
                            ? 'bg-[#F5C451]/5 border-[#F5C451]/30 gold-glow'
                            : 'bg-[#1A1D26]/40 border-white/5'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isNext ? 'bg-[#F5C451]/20' : 'bg-white/5'
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${
                            isNext ? 'text-[#F5C451]' : 'text-white/65'
                          }`}>{prayer.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${isNext ? 'text-[#F5C451]' : 'text-white'}`}>
                            {prayer.name}
                          </p>
                        </div>
                        <p className={`text-sm font-bold ${isNext ? 'text-[#F5C451]' : 'text-white/50'}`}>
                          {prayer.time}
                        </p>
                        {isNext && (
                          <span className="text-[#F5C451] text-[10px] font-bold uppercase bg-[#F5C451]/10 px-2 py-0.5 rounded-full">
                            Next
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-4 mt-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveModal('mosque')}
                    className="flex-1 bg-[#1A1D26] rounded-2xl p-3 border border-white/5 flex items-center gap-3 hover:border-[#10E07A]/20 transition-colors"
                  >
                    <Compass className="w-5 h-5 text-[#F5C451]" />
                    <div className="text-left">
                      <p className="text-white font-bold text-xs">Qibla Finder</p>
                      <p className="text-white/60 text-[10px]">NE 56°</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setAthanEnabled(!athanEnabled);
                      toast({
                        title: athanEnabled ? 'Athan Alerts Off' : 'Athan Alerts On 🔔',
                        description: athanEnabled ? 'You won\'t receive prayer notifications' : 'You\'ll be notified at each prayer time',
                      });
                    }}
                    className="flex-1 bg-[#1A1D26] rounded-2xl p-3 border border-white/5 flex items-center gap-3 hover:border-[#10E07A]/20 transition-colors"
                    aria-label={athanEnabled ? 'Disable Athan alerts' : 'Enable Athan alerts'}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      athanEnabled ? 'border-[#10E07A] bg-[#10E07A]' : 'border-white/20'
                    }`}>
                      {athanEnabled && <div className="w-2 h-2 bg-[#05070A] rounded-full" />}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold text-xs">Athan Alerts</p>
                      <p className="text-white/60 text-[10px]">{athanEnabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ramadan Essentials Grid */}
              <div className="px-4 mt-6">
                <h3 className="text-white font-bold text-base mb-3">Ramadan Essentials</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ramadanEssentials.map((item) => (
                    <motion.button
                      key={item.name}
                      onClick={item.action}
                      whileTap={{ scale: 0.97 }}
                      className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 text-left hover:border-[#10E07A]/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[#F5C451] text-2xl mb-2">{item.icon}</span>
                      <p className="text-white font-bold text-sm">{item.name}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Daily Dua Section */}
              <div className="px-4 mt-6 mb-6">
                <div className="bg-[#1A1D26] rounded-2xl p-5 border-2 border-[#F5C451]/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#F5C451]">menu_book</span>
                      <h4 className="text-[#F5C451] font-bold text-sm">Daily Dua</h4>
                    </div>
                    <button
                      onClick={handleShareDua}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      aria-label="Share dua"
                    >
                      <Share2 className="w-4 h-4 text-white/65" />
                    </button>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed italic">
                    &ldquo;{dailyDuas[dailyDuaIndex]}&rdquo;
                  </p>
                  <p className="text-white/60 text-[10px] mt-2">Day {Math.min(new Date().getDate(), 30)} of Ramadan</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
