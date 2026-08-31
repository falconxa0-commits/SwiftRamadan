'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Bug, Lightbulb, Star, Send, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

type FeedbackType = 'feedback' | 'bug' | 'feature';

const TYPES: { id: FeedbackType; label: string; icon: typeof Bug; color: string; desc: string }[] = [
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'var(--sr-customer)', desc: 'General thoughts' },
  { id: 'bug', label: 'Bug Report', icon: Bug, color: 'var(--sr-error)', desc: 'Something broke' },
  { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'var(--sr-vendor)', desc: 'Idea for the app' },
];

export default function BetaFeedbackModal() {
  const { activeModal, setActiveModal, activeTab } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const isOpen = activeModal === 'beta-feedback';
  const { toast } = useToast();

  const [type, setType] = useState<FeedbackType>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Almost there', description: 'Please add a subject and message', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: userEmail || 'guest', type, subject: subject.trim(),
          message: message.trim(), rating, page: activeTab || 'home',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast({ title: 'Feedback sent! 💚', description: 'Jazak Allahu Khairan — our team will review it' });
      } else {
        toast({ title: 'Failed to send', description: data.error || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not reach server', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveModal(null);
    // Reset after close animation
    setTimeout(() => {
      setType('feedback'); setSubject(''); setMessage(''); setRating(0); setSubmitted(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[110]" onClick={handleClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 h-[94vh] bg-[var(--sr-surface-base)] rounded-t-3xl z-[115] flex flex-col overflow-hidden border-t border-[var(--sr-customer)]/20">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/5 shrink-0 bg-gradient-to-r from-[var(--sr-customer)]/5 to-[var(--sr-vendor)]/5">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 bg-gradient-to-br from-[var(--sr-customer)]/20 to-[var(--sr-vendor)]/20 rounded-2xl flex items-center justify-center border border-[var(--sr-customer)]/30">
                  <MessageSquare className="w-6 h-6 text-[var(--sr-customer)]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    Beta Feedback
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--sr-vendor)]/20 border border-[var(--sr-vendor)]/30 text-[var(--sr-vendor)] text-[9px] font-black uppercase tracking-wider">Beta</span>
                  </h2>
                  <p className="text-white/65 text-xs">Help us improve SwiftRamadan</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--sr-customer)] to-[#0ea30e] flex items-center justify-center green-glow">
                    <CheckCircle2 className="w-10 h-10 text-[var(--sr-surface-base)]" />
                  </motion.div>
                  <h3 className="text-white font-black text-xl">Shukran! 💚</h3>
                  <p className="text-white/50 text-sm mt-1">Your feedback has been received.</p>
                  <p className="text-white/65 text-xs mt-2 max-w-xs mx-auto">Our team reviews every submission. You're helping make SwiftRamadan better for the whole community.</p>
                  <button onClick={handleClose} className="mt-5 bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold text-sm py-2.5 px-6 rounded-xl active:scale-[0.98] transition-transform">
                    Done
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {/* Type selector */}
                  <div>
                    <p className="text-white/65 text-[10px] font-bold uppercase tracking-wider mb-2">What kind of feedback?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {TYPES.map((t) => {
                        const Icon = t.icon; const active = type === t.id;
                        return (
                          <button key={t.id} onClick={() => setType(t.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${active ? 'bg-white/5' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                            style={active ? { borderColor: `color-mix(in srgb, ${t.color} 31%, transparent)`, backgroundColor: `color-mix(in srgb, ${t.color} 6%, transparent)` } : {}}>
                            <Icon className="w-5 h-5" style={{ color: active ? t.color : 'color-mix(in srgb, var(--sr-text-primary) 40%, transparent)' }} />
                            <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-white/50'}`}>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <p className="text-white/65 text-[10px] font-bold uppercase tracking-wider mb-2">Rate your experience</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform active:scale-90" aria-label={`Rate ${s} stars`}>
                          <Star className={`w-7 h-7 transition-all ${(hoverRating || rating) >= s ? 'text-[var(--sr-vendor)] fill-[var(--sr-vendor)]' : 'text-white/20'}`} />
                        </button>
                      ))}
                      {rating > 0 && <span className="ml-2 text-white/60 text-xs font-bold">{rating}/5</span>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <p className="text-white/65 text-[10px] font-bold uppercase tracking-wider mb-2">Subject</p>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your feedback"
                      className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder:text-white/60 focus:border-[var(--sr-customer)]/40 focus:outline-none" />
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-white/65 text-[10px] font-bold uppercase tracking-wider mb-2">Message</p>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us more… What happened? What were you trying to do? Any ideas?"
                      rows={5}
                      className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder:text-white/60 focus:border-[var(--sr-customer)]/40 focus:outline-none resize-none custom-scrollbar" />
                  </div>

                  {/* Context chip */}
                  <div className="flex items-center gap-2 text-xs text-white/65">
                    <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Page: {activeTab || 'home'}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span>Auto-attached to help our team reproduce</span>
                  </div>
                </div>
              )}
            </div>

              {/* Sticky footer */}
            {!submitted && (
              <div className="shrink-0 p-3 sm:p-4 border-t border-white/5 bg-[var(--sr-surface-base)]/95 backdrop-blur-lg">
                <button onClick={handleSubmit} disabled={submitting || !subject.trim() || !message.trim()}
                  className="w-full bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Feedback</>}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
