'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, MessageCircle, Share2, Bookmark, Music2, Play, Pause,
  Volume2, VolumeX, Plus, ChevronUp, ChevronDown, Verified, Send,
  ShoppingBag, Sparkles,
} from 'lucide-react';
import { useNavigation, useCart, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────────── types ──────────────────────── */

interface SwiftBiteVideo {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  category: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  verified: boolean;
  posterImage: string;
  musicTitle: string;
  durationSec: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  orderCtaText: string | null;
  orderProductId: string | null;
  createdAt: string;
}

interface SwiftBiteComment {
  id: string;
  videoId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorInitial: string;
  content: string;
  likes: number;
  time: string;
  createdAt: string;
}

/* ──────────────────────── helpers ──────────────────────── */

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function initialFromName(name: string): string {
  return (name?.[0] || 'U').toUpperCase();
}

/* ──────────────────────── categories ──────────────────────── */

const CATEGORIES = ['For You', 'Iftar', 'Sahur', 'Recipes', 'Vendors', 'Community'] as const;
type Category = (typeof CATEGORIES)[number];

/* ──────────────────────── main component ──────────────────────── */

export default function SwiftBitesModal() {
  const { activeModal, setActiveModal, setActiveTab } = useNavigation();
  const { addToCart } = useCart();
  const userName = useAppStore(s => s.userName);
  const userEmail = useAppStore(s => s.userEmail);
  const { toast } = useToast();
  const isOpen = activeModal === 'swift-bites';

  const [videos, setVideos] = useState<SwiftBiteVideo[]>([]);
  const [category, setCategory] = useState<Category>('For You');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SwiftBiteComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [heartBursts, setHeartBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewRegisteredRef = useRef<Set<string>>(new Set());

  const currentVideo = videos[currentIndex];

  /* ─── Fetch videos on open + category change ─── */
  useEffect(() => {
    if (!isOpen) return;
    fetchVideos();
     
  }, [isOpen, category]);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/swift-bites?category=${encodeURIComponent(category)}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setCurrentIndex(0);
      setProgress(0);
      viewRegisteredRef.current.clear();
    } catch (e) {
      console.error('Failed to fetch SwiftBites videos', e);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  /* ─── Progress bar + auto-advance ─── */
  useEffect(() => {
    if (!currentVideo || !isOpen) return;

    // Register a view (once per video per session)
    if (!viewRegisteredRef.current.has(currentVideo.id)) {
      viewRegisteredRef.current.add(currentVideo.id);
      fetch(`/api/swift-bites?view=${currentVideo.id}`, { method: 'POST' }).catch(() => {});
    }

    // If paused or comments drawer open, freeze the timer (don't auto-advance)
    if (isPaused || showComments) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    const totalMs = (currentVideo.durationSec || 15) * 1000;
    const tickMs = 100;
    const inc = (tickMs / totalMs) * 100;

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          // Auto-advance to next video
          goNext();
          return 0;
        }
        return p + inc;
      });
    }, tickMs);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [currentVideo, isPaused, isOpen, showComments]);

  /* ─── Keyboard navigation ─── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        if (showComments) setShowComments(false);
        else if (showShareSheet) setShowShareSheet(false);
        else handleClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'm') {
        setIsMuted((m) => !m);
      } else if (e.key === 'l') {
        if (currentVideo) handleLike(currentVideo.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
     
  }, [isOpen, currentIndex, videos, showComments, showShareSheet]);

  /* ─── navigation ─── */
  const goNext = useCallback(() => {
    setCurrentIndex((i) => {
      if (i >= videos.length - 1) return i;
      return i + 1;
    });
    setProgress(0);
    setShowComments(false);
  }, [videos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => {
      if (i <= 0) return i;
      return i - 1;
    });
    setProgress(0);
    setShowComments(false);
  }, []);

  const handleClose = () => {
    setActiveModal(null);
    setShowComments(false);
    setShowShareSheet(false);
  };

  /* ─── interactions ─── */
  const handleLike = (videoId: string) => {
    const isLiked = likedVideos.has(videoId);
    setLikedVideos((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
    // Optimistic update of like count
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, likes: v.likes + (isLiked ? -1 : 1) } : v
      )
    );
    // Persist (only increment — for a real app you'd track per-user)
    if (!isLiked) {
      fetch(`/api/swift-bites?like=${videoId}`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleSave = (videoId: string) => {
    const isSaved = savedVideos.has(videoId);
    setSavedVideos((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, saves: v.saves + (isSaved ? -1 : 1) } : v
      )
    );
    if (!isSaved) {
      fetch(`/api/swift-bites?save=${videoId}`, { method: 'POST' }).catch(() => {});
      toast({ title: 'Saved! 🔖', description: 'Video saved to your bookmarks' });
    }
  };

  const handleShare = async (videoId: string) => {
    setShowShareSheet(true);
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, shares: v.shares + 1 } : v))
    );
    fetch(`/api/swift-bites?share=${videoId}`, { method: 'POST' }).catch(() => {});
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>, videoId: string) => {
    // Double-tap to like with heart burst
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const burstId = Date.now();
    setHeartBursts((prev) => [...prev, { id: burstId, x, y }]);
    setTimeout(() => {
      setHeartBursts((prev) => prev.filter((h) => h.id !== burstId));
    }, 1000);
    if (!likedVideos.has(videoId)) {
      handleLike(videoId);
    }
  };

  /* ─── comments ─── */
  const fetchComments = async (videoId: string) => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/swift-bites?commentsFor=${videoId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleOpenComments = () => {
    if (!currentVideo) return;
    setShowComments(true);
    fetchComments(currentVideo.id);
  };

  const handlePostComment = async () => {
    if (!currentVideo || !commentInput.trim()) return;
    setIsPostingComment(true);
    const content = commentInput.trim();
    const authorName = userName || 'Guest';
    const authorHandle = userEmail ? `@${userEmail.split('@')[0]}` : '@guest';
    setCommentInput('');

    // Optimistic insert
    const optimistic: SwiftBiteComment = {
      id: `temp-${Date.now()}`,
      videoId: currentVideo.id,
      authorName,
      authorHandle,
      authorAvatar: '',
      authorInitial: initialFromName(authorName),
      content,
      likes: 0,
      time: 'just now',
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch(`/api/swift-bites?comment=${currentVideo.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          authorHandle,
          authorInitial: initialFromName(authorName),
          content,
        }),
      });
      const data = await res.json();
      if (data?.comment) {
        // Replace optimistic with real
        setComments((prev) =>
          prev.map((c) => (c.id === optimistic.id ? data.comment : c))
        );
        // Update comment count on the video
        setVideos((prev) =>
          prev.map((v) =>
            v.id === currentVideo.id ? { ...v, comments: v.comments + 1 } : v
          )
        );
      }
    } catch (e) {
      console.error('Failed to post comment', e);
      // Roll back optimistic
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setIsPostingComment(false);
    }
  };

  /* ─── order CTA ─── */
  const handleOrderNow = (video: SwiftBiteVideo) => {
    if (!video.orderCtaText) return;
    // Try to find the product by the CTA text keyword
    const allProducts = useAppStore.getState();
    // Just add by name inference — the CTA text contains the product name
    // We use the orderCtaText directly to derive the product name
    const productName = video.orderCtaText.replace(/^Order\s+/i, '');
    addToCart({
      id: Math.floor(Math.random() * 10000) + 500,
      name: productName,
      price: 4500, // Default fallback price — in a real app we'd look this up
      image: video.posterImage,
    });
    toast({
      title: 'Added to Cart! 🛒',
      description: `${productName} — swipe to checkout`,
    });
    handleClose();
    setActiveTab('cart');
  };

  /* ─── share sheet actions ─── */
  const shareActions = [
    { label: 'WhatsApp', icon: '💬', color: 'bg-[#25D366]' },
    { label: 'Twitter / X', icon: '𝕏', color: 'bg-black' },
    { label: 'Copy Link', icon: '🔗', color: 'bg-[var(--sr-customer)]' },
    { label: 'Save Video', icon: '⬇️', color: 'bg-[#A78BFA]' },
  ];

  const handleShareAction = (label: string) => {
    if (label === 'Copy Link') {
      navigator.clipboard?.writeText(`${window.location.origin}/?video=${currentVideo?.id || ''}`).catch(() => {});
      toast({ title: 'Link Copied! 🔗', description: 'SwiftBites video link copied' });
    } else {
      toast({ title: `Shared to ${label}`, description: 'Opening share dialog...' });
    }
    setShowShareSheet(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black flex items-center justify-center"
      >
        {/* ─── Phone-frame container (9:16) ─── */}
        <div
          ref={containerRef}
          className="relative w-full h-full sm:w-[420px] sm:h-[88vh] sm:rounded-3xl overflow-hidden bg-black sm:border sm:border-white/10 sm:shadow-2xl"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0B0D14] to-black">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10E07A] to-[#F5C451] flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <p className="text-white/60 text-sm tracking-widest uppercase">Loading SwiftBites…</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#0B0D14] to-black">
              <Sparkles className="w-10 h-10 text-white/60" />
              <p className="text-white/65 text-sm">No videos in this category yet</p>
            </div>
          ) : (
            <>
              {/* ─── Video frame (Ken Burns animation simulates motion) ─── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentVideo?.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1.12 }}
                  exit={{ opacity: 0, scale: 1 }}
                  transition={{ duration: currentVideo?.durationSec || 15, ease: 'linear' }}
                  className="absolute inset-0"
                  onClick={(e) => {
                    // Single tap = pause/play, double tap = like
                    if (e.detail === 2 && currentVideo) {
                      handleDoubleTap(e, currentVideo.id);
                    } else {
                      setIsPaused((p) => !p);
                    }
                  }}
                >
                  {currentVideo && (
                    <>
                      { }
                      <img
                        src={currentVideo.posterImage}
                        alt={currentVideo.title}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      {/* Dark gradient overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ─── Heart bursts (double-tap to like) ─── */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <AnimatePresence>
                  {heartBursts.map((burst) => (
                    <motion.div
                      key={burst.id}
                      initial={{ opacity: 1, scale: 0, x: burst.x - 30, y: burst.y - 30 }}
                      animate={{ opacity: 0, scale: 1.8, x: burst.x - 60, y: burst.y - 120 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="absolute"
                    >
                      <Heart className="w-16 h-16 fill-[#FB7185] text-[#FB7185] drop-shadow-[0_0_20px_rgba(251,113,133,0.8)]" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* ─── Top: category tabs + close ─── */}
              <div className="absolute top-0 left-0 right-0 z-30 pt-3 pb-2 px-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10E07A] to-[#F5C451] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-white font-black text-lg tracking-tight">
                      SwiftBites
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        category === cat
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── Right action rail ─── */}
              {currentVideo && (
                <div className="absolute right-2 sm:right-3 bottom-32 z-30 flex flex-col items-center gap-5">
                  {/* Creator avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10E07A] to-[#A78BFA] flex items-center justify-center text-white font-black text-lg border-2 border-white">
                      {currentVideo.creatorAvatar ? (
                         
                        <img src={currentVideo.creatorAvatar} alt={currentVideo.creatorName} className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        initialFromName(currentVideo.creatorName)
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FB7185] flex items-center justify-center border-2 border-black">
                      <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  {/* Like */}
                  <button
                    onClick={() => handleLike(currentVideo.id)}
                    className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    aria-label="Like"
                  >
                    <Heart
                      className={`w-9 h-9 transition-all ${
                        likedVideos.has(currentVideo.id)
                          ? 'fill-[#FB7185] text-[#FB7185] drop-shadow-[0_0_12px_rgba(251,113,133,0.8)]'
                          : 'text-white drop-shadow-lg'
                      }`}
                    />
                    <span className="text-white text-xs font-bold drop-shadow-lg">
                      {formatCount(currentVideo.likes + (likedVideos.has(currentVideo.id) ? 1 : 0) - (likedVideos.has(currentVideo.id) ? 1 : 0))}
                    </span>
                  </button>

                  {/* Comments */}
                  <button
                    onClick={handleOpenComments}
                    className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    aria-label="Comments"
                  >
                    <MessageCircle className="w-9 h-9 text-white drop-shadow-lg" />
                    <span className="text-white text-xs font-bold drop-shadow-lg">
                      {formatCount(currentVideo.comments)}
                    </span>
                  </button>

                  {/* Save */}
                  <button
                    onClick={() => handleSave(currentVideo.id)}
                    className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    aria-label="Save"
                  >
                    <Bookmark
                      className={`w-9 h-9 transition-all ${
                        savedVideos.has(currentVideo.id)
                          ? 'fill-[#F5C451] text-[var(--sr-vendor)] drop-shadow-[0_0_12px_rgba(245,196,81,0.8)]'
                          : 'text-white drop-shadow-lg'
                      }`}
                    />
                    <span className="text-white text-xs font-bold drop-shadow-lg">
                      {formatCount(currentVideo.saves)}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => handleShare(currentVideo.id)}
                    className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    aria-label="Share"
                  >
                    <Share2 className="w-9 h-9 text-white drop-shadow-lg" />
                    <span className="text-white text-xs font-bold drop-shadow-lg">
                      {formatCount(currentVideo.shares)}
                    </span>
                  </button>

                  {/* Spinning music disc */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F2330] to-black border-2 border-white/20 flex items-center justify-center"
                  >
                    <Music2 className="w-4 h-4 text-white/80" />
                  </motion.div>
                </div>
              )}

              {/* ─── Bottom: caption + creator + music ticker ─── */}
              {currentVideo && (
                <div className="absolute left-0 right-16 bottom-24 z-20 px-4 pb-2">
                  {/* Creator row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-bold text-sm drop-shadow-lg">
                      {currentVideo.creatorHandle}
                    </span>
                    {currentVideo.verified && (
                      <Verified className="w-4 h-4 text-[var(--sr-rider)] fill-[#38BDF8]/30" />
                    )}
                    <span className="text-white/60 text-xs">·</span>
                    <span className="text-white/80 text-xs">{currentVideo.creatorName}</span>
                  </div>

                  {/* Caption */}
                  <p className="text-white text-sm leading-snug mb-2 drop-shadow-lg line-clamp-3">
                    {currentVideo.caption}
                  </p>

                  {/* Hashtags */}
                  {currentVideo.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-2">
                      {currentVideo.hashtags.map((tag) => (
                        <span key={tag} className="text-white text-xs font-bold drop-shadow-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Music ticker */}
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Music2 className="w-3 h-3 text-white shrink-0" />
                    <div className="overflow-hidden flex-1">
                      <motion.div
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                        className="whitespace-nowrap text-white/90 text-xs font-medium"
                      >
                        {currentVideo.musicTitle} · {currentVideo.musicTitle} ·{' '}
                      </motion.div>
                    </div>
                  </div>

                  {/* Order CTA */}
                  {currentVideo.orderCtaText && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      onClick={() => handleOrderNow(currentVideo)}
                      className="mt-3 flex items-center gap-2 bg-gradient-to-r from-[#10E07A] to-[#13ec13] text-black font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-full shadow-[0_0_20px_rgba(16,224,122,0.5)] hover:brightness-110 active:scale-95 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {currentVideo.orderCtaText}
                    </motion.button>
                  )}
                </div>
              )}

              {/* ─── Progress bar ─── */}
              <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-white/10">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* ─── Bottom controls: mute + prev/next ─── */}
              <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>

                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-30"
                  aria-label="Previous"
                >
                  <ChevronUp className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => setIsPaused((p) => !p)}
                  className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label={isPaused ? 'Play' : 'Pause'}
                >
                  {isPaused ? <Play className="w-5 h-5 text-white fill-white ml-0.5" /> : <Pause className="w-5 h-5 text-white fill-white" />}
                </button>

                <button
                  onClick={goNext}
                  disabled={currentIndex >= videos.length - 1}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-30"
                  aria-label="Next"
                >
                  <ChevronDown className="w-5 h-5 text-white" />
                </button>

                <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {currentIndex + 1}/{videos.length}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ─── Comments drawer ─── */}
          <AnimatePresence>
            {showComments && currentVideo && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowComments(false)}
                  className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                  className="absolute bottom-0 left-0 right-0 z-50 h-[70%] bg-[#0B0D14] rounded-t-3xl border-t border-white/10 flex flex-col"
                >
                  {/* Grabber */}
                  <div className="pt-3 pb-2 flex justify-center">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </div>
                  {/* Header */}
                  <div className="px-5 pb-3 flex items-center justify-between border-b border-white/5">
                    <h3 className="text-white font-bold text-base">
                      {formatCount(currentVideo.comments)} comments
                    </h3>
                    <button
                      onClick={() => setShowComments(false)}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  {/* Comments list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {isLoadingComments ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-9 h-9 rounded-full bg-white/5" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-white/5 rounded w-1/3" />
                            <div className="h-4 bg-white/5 rounded w-2/3" />
                          </div>
                        </div>
                      ))
                    ) : comments.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                        <p className="text-white/60 text-sm">Be the first to comment</p>
                      </div>
                    ) : (
                      comments.map((c) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10E07A] to-[#A78BFA] flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {c.authorInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-white/80 text-xs font-bold">{c.authorHandle}</span>
                              <span className="text-white/60 text-[10px]">· {c.time}</span>
                            </div>
                            <p className="text-white text-sm leading-snug">{c.content}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <button className="flex items-center gap-1 text-white/65 text-xs hover:text-[#FB7185] transition-colors">
                                <Heart className="w-3 h-3" />
                                {c.likes > 0 && formatCount(c.likes)}
                              </button>
                              <button className="text-white/65 text-xs hover:text-white/70 transition-colors">
                                Reply
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Comment input */}
                  <div className="p-3 border-t border-white/5 bg-[#0B0D14]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10E07A] to-[#F5C451] flex items-center justify-center text-black font-bold text-xs shrink-0">
                        {initialFromName(userName || 'G')}
                      </div>
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostComment();
                          }
                        }}
                        placeholder="Add a comment…"
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[var(--sr-customer)]/40"
                      />
                      <button
                        onClick={handlePostComment}
                        disabled={!commentInput.trim() || isPostingComment}
                        className="w-9 h-9 rounded-full bg-[var(--sr-customer)] flex items-center justify-center disabled:opacity-30 hover:brightness-110 active:scale-95 transition-all"
                        aria-label="Post comment"
                      >
                        <Send className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ─── Share sheet ─── */}
          <AnimatePresence>
            {showShareSheet && currentVideo && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowShareSheet(false)}
                  className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                  className="absolute bottom-0 left-0 right-0 z-50 bg-[#0B0D14] rounded-t-3xl border-t border-white/10 p-5 pb-8"
                >
                  <div className="pt-2 pb-4 flex justify-center">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-4 text-center">Share this SwiftBite</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {shareActions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => handleShareAction(a.label)}
                        className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                      >
                        <div className={`w-14 h-14 rounded-2xl ${a.color} flex items-center justify-center text-2xl shadow-lg`}>
                          {a.icon}
                        </div>
                        <span className="text-white/70 text-xs font-medium">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
