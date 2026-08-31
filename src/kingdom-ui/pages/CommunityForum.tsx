'use client';

/**
 * KingdomCommunityForum — Auren Kingdom V2 reinterpretation of the
 * legacy SwiftRamadan CommunityForum.
 *
 * Same store hooks (`useNavigation`, `useAppStore(s => s.userEmail)`,
 * `useAppStore(s => s.userName)`, `useNavigation().setActiveModal`)
 * and the same API contract (`/api/community` GET + POST for posts,
 * likes, comments) are preserved. The visual layer is completely
 * replaced with the Kingdom V2 design system (KingdomShell,
 * IntelligenceCard, RoyalSkeleton, RoyalBadge, kv-card, kv-stagger,
 * kv-empty, kv-accent-line).
 *
 * Visual changes per V2 spec:
 *  1. KingdomShell root
 *  2. Title: "Kingdom Community" with kv-gradient-text + kv-accent-line
 *  3. Category filter as RoyalBadge pills (All, Reviews, Recipes, Tips, Questions)
 *  4. Posts as kv-card:
 *     - Author avatar (circle, initial-based)
 *     - Author name (font-bold)
 *     - Category badge (RoyalBadge)
 *     - Content text
 *     - Like button with count
 *     - Reply button
 *  5. Post creation: kv-btn-royal "Share Your Story"
 *  6. Group buy CTA: IntelligenceCard with royal variant
 *  7. Empty state: kv-empty ("The community is gathering. Be the first to share.")
 *  8. RoyalSkeleton loading state
 *  9. kv-stagger entrance
 * 10. Mobile-first
 * 11. Same store hooks preserved
 *
 * Legacy file `src/components/swift/CommunityForum.tsx` is untouched.
 *
 * NOTE: The legacy component was a slide-up modal triggered by
 * `activeModal === 'community'`. In Kingdom V2 we expose it as a
 * full-page route (`/kingdom/community`). The `setActiveModal` hook
 * is still preserved for cross-page navigation (e.g. the group-buy
 * CTA on this page calls `setActiveModal('groupBuy')`), and the
 * composer is a RoyalModal-style bottom sheet built with native
 * framer-motion + kv-card surfaces.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Plus,
  Share2,
  Send,
  Users,
  Flame,
  Clock,
  X,
} from 'lucide-react';
import {
  useNavigation,
  useAppStore,
} from '@/lib/store-selectors';
import { communityPosts } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  IntelligenceCard,
  RoyalSkeleton,
  RoyalBadge,
} from '../components';

/* ───────────────────────────────────────────────────────────────
   API types (mirrors legacy CommunityForum)
   ─────────────────────────────────────────────────────────────── */
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

/* Category filter pills (per V2 spec) */
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Reviews', label: 'Reviews' },
  { id: 'Recipes', label: 'Recipes' },
  { id: 'Tips', label: 'Tips' },
  { id: 'Questions', label: 'Questions' },
] as const;

const COMPOSER_CATEGORIES = ['Reviews', 'Recipes', 'Tips', 'Questions', 'General'];

/* Royal palette: cycle 5 gradients by initial letter (V2 royal + gold + ai) */
const ROYAL_PALETTE = [
  { bg: 'rgba(124, 58, 237, 0.30)', color: 'var(--kv-mystic)' },
  { bg: 'rgba(212, 175, 55, 0.25)', color: 'var(--kv-gold)' },
  { bg: 'rgba(99, 102, 241, 0.30)', color: 'var(--kv-ai-glow)' },
  { bg: 'rgba(16, 185, 129, 0.25)', color: 'var(--kv-emerald)' },
  { bg: 'rgba(245, 158, 11, 0.25)', color: 'var(--kv-amber)' },
];

function paletteFor(initial: string) {
  const code = (initial || 'G').toUpperCase().charCodeAt(0) || 65;
  return ROYAL_PALETTE[(code - 65) % ROYAL_PALETTE.length];
}

/* RoyalBadge variant per category */
const CATEGORY_VARIANT: Record<
  string,
  'royal' | 'gold' | 'neutral'
> = {
  Reviews: 'royal',
  Recipes: 'gold',
  Tips: 'royal',
  Questions: 'gold',
  General: 'neutral',
  'Group Buy': 'gold',
  Charity: 'royal',
};

/* ───────────────────────────────────────────────────────────────
   Helpers (preserved from legacy)
   ─────────────────────────────────────────────────────────────── */
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

/* Convert mock communityPosts (from @/lib/data) into ApiPost shape for fallback */
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
            ? 'MashaAllah, thank you for sharing! 🌙'
            : 'JazakAllah khair — bookmarking this for tomorrow.',
        createdAt: new Date(now - (idx + 1) * 60 * 60 * 1000 + ci * 5 * 60 * 1000).toISOString(),
      })),
    };
  });
}

/* ───────────────────────────────────────────────────────────────
   Avatar — initial-based circle with royal gradient
   ─────────────────────────────────────────────────────────────── */
function RoyalAvatar({
  initial,
  size = 40,
}: {
  initial: string;
  size?: number;
}) {
  const palette = paletteFor(initial);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: palette.bg,
        border: '1px solid var(--kv-glass-border)',
      }}
      aria-hidden
    >
      <span
        className="font-bold"
        style={{ color: palette.color, fontSize: size * 0.36 }}
      >
        {initial || 'U'}
      </span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   CommunitySkeleton — RoyalSkeleton loading state
   ─────────────────────────────────────────────────────────────── */
function CommunitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="kv-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <RoyalSkeleton variant="circle" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <RoyalSkeleton variant="text" width="40%" height={12} />
              <RoyalSkeleton variant="text" width="25%" height={10} />
            </div>
            <RoyalSkeleton variant="rect" width={64} height={20} />
          </div>
          <div className="space-y-2">
            <RoyalSkeleton variant="text" width="100%" height={12} />
            <RoyalSkeleton variant="text" width="70%" height={12} />
          </div>
          <div className="flex gap-4 mt-3">
            <RoyalSkeleton variant="text" width={48} height={16} />
            <RoyalSkeleton variant="text" width={48} height={16} />
            <RoyalSkeleton variant="text" width={64} height={16} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Main component
   ─────────────────────────────────────────────────────────────── */
export function KingdomCommunityForum() {
  /* ── SAME store hooks preserved ── */
  const { setActiveModal } = useNavigation();
  const userEmail = useAppStore((s) => s.userEmail);
  const userName = useAppStore((s) => s.userName);
  const { toast } = useToast();

  // In V2 this is a full-page route, not a modal. We always render.
  const email = userEmail?.trim() || 'guest';
  const authorName = userName?.trim() || 'Guest';
  const authorInitial = (authorName[0] || 'G').toUpperCase();

  /* ── Feed state ── */
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'latest' | 'trending'>('latest');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});
  const [likePending, setLikePending] = useState<Record<string, boolean>>({});

  /* ── Composer state ── */
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerCategory, setComposerCategory] = useState('General');
  const [submittingPost, setSubmittingPost] = useState(false);

  /* Stable React key for each post (so optimistic→server swap doesn't remount). */
  const reactKeyRef = useRef(0);
  function nextLocalId(): string {
    reactKeyRef.current += 1;
    return `local-${reactKeyRef.current}`;
  }

  const reqIdRef = useRef(0);

  /* ── Load posts (useCallback → called from useEffect) ── */
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
      if (reqId !== reqIdRef.current) return;
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
    loadPosts(email);
  }, [email, loadPosts]);

  /* ── Derived: filtered + sorted feed ── */
  const visiblePosts = (() => {
    const list =
      activeFilter === 'all' ? posts : posts.filter((p) => p.category === activeFilter);
    return [...list].sort((a, b) => {
      if (sortMode === 'trending') {
        if (b.likes !== a.likes) return b.likes - a.likes;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  })();

  /* ── Like handler (optimistic + sync) ── */
  const handleLike = useCallback(
    async (post: ApiPost) => {
      if (likePending[post.id]) return;
      const liked = isLikedByMe(post, email);
      const arr = likedByArray(post);
      const newArr = liked ? arr.filter((e) => e !== email) : [...arr, email];
      const newCount = newArr.length;

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
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...data.post!, _localId: p._localId } : p,
            ),
          );
        }
        if (data.liked) {
          toast({ title: 'Liked! ❤️', description: 'Thanks for the love' });
        }
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, likes: post.likes, likedBy: post.likedBy } : p,
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

  /* ── Comment handlers ── */
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

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, comments: [...p.comments, tempComment] } : p,
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
        const data = (await res.json()) as { post?: ApiPost };
        if (data.post) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...data.post!, _localId: p._localId } : p,
            ),
          );
        }
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, comments: p.comments.filter((c) => c.id !== tempId) }
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

  /* ── Create post handler ── */
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

    setPosts((prev) => [tempPost, ...prev]);
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
        setPosts((prev) =>
          prev.map((p) =>
            p.id === tempPost.id ? { ...data.post!, _localId: tempPost._localId } : p,
          ),
        );
      }
    } catch {
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

  const handleCloseComposer = () => {
    setComposerOpen(false);
    setComposerContent('');
    setComposerCategory('General');
  };

  /* ── Render ── */
  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Header ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start justify-between mb-5"
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
              Kingdom Community
            </h1>
            <div className="kv-accent-line mt-3" />
            <p className="text-sm text-[var(--kv-text-tertiary)] mt-3">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} · break fast together
            </p>
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="kv-btn kv-btn-royal text-xs py-2.5 px-4 min-h-[40px] shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Share Your Story
          </button>
        </motion.header>

        {/* ─────────────────────── Category Filter (RoyalBadge pills) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar mb-3"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveFilter(cat.id)}
                className="shrink-0"
                aria-pressed={isActive}
              >
                <RoyalBadge
                  variant={isActive ? 'royal' : 'neutral'}
                  className="!px-3.5 !py-1.5 !text-xs !normal-case !tracking-normal"
                >
                  {cat.label}
                </RoyalBadge>
              </button>
            );
          })}
        </motion.div>

        {/* ─────────────────────── Sort toggle + error strip ─────────────────────── */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1 p-1 kv-glass rounded-full">
            <button
              type="button"
              onClick={() => setSortMode('latest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                sortMode === 'latest'
                  ? 'kv-badge-royal !border-0 !px-3 !py-1.5 !text-xs !normal-case !tracking-normal'
                  : 'text-[var(--kv-text-tertiary)] hover:text-white'
              }`}
              aria-pressed={sortMode === 'latest'}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden />
              Latest
            </button>
            <button
              type="button"
              onClick={() => setSortMode('trending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                sortMode === 'trending'
                  ? 'kv-badge-gold !border-0 !px-3 !py-1.5 !text-xs !normal-case !tracking-normal'
                  : 'text-[var(--kv-text-tertiary)] hover:text-white'
              }`}
              aria-pressed={sortMode === 'trending'}
            >
              <Flame className="w-3.5 h-3.5" aria-hidden />
              Trending
            </button>
          </div>
          {loadError && (
            <span className="text-[10px] text-[var(--kv-danger)] truncate text-right max-w-[55%]">
              {loadError}
            </span>
          )}
        </div>

        {/* ─────────────────────── Group buy CTA — IntelligenceCard royal variant ─────────────────────── */}
        <IntelligenceCard
          variant="royal"
          title="Group Buy"
          subtitle="Split bulk Ramadan essentials with your community"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--kv-royal-light)' }}
            >
              <Users className="w-6 h-6 text-[var(--kv-mystic)]" aria-hidden />
            </div>
            <p className="text-sm text-white flex-1 leading-snug">
              Save up to 40% on 50kg rice splits, bulk dates, and iftar staples.
              Join a live group buy near you.
            </p>
            <button
              type="button"
              onClick={() => setActiveModal('groupBuy')}
              className="kv-btn kv-btn-royal text-xs py-2 px-4 min-h-[36px] shrink-0"
            >
              Join
            </button>
          </div>
        </IntelligenceCard>

        {/* ─────────────────────── Feed ─────────────────────── */}
        <div className="mt-5">
          {loading ? (
            <CommunitySkeleton />
          ) : visiblePosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="kv-card kv-empty"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--kv-royal-light)', border: '1px solid var(--kv-royal-border)' }}
              >
                <MessageCircle className="w-9 h-9 text-[var(--kv-mystic)]" />
              </div>
              <h3 className="text-white font-bold text-base">
                The community is gathering
              </h3>
              <p className="text-[var(--kv-text-tertiary)] text-sm max-w-xs">
                The community is gathering. Be the first to share.
              </p>
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="kv-btn kv-btn-royal mt-2"
              >
                <Plus className="w-4 h-4" aria-hidden />
                Share Your Story
              </button>
            </motion.div>
          ) : (
            <div className="kv-stagger space-y-3">
              {visiblePosts.map((post) => {
                const liked = isLikedByMe(post, email);
                const expanded = !!expandedComments[post.id];
                const commentCount = post.comments?.length || 0;
                const draft = commentDrafts[post.id] || '';
                const sending = !!commentSending[post.id];
                const pending = !!likePending[post.id];
                const reactKey = post._localId || post.id;

                return (
                  <motion.article
                    key={reactKey}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="kv-card p-4"
                  >
                    {/* Author row */}
                    <div className="flex items-center gap-3 mb-3">
                      <RoyalAvatar initial={post.authorInitial} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">
                          {post.authorName}
                        </p>
                        <p className="text-[var(--kv-text-tertiary)] text-[11px]">
                          {formatRelativeTime(post.createdAt)}
                        </p>
                      </div>
                      <RoyalBadge
                        variant={CATEGORY_VARIANT[post.category] || 'neutral'}
                      >
                        {post.category}
                      </RoyalBadge>
                    </div>

                    {/* Content */}
                    <p className="text-[var(--kv-text-secondary)] text-sm leading-relaxed mb-3 whitespace-pre-wrap break-words">
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
                      {/* Like */}
                      <button
                        type="button"
                        onClick={() => handleLike(post)}
                        disabled={pending}
                        aria-label={liked ? 'Unlike' : 'Like'}
                        className={`flex items-center gap-1.5 transition-all active:scale-90 disabled:opacity-50 ${
                          liked ? 'text-[var(--kv-danger)]' : 'text-[var(--kv-text-tertiary)] hover:text-[var(--kv-danger)]'
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

                      {/* Reply / comments */}
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        aria-label="Comments"
                        className={`flex items-center gap-1.5 transition-all active:scale-90 ${
                          expanded
                            ? 'text-[var(--kv-mystic)]'
                            : 'text-[var(--kv-text-tertiary)] hover:text-[var(--kv-mystic)]'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold">{commentCount}</span>
                      </button>

                      {/* Share */}
                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        aria-label="Share"
                        className="flex items-center gap-1.5 text-[var(--kv-text-tertiary)] hover:text-[var(--kv-gold)] transition-all active:scale-90"
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
                              <p className="text-[var(--kv-text-tertiary)] text-xs text-center py-2">
                                No comments yet · be the first to reply
                              </p>
                            )}
                            {post.comments.map((c) => (
                              <div key={c.id} className="flex items-start gap-2.5">
                                <RoyalAvatar initial={c.authorInitial} size={28} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-white text-xs font-bold truncate">
                                      {c.authorName}
                                    </p>
                                    <span className="text-[var(--kv-text-tertiary)] text-[10px] shrink-0">
                                      {formatRelativeTime(c.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-[var(--kv-text-secondary)] text-xs leading-relaxed break-words">
                                    {c.content}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Comment input */}
                            <div className="flex items-center gap-2 mt-2">
                              <RoyalAvatar initial={authorInitial} size={28} />
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
                                className="kv-input !min-h-[36px] !py-2 !px-3.5 !text-xs flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleSubmitComment(post)}
                                disabled={!draft.trim() || sending}
                                aria-label="Send comment"
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--kv-royal)] to-[var(--kv-violet)] flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-40 disabled:active:scale-100 shrink-0"
                                style={{ boxShadow: 'var(--kv-shadow-royal)' }}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─────────────────────── FAB (mobile) ─────────────────────── */}
      {!composerOpen && (
        <motion.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15, stiffness: 250 }}
          onClick={() => setComposerOpen(true)}
          aria-label="Create a post"
          className="kv-fab"
          style={{ bottom: 24, right: 20 }}
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </motion.button>
      )}

      {/* ─────────────────────── Composer sheet (RoyalModal-style) ─────────────────────── */}
      <AnimatePresence>
        {composerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseComposer}
              className="kv-backdrop"
              aria-hidden
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed bottom-0 left-0 right-0 z-[60] kv-card rounded-b-none rounded-t-3xl p-5 pb-8 max-w-md mx-auto"
              style={{ borderLeftWidth: 1, borderRightWidth: 1, borderTopWidth: 1 }}
              role="dialog"
              aria-modal="true"
              aria-label="Create a new community post"
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1.5 rounded-full bg-white/15" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="kv-gradient-text font-extrabold text-lg">New Post ✍️</h3>
                <button
                  type="button"
                  onClick={handleCloseComposer}
                  aria-label="Close composer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--kv-text-tertiary)]" />
                </button>
              </div>

              {/* Author row */}
              <div className="flex items-center gap-2.5 mb-3">
                <RoyalAvatar initial={authorInitial} size={32} />
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold truncate">{authorName}</p>
                  <p className="text-[var(--kv-text-tertiary)] text-[10px]">Posting as you</p>
                </div>
              </div>

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
                {COMPOSER_CATEGORIES.map((cat) => {
                  const isActive = composerCategory === cat;
                  const variant = CATEGORY_VARIANT[cat] || 'neutral';
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setComposerCategory(cat)}
                      className="shrink-0"
                      aria-pressed={isActive}
                    >
                      <RoyalBadge
                        variant={isActive ? variant : 'neutral'}
                        className="!px-3 !py-1.5 !text-xs !normal-case !tracking-normal"
                      >
                        {cat}
                      </RoyalBadge>
                    </button>
                  );
                })}
              </div>

              {/* Textarea */}
              <textarea
                value={composerContent}
                onChange={(e) => setComposerContent(e.target.value)}
                placeholder="Share your Ramadan cooking story, a recipe, or ask the community…"
                rows={4}
                maxLength={1000}
                className="kv-input !rounded-2xl !text-sm !min-h-[120px] resize-none"
              />
              <div className="flex justify-end mb-3">
                <span className="text-[10px] text-[var(--kv-text-tertiary)]">
                  {composerContent.length}/1000
                </span>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleCreatePost}
                disabled={!composerContent.trim() || submittingPost}
                className="kv-btn kv-btn-royal w-full disabled:opacity-40 disabled:active:scale-100"
              >
                {submittingPost ? 'Posting…' : 'Post to Community'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </KingdomShell>
  );
}
