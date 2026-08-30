'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Sunrise, Sunset, Sparkles } from 'lucide-react';
import { useNavigation, useAdhanSync } from '@/lib/store-selectors';

type AppTheme = 'ramadan' | 'iftar' | 'sahur' | 'eid';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  autoDetect: boolean;
  setAutoDetect: (auto: boolean) => void;
  suggestedTheme: AppTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'ramadan',
  setTheme: () => {},
  autoDetect: true,
  setAutoDetect: () => {},
  suggestedTheme: 'ramadan',
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

// Auto-detect theme based on time of day
function detectThemeFromTime(): AppTheme {
  const hour = new Date().getHours();

  // Sahur: 12am – 5:30am (after Tahajjud, before Fajr)
  if (hour >= 0 && hour < 5) return 'sahur';
  // Early fasting: 5am – 3pm (default dark)
  if (hour >= 5 && hour < 15) return 'ramadan';
  // Pre-Iftar: 3pm – 7pm (warm amber)
  if (hour >= 15 && hour < 19) return 'iftar';
  // Post-Isha: 7pm – 10pm (cool blue)
  if (hour >= 19 && hour < 22) return 'sahur';
  // Late night: 10pm – midnight (default dark)
  return 'ramadan';
}

const THEME_INFO: Record<AppTheme, { label: string; description: string; icon: typeof Sun; color: string }> = {
  ramadan: { label: 'Ramadan', description: 'Deep dark during fasting', icon: Moon, color: '#10E07A' },
  iftar: { label: 'Iftar', description: 'Warm amber near Maghrib', icon: Sunset, color: '#F5C451' },
  sahur: { label: 'Sahur', description: 'Cool blue after Tahajjud', icon: Sunrise, color: '#38BDF8' },
  eid: { label: 'Eid', description: 'Festive gold & green', icon: Sparkles, color: '#10E07A' },
};

// Theme Provider — wraps the app and applies CSS classes to body
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { appTheme, setAppTheme } = useAdhanSync();
  const [autoDetect, setAutoDetect] = useState(true);
  const [suggestedTheme, setSuggestedTheme] = useState<AppTheme>('ramadan');

  // Auto-detect theme on mount and periodically
  useEffect(() => {
    const detect = () => {
      const detected = detectThemeFromTime();
      setSuggestedTheme(detected);
      if (autoDetect) {
        setAppTheme(detected);
      }
    };

    detect();
    const interval = setInterval(detect, 60000); // Re-check every minute
    return () => clearInterval(interval);
  }, [autoDetect, setAppTheme]);

  // Apply theme class to document body
  useEffect(() => {
    const body = document.body;
    // Remove all theme classes
    body.classList.remove('theme-ramadan', 'theme-iftar', 'theme-sahur', 'theme-eid');
    // Add current theme class
    body.classList.add(`theme-${appTheme}`);

    // Also update the root for CSS variables
    const root = document.documentElement;
    root.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  return (
    <ThemeContext.Provider value={{ theme: appTheme, setTheme: setAppTheme, autoDetect, setAutoDetect, suggestedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme Transition Settings Modal
export default function ThemeTransition() {
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'theme-transition';
  const { theme, setTheme, autoDetect, setAutoDetect, suggestedTheme } = useThemeContext();

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, setActiveModal]);

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
          aria-label="Theme Settings"
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
            style={{ background: 'linear-gradient(180deg, #11141C 0%, #0B0D14 100%)' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4" style={{ background: 'linear-gradient(180deg, #11141C 0%, rgba(17,20,28,0.95) 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="icon-tile w-10 h-10 border border-[#A78BFA]/20" style={{ background: 'rgba(167,139,250,0.12)' }}>
                  <Sun className="w-5 h-5 text-[#A78BFA]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Time-of-Day Theme</h2>
                  <p className="text-xs text-white/50">Auto-shifts throughout the day</p>
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
              {/* Auto-detect toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--sr-surface-raised)] border border-white/8">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-Detect Time</p>
                  <p className="text-xs text-white/65">Theme shifts based on prayer schedule</p>
                </div>
                <button
                  onClick={() => setAutoDetect(!autoDetect)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                    autoDetect ? 'bg-[var(--sr-customer)]' : 'bg-white/10'
                  }`}
                  role="switch"
                  aria-checked={autoDetect}
                  aria-label="Toggle auto-detect"
                >
                  <motion.div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg"
                    animate={{ left: autoDetect ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Suggested theme banner */}
              {autoDetect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl border"
                  style={{
                    background: `linear-gradient(135deg, ${THEME_INFO[suggestedTheme].color}15, ${THEME_INFO[suggestedTheme].color}08)`,
                    borderColor: `${THEME_INFO[suggestedTheme].color}30`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {(() => {
                        const Icon = THEME_INFO[suggestedTheme].icon;
                        return <Icon className="w-5 h-5" style={{ color: THEME_INFO[suggestedTheme].color }} />;
                      })()}
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Suggested: {THEME_INFO[suggestedTheme].label}
                      </p>
                      <p className="text-xs text-white/50">{THEME_INFO[suggestedTheme].description}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Theme options */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white/70">Choose Theme</p>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(THEME_INFO) as [AppTheme, typeof THEME_INFO[AppTheme]][]).map(([key, info]) => {
                    const Icon = info.icon;
                    const isActive = theme === key;
                    return (
                      <motion.button
                        key={key}
                        onClick={() => {
                          setAutoDetect(false);
                          setTheme(key);
                        }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative p-4 rounded-2xl text-left transition-all ${
                          isActive
                            ? 'border-2'
                            : 'border border-white/8 hover:border-white/15'
                        }`}
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${info.color}18, ${info.color}08)`
                            : '#0F1118',
                          borderColor: isActive ? `${info.color}50` : undefined,
                        }}
                        aria-pressed={isActive}
                        aria-label={`Set ${info.label} theme`}
                      >
                        {/* Color preview dot */}
                        <div
                          className="w-8 h-8 rounded-full mb-3 flex items-center justify-center"
                          style={{ background: `${info.color}20` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: info.color }} />
                        </div>
                        <p className="text-sm font-semibold text-white">{info.label}</p>
                        <p className="text-xs text-white/65 mt-1">{info.description}</p>
                        {isActive && (
                          <motion.div
                            layoutId="theme-indicator"
                            className="absolute top-2 right-2 w-2 h-2 rounded-full"
                            style={{ backgroundColor: info.color }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Time schedule */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white/70">Schedule</p>
                <div className="space-y-2">
                  {[
                    { time: '12am – 5am', theme: 'Sahur' as const, color: '#38BDF8' },
                    { time: '5am – 3pm', theme: 'Ramadan' as const, color: '#10E07A' },
                    { time: '3pm – 7pm', theme: 'Iftar' as const, color: '#F5C451' },
                    { time: '7pm – 10pm', theme: 'Sahur' as const, color: '#38BDF8' },
                    { time: '10pm – 12am', theme: 'Ramadan' as const, color: '#10E07A' },
                  ].map((schedule) => (
                    <div
                      key={schedule.time}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--sr-surface-raised)] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: schedule.color }}
                        />
                        <span className="text-sm text-white/70">{schedule.time}</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: schedule.color }}>
                        {schedule.theme}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
