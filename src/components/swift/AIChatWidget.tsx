'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChefHat, Mic, Paperclip, Sparkles, X, Send, User, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

const WELCOME_TEXT =
  "Salam! 🌙 I'm Chef Safa, your AI cooking & shopping assistant. I can help you plan meals, find deals, track orders, or guide your cooking. What's on your mind?";

const QUICK_REPLIES = [
  { icon: '🍽️', label: 'Plan my Iftar' },
  { icon: '🔥', label: "Today's deals" },
  { icon: '📦', label: 'Track order' },
  { icon: '🥘', label: 'Recipe ideas' },
  { icon: '⏰', label: 'Prayer times' },
  { icon: '🛒', label: 'My cart' },
];

const PROACTIVE_TIPS = [
  { emoji: '💡', title: 'Tip', text: "Ask me 'What should I cook for iftar?'" },
  { emoji: '⚡', title: 'Did you know?', text: 'You can launch the Smart Kitchen for live AI cooking coaching' },
  { emoji: '🎯', title: 'Trending', text: 'Suya platters are 20% off today' },
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: 'bot', text: WELCOME_TEXT },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNew, setHasNew] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const cartCount = useAppStore((s) => s.cartCount);
  const orders = useAppStore((s) => s.orders);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, minimized, scrollToBottom]);

  // Escape to close (setState inside event handler — not in effect body)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setMinimized(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const userMessage = (text || message).trim();
    if (!userMessage || isLoading) return;
    setHasNew(false);
    setMinimized(false);
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', text: userMessage }]);
    setMessage('');
    setIsLoading(true);
    track('ai_chat_message', { length: userMessage.length });
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: 'bot', text: data.reply || "I'm here to help! What would you like to know? 🌟" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: 'bot', text: "I'm having trouble connecting right now. Please try again. 🌙" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasUserMessage = messages.some((m) => m.from === 'user');
  const showProactive = !hasUserMessage && !isLoading;
  const showQuickReplies = messages.length <= 3 && !isLoading;

  // Context-aware chips
  const contextChips: { icon: string; label: string }[] = [];
  if (cartCount > 0) contextChips.push({ icon: '🛒', label: `I have ${cartCount} items in cart` });
  if (orders.length > 0) contextChips.push({ icon: '📦', label: "Where's my order?" });
  const allReplies = [...contextChips, ...QUICK_REPLIES.map((q) => ({ icon: q.icon, label: q.label }))];

  const openWidget = () => {
    setIsOpen(true);
    setMinimized(false);
    setHasNew(false);
  };
  const closeWidget = () => {
    setIsOpen(false);
    setMinimized(false);
  };

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ height: minimized ? 'auto' : '70vh' }}
            className="fixed bottom-24 left-4 w-[calc(100%-2rem)] sm:w-[400px] z-[60] flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#0F1117]/95 backdrop-blur-md shadow-2xl shadow-black/50"
          >
            {/* Gradient ring border */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl p-px bg-gradient-to-br from-[#13ec13]/50 via-transparent to-[#FFD700]/50 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude]" />

            {/* Header */}
            <div className="relative shrink-0 bg-gradient-to-r from-[#13ec13]/15 via-[#1A1D26] to-[#FFD700]/15 border-b border-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-[#13ec13] flex items-center justify-center shadow-lg shadow-[#13ec13]/20">
                    <ChefHat className="w-5 h-5 text-[#0F1117]" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#13ec13] rounded-full border-2 border-[#0F1117]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-bold leading-tight">Chef Safa AI</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#13ec13] text-[#0F1117] flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Beta
                      </span>
                    </div>
                    <p className="text-white/50 text-[10px] leading-tight">Your Ramadan cooking &amp; shopping assistant</p>
                    <p className="text-[#13ec13] text-[10px] font-medium flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-[#13ec13] rounded-full animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMinimized((m) => !m)}
                    aria-label="Minimize chat"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={closeWidget}
                    aria-label="Close chat"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] flex gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                          msg.from === 'user'
                            ? 'bg-[#13ec13]/20'
                            : 'bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10'
                        }`}>
                          {msg.from === 'user' ? (
                            <User className="w-3.5 h-3.5 text-[#13ec13]" />
                          ) : (
                            <ChefHat className="w-3.5 h-3.5 text-[#FFD700]" />
                          )}
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.from === 'user'
                            ? 'bg-[#13ec13] text-[#05070A] font-semibold rounded-tr-sm'
                            : 'bg-[#1A1D26] text-white/85 border-l-2 border-[#FFD700]/60 rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10">
                          <ChefHat className="w-3.5 h-3.5 text-[#FFD700]" />
                        </div>
                        <div className="bg-[#1A1D26] px-4 py-3 rounded-2xl border-l-2 border-[#FFD700]/60 rounded-tl-sm">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Proactive tip cards */}
                <AnimatePresence>
                  {showProactive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-2 space-y-1.5 overflow-hidden"
                    >
                      {PROACTIVE_TIPS.map((tip) => (
                        <div key={tip.title} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#1A1D26]/60 border border-white/5">
                          <span className="text-sm leading-tight">{tip.emoji}</span>
                          <p className="text-[11px] text-white/70 leading-snug">
                            <span className="text-white font-semibold">{tip.title}:</span> {tip.text}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Replies (scrollable) */}
                {showQuickReplies && (
                  <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
                    {allReplies.map((reply) => (
                      <button
                        key={reply.label}
                        onClick={() => handleSend(reply.label)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] text-xs font-medium whitespace-nowrap hover:bg-[#13ec13]/20 transition-colors"
                      >
                        <span>{reply.icon}</span>
                        {reply.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-white/5 bg-[#0a0a0a]/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast({ title: '📎 Coming soon', description: 'Image sharing coming soon' })}
                      aria-label="Attach image"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    >
                      <Paperclip className="w-4 h-4 text-white/60" />
                    </button>
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask Chef Safa anything…"
                      className="flex-1 bg-[#1A1D26] border border-white/5 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[#13ec13]/30"
                    />
                    <button
                      onClick={() => toast({ title: '🎤 Coming soon', description: 'Voice input coming soon' })}
                      aria-label="Voice input"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    >
                      <Mic className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !message.trim()}
                      aria-label="Send message"
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity bg-gradient-to-br from-[#13ec13] to-[#FFD700]"
                    >
                      <Send className="w-4 h-4 text-[#05070A]" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (isOpen ? closeWidget() : openWidget())}
        aria-label={isOpen ? 'Close Chef Safa AI assistant' : 'Open Chef Safa AI assistant'}
        className="fixed bottom-24 left-4 z-[60] group"
      >
        {/* Expanding ping ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#13ec13] opacity-50 animate-ping" />
        )}
        {/* Soft pulsing glow */}
        <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#13ec13] to-[#FFD700] opacity-40 blur-xl group-hover:opacity-70 transition-opacity" />
        {/* Gradient orb */}
        <span className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#13ec13] via-[#13ec13] to-[#FFD700] flex items-center justify-center shadow-lg shadow-[#13ec13]/30">
          {isOpen ? <X className="w-6 h-6 text-[#05070A]" /> : <ChefHat className="w-6 h-6 text-[#05070A]" />}
          {/* Gold "new" notification dot */}
          {!isOpen && hasNew && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD700] rounded-full border-2 border-[#0F1117] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#0F1117] rounded-full" />
            </span>
          )}
        </span>
        {/* Desktop hover label */}
        <span className="absolute left-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1A1D26] border border-white/10 text-xs text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          <Sparkles className="w-3 h-3 text-[#FFD700]" />
          Chef Safa AI
        </span>
        {/* Mobile persistent AI badge */}
        <span className="absolute -top-1 -left-1 sm:hidden bg-[#FFD700] text-[#0F1117] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#0F1117]">
          AI
        </span>
      </motion.button>
    </>
  );
}
