'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { communityPosts } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'Reviews', label: 'Reviews' },
  { id: 'Group Buy', label: 'Group Buy' },
  { id: 'Charity', label: 'Charity' },
  { id: 'Recipes', label: 'Recipes' },
];

const avatarColors: Record<string, string> = {
  A: 'from-[#13ec13]/40 to-[#13ec13]/10',
  I: 'from-[#FFD700]/40 to-[#FFD700]/10',
  F: 'from-purple-400/40 to-purple-400/10',
  Y: 'from-cyan-400/40 to-cyan-400/10',
};

const categoryColors: Record<string, string> = {
  Reviews: 'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/20',
  'Group Buy': 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20',
  Charity: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  Recipes: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
};

export default function CommunityForum() {
  const { activeModal, setActiveModal } = useAppStore();
  const { toast } = useToast();

  const isOpen = activeModal === 'community';
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredPosts = activeFilter === 'all'
    ? communityPosts
    : communityPosts.filter((p) => p.category === activeFilter);

  const handlePostClick = (author: string) => {
    toast({ title: `${author}'s Post 📝`, description: 'Post detail coming soon!' });
  };

  const handleNewPost = () => {
    toast({ title: 'New Post ✍️', description: 'Create a new community post' });
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
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={() => setActiveModal(null)}
          />

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌙</span>
                  <h2 className="text-white text-lg font-bold">SwiftCommunity</h2>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Category Filter Chips */}
              <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(cat.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      activeFilter === cat.id
                        ? 'bg-[#13ec13]/20 border border-[#13ec13]/30 text-[#13ec13]'
                        : 'bg-[#1A1D26] border border-white/5 text-white/50 hover:bg-white/5'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div className="px-4 py-4 space-y-3 flex-1 pb-24">
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handlePostClick(post.author)}
                    className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 cursor-pointer hover:border-white/10 transition-colors active:scale-[0.99]"
                  >
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[post.avatar] || 'from-white/20 to-white/5'} flex items-center justify-center border border-white/10 shrink-0`}
                      >
                        <span className="text-white text-sm font-bold">{post.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-bold">{post.author}</p>
                        <p className="text-white/30 text-[10px]">{post.time}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${categoryColors[post.category] || 'bg-white/5 text-white/40 border-white/10'}`}
                      >
                        {post.category}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-white/70 text-sm leading-relaxed mb-3">{post.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast({ title: 'Liked! ❤️', description: `You liked ${post.author}'s post` });
                        }}
                        className="flex items-center gap-1.5 text-white/30 hover:text-[#FF6B6B] transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-xs font-semibold">{post.likes}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast({ title: 'Reply 💬', description: `Reply to ${post.author}` });
                        }}
                        className="flex items-center gap-1.5 text-white/30 hover:text-[#13ec13] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold">{post.replies}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <span className="text-4xl mb-3">🤷</span>
                  <p className="text-white/40 text-sm">No posts in this category yet</p>
                  <p className="text-white/20 text-xs mt-1">Be the first to start a conversation!</p>
                </div>
              )}
            </div>

            {/* New Post FAB */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              onClick={handleNewPost}
              className="fixed bottom-8 right-6 z-[110] w-14 h-14 rounded-full bg-[#13ec13] flex items-center justify-center shadow-lg shadow-[#13ec13]/30 green-glow active:scale-90 transition-transform"
            >
              <Plus className="w-6 h-6 text-[#05070A]" />
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
