'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  MessageCircle,
  Plus,
  Share2,
  Send,
  Users,
  Flame,
  Clock,
} from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { communityPosts } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────────────────────────────────────────────────────
   SwiftCommunity — full community feed with real posts / comments / likes
   Backed by /api/community (built by Task 2). Falls back to mock
   seed data so the feed is never visually empty.
   ────────────────────────────────────────────────────────────────── */

interface ApiComment {
  id: string;
  authorName: string;
  authorInitial: string;
  content: string;
  createdAt: string;
}

interface ApiPost {
  id: string;
  authorName: string;
  authorInitial: string;
  authorEmail?: string;
  category: string;
  content: string;
  imageUrl?: string | null;
  likes: number;
  likedBy?: string | string[];
  createdAt: string;
  comments: ApiComment[];
  /** Client-only stable React key for optimistic posts. */
  _localId?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Reviews', label: 'Reviews' },
  { id: 'Recipes', label: 'Recipes' },
  { id: 'Tips', label: 'Tips' },
  { id: 'Questions', label: 'Questions' },
  { id: 'General', label: 'General' },
];

const COMPOSER_CATEGORIES = ['Reviews', 'Recipes', 'Tips', 'Questions', 'General'];

// Cycle 5 palette gradients by initial letter
// (A→green, B→gold, C→purple, D→cyan, E→red, F→green, …).
const PALETTE = [
  'from-[#10E07A]/40 to-[#10E07A]/10',
  'from-[#F5C451]/40 to-[#F5C451]/10',
  'from-[#8b5cf6]/40 to-[#8b5cf6]/10',
  'from-[#06b6d4]/40 to-[#06b6d4]/10',
  'from-[#FF6B6B]/40 to-[#FF6B6B]/10',
];

function gradientFor(initial: string): string {
  const code = (initial || 'G').toUpperCase().charCodeAt(0) || 65;
  return PALETTE[(code - 65) % PALETTE.length];
}

const CATEGORY_BADGES: Record<string, string> = {
  Reviews: 'bg-[#10E07A]/10 text-[#10E07A] border-[#10E07A]/20',
  Recipes: 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/20',
  Tips: 'bg-[#F5C451]/10 text-[#F5C451] border-[#F5C451]/20',
  Questions: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20',
  General: 'bg-white/5 text-white/60 border-white/10',
  'Group Buy': 'bg-[#F5C451]/10 text-[#F5C451] border-[#F5C451]/20',
  Charity: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20',
};

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'just now';
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 'just now';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const week = Math.floor(day / 7);
    if (week < 5) return `${week}w ago`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month}mo ago`;
    const year = Math.floor(day / 365);
    return `${year}y ago`;
  } catch {
    return 'just now';
  }
}

function isLikedByMe(post: ApiPost, email: string): boolean {
  const lb = post.likedBy;
  if (!lb) return false;
  if (Array.isArray(lb)) return lb.includes(email);
  try {
    const arr = JSON.parse(lb);
    return Array.isArray(arr) && arr.includes(email);
  } catch {
    return false;
  }
}

function likedByArray(post: ApiPost): string[] {
  const lb = post.likedBy;
  if (!lb) return [];
  if (Array.isArray(lb)) return lb;
  try {
    const arr = JSON.parse(lb);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

// Convert mock communityPosts (from @/lib/data) into ApiPost shape for fallback.
function seedToApiPosts(): ApiPost[] {
  const now = Date.now();
  return communityPosts.map((p, idx) => {
    const created = new Date(now - (idx + 1) * 60 * 60 * 1000).toISOString();
    return {
      id: `seed-${p.id}`,
      authorName: p.author,
      authorInitial: p.avatar,
      category: p.category,
      content: p.content,
      imageUrl: null,
      likes: p.likes,
      likedBy: [],
      createdAt: created,
      comments: Array.from({ length: Math.min(p.replies, 2) }).map((_, ci) => ({
        id: `seed-c-${p.id}-${ci}`,
        authorName: ci === 0 ? 'Sister Khadija' : 'Brother Yusuf',
        authorInitial: ci === 0 ? 'S' : 'Y',
        content:
          ci === 0
            ? 'Subhanallah, thank you for sharing! 🤲'
            : 'Jazak Allahu khairan for the tip 🌙',
        createdAt: new Date(
          now - (idx + 1) * 60 * 60 * 1000 + (ci + 1) * 5 * 60 * 1000,
        ).toISOString(),
      })),
    };
  });
}

export default function CommunityForum() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const userName = useAppStore(s => s.userName);
  const { toast } = useToast();

  const isOpen = activeModal === 'community';
  const email = userEmail?.trim() || 'guest';
  const authorName = userName?.trim() || 'Guest';
  const authorInitial = (authorName[0] || 'G').toUpperCase();

  // ─── Feed state ───
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortMode, setSortMode] = useState<'latest' | 'trending'>('latest');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});
  const [likePending, setLikePending] = useState<Record<string, boolean>>({});

  // ─── Composer state ───
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerCategory, setComposerCategory] = useState('General');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Stable React key for each post (so optimistic→server swap doesn't remount).
  const reactKeyRef = useRef(0);
  function nextLocalId(): string {
    reactKeyRef.current += 1;
    return `local-${reactKeyRef.current}`;
  }

  const reqIdRef = useRef(0);

  // ─── Load posts (useCallback → called from useEffect; never setState
  //     directly in the effect body so we stay clean of the
  //     react-hooks/set-state-in-effect lint rule). ───
  const loadPosts = useCallback(async (ownerEmail: string) => {
    const reqId = (reqIdRef.current += 1);
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/community?email=${encodeURIComponent(ownerEmail)}`,
        { cache: 'no-store' },
      );
      const data = (await res.json()) as { posts?: ApiPost[] };
      if (reqId !== reqIdRef.current) return; // stale
      if (data.posts && data.posts.length > 0) {
        setPosts(data.posts);
      } else {
        setPosts(seedToApiPosts());
      }
    } catch {
      if (reqId !== reqIdRef.current) return;
      setLoadError('Could not reach the community feed. Showing sample posts.');
      setPosts(seedToApiPosts());
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadPosts(email);
  }, [isOpen, email, loadPosts]);

  // ─── Derived: filtered + sorted feed ───
  const visiblePosts = (() => {
    const list =
      activeFilter === 'all'
        ? posts
        : posts.filter((p) => p.category === activeFilter);
    return [...list].sort((a, b) => {
      if (sortMode === 'trending') {
        if (b.likes !== a.likes) return b.likes - a.likes;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  })();

  // ─── Like handler (optimistic + sync) ───
  const handleLike = useCallback(
    async (post: ApiPost) => {
      if (likePending[post.id]) return;
      const liked = isLikedByMe(post, email);
      const arr = likedByArray(post);
      const newArr = liked
        ? arr.filter((e) => e !== email)
        : [...arr, email];
      const newCount = newArr.length;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, likes: newCount, likedBy: newArr } : p,
        ),
      );
      setLikePending((prev) => ({ ...prev, [post.id]: true }));

      try {
        const res = await fetch('/api/community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, postId: post.id, action: 'like' }),
        });
        const data = (await res.json()) as { post?: ApiPost; liked?: boolean };
        if (data.post) {
          // Preserve stable local React key across the server sync.
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? { ...data.post!, _localId: p._localId }
                : p,
            ),
          );
        }
        if (data.liked) {
          toast({ title: 'Liked! ❤️', description: 'Thanks for the love' });
        }
      } catch {
        // Revert on failure
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likes: post.likes, likedBy: post.likedBy }
              : p,
          ),
        );
        toast({ title: 'Like failed', description: 'Tap again to retry' });
      } finally {
        setLikePending((prev) => {
          const next = { ...prev };
          delete next[post.id];
          return next;
        });
      }
    },
    [email, likePending, toast],
  );

  // ─── Comment handlers ───
  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const setCommentDraft = (postId: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = useCallback(
    async (post: ApiPost) => {
      const draft = (commentDrafts[post.id] || '').trim();
      if (!draft || commentSending[post.id]) return;

      const tempId = `temp-c-${Date.now()}`;
      const tempComment: ApiComment = {
        id: tempId,
        authorName,
        authorInitial,
        content: draft,
        createdAt: new Date().toISOString(),
      };

      // Optimistic append (comments are oldest-first).
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, comments: [...p.comments, tempComment] }
            : p,
        ),
      );
      setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
      setCommentSending((prev) => ({ ...prev, [post.id]: true }));

      try {
        const res = await fetch('/api/community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            postId: post.id,
            authorName,
            authorInitial,
            content: draft,
            action: 'comment',
          }),
        });
        const data = (await res.json()) as { comment?: ApiComment };
        if (data.comment) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    comments: [
                      ...p.comments.filter((c) => c.id !== tempId),
                      data.comment!,
                    ],
                  }
                : p,
            ),
          );
        }
      } catch {
        // Remove optimistic comment + restore draft
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  comments: p.comments.filter((c) => c.id !== tempId),
                }
              : p,
          ),
        );
        setCommentDrafts((prev) => ({ ...prev, [post.id]: draft }));
        toast({ title: 'Comment failed', description: 'Tap send to retry' });
      } finally {
        setCommentSending((prev) => {
          const next = { ...prev };
          delete next[post.id];
          return next;
        });
      }
    },
    [authorInitial, authorName, commentDrafts, commentSending, email, toast],
  );

  // ─── Create post handler ───
  const handleCreatePost = useCallback(async () => {
    const content = composerContent.trim();
    if (!content || submittingPost) return;

    const localId = nextLocalId();
    const tempPost: ApiPost = {
      id: `temp-${localId}`,
      authorName,
      authorInitial,
      authorEmail: email,
      category: composerCategory,
      content,
      imageUrl: null,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      comments: [],
      _localId: localId,
    };

    setSubmittingPost(true);
    setComposerOpen(false);
    setComposerContent('');
    setComposerCategory('General');

    // Optimistic prepend
    setPosts((prev) => [tempPost, ...prev]);
    // Jump to latest sort + all filter so the user sees their new post.
    setSortMode('latest');
    setActiveFilter('all');
    toast({ title: 'Posted! 🎉', description: 'Your post is live in the community' });

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          authorName,
          authorInitial,
          category: tempPost.category,
          content: tempPost.content,
        }),
      });
      const data = (await res.json()) as { post?: ApiPost };
      if (data.post) {
        // Replace temp post in place, preserving the stable _localId so
        // framer-motion doesn't remount the card.
        setPosts((prev) =>
          prev.map((p) =>
            p.id === tempPost.id
              ? { ...data.post!, _localId: tempPost._localId }
              : p,
          ),
        );
      }
    } catch {
      // Remove the optimistic post + reopen composer with content
      setPosts((prev) => prev.filter((p) => p.id !== tempPost.id));
      setComposerContent(content);
      setComposerCategory(tempPost.category);
      setComposerOpen(true);
      toast({ title: 'Post failed', description: 'Tap Post to retry' });
    } finally {
      setSubmittingPost(false);
    }
  }, [authorInitial, authorName, composerCategory, composerContent, email, submittingPost, toast]);

  const handleShare = (post: ApiPost) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?post=${post.id}`;
      navigator.clipboard.writeText(url).catch(() => {});
    }
    toast({ title: 'Link copied!', description: 'Share with your community' });
  };

  const handleClose = () => {
    setActiveModal(null);
    setComposerOpen(false);
    setComposerContent('');
    setExpandedComments({});
    setCommentDrafts({});
  };

  // ─── Render ───
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
            onClick={handleClose}
          />

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[120] bg-[#05070A] flex flex-col overflow-y-auto custom-scrollbar"
          >
            {/* Decorative top glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[320px] h-[200px] rounded-full bg-[#10E07A]/10 blur-3xl" />

            {/* ──── Sticky Header ──── */}
            <div className="sticky top-0 z-20 glass-effect border-b border-white/5">
              {/* Accent bar */}
              <div className="h-[3px] bg-gradient-to-r from-[#10E07A] via-[#F5C451] to-[#8b5cf6]" />

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="w-10 h-10 bg-gradient-to-br from-[#10E07A]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center border border-[#10E07A]/30 shrink-0"
                  >
                    <Users className="w-5 h-5 text-[#10E07A]" />
                  </motion.div>
                  <div className="min-w-0">
                    <h2 className="text-white font-black text-lg leading-tight flex items-center gap-2">
                      <span>SwiftCommunity</span>
                      <span className="text-base">🌙</span>
                      <span className="beta-badge text-[9px]">BETA</span>
                    </h2>
                    <p className="text-white/40 text-xs">
                      {posts.length} {posts.length === 1 ? 'post' : 'posts'} · break fast together
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Category Filter Chips */}
              <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(cat.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeFilter === cat.id
                        ? 'bg-[#10E07A]/20 border border-[#10E07A]/40 text-[#10E07A]'
                        : 'bg-[#1A1D26] border border-white/5 text-white/50 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ──── Sort toggle + error strip ──── */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-[#0F1117] rounded-full border border-white/5">
                <button
                  onClick={() => setSortMode('latest')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    sortMode === 'latest'
                      ? 'bg-[#10E07A]/20 text-[#10E07A]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Latest
                </button>
                <button
                  onClick={() => setSortMode('trending')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    sortMode === 'trending'
                      ? 'bg-[#F5C451]/20 text-[#F5C451]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Trending
                </button>
              </div>
              {loadError && (
                <span className="text-[10px] text-[#FF6B6B]/70 truncate text-right max-w-[55%]">
                  {loadError}
                </span>
              )}
            </div>

            {/* ──── Feed ──── */}
            <div className="px-4 pt-2 pb-32 space-y-3 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="bg-[#0F1117] rounded-2xl border border-white/5 p-4 animate-pulse"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-1/3 rounded bg-white/10" />
                          <div className="h-2 w-1/4 rounded bg-white/5" />
                        </div>
                        <div className="w-16 h-5 rounded-full bg-white/5" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-white/10" />
                        <div className="h-3 w-2/3 rounded bg-white/10" />
                      </div>
                      <div className="flex gap-5 mt-3">
                        <div className="h-4 w-12 rounded bg-white/5" />
                        <div className="h-4 w-12 rounded bg-white/5" />
                        <div className="h-4 w-12 rounded bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visiblePosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(167,139,250,0.18), rgba(167,139,250,0.04))',
                      border: '1px solid rgba(167,139,250,0.3)',
                      boxShadow: '0 0 24px rgba(167,139,250,0.18)',
                    }}
                  >
                    <MessageCircle className="w-9 h-9 text-[#A78BFA]" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-white font-bold text-base"
                  >
                    {activeFilter === 'all'
                      ? 'No posts yet'
                      : `No ${activeFilter} posts yet`}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/40 text-sm mt-1 max-w-[240px]"
                  >
                    {activeFilter === 'all'
                      ? 'Be the first to share something with the community.'
                      : `Be the first to post in ${activeFilter}! Tap the + button below.`}
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setComposerOpen(true)}
                    className="mt-5 px-5 py-2.5 rounded-full bg-[#A78BFA] text-white font-bold text-sm active:scale-95 transition-transform"
                    style={{ boxShadow: '0 0 16px rgba(167,139,250,0.35)' }}
                  >
                    + Create a post
                  </motion.button>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {visiblePosts.map((post, i) => {
                    const liked = isLikedByMe(post, email);
                    const expanded = !!expandedComments[post.id];
                    const commentCount = post.comments?.length || 0;
                    const draft = commentDrafts[post.id] || '';
                    const sending = !!commentSending[post.id];
                    const pending = !!likePending[post.id];
                    const reactKey = post._localId || post.id;

                    return (
                      <motion.div
                        key={reactKey}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{
                          delay: Math.min(i * 0.04, 0.3),
                          type: 'spring',
                          damping: 25,
                        }}
                        className="bg-[#0F1117] rounded-2xl border border-white/5 hover:border-white/10 transition-colors p-4"
                      >
                        {/* Author row */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientFor(post.authorInitial)} flex items-center justify-center border border-white/10 shrink-0`}
                          >
                            <span className="text-white text-sm font-bold">
                              {post.authorInitial || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold truncate">
                              {post.authorName}
                            </p>
                            <p className="text-white/30 text-[11px]">
                              {formatRelativeTime(post.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              CATEGORY_BADGES[post.category] || CATEGORY_BADGES.General
                            }`}
                          >
                            {post.category}
                          </span>
                        </div>

                        {/* Content */}
                        <p className="text-white/80 text-sm leading-relaxed mb-3 whitespace-pre-wrap break-words">
                          {post.content}
                        </p>

                        {/* Optional image */}
                        {post.imageUrl ? (
                          <div className="rounded-xl overflow-hidden border border-white/5 mb-3">
                            <img
                              src={post.imageUrl}
                              alt="Post attachment"
                              className="w-full object-cover max-h-80"
                            />
                          </div>
                        ) : null}

                        {/* Action row */}
                        <div className="flex items-center gap-5 pt-1">
                          <button
                            onClick={() => handleLike(post)}
                            disabled={pending}
                            aria-label={liked ? 'Unlike' : 'Like'}
                            className={`flex items-center gap-1.5 transition-all active:scale-90 disabled:opacity-50 ${
                              liked
                                ? 'text-[#FF6B6B]'
                                : 'text-white/40 hover:text-[#FF6B6B]'
                            }`}
                          >
                            <motion.span
                              key={liked ? 'filled' : 'outline'}
                              initial={{ scale: 0.5 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', damping: 12, stiffness: 300 }}
                              className="flex items-center"
                            >
                              <Heart
                                className={`w-4 h-4 ${liked ? 'fill-current' : ''}`}
                              />
                            </motion.span>
                            <span className="text-xs font-semibold">{post.likes}</span>
                          </button>

                          <button
                            onClick={() => toggleComments(post.id)}
                            aria-label="Comments"
                            className={`flex items-center gap-1.5 transition-all active:scale-90 ${
                              expanded
                                ? 'text-[#10E07A]'
                                : 'text-white/40 hover:text-[#10E07A]'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">{commentCount}</span>
                          </button>

                          <button
                            onClick={() => handleShare(post)}
                            aria-label="Share"
                            className="flex items-center gap-1.5 text-white/40 hover:text-[#F5C451] transition-all active:scale-90"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="text-xs font-semibold">Share</span>
                          </button>
                        </div>

                        {/* Comments section */}
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                                {commentCount === 0 && !draft && (
                                  <p className="text-white/30 text-xs text-center py-2">
                                    No comments yet · be the first to reply
                                  </p>
                                )}
                                {post.comments.map((c) => (
                                  <div key={c.id} className="flex items-start gap-2.5">
                                    <div
                                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradientFor(c.authorInitial)} flex items-center justify-center border border-white/10 shrink-0`}
                                    >
                                      <span className="text-white text-[10px] font-bold">
                                        {c.authorInitial || 'U'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-white text-xs font-bold truncate">
                                          {c.authorName}
                                        </p>
                                        <span className="text-white/30 text-[10px] shrink-0">
                                          {formatRelativeTime(c.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-white/70 text-xs leading-relaxed break-words">
                                        {c.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}

                                {/* Comment input */}
                                <div className="flex items-center gap-2 mt-2">
                                  <div
                                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradientFor(authorInitial)} flex items-center justify-center border border-white/10 shrink-0`}
                                  >
                                    <span className="text-white text-[10px] font-bold">
                                      {authorInitial}
                                    </span>
                                  </div>
                                  <input
                                    value={draft}
                                    onChange={(e) => setCommentDraft(post.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitComment(post);
                                      }
                                    }}
                                    placeholder="Write a comment…"
                                    className="flex-1 bg-white/5 border border-white/5 focus:border-[#10E07A]/30 rounded-full px-3.5 py-2 text-white text-xs placeholder:text-white/30 outline-none transition-colors"
                                  />
                                  <button
                                    onClick={() => handleSubmitComment(post)}
                                    disabled={!draft.trim() || sending}
                                    aria-label="Send comment"
                                    className="w-9 h-9 rounded-full bg-[#10E07A] flex items-center justify-center text-[#05070A] active:scale-90 transition-transform disabled:opacity-40 disabled:active:scale-100 shrink-0"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* ──── FAB ──── */}
            {!composerOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15, stiffness: 250 }}
                onClick={() => setComposerOpen(true)}
                aria-label="Create a post"
                className="fixed bottom-6 right-5 z-[130] w-14 h-14 rounded-full bg-[#10E07A] flex items-center justify-center green-glow active:scale-90 transition-transform"
              >
                <Plus className="w-6 h-6 text-[#05070A]" strokeWidth={2.5} />
              </motion.button>
            )}

            {/* ──── Composer sheet ──── */}
            <AnimatePresence>
              {composerOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setComposerOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[140]"
                  />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                    className="fixed bottom-0 left-0 right-0 z-[150] bg-[#0F1117] rounded-t-3xl border-t border-white/10 p-5 pb-8 max-w-md mx-auto"
                  >
                    {/* Drag handle */}
                    <div className="flex justify-center mb-4">
                      <div className="w-10 h-1.5 rounded-full bg-white/15" />
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-black text-lg">New Post ✍️</h3>
                      <button
                        onClick={() => setComposerOpen(false)}
                        aria-label="Close composer"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>

                    {/* Author row */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradientFor(authorInitial)} flex items-center justify-center border border-white/10 shrink-0`}
                      >
                        <span className="text-white text-xs font-bold">
                          {authorInitial}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-bold truncate">
                          {authorName}
                        </p>
                        <p className="text-white/30 text-[10px]">Posting as you</p>
                      </div>
                    </div>

                    {/* Category chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
                      {COMPOSER_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setComposerCategory(cat)}
                          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            composerCategory === cat
                              ? CATEGORY_BADGES[cat] || CATEGORY_BADGES.General
                              : 'bg-white/5 border-white/5 text-white/40 hover:text-white/70'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                      placeholder="Share your Ramadan cooking story, a recipe, or ask the community…"
                      rows={4}
                      maxLength={1000}
                      className="w-full bg-white/5 border border-white/5 focus:border-[#10E07A]/30 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none resize-none transition-colors custom-scrollbar"
                    />
                    <div className="flex justify-end mb-3">
                      <span className="text-[10px] text-white/30">
                        {composerContent.length}/1000
                      </span>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleCreatePost}
                      disabled={!composerContent.trim() || submittingPost}
                      className="w-full py-3.5 rounded-2xl bg-[#10E07A] text-[#05070A] font-black text-sm green-glow active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
                    >
                      {submittingPost ? 'Posting…' : 'Post to Community'}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
