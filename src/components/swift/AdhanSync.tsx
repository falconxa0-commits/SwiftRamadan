'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio, MapPin, Clock, Volume2, VolumeX, ChevronDown, Check } from 'lucide-react';
import { useNavigation, useAdhanSync } from '@/lib/store-selectors';

interface PrayerTime {
  name: string;
  time: string;
  minutesUntil: number;
}

interface AdhanData {
  date: string;
  location: string;
  prayers: Record<string, string>;
  nextPrayer: {
    name: string;
    time: string;
    minutesUntil: number;
  };
  maghribCountdown: {
    secondsUntil: number;
    isIftarTime: boolean;
  };
}

const FALLBACK_DATA: AdhanData = {
  date: '',
  location: 'Lagos, Nigeria',
  prayers: {
    Fajr: '5:23 AM',
    Sunrise: '6:45 AM',
    Dhuhr: '12:45 PM',
    Asr: '4:10 PM',
    Maghrib: '6:45 PM',
    Isha: '8:05 PM',
  },
  nextPrayer: { name: 'Maghrib', time: '6:45 PM', minutesUntil: 45 },
  maghribCountdown: { secondsUntil: 2700, isIftarTime: false },
};

const MOSQUES = [
  { id: 'lekki', name: 'Lekki Central Mosque', address: '4 Admiralty Way, Lekki', distance: '0.8 km' },
  { id: 'ikoyi', name: 'Ikoyi Muslim Community', address: '15 Awolowo Rd, Ikoyi', distance: '2.3 km' },
  { id: 'vi', name: 'Victoria Island Mosque', address: '8 Akin Adesola St', distance: '3.1 km' },
];

export default function AdhanSync() {
  const { activeModal, setActiveModal } = useNavigation();
  const { adhanSyncEnabled, setAdhanSyncEnabled, setAppTheme } = useAdhanSync();
  const isOpen = activeModal === 'adhan-sync';

  const [adhanData, setAdhanData] = useState<AdhanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState('lekki');
  const [showMosquePicker, setShowMosquePicker] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const openRef = useRef(false);

  useEffect(() => { openRef.current = isOpen; }, [isOpen]);

  // Fetch on open + auto-refresh — all setState in async callbacks (not sync in effect)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const doFetch = () => {
      void fetch('/api/adhan')
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && openRef.current) {
            setAdhanData(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled && openRef.current) {
            setAdhanData({ ...FALLBACK_DATA, date: new Date().toISOString().split('T')[0] });
            setLoading(false);
          }
        });
    };

    doFetch();
    const interval = setInterval(doFetch, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen]);

  // Update app theme based on current prayer time
  useEffect(() => {
    if (!adhanData) return;
    const prayer = adhanData.nextPrayer?.name;
    if (prayer === 'Maghrib') {
      setAppTheme('iftar');
    } else if (prayer === 'Fajr') {
      setAppTheme('sahur');
    } else {
      setAppTheme('ramadan');
    }
  }, [adhanData, setAppTheme]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, setActiveModal]);

  const prayerEntries: PrayerTime[] = adhanData
    ? Object.entries(adhanData.prayers).map(([name, time]) => ({
        name,
        time,
        minutesUntil: name === adhanData.nextPrayer.name ? adhanData.nextPrayer.minutesUntil : -1,
      }))
    : [];

  const currentMosque = MOSQUES.find((m) => m.id === selectedMosque) || MOSQUES[0];

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
          aria-label="Adhan Sync Settings"
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
                <div className="icon-tile w-10 h-10 bg-[var(--sr-customer)]/15 border border-[var(--sr-customer)]/20">
                  <Radio className="w-5 h-5 text-[var(--sr-customer)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Adhan Sync</h2>
                  <p className="text-xs text-white/50">Sync with your local mosque</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="px-6 pb-8 space-y-6">
              {/* Sync Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--sr-surface-raised)] border border-white/8">
                <div className="flex items-center gap-3">
                  {adhanSyncEnabled ? (
                    <Volume2 className="w-5 h-5 text-[var(--sr-customer)]" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-white/65" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">Adhan Sync</p>
                    <p className="text-xs text-white/65">Auto-sync with Maghrib adhan</p>
                  </div>
                </div>
                <button
                  onClick={() => setAdhanSyncEnabled(!adhanSyncEnabled)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                    adhanSyncEnabled ? 'bg-[var(--sr-customer)]' : 'bg-white/10'
                  }`}
                  role="switch"
                  aria-checked={adhanSyncEnabled}
                  aria-label="Toggle adhan sync"
                >
                  <motion.div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg"
                    animate={{ left: adhanSyncEnabled ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Notification Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--sr-surface-raised)] border border-white/8">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-[var(--sr-vendor)]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Adhan Notifications</p>
                    <p className="text-xs text-white/65">Get notified at prayer times</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifEnabled(!notifEnabled)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                    notifEnabled ? 'bg-[var(--sr-vendor)]' : 'bg-white/10'
                  }`}
                  role="switch"
                  aria-checked={notifEnabled}
                  aria-label="Toggle notifications"
                >
                  <motion.div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg"
                    animate={{ left: notifEnabled ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Mosque Selector */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white/70">Select Mosque</p>
                <button
                  onClick={() => setShowMosquePicker(!showMosquePicker)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--sr-surface-raised)] border border-white/8 hover:border-[var(--sr-customer)]/30 transition-colors"
                  aria-expanded={showMosquePicker}
                  aria-label="Choose mosque"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[var(--sr-customer)]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{currentMosque.name}</p>
                      <p className="text-xs text-white/65">{currentMosque.distance} away</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/65 transition-transform ${showMosquePicker ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showMosquePicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2"
                    >
                      {MOSQUES.map((mosque) => (
                        <button
                          key={mosque.id}
                          onClick={() => {
                            setSelectedMosque(mosque.id);
                            setShowMosquePicker(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                            selectedMosque === mosque.id
                              ? 'bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/30'
                              : 'bg-[var(--sr-surface-raised)] border border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{mosque.name}</p>
                            <p className="text-xs text-white/65">{mosque.address} · {mosque.distance}</p>
                          </div>
                          {selectedMosque === mosque.id && (
                            <Check className="w-4 h-4 text-[var(--sr-customer)]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Today's Prayer Times */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--sr-vendor)]" />
                  <p className="text-sm font-semibold text-white/70">Today&apos;s Prayer Times</p>
                </div>

                {loading && !adhanData ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-12 rounded-xl shimmer-sweep" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prayerEntries.map((prayer, i) => {
                      const isNext = prayer.name === adhanData?.nextPrayer.name;
                      const isMaghrib = prayer.name === 'Maghrib';
                      return (
                        <motion.div
                          key={prayer.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            isNext
                              ? isMaghrib
                                ? 'bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/30'
                                : 'bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/30'
                              : 'bg-[var(--sr-surface-raised)] border border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              isNext
                                ? isMaghrib ? 'bg-[var(--sr-vendor)]' : 'bg-[var(--sr-customer)]'
                                : 'bg-white/20'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isNext ? 'text-white' : 'text-white/60'
                            }`}>
                              {prayer.name}
                            </span>
                            {isNext && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isMaghrib
                                  ? 'bg-[var(--sr-vendor)]/20 text-[var(--sr-vendor)]'
                                  : 'bg-[var(--sr-customer)]/20 text-[var(--sr-customer)]'
                              }`}>
                                NEXT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${
                              isNext ? 'text-white font-semibold' : 'text-white/50'
                            }`}>
                              {prayer.time}
                            </span>
                            {isNext && prayer.minutesUntil > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isMaghrib
                                  ? 'bg-[var(--sr-vendor)]/15 text-[var(--sr-vendor)]'
                                  : 'bg-[var(--sr-customer)]/15 text-[var(--sr-customer)]'
                              }`}>
                                {prayer.minutesUntil}m
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Maghrib Alert */}
              {adhanData?.maghribCountdown.isIftarTime && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 rounded-2xl border border-[var(--sr-vendor)]/30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,196,81,0.15) 0%, rgba(16,224,122,0.10) 100%)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-3 h-3 rounded-full bg-[var(--sr-vendor)]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[var(--sr-vendor)]">It&apos;s almost Iftar time!</p>
                      <p className="text-xs text-white/50">Cart will auto-prioritize Iftar items</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Location info */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <MapPin className="w-3 h-3 text-white/60" />
                <p className="text-xs text-white/60">{adhanData?.location || 'Lagos, Nigeria'}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
