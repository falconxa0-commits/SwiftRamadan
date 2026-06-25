'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Moon,
  Sun,
  Globe,
  DollarSign,
  User,
  CreditCard,
  MapPin,
  HelpCircle,
  MessageSquare,
  Flag,
  FileText,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface UserSetting {
  notificationsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  language: string;
  currency: string;
  theme: string;
}

const DEFAULT_SETTINGS: UserSetting = {
  notificationsEnabled: true,
  pushEnabled: true,
  emailEnabled: false,
  language: 'en',
  currency: 'NGN',
  theme: 'dark',
};

const LANGUAGES = [
  { code: 'en',    label: 'English',  flag: '🇬🇧' },
  { code: 'yo',    label: 'Yoruba',   flag: '🇳🇬' },
  { code: 'ha',    label: 'Hausa',    flag: '🇳🇬' },
  { code: 'ig',    label: 'Igbo',     flag: '🇳🇬' },
  { code: 'ar',    label: 'Arabic',   flag: '🇸🇦' },
];

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
];

function GoldToggle({
  enabled,
  onToggle,
  label,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
        enabled ? 'bg-[#F5C451]' : 'bg-white/10'
      }`}
      style={enabled ? { boxShadow: '0 0 12px rgba(245,196,81,0.35)' } : undefined}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsModal() {
  const { activeModal, setActiveModal, userEmail, logout } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'settings';

  const [settings, setSettings] = useState<UserSetting>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Fetch settings on open
  const fetchSettings = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/settings?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data?.success && data.setting) {
        setSettings({
          notificationsEnabled: data.setting.notificationsEnabled,
          pushEnabled: data.setting.pushEnabled,
          emailEnabled: data.setting.emailEnabled,
          language: data.setting.language,
          currency: data.setting.currency,
          theme: data.setting.theme,
        });
        // Apply theme class to body
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('light', data.setting.theme === 'light');
        }
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, fetchSettings]);

  const saveField = async (field: keyof UserSetting, value: unknown, label: string) => {
    if (!userEmail) {
      toast({ title: 'Sign in required', description: 'Please sign in to save settings.', variant: 'destructive' });
      return;
    }
    setSavingField(field);
    setSettings(prev => ({ ...prev, [field]: value }));

    // Theme: apply immediately
    if (field === 'theme' && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('light', value === 'light');
      try {
        localStorage.setItem('swiftramadan-theme', String(value));
      } catch {
        // ignore
      }
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, [field]: value }),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ title: `${label} saved`, description: 'Your preference has been updated.' });
      } else {
        toast({ title: 'Save failed', description: data?.message || 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Save failed', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setSavingField(null);
    }
  };

  const handleLogout = () => {
    setActiveModal(null);
    logout();
    toast({ title: 'Logged out', description: 'See you soon! 🌙' });
  };

  const openModal = (modal: string) => {
    setActiveModal(modal);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md max-h-[90vh] glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto"
              style={{ background: 'linear-gradient(180deg, rgba(15,17,24,0.95), rgba(11,13,20,0.98))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5C451]/10 border border-[#F5C451]/30 flex items-center justify-center icon-tile">
                    <SettingsIcon className="w-5 h-5 text-[#F5C451] relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-tight">Settings</h2>
                    <p className="text-white/40 text-[11px]">Manage your preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  aria-label="Close settings"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-7 h-7 text-[#F5C451] animate-spin" />
                    <p className="text-white/40 text-sm">Loading settings…</p>
                  </div>
                ) : (
                  <>
                    {/* ── Notifications ── */}
                    <section>
                      <p className="text-white/30 text-[10px] font-extrabold tracking-widest mb-2 px-1">
                        NOTIFICATIONS
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 glass-card rounded-xl">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-[#10E07A]" />
                            <div>
                              <p className="text-white font-bold text-sm">Push Notifications</p>
                              <p className="text-white/40 text-xs">Order updates & alerts</p>
                            </div>
                          </div>
                          <GoldToggle
                            enabled={settings.pushEnabled && settings.notificationsEnabled}
                            onToggle={() => saveField('pushEnabled', !settings.pushEnabled, 'Push notifications')}
                            label="Push notifications"
                            disabled={savingField === 'pushEnabled'}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 glass-card rounded-xl">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-[#38BDF8]" />
                            <div>
                              <p className="text-white font-bold text-sm">In-App Notifications</p>
                              <p className="text-white/40 text-xs">Show inside the app</p>
                            </div>
                          </div>
                          <GoldToggle
                            enabled={settings.notificationsEnabled}
                            onToggle={() => saveField('notificationsEnabled', !settings.notificationsEnabled, 'In-app notifications')}
                            label="In-app notifications"
                            disabled={savingField === 'notificationsEnabled'}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 glass-card rounded-xl">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-[#A78BFA]" />
                            <div>
                              <p className="text-white font-bold text-sm">Email Alerts</p>
                              <p className="text-white/40 text-xs">Receipts & promos</p>
                            </div>
                          </div>
                          <GoldToggle
                            enabled={settings.emailEnabled}
                            onToggle={() => saveField('emailEnabled', !settings.emailEnabled, 'Email alerts')}
                            label="Email alerts"
                            disabled={savingField === 'emailEnabled'}
                          />
                        </div>
                      </div>
                    </section>

                    {/* ── Appearance ── */}
                    <section>
                      <p className="text-white/30 text-[10px] font-extrabold tracking-widest mb-2 px-1">
                        APPEARANCE
                      </p>
                      <div className="flex items-center justify-between p-3 glass-card rounded-xl">
                        <div className="flex items-center gap-3">
                          {settings.theme === 'dark' ? (
                            <Moon className="w-5 h-5 text-[#A78BFA]" />
                          ) : (
                            <Sun className="w-5 h-5 text-[#F5C451]" />
                          )}
                          <div>
                            <p className="text-white font-bold text-sm">Theme</p>
                            <p className="text-white/40 text-xs">
                              {settings.theme === 'dark' ? 'Aurora Dark' : 'Light'}
                            </p>
                          </div>
                        </div>
                        <GoldToggle
                          enabled={settings.theme === 'dark'}
                          onToggle={() =>
                            saveField('theme', settings.theme === 'dark' ? 'light' : 'dark', 'Theme')
                          }
                          label="Theme toggle"
                          disabled={savingField === 'theme'}
                        />
                      </div>
                    </section>

                    {/* ── Language ── */}
                    <section>
                      <p className="text-white/30 text-[10px] font-extrabold tracking-widest mb-2 px-1">
                        LANGUAGE
                      </p>
                      <div className="p-3 glass-card rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="w-5 h-5 text-[#10E07A]" />
                          <p className="text-white font-bold text-sm">App Language</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {LANGUAGES.map(lang => (
                            <button
                              key={lang.code}
                              onClick={() => saveField('language', lang.code, `Language: ${lang.label}`)}
                              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                                settings.language === lang.code
                                  ? 'bg-[#F5C451]/10 border-[#F5C451]/30'
                                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <span className="text-lg">{lang.flag}</span>
                                <span className={`text-sm font-bold ${settings.language === lang.code ? 'text-[#F5C451]' : 'text-white/80'}`}>
                                  {lang.label}
                                </span>
                              </span>
                              {settings.language === lang.code && (
                                <span className="w-2 h-2 rounded-full bg-[#F5C451] shadow-[0_0_8px_#F5C451]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* ── Currency ── */}
                    <section>
                      <p className="text-white/30 text-[10px] font-extrabold tracking-widest mb-2 px-1">
                        CURRENCY
                      </p>
                      <div className="p-3 glass-card rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <DollarSign className="w-5 h-5 text-[#F5C451]" />
                          <p className="text-white font-bold text-sm">Display Currency</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {CURRENCIES.map(c => (
                            <button
                              key={c.code}
                              onClick={() => saveField('currency', c.code, `Currency: ${c.code}`)}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                                settings.currency === c.code
                                  ? 'bg-[#F5C451]/10 border-[#F5C451]/30'
                                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                              }`}
                            >
                              <span className={`text-xl font-black ${settings.currency === c.code ? 'text-[#F5C451]' : 'text-white/80'}`}>
                                {c.symbol}
                              </span>
                              <span className={`text-[10px] font-bold ${settings.currency === c.code ? 'text-[#F5C451]' : 'text-white/60'}`}>
                                {c.code}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* ── Account ── */}
                    <section>
                      <p className="text-white/30 text-[10px] font-extrabold tracking-widest mb-2 px-1">
                        ACCOUNT
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => openModal('edit-profile')}
                          className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-white/15 transition-colors w-full text-left"
                        >
                          <User className="w-5 h-5 text-[#10E07A]" />
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">Edit Profile</p>
                            <p className="text-white/40 text-xs">Name, phone, area, avatar</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </button>
                        <button
                          onClick={() => toast({ title: 'Saved Addresses', description: 'Address management coming soon.' })}
                          className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-white/15 transition-colors w-full text-left"
                        >
                          <MapPin className="w-5 h-5 text-[#A78BFA]" />
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">Saved Addresses</p>
                            <p className="text-white/40 text-xs">Manage delivery locations</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </button>
                        <button
                          onClick={() => toast({ title: 'Payment Methods', description: 'Payment management coming soon.' })}
                          className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-white/15 transition-colors w-full text-left"
                        >
                          <CreditCard className="w-5 h-5 text-[#F5C451]" />
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">Payment Methods</p>
                            <p className="text-white/40 text-xs">Cards, bank, BNPL</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </button>
                      </div>
                    </section>

                    {/* ── Support ── */}
                    <section>
                      <p className="text-white/30 text-[10px] font-extrabold tracking-widest mb-2 px-1">
                        SUPPORT
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => openModal('help-center')}
                          className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-white/15 transition-colors w-full text-left"
                        >
                          <HelpCircle className="w-5 h-5 text-[#10E07A]" />
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">Help Center</p>
                            <p className="text-white/40 text-xs">FAQs & guides</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </button>
                        <button
                          onClick={() => toast({ title: 'Contact Us', description: 'Our support team will reach out via WhatsApp.' })}
                          className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-white/15 transition-colors w-full text-left"
                        >
                          <MessageSquare className="w-5 h-5 text-[#38BDF8]" />
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">Contact Us</p>
                            <p className="text-white/40 text-xs">Chat on WhatsApp</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </button>
                        <button
                          onClick={() => openModal('help-center')}
                          className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-white/15 transition-colors w-full text-left"
                        >
                          <Flag className="w-5 h-5 text-[#FB7185]" />
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">Report a Problem</p>
                            <p className="text-white/40 text-xs">Bug, issue, or feedback</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </button>
                      </div>
                    </section>

                    {/* ── Legal ── */}
                    <section>
                      <p className="text-white/30 text-[10px] font-extrabold tracking-widest mb-2 px-1">
                        LEGAL
                      </p>
                      <button
                        onClick={() => openModal('legal')}
                        className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-white/15 transition-colors w-full text-left"
                      >
                        <FileText className="w-5 h-5 text-white/50" />
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">Terms, Privacy & About</p>
                          <p className="text-white/40 text-xs">Legal documents</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </button>
                    </section>

                    {/* ── Logout ── */}
                    <section className="pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/20 text-[#FB7185] font-bold text-sm hover:bg-[#FB7185]/15 transition-colors active:scale-[0.98]"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </section>

                    <p className="text-center text-white/20 text-[10px] pt-2 pb-1">
                      SwiftRamadan v1.0 — Ramadan 2026
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
