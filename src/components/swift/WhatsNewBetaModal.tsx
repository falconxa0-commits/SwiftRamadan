'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain, ChefHat, BarChart3, Award, MessageSquare, Rocket, Star, Zap, TrendingUp, Camera, Bike } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface ReleaseItem {
  category: 'AI' | 'Smart Kitchen' | 'Delivery' | 'Community';
  title: string;
  desc: string;
  icon: typeof Brain;
  badge?: string;
}

const RELEASES: { version: string; date: string; tag: string; items: ReleaseItem[] }[] = [
  {
    version: '0.3.0-beta.1',
    date: 'Ramadan 2026',
    tag: 'Current Beta',
    items: [
      { category: 'Smart Kitchen', title: 'Smart Kitchen Intelligence', desc: 'Persistent pantry tracking with expiry urgency, AI fridge rescue, cooking analytics & 10 gamified badges.', icon: Brain, badge: 'NEW' },
      { category: 'Smart Kitchen', title: 'AI Fridge Rescue', desc: 'Chef Safa turns your expiring ingredients into a custom halal recipe in seconds.', icon: ChefHat },
      { category: 'Smart Kitchen', title: 'Cook-Along Mode', desc: 'Step-by-step guided cooking with live timer, progress tracking, and auto-logged sessions.', icon: Zap },
      { category: 'Smart Kitchen', title: 'Cooking Insights', desc: '7-day activity bar chart, cuisine donut, difficulty breakdown, and achievement badges.', icon: BarChart3 },
      { category: 'AI', title: 'AI Chef Safa', desc: 'Generate custom Ramadan recipes from any prompt — ingredients auto-add to cart.', icon: Sparkles },
      { category: 'AI', title: 'Visual Snap-to-Shop', desc: 'Snap a photo of any ingredient or dish; AI finds matching products instantly.', icon: Camera },
      { category: 'AI', title: 'Trending in Lagos', desc: 'Real-time web search for trending Ramadan deals, recipes, and halal news.', icon: TrendingUp },
      { category: 'Delivery', title: 'Real-time Rider Tracking', desc: 'Live WebSocket rider position, status timeline, ETA countdown, and in-app chat.', icon: Bike },
      { category: 'Community', title: 'Beta Feedback Program', desc: 'Report bugs, request features, and rate your beta experience directly in-app.', icon: MessageSquare, badge: 'BETA' },
    ],
  },
];

const CATEGORY_COLOR: Record<ReleaseItem['category'], string> = {
  AI: '#13ec13',
  'Smart Kitchen': '#FFD700',
  Delivery: '#3b82f6',
  Community: '#ec4899',
};

export default function WhatsNewBetaModal() {
  const { activeModal, setActiveModal } = useAppStore();
  const isOpen = activeModal === 'whats-new';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[110]" onClick={() => setActiveModal(null)} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 h-[94vh] bg-[#05070A] rounded-t-3xl z-[115] flex flex-col overflow-hidden border-t border-[#FFD700]/20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 bg-gradient-to-r from-[#FFD700]/8 to-[#13ec13]/5">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 bg-gradient-to-br from-[#FFD700]/20 to-[#13ec13]/20 rounded-2xl flex items-center justify-center border border-[#FFD700]/30">
                  <Rocket className="w-6 h-6 text-[#FFD700]" />
                  <Sparkles className="w-3 h-3 text-[#13ec13] absolute -top-1 -right-1" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    What's New
                    <span className="px-1.5 py-0.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] text-[9px] font-black uppercase tracking-wider">Beta</span>
                  </h2>
                  <p className="text-white/40 text-xs">Release notes & fresh features</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
              {RELEASES.map((release, ri) => (
                <div key={ri}>
                  {/* Version header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-black text-base">{release.version}</h3>
                      <p className="text-white/40 text-xs">{release.date}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-black uppercase tracking-wider">{release.tag}</span>
                  </div>

                  {/* Feature items */}
                  <div className="space-y-2">
                    {release.items.map((item, i) => {
                      const Icon = item.icon;
                      const color = CATEGORY_COLOR[item.category];
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="flex gap-3 p-3 rounded-2xl bg-[#0F1117] border border-white/5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-white font-bold text-sm">{item.title}</h4>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>{item.badge}</span>
                              )}
                            </div>
                            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: `${color}99` }}>{item.category}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Beta call-to-action */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl overflow-hidden relative border border-[#13ec13]/30"
                style={{ background: 'linear-gradient(135deg, rgba(19,236,19,0.08) 0%, rgba(255,215,0,0.06) 100%)' }}>
                <motion.div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#13ec13]/20 blur-2xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 4, repeat: Infinity }} />
                <div className="relative z-10 p-4 text-center">
                  <Award className="w-8 h-8 text-[#FFD700] mx-auto mb-2" />
                  <h3 className="text-white font-bold text-sm">You're a Beta Tester 🎉</h3>
                  <p className="text-white/50 text-xs mt-1 mb-3">Thanks for helping shape SwiftRamadan. Your feedback makes the app better for the whole ummah.</p>
                  <button onClick={() => setActiveModal('beta-feedback')}
                    className="bg-[#13ec13] text-[#05070A] font-bold text-sm py-2.5 px-5 rounded-xl inline-flex items-center gap-2 active:scale-[0.98] transition-transform">
                    <MessageSquare className="w-4 h-4" /> Send Feedback
                  </button>
                </div>
              </motion.div>

              {/* Footer */}
              <div className="text-center pt-2 pb-4">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />))}
                </div>
                <p className="text-white/30 text-[10px]">SwiftRamadan Beta · Built with 💚 for the Ummah</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
