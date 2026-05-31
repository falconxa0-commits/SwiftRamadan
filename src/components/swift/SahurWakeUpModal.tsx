'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlarmClock, Plus, Minus, Play, ShoppingCart, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { trendingMeals, dailyDuas, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const wakeUpOptions = [
  { id: 'adhan', name: 'Gentle Adhan', icon: 'mosque', desc: 'Peaceful call to prayer' },
  { id: 'quran', name: 'Quran Recitation', icon: 'menu_book', desc: 'Soothing recitation' },
  { id: 'nature', name: 'Nature Sounds', icon: 'forest', desc: 'Birds & flowing water' },
  { id: 'standard', name: 'Standard Alarm', icon: 'alarm', desc: 'Classic alarm tone' },
];

export default function SahurWakeUpModal() {
  const { activeModal, setActiveModal, sahurAlarmTime, setSahurAlarmTime, sahurAlarmEnabled, setSahurAlarmEnabled, addToCart } = useAppStore();
  const { toast } = useToast();
  const [selectedSound, setSelectedSound] = useState('adhan');
  const [previewing, setPreviewing] = useState(false);

  const isOpen = activeModal === 'sahur';

  const timeParts = sahurAlarmTime.split(':');
  const hours = parseInt(timeParts[0] || '04');
  const minutes = parseInt(timeParts[1] || '30');

  const adjustTime = useCallback((type: 'hour' | 'minute', delta: number) => {
    let newH = hours;
    let newM = minutes;
    if (type === 'hour') {
      newH = ((newH + delta) + 24) % 24;
    } else {
      newM = newM + delta;
      if (newM >= 60) { newM = 0; newH = (newH + 1) % 24; }
      if (newM < 0) { newM = 59; newH = ((newH - 1) + 24) % 24; }
    }
    const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    setSahurAlarmTime(newTime);
  }, [hours, minutes, setSahurAlarmTime]);

  const handlePreview = useCallback(() => {
    setPreviewing(true);
    try {
      const audioContext = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(580, audioContext.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(520, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch {
      // Audio not available
    }
    setTimeout(() => setPreviewing(false), 700);
  }, []);

  const handleSave = useCallback(() => {
    setSahurAlarmEnabled(true);
    toast({ title: 'Sahur Alarm Set! ⏰', description: `Alarm set for ${sahurAlarmTime} with ${wakeUpOptions.find(o => o.id === selectedSound)?.name}` });
  }, [sahurAlarmTime, selectedSound, setSahurAlarmEnabled, toast]);

  const handleClose = () => setActiveModal(null);

  const sahurMeals = trendingMeals.filter(m => m.category === 'Sahur');
  const todayDua = dailyDuas[Math.floor(Math.random() * dailyDuas.length)];

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
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <Moon className="w-5 h-5 text-[#FFD700]" />
                  Sahur Wake-Up Call
                </h2>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Alarm Toggle & Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 bg-[#1A1D26] rounded-2xl border border-white/5 p-6 text-center"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <AlarmClock className="w-5 h-5 text-[#FFD700]" />
                    <span className="text-white font-bold text-sm">Sahur Alarm</span>
                  </div>
                  <button
                    onClick={() => setSahurAlarmEnabled(!sahurAlarmEnabled)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${sahurAlarmEnabled ? 'bg-[#13ec13]' : 'bg-white/10'}`}
                  >
                    <motion.div
                      className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg"
                      animate={{ left: sahurAlarmEnabled ? '30px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Time Picker */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => adjustTime('hour', 1)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-white/60" />
                    </button>
                    <div className="w-20 h-20 rounded-xl bg-[#0F1117] border border-white/10 flex items-center justify-center">
                      <span className="text-white text-3xl font-black">{String(hours).padStart(2, '0')}</span>
                    </div>
                    <button
                      onClick={() => adjustTime('hour', -1)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                  <span className="text-white text-3xl font-black pb-1">:</span>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => adjustTime('minute', 5)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-white/60" />
                    </button>
                    <div className="w-20 h-20 rounded-xl bg-[#0F1117] border border-white/10 flex items-center justify-center">
                      <span className="text-white text-3xl font-black">{String(minutes).padStart(2, '0')}</span>
                    </div>
                    <button
                      onClick={() => adjustTime('minute', -5)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>

                <p className="text-white/30 text-xs mt-3">Adjust by 5-minute increments</p>

                {/* Preview Button */}
                <button
                  onClick={handlePreview}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:border-[#FFD700]/30 hover:text-[#FFD700] transition-colors"
                >
                  <Play className={`w-3.5 h-3.5 ${previewing ? 'text-[#FFD700]' : ''}`} />
                  {previewing ? 'Playing...' : 'Preview Alarm'}
                </button>
              </motion.div>

              {/* Wake-up Options */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Wake-up Sound</h4>
                <div className="space-y-2">
                  {wakeUpOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSound(option.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${selectedSound === option.id ? 'bg-[#13ec13]/5 border-[#13ec13]/30' : 'bg-[#1A1D26] border-white/5 hover:border-white/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedSound === option.id ? 'bg-[#13ec13]/20' : 'bg-white/5'}`}>
                        <span className={`material-symbols-outlined text-lg ${selectedSound === option.id ? 'text-[#13ec13]' : 'text-white/40'}`}>{option.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${selectedSound === option.id ? 'text-[#13ec13]' : 'text-white'}`}>{option.name}</p>
                        <p className="text-white/40 text-xs">{option.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedSound === option.id ? 'border-[#13ec13]' : 'border-white/20'}`}>
                        {selectedSound === option.id && <div className="w-2.5 h-2.5 rounded-full bg-[#13ec13]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Sahur Meal Pre-order */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Pre-order Sahur Meal</h4>
                <div className="space-y-2">
                  {sahurMeals.length > 0 ? sahurMeals.map((meal) => (
                    <div key={meal.id} className="bg-[#1A1D26] rounded-xl border border-white/5 p-3 flex gap-3">
                      <div
                        className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${meal.image})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{meal.name}</p>
                        <p className="text-white/40 text-xs truncate">{meal.description}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[#13ec13] font-black text-sm">{formatNaira(meal.price)}</span>
                          <button
                            onClick={() => {
                              addToCart({ id: meal.id, name: meal.name, price: meal.price, image: meal.image });
                              toast({ title: 'Added! 🛒', description: `${meal.name} added to cart for Sahur` });
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] text-xs font-bold hover:bg-[#13ec13]/20 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="bg-[#1A1D26] rounded-xl border border-white/5 p-3 flex gap-3">
                      <div
                        className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${trendingMeals[2].image})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{trendingMeals[2].name}</p>
                        <p className="text-white/40 text-xs truncate">{trendingMeals[2].description}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[#13ec13] font-black text-sm">{formatNaira(trendingMeals[2].price)}</span>
                          <button
                            onClick={() => {
                              addToCart({ id: trendingMeals[2].id, name: trendingMeals[2].name, price: trendingMeals[2].price, image: trendingMeals[2].image });
                              toast({ title: 'Added! 🛒', description: `${trendingMeals[2].name} added to cart for Sahur` });
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] text-xs font-bold hover:bg-[#13ec13]/20 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Daily Dua for Sahur */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Dua for Sahur</h4>
                <div className="relative overflow-hidden bg-gradient-to-br from-[#1A1D26] to-[#0F1117] rounded-2xl border border-[#FFD700]/20 p-5">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#FFD700]/5 blur-[40px]" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#FFD700] text-lg">auto_stories</span>
                      <span className="text-[#FFD700] text-xs font-bold uppercase tracking-widest">Sahur Dua</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed italic">{todayDua}</p>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 mb-4"
              >
                <button
                  onClick={handleSave}
                  className="w-full py-4 bg-[#13ec13] text-[#05070A] font-bold text-base rounded-xl hover:bg-[#11d411] transition-colors flex items-center justify-center gap-2"
                >
                  <AlarmClock className="w-5 h-5" />
                  Save Sahur Alarm
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
