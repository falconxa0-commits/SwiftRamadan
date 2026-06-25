'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Music2, Play, Volume2, VolumeX, ShoppingBag, UserPlus, UserCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';

export interface ReelVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorId?: string | null;
  category: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  liked: boolean;
  createdAt: string;
}

interface VideoCardProps {
  video: ReelVideo;
  onLike: (video: ReelVideo) => void;
  onShare: (video: ReelVideo) => void;
  onOpenComments: (video: ReelVideo) => void;
  viewer: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const AVATAR_COLORS = ['#10E07A', '#F5C451', '#A78BFA', '#38BDF8', '#FB7185', '#FB923C'];

export default function VideoCard({ video, onLike, onShare, onOpenComments, viewer }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [inView, setInView] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const viewRecordedRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Resolve current user id (fall back to 'guest')
  const currentUserId = useAppStore((s) => s.userEmail) || 'guest';
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const setShowAuth = useAppStore((s) => s.setShowAuth);

  const authorId = video.authorId || null;

  // Check initial save + follow status on mount
  useEffect(() => {
    let cancelled = false;
    async function checkStatus() {
      try {
        // Save status (single-video GET)
        const saveRes = await fetch(
          `/api/videos/${video.id}/save?userId=${encodeURIComponent(currentUserId)}`,
          { cache: 'no-store' }
        );
        if (saveRes.ok) {
          const data = await saveRes.json();
          if (!cancelled && typeof data.saved === 'boolean') {
            setSaved(data.saved);
          }
        }
      } catch {
        /* ignore */
      }

      // Follow status — only if author is a registered user
      if (authorId && currentUserId && currentUserId !== 'guest') {
        try {
          const folRes = await fetch(
            `/api/users/follow?followerId=${encodeURIComponent(currentUserId)}&followeeId=${encodeURIComponent(authorId)}`,
            { cache: 'no-store' }
          );
          if (folRes.ok) {
            const data = await folRes.json();
            if (!cancelled && typeof data.following === 'boolean') {
              setFollowing(data.following);
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (!cancelled) setStatusChecked(true);
    }
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [video.id, currentUserId, authorId]);

  const handleSave = useCallback(async () => {
    if (!isLoggedIn) {
      toast({
        title: 'Login required',
        description: 'Please sign in to save reels to your bookmarks.',
      });
      setShowAuth('login');
      return;
    }
    if (saving) return;
    setSaving(true);
    // Optimistic update
    const prev = saved;
    setSaved(!prev);
    track('video_save', { videoId: video.id, saved: !prev });
    try {
      const res = await fetch(`/api/videos/${video.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, videoId: video.id }),
      });
      const data = await res.json();
      if (typeof data.saved === 'boolean') {
        setSaved(data.saved);
        toast({
          title: data.saved ? 'Saved to bookmarks' : 'Removed',
          description: data.saved
            ? 'You can find this reel in your Saved tab.'
            : 'Reel removed from your bookmarks.',
        });
      }
    } catch {
      setSaved(prev);
      toast({
        title: 'Could not save reel',
        description: 'Network issue — please try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [isLoggedIn, saving, saved, currentUserId, video.id, toast, setShowAuth]);

  const handleFollow = useCallback(async () => {
    if (!isLoggedIn) {
      toast({
        title: 'Login required',
        description: 'Please sign in to follow creators.',
      });
      setShowAuth('login');
      return;
    }
    if (!authorId) {
      toast({
        title: 'Author not registered',
        description: 'This creator is not yet a registered SwiftRamadan user.',
      });
      return;
    }
    if (followPending) return;
    setFollowPending(true);
    const prev = following;
    setFollowing(!prev);
    track('follow_user', { followeeId: authorId || '', followeeName: video.authorName, following: !prev });
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUserId, followeeId: authorId }),
      });
      const data = await res.json();
      if (typeof data.following === 'boolean') {
        setFollowing(data.following);
        toast({
          title: data.following ? `Following ${video.authorName}` : 'Unfollowed',
          description: data.following
            ? 'You will see new reels from this creator in your feed.'
            : `You unfollowed ${video.authorName}.`,
        });
      }
    } catch {
      setFollowing(prev);
      toast({
        title: 'Could not follow',
        description: 'Network issue — please try again.',
      });
    } finally {
      setFollowPending(false);
    }
  }, [isLoggedIn, authorId, followPending, following, currentUserId, video.authorName, toast, setShowAuth]);

  // Intersection observer to auto-play/pause
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.6) {
            setInView(true);
          } else {
            setInView(false);
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Play/pause based on visibility
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.play().catch(() => {});
      // Record a view once
      if (!viewRecordedRef.current) {
        viewRecordedRef.current = true;
        track('video_view', { videoId: video.id, author: video.authorName });
        fetch(`/api/videos/${video.id}/share`, { method: 'PUT' }).catch(() => {});
      }
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [inView, video.id]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const handleDoubleClick = () => {
    if (!video.liked) {
      onLike(video);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleLike = () => {
    onLike(video);
    track('video_like', { videoId: video.id, liked: !video.liked });
    if (!video.liked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  };

  const avatarColor = AVATAR_COLORS[video.authorName.charCodeAt(0) % AVATAR_COLORS.length];
  const initial = video.authorName.charAt(0).toUpperCase();

  return (
    <div ref={wrapRef} className="relative h-full w-full bg-black overflow-hidden">
      {/* ── Video ── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={togglePlay}
        onDoubleClick={handleDoubleClick}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnailUrl || undefined}
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {/* Dark gradient overlays for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
      </div>

      {/* Pause indicator */}
      <AnimatePresence>
        {!isPlaying && inView && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="size-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-28 h-28 text-[#FB7185] fill-[#FB7185] drop-shadow-[0_0_30px_rgba(251,113,133,0.6)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top: category chip ── */}
      <div className="absolute top-20 left-4 z-10">
        <span className="px-2.5 h-6 rounded-full bg-black/40 backdrop-blur-md text-white/80 text-[10px] font-bold uppercase tracking-wider flex items-center border border-white/10">
          {video.category}
        </span>
      </div>

      {/* ── Right action rail ── */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
        {/* Avatar with follow + */}
        <div className="relative mb-1">
          <div
            className="size-12 rounded-full flex items-center justify-center text-white font-black text-base border-2 border-white"
            style={{ backgroundColor: avatarColor }}
          >
            {initial}
          </div>
          <button
            onClick={handleFollow}
            disabled={followPending || (statusChecked && !authorId)}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-5 rounded-full flex items-center justify-center text-white text-[10px] font-black leading-none active:scale-90 transition-transform disabled:opacity-50"
            style={{
              backgroundColor: following ? '#10E07A' : authorId ? '#FB7185' : '#6b7280',
            }}
            aria-label={following ? 'Unfollow' : 'Follow'}
          >
            {following ? (
              <UserCheck className="w-3 h-3" strokeWidth={3} />
            ) : (
              <UserPlus className="w-3 h-3" strokeWidth={3} />
            )}
          </button>
        </div>

        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
          aria-label="Like"
        >
          <motion.div animate={video.liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart
              className={`w-8 h-8 ${video.liked ? 'text-[#FB7185] fill-[#FB7185]' : 'text-white'}`}
              strokeWidth={2}
            />
          </motion.div>
          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.likes)}</span>
        </button>

        {/* Comments */}
        <button
          onClick={() => {
            track('video_comment', { videoId: video.id });
            onOpenComments(video);
          }}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
          aria-label="Comments"
        >
          <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.comments)}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            track('video_share', { videoId: video.id });
            onShare(video);
          }}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
          aria-label="Share"
        >
          <Share2 className="w-8 h-8 text-white" strokeWidth={2} />
          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.shares)}</span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform disabled:opacity-60"
          aria-label={saved ? 'Remove from bookmarks' : 'Save to bookmarks'}
        >
          <Bookmark
            className={`w-8 h-8 ${saved ? 'text-[#F5C451] fill-[#F5C451]' : 'text-white'}`}
            strokeWidth={2}
          />
        </button>

        {/* Shop link (rotating disc) */}
        <button
          className="size-11 rounded-full bg-gradient-to-br from-[#10E07A] to-[#F5C451] flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(16,224,122,0.4)]"
          aria-label="Shop this"
        >
          <ShoppingBag className="w-5 h-5 text-black" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Bottom-left: caption info ── */}
      <div className="absolute left-4 right-20 bottom-24 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-black text-sm tracking-tight">{video.authorHandle || `@${video.authorName.toLowerCase().replace(/\s+/g, '')}`}</span>
          <span className="text-white/40 text-xs">•</span>
          <button
            onClick={handleFollow}
            disabled={followPending || (statusChecked && !authorId)}
            className={`text-[11px] font-bold border px-2.5 h-6 rounded-full flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50 ${
              following
                ? 'bg-[#10E07A]/15 text-[#10E07A] border-[#10E07A]/40'
                : 'text-white border-white/30 hover:border-white/50'
            }`}
          >
            {following ? (
              <>
                <UserCheck className="w-3 h-3" strokeWidth={3} />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3" strokeWidth={3} />
                Follow
              </>
            )}
          </button>
        </div>
        <h3 className="text-white font-bold text-[15px] leading-snug tracking-tight mb-1.5 drop-shadow">
          {video.title}
        </h3>
        <p className="text-white/80 text-[13px] leading-snug line-clamp-2 drop-shadow">
          {video.description}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <Music2 className="w-3 h-3 text-white/70" />
          <span className="text-white/70 text-[11px] font-medium">original sound — {video.authorName}</span>
          <span className="text-white/40 text-[11px]">•</span>
          <span className="text-white/70 text-[11px] font-medium">{formatCount(video.views)} views</span>
        </div>
      </div>

      {/* ── Mute toggle (bottom-right corner) ── */}
      <button
        onClick={toggleMute}
        className="absolute left-4 bottom-16 z-20 size-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
      </button>
    </div>
  );
}
