'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Film, Bookmark } from 'lucide-react';
import VideoCard, { type ReelVideo } from './VideoCard';
import VideoCommentsSheet from './VideoCommentsSheet';
import UploadVideoModal from './UploadVideoModal';
import { useAppStore } from '@/lib/store';
import { ReelsTabSkeleton } from './Skeletons';

const CATEGORIES = [
  { id: 'all', label: 'For You' },
  { id: 'cooking', label: 'Cooking' },
  { id: 'iftar', label: 'Iftar' },
  { id: 'sahur', label: 'Sahur' },
  { id: 'tips', label: 'Tips' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'saved', label: 'Saved' },
];

export default function ReelsTab() {
  const { userName, userEmail } = useAppStore();
  const [videos, setVideos] = useState<ReelVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [commentsFor, setCommentsFor] = useState<ReelVideo | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const viewer = userEmail || 'guest';
  const isSavedMode = activeCategory === 'saved';

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      if (isSavedMode) {
        // Fetch user's saved videos
        const res = await fetch(
          `/api/videos/list/save?userId=${encodeURIComponent(viewer)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        const list: ReelVideo[] = (data.videos || []).map((v: Record<string, unknown> & { id: string; title: string; description: string; videoUrl: string; thumbnailUrl: string; authorName: string; authorHandle: string; authorAvatar: string; category: string; likes: number; comments: number; shares: number; views: number; createdAt: string; authorId?: string | null }) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          videoUrl: v.videoUrl,
          thumbnailUrl: v.thumbnailUrl,
          authorName: v.authorName,
          authorHandle: v.authorHandle,
          authorAvatar: v.authorAvatar,
          authorId: v.authorId ?? null,
          category: v.category,
          likes: v.likes,
          comments: v.comments,
          shares: v.shares,
          views: v.views,
          liked: Array.isArray(v.likedBy) ? (v.likedBy as string[]).includes(viewer) : false,
          createdAt: v.createdAt,
        }));
        setVideos(list);
      } else {
        const res = await fetch(`/api/videos?category=${activeCategory}&viewer=${encodeURIComponent(viewer)}`);
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (e) {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, viewer, isSavedMode]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleLike = useCallback(async (video: ReelVideo) => {
    // Optimistic update
    setVideos((prev) =>
      prev.map((v) =>
        v.id === video.id
          ? {
              ...v,
              liked: !v.liked,
              likes: v.liked ? v.likes - 1 : v.likes + 1,
            }
          : v
      )
    );
    try {
      await fetch(`/api/videos/${video.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer }),
      });
    } catch (e) {
      // Revert on failure
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id
            ? { ...v, liked: video.liked, likes: video.likes }
            : v
        )
      );
    }
  }, [viewer]);

  const handleShare = useCallback(async (video: ReelVideo) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, shares: v.shares + 1 } : v))
    );
    try {
      await fetch(`/api/videos/${video.id}/share`, { method: 'POST' });
    } catch (e) {
      /* noop */
    }
  }, []);

  const handleOpenComments = useCallback((video: ReelVideo) => {
    setCommentsFor(video);
  }, []);

  const handleCommentAdded = useCallback((videoId: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, comments: v.comments + 1 } : v
      )
    );
    setCommentsFor((prev) =>
      prev && prev.id === videoId ? { ...prev, comments: prev.comments + 1 } : prev
    );
  }, []);

  const handleUploaded = useCallback(() => {
    fetchVideos();
  }, [fetchVideos]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-[#10E07A]/15 border border-[#10E07A]/30 flex items-center justify-center">
              <Film className="w-4 h-4 text-[#10E07A]" />
            </div>
            <div>
              <h1 className="text-white font-black text-base leading-tight tracking-tight">SwiftReels</h1>
              <p className="text-white/45 text-[10px] font-medium leading-none">Ramadan food shorts</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-[#10E07A] text-[#04140C] text-xs font-black active:scale-95 transition-transform shadow-[0_0_20px_rgba(16,224,122,0.4)]"
            aria-label="Upload reel"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Upload
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3.5 h-7 rounded-full text-[11px] font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vertical feed ── */}
      {loading ? (
        <ReelsTabSkeleton />
      ) : videos.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            {isSavedMode ? (
              <Bookmark className="w-7 h-7 text-[#F5C451]" />
            ) : (
              <Film className="w-7 h-7 text-white/30" />
            )}
          </div>
          <p className="text-white font-bold text-lg">
            {isSavedMode ? 'No saved reels' : 'No reels yet'}
          </p>
          <p className="text-white/40 text-sm mt-1">
            {isSavedMode
              ? 'Bookmark videos to watch later — they will show up here.'
              : 'Be the first to share a Ramadan food short!'}
          </p>
          {!isSavedMode && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-5 flex items-center gap-1.5 px-5 h-10 rounded-full bg-[#10E07A] text-[#04140C] text-sm font-black active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Upload Reel
            </button>
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {videos.map((video) => (
            <div
              key={video.id}
              className="snap-start h-full w-full relative"
              style={{ scrollSnapAlign: 'start' }}
            >
              <VideoCard
                video={video}
                onLike={handleLike}
                onShare={handleShare}
                onOpenComments={handleOpenComments}
                viewer={viewer}
              />
            </div>
          ))}
          {/* Spacer for bottom nav */}
          <div className="h-4" />
        </div>
      )}

      {/* ── Comments sheet ── */}
      <AnimatePresence>
        {commentsFor && (
          <VideoCommentsSheet
            video={commentsFor}
            viewer={viewer}
            viewerName={userName || 'Guest'}
            onClose={() => setCommentsFor(null)}
            onCommentAdded={() => handleCommentAdded(commentsFor.id)}
          />
        )}
      </AnimatePresence>

      {/* ── Upload modal ── */}
      <AnimatePresence>
        {showUpload && (
          <UploadVideoModal
            onClose={() => setShowUpload(false)}
            onUploaded={handleUploaded}
            authorName={userName || 'Guest'}
            authorHandle={userName ? `@${userName.toLowerCase().replace(/\s+/g, '')}` : '@guest'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
