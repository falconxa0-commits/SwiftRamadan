'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Camera,
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useNavigation, useUserName } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────────────────────────────────────────────────────
   IftarStories — Instagram-like stories for Iftar/Sahur moments
   Horizontal scrollable story circles at top, fullscreen viewer
   with progress bar. Stickers, photo + sticker, 24h expiry.
   ────────────────────────────────────────────────────────────────── */

interface Story {
  id: string;
  authorName: string;
  authorInitial: string;
  avatar?: string;
  items: StoryItem[];
  viewed: boolean;
  createdAt: string;
}

interface StoryItem {
  id: string;
  imageUrl: string;
  sticker: string;
  caption?: string;
  createdAt: string;
}

const STICKERS = [
  'Just broke fast 🌙',
  'Sahur prep ☪️',
  'Dates & water first 🫒',
  'Alhamdulillah 🤲',
  'Iftar ready! 🍽️',
  'Suhoor vibes ✨',
  'Quran time 📖',
  'Tarawih tonight 🕌',
];

const STORY_DURATION = 5000; // 5 seconds per story item

/* ── Mock seed data ── */
const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    authorName: 'Amina K.',
    authorInitial: 'A',
    items: [
      {
        id: 'si1',
        imageUrl: '/images/meals/meal-jollof.png',
        sticker: 'Just broke fast 🌙',
        caption: 'Jollof and chicken for iftar!',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'si2',
        imageUrl: '/images/meals/meal-suya.png',
        sticker: 'Dates & water first 🫒',
        caption: 'Started with dates as always',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
    viewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 's2',
    authorName: 'Ibrahim S.',
    authorInitial: 'I',
    items: [
      {
        id: 'si3',
        imageUrl: '/images/meals/meal-shawarma.png',
        sticker: 'Sahur prep ☪️',
        caption: 'Prepping sahur early',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ],
    viewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 's3',
    authorName: 'Fatima M.',
    authorInitial: 'F',
    items: [
      {
        id: 'si4',
        imageUrl: '/images/meals/meal-peppersoup.png',
        sticker: 'Alhamdulillah 🤲',
        caption: 'Pepper soup hits different after fasting',
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
      {
        id: 'si5',
        imageUrl: '/images/meals/meal-moi.png',
        sticker: 'Iftar ready! 🍽️',
        caption: 'Moi moi and pap',
        createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      },
      {
        id: 'si6',
        imageUrl: '/images/meals/meal-zobo.png',
        sticker: 'Suhoor vibes ✨',
        caption: 'Zobo to stay hydrated',
        createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      },
    ],
    viewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 's4',
    authorName: 'Yusuf A.',
    authorInitial: 'Y',
    items: [
      {
        id: 'si7',
        imageUrl: '/images/meals/meal-ofada.png',
        sticker: 'Quran time 📖',
        caption: 'Reading Quran before iftar',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ],
    viewed: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 's5',
    authorName: 'Halima B.',
    authorInitial: 'H',
    items: [
      {
        id: 'si8',
        imageUrl: '/images/meals/meal-asun.png',
        sticker: 'Tarawih tonight 🕌',
        caption: 'Heading to tarawih after iftar',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
    viewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

function IftarStoriesInner() {
  const userName = useUserName();
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'iftar-stories';
  const { toast } = useToast();

  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(STICKERS[0]);
  const [caption, setCaption] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Fetch stories from API ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/stories');
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.stories && data.stories.length > 0) {
            setStories(data.stories);
          }
        }
      } catch {
        // keep mock data
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Story progress timer ── */
  const startProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        if (progressRef.current) clearInterval(progressRef.current);
        // Move to next item
        setCurrentItemIndex((prev) => {
          if (viewingStory && prev < viewingStory.items.length - 1) {
            return prev + 1;
          }
          // Move to next story
          const currentIdx = stories.findIndex((s) => s.id === viewingStory?.id);
          if (currentIdx < stories.length - 1) {
            setViewingStory(stories[currentIdx + 1]);
            return 0;
          }
          setViewingStory(null);
          return 0;
        });
      }
    }, 50);
  }, [viewingStory, stories]);

  useEffect(() => {
    if (viewingStory) {
      startProgress();
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [viewingStory, currentItemIndex, startProgress]);

  /* ── Mark story as viewed ── */
  useEffect(() => {
    if (viewingStory) {
      setStories((prev) =>
        prev.map((s) => (s.id === viewingStory.id ? { ...s, viewed: true } : s))
      );
    }
  }, [viewingStory]);

  /* ── Keyboard handling ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreate) {
          setShowCreate(false);
        } else if (viewingStory) {
          setViewingStory(null);
          setCurrentItemIndex(0);
          setProgress(0);
        }
      } else if (e.key === 'ArrowRight' && viewingStory) {
        if (currentItemIndex < viewingStory.items.length - 1) {
          setCurrentItemIndex((prev) => prev + 1);
          setProgress(0);
        }
      } else if (e.key === 'ArrowLeft' && viewingStory) {
        if (currentItemIndex > 0) {
          setCurrentItemIndex((prev) => prev - 1);
          setProgress(0);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [viewingStory, currentItemIndex, showCreate]);

  /* ── Image upload handler ── */
  const handleImageSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  /* ── Create story ── */
  const handleCreateStory = async () => {
    if (!imagePreview) {
      toast({ title: 'Add a photo', description: 'Select a photo for your story' });
      return;
    }

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imagePreview,
          sticker: selectedSticker,
          caption,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newStory: Story = {
          id: data.story?.id || `local-${Date.now()}`,
          authorName: userName || 'You',
          authorInitial: (userName || 'Y')[0].toUpperCase(),
          items: [
            {
              id: `item-${Date.now()}`,
              imageUrl: imagePreview,
              sticker: selectedSticker,
              caption,
              createdAt: new Date().toISOString(),
            },
          ],
          viewed: true,
          createdAt: new Date().toISOString(),
        };
        setStories((prev) => [newStory, ...prev]);
        setShowCreate(false);
        setImagePreview(null);
        setCaption('');
        setSelectedSticker(STICKERS[0]);
        toast({ title: 'Story posted! 🌙', description: 'Your iftar moment is live' });
      }
    } catch {
      // Still add locally
      const newStory: Story = {
        id: `local-${Date.now()}`,
        authorName: userName || 'You',
        authorInitial: (userName || 'Y')[0].toUpperCase(),
        items: [
          {
            id: `item-${Date.now()}`,
            imageUrl: imagePreview,
            sticker: selectedSticker,
            caption,
            createdAt: new Date().toISOString(),
          },
        ],
        viewed: true,
        createdAt: new Date().toISOString(),
      };
      setStories((prev) => [newStory, ...prev]);
      setShowCreate(false);
      setImagePreview(null);
      setCaption('');
      setSelectedSticker(STICKERS[0]);
      toast({ title: 'Story posted! 🌙', description: 'Your iftar moment is live' });
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return 'Expired';
  };

  if (!isOpen) return null;

  return (
    <div className="w-full">
      {/* ── Story Circles (horizontal scroll) ── */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Add Story Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center gap-1 shrink-0"
            aria-label="Create a new story"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#10E07A]/50 flex items-center justify-center bg-[#0F1118]">
              <Plus className="w-6 h-6 text-[#10E07A]" />
            </div>
            <span className="text-[10px] text-white/50">Your Story</span>
          </motion.button>

          {/* Story Circles */}
          {stories.map((story) => (
            <motion.button
              key={story.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setViewingStory(story);
                setCurrentItemIndex(0);
                setProgress(0);
              }}
              className="flex flex-col items-center gap-1 shrink-0"
              aria-label={`View ${story.authorName}'s story`}
            >
              <div
                className={`w-16 h-16 rounded-full p-[2px] ${
                  story.viewed
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-[#10E07A] via-[#F5C451] to-[#A78BFA]'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#0B0D14] flex items-center justify-center text-lg font-bold overflow-hidden">
                  {story.avatar ? (
                    <img
                      src={story.avatar}
                      alt={story.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#10E07A]">{story.authorInitial}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-white/60 max-w-[64px] truncate">
                {story.authorName}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Fullscreen Story Viewer ── */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0D14] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label={`Viewing ${viewingStory.authorName}'s story`}
          >
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-4 pt-3">
              {viewingStory.items.map((_, i) => (
                <div key={i} className="flex-1 h-[3px] rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#10E07A] rounded-full"
                    style={{
                      width:
                        i < currentItemIndex
                          ? '100%'
                          : i === currentItemIndex
                            ? `${progress}%`
                            : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10E07A] to-[#F5C451] flex items-center justify-center text-sm font-bold text-black">
                  {viewingStory.authorInitial}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{viewingStory.authorName}</p>
                  <p className="text-white/65 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(viewingStory.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingStory(null);
                  setCurrentItemIndex(0);
                  setProgress(0);
                }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Close story viewer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Story Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              {viewingStory.items[currentItemIndex] && (
                <motion.div
                  key={viewingStory.items[currentItemIndex].id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <div className="relative max-w-lg w-full mx-4">
                    <img
                      src={viewingStory.items[currentItemIndex].imageUrl}
                      alt="Story content"
                      className="w-full h-auto max-h-[70vh] object-cover rounded-2xl"
                    />

                    {/* Sticker overlay */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute bottom-16 left-4 bg-[#0F1118]/90 backdrop-blur-sm border border-[#10E07A]/30 rounded-full px-4 py-2"
                    >
                      <span className="text-sm text-white font-medium">
                        {viewingStory.items[currentItemIndex].sticker}
                      </span>
                    </motion.div>

                    {/* Caption */}
                    {viewingStory.items[currentItemIndex].caption && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 right-4 text-white/80 text-sm bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2"
                      >
                        {viewingStory.items[currentItemIndex].caption}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Tap zones for navigation */}
            <div className="absolute inset-0 flex z-[5]">
              <div
                className="w-1/3 h-full"
                onClick={() => {
                  if (currentItemIndex > 0) {
                    setCurrentItemIndex((prev) => prev - 1);
                    setProgress(0);
                  } else {
                    const currentIdx = stories.findIndex((s) => s.id === viewingStory.id);
                    if (currentIdx > 0) {
                      setViewingStory(stories[currentIdx - 1]);
                      setCurrentItemIndex(stories[currentIdx - 1].items.length - 1);
                      setProgress(0);
                    }
                  }
                }}
                aria-label="Previous story"
              />
              <div className="w-1/3 h-full" />
              <div
                className="w-1/3 h-full"
                onClick={() => {
                  if (currentItemIndex < viewingStory.items.length - 1) {
                    setCurrentItemIndex((prev) => prev + 1);
                    setProgress(0);
                  } else {
                    const currentIdx = stories.findIndex((s) => s.id === viewingStory.id);
                    if (currentIdx < stories.length - 1) {
                      setViewingStory(stories[currentIdx + 1]);
                      setCurrentItemIndex(0);
                      setProgress(0);
                    } else {
                      setViewingStory(null);
                      setCurrentItemIndex(0);
                      setProgress(0);
                    }
                  }
                }}
                aria-label="Next story"
              />
            </div>

            {/* Nav arrows (desktop) */}
            <button
              onClick={() => {
                if (currentItemIndex > 0) {
                  setCurrentItemIndex((prev) => prev - 1);
                  setProgress(0);
                }
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity hidden md:flex"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => {
                if (currentItemIndex < viewingStory.items.length - 1) {
                  setCurrentItemIndex((prev) => prev + 1);
                  setProgress(0);
                }
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity hidden md:flex"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Story Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0D14]/95 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Create a new story"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F1118] border border-white/8 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-lg">New Story</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  aria-label="Close create story"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Image Upload */}
                <div
                  onClick={handleImageSelect}
                  className="aspect-[9/16] max-h-64 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#10E07A]/50 transition-colors overflow-hidden"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Story preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-white/60" />
                      <p className="text-white/65 text-sm">Tap to add a photo</p>
                    </>
                  )}
                </div>

                {/* Sticker Selection */}
                <div>
                  <p className="text-white/60 text-xs mb-2">Choose a sticker</p>
                  <div className="flex flex-wrap gap-2">
                    {STICKERS.map((sticker) => (
                      <button
                        key={sticker}
                        onClick={() => setSelectedSticker(sticker)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          selectedSticker === sticker
                            ? 'bg-[#10E07A] text-black font-semibold'
                            : 'bg-white/8 text-white/60 hover:bg-white/15'
                        }`}
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption */}
                <div>
                  <p className="text-white/60 text-xs mb-2">Caption</p>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What's your iftar moment?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[#10E07A]/50"
                    maxLength={120}
                  />
                </div>

                {/* Post Button */}
                <button
                  onClick={handleCreateStory}
                  className="w-full bg-[#10E07A] text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#10E07A]/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Post Story
                </button>

                {/* 24h Notice */}
                <p className="text-white/60 text-xs text-center flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Stories disappear after 24 hours
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(IftarStoriesInner);
