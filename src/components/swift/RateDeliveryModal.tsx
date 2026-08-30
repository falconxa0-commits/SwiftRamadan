'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2, Bike } from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────
// Lightweight rating context — set externally before opening.
// Usage:
//   setRateContext({ orderId: 'SWR-XXXX', riderName: 'Tunde R.', riderId: 'user_xxx' });
//   setActiveModal('rate-delivery');
// ─────────────────────────────────────────────────────────────
export interface RateContext {
  orderId?: string;
  riderName?: string;
  riderId?: string;
  vendorName?: string;
  vendorId?: string;
}

let _rateContext: RateContext = {};

export function setRateContext(ctx: RateContext) {
  _rateContext = { ...ctx };
}

export function getRateContext(): RateContext {
  return _rateContext;
}

// ─────────────────────────────────────────────────────────────

const TAGS = [
  'Fast delivery',
  'Friendly',
  'Professional',
  'Careful with food',
  'Good communication',
];

const STAR_LABELS: Record<number, string> = {
  0: 'Tap a star to rate',
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent!',
};

export default function RateDeliveryModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userName = useAppStore(s => s.userName);
  const userEmail = useAppStore(s => s.userEmail);
  const { toast } = useToast();

  const isOpen = activeModal === 'rate-delivery';
  const ctx = getRateContext();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const displayRating = hoverRating || rating;
  const riderName = ctx.riderName || 'your rider';

  const reset = useCallback(() => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setSelectedTags([]);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    setActiveModal(null);
  }, [reset, setActiveModal]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating < 1) {
      toast({
        title: 'Select a rating',
        description: 'Please tap at least one star to rate your delivery.',
      });
      return;
    }
    if (!ctx.orderId) {
      toast({
        title: 'Order not found',
        description: 'We could not find the order to rate. Please try again later.',
      });
      handleClose();
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    // Compose a comment that includes the selected tags
    const tagLine = selectedTags.length > 0 ? `Tags: ${selectedTags.join(', ')}` : '';
    const fullComment = [comment.trim(), tagLine].filter(Boolean).join('\n\n');

    try {
      const res = await fetch(`/api/orders/${ctx.orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: ctx.orderId,
          userId: userEmail || null,
          authorName: userName || 'Guest',
          rating,
          comment: fullComment,
          targetType: 'rider',
          targetId: ctx.riderId || ctx.orderId,
        }),
      });
      if (!res.ok) throw new Error('rate failed');
      toast({
        title: 'Thanks for your rating! ⭐',
        description: 'Your feedback helps us improve every delivery.',
      });
      handleClose();
    } catch {
      setSubmitting(false);
      toast({
        title: 'Could not submit rating',
        description: 'Network issue — please try again.',
      });
    }
  }, [rating, selectedTags, comment, ctx.orderId, ctx.riderId, submitting, userEmail, userName, toast, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140]"
            onClick={handleClose}
          />

          {/* Bottom sheet modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed bottom-0 left-0 right-0 z-[150] bg-[var(--sr-surface-raised)] rounded-t-3xl border-t border-white/10 max-w-md mx-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1.5 rounded-full bg-white/15" />
            </div>

            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="size-10 rounded-2xl bg-[var(--sr-vendor)]/15 border border-[var(--sr-vendor)]/30 flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5 text-[var(--sr-vendor)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white font-black text-lg leading-tight">Rate your delivery</h2>
                  <p className="text-white/65 text-xs truncate">
                    How was {riderName}?
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="size-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Aurora accent bar */}
            <div className="h-px mx-5 bg-gradient-to-r from-transparent via-[#F5C451]/40 to-transparent" />

            <div className="px-5 py-5 pb-7 space-y-5">
              {/* ── Star selector ── */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = displayRating >= n;
                    return (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 active:scale-90 transition-transform"
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                      >
                        <motion.div
                          animate={filled ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                          transition={{ duration: 0.28 }}
                        >
                          <Star
                            className={`w-10 h-10 ${filled ? 'text-[var(--sr-vendor)] fill-[#F5C451] drop-shadow-[0_0_12px_rgba(245,196,81,0.5)]' : 'text-white/20'}`}
                            strokeWidth={2}
                          />
                        </motion.div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-sm font-bold text-[var(--sr-vendor)] min-h-[20px]">
                  {STAR_LABELS[displayRating] || STAR_LABELS[0]}
                </p>
              </div>

              {/* ── Tags ── */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
                  What stood out?
                </p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                          active
                            ? 'bg-[var(--sr-vendor)]/15 text-[var(--sr-vendor)] border-[var(--sr-vendor)]/40'
                            : 'bg-white/5 text-white/60 border-white/8 hover:border-white/15'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Comment ── */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
                  Comment (optional)
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about your delivery experience…"
                  rows={3}
                  maxLength={500}
                  className="w-full bg-white/5 border border-white/8 focus:border-[var(--sr-vendor)]/30 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/60 outline-none resize-none transition-colors custom-scrollbar"
                />
                <div className="flex justify-end">
                  <span className="text-[10px] text-white/60 mt-0.5">{comment.length}/500</span>
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={rating < 1 || submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F5C451] to-[#E0A82E] text-[#1a1404] font-black text-sm active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100 shadow-[0_0_20px_rgba(245,196,81,0.35)]"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </span>
                  ) : (
                    'Submit Rating'
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-2 text-white/65 text-xs font-bold hover:text-white/70 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
