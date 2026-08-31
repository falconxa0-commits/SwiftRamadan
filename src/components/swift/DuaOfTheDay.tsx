'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Share2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigation, useDailyDua } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface DuaData {
  arabic: string;
  translation: string;
  transliteration: string;
  source: string;
  day: number;
  date: string;
}

// Complete dua collection (client-side fallback)
const DUA_COLLECTION: DuaData[] = [
  { arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', translation: 'O Allah, You are the One who pardons greatly, and You love to pardon, so pardon me.', transliteration: 'Allahumma innaka \'afuwwun tuhibbul \'afwa fa\'fu \'anni', source: 'Tirmidhi', day: 1, date: '' },
  { arabic: 'اللَّهُمَّ اجْعَلْ صِيَامِي صِيَامَ الصَّائِمِينَ', translation: 'O Allah, make my fasting the fasting of those who truly fast.', transliteration: 'Allahummaj\'al siyami siyamas-sa\'imin', source: 'Ibn Majah', day: 2, date: '' },
  { arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', translation: 'Our Lord, give us good in this world and good in the Hereafter, and save us from the punishment of the Fire.', transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar', source: 'Quran 2:201', day: 3, date: '' },
  { arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', translation: 'O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.', transliteration: 'Allahumma inni as\'alukal-huda wat-tuqa wal-\'afafa wal-ghina', source: 'Muslim', day: 4, date: '' },
  { arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ', translation: 'Thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.', transliteration: 'Dhahaba zhama\'u wabtallatil-\'uruqu wa thabatal-ajru insha\'Allah', source: 'Abu Dawud', day: 5, date: '' },
  { arabic: 'اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ', translation: 'O Allah, for You I have fasted and with Your provision I break my fast.', transliteration: 'Allahumma laka sumtu wa \'ala rizqika aftartu', source: 'Abu Dawud', day: 6, date: '' },
  { arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', translation: 'My Lord, expand for me my breast and ease for me my task.', transliteration: 'Rabbi ishrah li sadri wa yassir li amri', source: 'Quran 20:25-26', day: 7, date: '' },
  { arabic: 'رَبِّ زِدْنِي عِلْمًا', translation: 'My Lord, increase me in knowledge.', transliteration: 'Rabbi zidni \'ilma', source: 'Quran 20:114', day: 8, date: '' },
  { arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translation: 'Allah is sufficient for us, and He is the best Disposer of affairs.', transliteration: 'Hasbunallahu wa ni\'mal-wakil', source: 'Quran 3:173', day: 9, date: '' },
  { arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', translation: 'Indeed, Allah is with the patient.', transliteration: 'Innallaha ma\'as-sabirin', source: 'Quran 2:153', day: 10, date: '' },
];

export default function DuaOfTheDay() {
  const { activeModal, setActiveModal } = useNavigation();
  const { setDailyDua } = useDailyDua();
  const isOpen = activeModal === 'dua-of-the-day';
  const { toast } = useToast();

  const [duas, setDuas] = useState<DuaData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  useEffect(() => { openRef.current = isOpen; }, [isOpen]);

  // Navigation handlers — declared BEFORE useEffect that references them
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // Fetch du'as — inline fetch to keep setState in async callback only
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    void fetch('/api/dua')
      .then((res) => res.json())
      .then((data: { today: DuaData; nearby: { previous: DuaData; next: DuaData } }) => {
        if (cancelled || !openRef.current) return;
        const todayDua = { ...data.today, date: data.today.date || new Date().toISOString().split('T')[0] };
        const prevDua = { ...data.nearby.previous, date: data.nearby.previous.date };
        const nextDua = { ...data.nearby.next, date: data.nearby.next.date };

        setDuas([prevDua, todayDua, nextDua]);
        setCurrentIndex(1);
        setDailyDua({
          arabic: todayDua.arabic,
          translation: todayDua.translation,
          transliteration: todayDua.transliteration,
          date: todayDua.date,
        });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled || !openRef.current) return;
        const dayIdx = (new Date().getDate() - 1) % DUA_COLLECTION.length;
        const todayDua = DUA_COLLECTION[dayIdx];
        const prevDua = DUA_COLLECTION[(dayIdx - 1 + DUA_COLLECTION.length) % DUA_COLLECTION.length];
        const nextDua = DUA_COLLECTION[(dayIdx + 1) % DUA_COLLECTION.length];

        setDuas([prevDua, todayDua, nextDua]);
        setCurrentIndex(1);
        setDailyDua({
          arabic: todayDua.arabic,
          translation: todayDua.translation,
          transliteration: todayDua.transliteration,
          date: new Date().toISOString().split('T')[0],
        });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, setDailyDua]);

  // Escape & arrow key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, setActiveModal, handlePrev, handleNext]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      handlePrev();
    } else if (info.offset.x < -threshold) {
      handleNext();
    }
  };

  const handleShare = async () => {
    const dua = duas[currentIndex];
    if (!dua) return;

    const text = `${dua.arabic}\n\n${dua.transliteration}\n\n"${dua.translation}"\n— ${dua.source}\n\nShared from SwiftRamadan 🌙`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Du'a of the Day", text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard!', description: 'Du\'a copied for sharing' });
    }
  };

  const currentDua = duas[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Du'a of the Day"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar rounded-t-3xl sm:rounded-3xl border border-white/8"
            style={{ background: 'linear-gradient(180deg, var(--sr-surface-raised) 0%, var(--sr-surface-base) 100%)' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4" style={{ background: 'linear-gradient(180deg, var(--sr-surface-raised) 0%, rgba(17,20,28,0.95) 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="icon-tile w-10 h-10 border border-[var(--sr-ai)]/20" style={{ background: 'rgba(167,139,250,0.12)' }}>
                  <BookOpen className="w-5 h-5 text-[var(--sr-ai)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Du&apos;a of the Day</h2>
                  <p className="text-xs text-white/50">Ramadan Day {currentDua?.day || new Date().getDate()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Share du'a"
                >
                  <Share2 className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-8 space-y-6">
              {loading && duas.length === 0 ? (
                <div className="space-y-4 py-8">
                  <div className="h-24 rounded-2xl shimmer-sweep" />
                  <div className="h-12 rounded-xl shimmer-sweep" />
                  <div className="h-16 rounded-xl shimmer-sweep" />
                </div>
              ) : (
                <>
                  {/* Swipeable Du'a Card */}
                  <div ref={containerRef} className="relative overflow-hidden rounded-2xl">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="p-6 rounded-2xl border border-white/8 cursor-grab active:cursor-grabbing"
                        style={{
                          background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(16,224,122,0.05) 50%, rgba(245,196,81,0.06) 100%), var(--sr-surface-raised)',
                        }}
                      >
                        {/* Arabic calligraphy */}
                        <motion.div
                          className="text-center mb-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <p
                            className="text-2xl sm:text-3xl leading-loose font-semibold"
                            style={{
                              color: 'var(--sr-vendor)',
                              fontFamily: '"Amiri", "Traditional Arabic", serif',
                              direction: 'rtl',
                              textShadow: '0 0 30px rgba(245,196,81,0.15)',
                            }}
                          >
                            {currentDua?.arabic}
                          </p>
                        </motion.div>

                        {/* Transliteration */}
                        <motion.div
                          className="mb-4 p-3 rounded-xl bg-white/3 border border-white/5"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-xs font-bold text-[var(--sr-ai)] mb-1 uppercase tracking-wider">Transliteration</p>
                          <p className="text-sm text-white/70 italic">{currentDua?.transliteration}</p>
                        </motion.div>

                        {/* Translation */}
                        <motion.div
                          className="mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <p className="text-xs font-bold text-[var(--sr-customer)] mb-1 uppercase tracking-wider">Translation</p>
                          <p className="text-sm text-white/80 leading-relaxed">{currentDua?.translation}</p>
                        </motion.div>

                        {/* Source */}
                        <motion.div
                          className="flex items-center justify-between"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <span className="text-xs text-white/60">— {currentDua?.source}</span>
                          <span className="text-xs text-white/20">Day {currentDua?.day}</span>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation arrows */}
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => handlePrev()}
                        disabled={currentIndex === 0}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30"
                        aria-label="Previous du'a"
                      >
                        <ChevronLeft className="w-4 h-4 text-white/60" />
                      </button>

                      {/* Dot indicators */}
                      <div className="flex gap-1.5">
                        {duas.map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            animate={{
                              backgroundColor: i === currentIndex ? 'var(--sr-ai)' : 'rgba(255,255,255,0.15)',
                              scale: i === currentIndex ? 1.3 : 1,
                            }}
                            transition={{ duration: 0.2 }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => handleNext()}
                        disabled={currentIndex >= duas.length - 1}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30"
                        aria-label="Next du'a"
                      >
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>

                  {/* Swipe hint */}
                  <motion.p
                    className="text-center text-xs text-white/20"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    ← Swipe for more du&apos;as →
                  </motion.p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
