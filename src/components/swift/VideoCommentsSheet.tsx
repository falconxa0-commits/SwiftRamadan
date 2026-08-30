'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Heart, Loader2, MessageCircle } from 'lucide-react';
import type { ReelVideo } from './VideoCard';

interface Comment {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  likes: number;
  createdAt: string;
}

interface VideoCommentsSheetProps {
  video: ReelVideo;
  viewer: string;
  viewerName: string;
  onClose: () => void;
  onCommentAdded: () => void;
}

const AVATAR_COLORS = ['#10E07A', '#F5C451', '#A78BFA', '#38BDF8', '#FB7185', '#FB923C'];

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function VideoCommentsSheet({
  video,
  viewer,
  viewerName,
  onClose,
  onCommentAdded,
}: VideoCommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/videos/${video.id}/comments`);
        const data = await res.json();
        if (!cancelled) setComments(data.comments || []);
      } catch (e) {
        // silently handle
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [video.id]);

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: viewerName,
          authorHandle: `@${viewerName.toLowerCase().replace(/\s+/g, '')}`,
          content,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setText('');
        onCommentAdded();
      }
    } catch (e) {
      // silently handle
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCommentLike = (id: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const avatarColor = (name: string) =>
    AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-[61] mx-auto max-w-lg h-[75vh] bg-[#0B0D14] rounded-t-3xl border-t border-white/10 flex flex-col"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#10E07A]" />
            <h3 className="text-white font-black text-base tracking-tight">
              {video.comments} comments
            </h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Close comments"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#10E07A] animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-white font-bold text-sm">No comments yet</p>
              <p className="text-white/65 text-xs mt-1">Start the conversation</p>
            </div>
          ) : (
            comments.map((c) => {
              const liked = likedComments.has(c.id);
              const initial = c.authorName.charAt(0).toUpperCase();
              return (
                <div key={c.id} className="flex gap-3">
                  <div
                    className="size-9 shrink-0 rounded-full flex items-center justify-center text-white font-black text-sm"
                    style={{ backgroundColor: avatarColor(c.authorName) }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/60 text-xs font-bold">{c.authorHandle || c.authorName}</span>
                      <span className="text-white/60 text-[10px]">•</span>
                      <span className="text-white/60 text-[10px]">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-white text-sm leading-snug mt-0.5 break-words">{c.content}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <button
                        onClick={() => toggleCommentLike(c.id)}
                        className="flex items-center gap-1 text-white/65 hover:text-[#FB7185] transition-colors"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${liked ? 'text-[#FB7185] fill-[#FB7185]' : ''}`}
                        />
                        <span className="text-[11px] font-medium">
                          {(c.likes + (liked ? 1 : 0)) || 'Like'}
                        </span>
                      </button>
                      <button className="text-white/65 hover:text-white/70 text-[11px] font-medium transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <div className="px-4 py-3 border-t border-white/8 bg-[#0B0D14]">
          <div className="flex items-center gap-2">
            <div className="size-8 shrink-0 rounded-full bg-[#10E07A] flex items-center justify-center text-[#04140C] font-black text-xs">
              {viewerName.charAt(0).toUpperCase() || 'G'}
            </div>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Add a comment..."
              className="flex-1 h-10 rounded-full bg-white/5 border border-white/10 px-4 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[#10E07A]/40 transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="size-10 rounded-full bg-[#10E07A] flex items-center justify-center text-[#04140C] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-transform"
              aria-label="Send comment"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
