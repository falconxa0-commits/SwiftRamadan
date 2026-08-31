'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChefHat, Mic, Sparkles, X, Send, User, Minus, Trash2, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { track } from '@/lib/analytics';

/* ──────────────────── Types ──────────────────── */

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
  timestamp: number;
}

interface ChatMessageAPI {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContextAPI {
  userName?: string;
  cartItems?: { name: string; qty: number; price: number }[];
  recentOrders?: { id: string; item: string; status: string }[];
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  swiftPoints?: number;
  dietaryPrefs?: string[];
}

/* ──────────────────── Time-of-day helpers ──────────────────── */

type TimeOfDay = 'sahur' | 'morning' | 'afternoon' | 'iftar' | 'evening' | 'night';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 3 && hour < 5) return 'sahur';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'afternoon';
  if (hour >= 15 && hour < 19) return 'iftar';
  if (hour >= 19 && hour < 21) return 'evening';
  return 'night';
}

function getGreeting(): string {
  const tod = getTimeOfDay();
  switch (tod) {
    case 'sahur':
      return "Salam! 🌙 It's Sahur time! Let me help you find a nourishing pre-dawn meal to keep you energized through tomorrow's fast.";
    case 'morning':
      return "Salam! ☀️ Good morning! How can I help your Ramadan today? I can suggest meals, track orders, or help you plan.";
    case 'afternoon':
      return "Salam! 🌤️ Good afternoon! Iftar is approaching — want me to suggest some meal options or check on your order?";
    case 'iftar':
      return "Salam! 🌙 Iftar time is near! Let me help you find the perfect meal to break your fast. We have hot deals ready!";
    case 'evening':
      return "Salam! 🌙 Good evening! How was your Iftar? I can help with Sahur prep, dessert ideas, or anything else.";
    case 'night':
      return "Salam! 🌙 Still up? Let me help you plan for Sahur or find a late-night snack before Fajr.";
  }
}

/* ──────────────────── Context-aware Quick Chips ──────────────────── */

const BASE_CHIPS = [
  { icon: '🍽️', label: 'Plan my Iftar' },
  { icon: '🔥', label: "Today's deals" },
  { icon: '📦', label: 'Track order' },
  { icon: '🥘', label: 'Recipe ideas' },
  { icon: '⏰', label: 'Prayer times' },
  { icon: '🛒', label: 'My cart' },
];

function getTimeChips(): { icon: string; label: string }[] {
  const tod = getTimeOfDay();
  switch (tod) {
    case 'sahur':
    case 'night':
      return [
        { icon: '🌙', label: 'Sahur meal ideas' },
        { icon: '⚡', label: 'Quick Sahur picks' },
        { icon: '🥤', label: 'Hydrating drinks' },
      ];
    case 'iftar':
    case 'afternoon':
      return [
        { icon: '🌙', label: 'Iftar meal deals' },
        { icon: '🍯', label: 'Dates & starters' },
        { icon: '👨‍👩‍👧‍👦', label: 'Family Iftar bundle' },
      ];
    case 'morning':
      return [
        { icon: '☀️', label: 'Morning energizers' },
        { icon: '🥗', label: 'Light meal ideas' },
        { icon: '💧', label: 'Stay hydrated tips' },
      ];
    case 'evening':
      return [
        { icon: '🍮', label: 'Dessert ideas' },
        { icon: '🌙', label: 'Sahur prep tips' },
        { icon: '📖', label: 'Ramadan guidance' },
      ];
  }
}

/* ──────────────────── Simple Markdown Renderer ──────────────────── */

function renderBotText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet points
    if (line.match(/^[-•]\s/)) {
      const content = line.replace(/^[-•]\s/, '');
      result.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-[var(--sr-vendor)] shrink-0">•</span>
          <span>{renderInlineFormatting(content)}</span>
        </div>
      );
      continue;
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '');
      const num = line.match(/^(\d+)/)?.[1];
      result.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-[var(--sr-customer)] shrink-0 font-semibold">{num}.</span>
          <span>{renderInlineFormatting(content)}</span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      result.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular lines
    result.push(<span key={i}>{renderInlineFormatting(line)}</span>);
  }

  return result;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold** and *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[2]) {
      // Bold
      parts.push(<strong key={key++} className="text-[var(--sr-vendor)] font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // Italic
      parts.push(<em key={key++}>{match[3]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [text];
}

/* ──────────────────── LocalStorage Persistence ──────────────────── */

const CHAT_STORAGE_KEY = 'safa-chat-history';
const MAX_STORED_MESSAGES = 50;

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveMessages(messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  } catch { /* ignore */ }
}

/* ──────────────────── Format Time ──────────────────── */

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ──────────────────── Component ──────────────────── */

export default function SafaAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNew, setHasNew] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Store state
  const cartCount = useAppStore((s) => s.cartCount);
  const cartItems = useAppStore((s) => s.cartItems);
  const orders = useAppStore((s) => s.orders);
  const userName = useAppStore((s) => s.userName);
  const loyaltyTier = useAppStore((s) => s.loyaltyTier);
  const swiftPoints = useAppStore((s) => s.swiftPoints);
  const dietaryPrefs = useAppStore((s) => s.customerDietaryPrefs);

  /* ──── Load persisted messages on mount ──── */
  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    } else {
      setMessages([{ id: Date.now(), from: 'bot', text: getGreeting(), timestamp: Date.now() }]);
    }
    setInitialLoad(false);
  }, []);

  /* ──── Persist messages on change ──── */
  useEffect(() => {
    if (!initialLoad && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, initialLoad]);

  /* ──── Auto-scroll ──── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, minimized, scrollToBottom]);

  /* ──── Focus input when opened ──── */
  useEffect(() => {
    if (isOpen && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, minimized]);

  /* ──── Escape to close ──── */
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

  /* ──── Cleanup speech recognition on unmount ──── */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  /* ──── Build context for API ──── */
  const buildContext = useCallback((): ChatContextAPI => {
    const ctx: ChatContextAPI = {};
    if (userName) ctx.userName = userName;
    if (loyaltyTier) ctx.loyaltyTier = loyaltyTier;
    if (swiftPoints) ctx.swiftPoints = swiftPoints;
    if (dietaryPrefs && dietaryPrefs.length > 0) ctx.dietaryPrefs = dietaryPrefs;
    if (cartItems.length > 0) {
      ctx.cartItems = cartItems.map(i => ({ name: i.name, qty: i.quantity, price: i.price }));
    }
    if (orders.length > 0) {
      ctx.recentOrders = orders.slice(0, 3).map(o => ({ id: o.id, item: o.item, status: o.status }));
    }
    return ctx;
  }, [userName, loyaltyTier, swiftPoints, dietaryPrefs, cartItems, orders]);

  /* ──── Send message ──── */
  const handleSend = useCallback(async (text?: string) => {
    const userMessage = (text || message).trim();
    if (!userMessage || isLoading) return;

    setHasNew(false);
    setMinimized(false);

    const userMsg: Message = { id: Date.now(), from: 'user', text: userMessage, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    track('ai_chat_message', { length: userMessage.length });

    // Build conversation history for multi-turn
    const history: ChatMessageAPI[] = [...messages, userMsg]
      .filter(m => m.from === 'user' || m.from === 'bot')
      .map(m => ({
        role: m.from === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          messages: history.slice(-10), // last 10 messages for context
          context: buildContext(),
        }),
      });
      const data = await res.json();
      const botText = data.reply || "I'm here to help! What would you like to know? 🌟";
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: 'bot', text: botText, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: 'bot', text: "I'm having trouble connecting right now. Please try again. 🌙", timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [message, messages, isLoading, buildContext]);

  /* ──── Clear chat ──── */
  const handleClearChat = useCallback(() => {
    const greeting: Message = { id: Date.now(), from: 'bot', text: getGreeting(), timestamp: Date.now() };
    setMessages([greeting]);
    saveMessages([greeting]);
  }, []);

  /* ──── Voice Input (Web Speech API) ──── */
  const toggleVoiceInput = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: 'bot', text: "Voice input isn't supported in your browser. Please type your message instead. 🎤", timestamp: Date.now() },
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-NG';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  /* ──── Quick action chips ──── */
  const contextChips: { icon: string; label: string }[] = [];
  if (cartCount > 0) contextChips.push({ icon: '🛒', label: `I have ${cartCount} items in cart` });
  if (orders.length > 0) contextChips.push({ icon: '📦', label: "Where's my order?" });
  const allChips = [...contextChips, ...getTimeChips(), ...BASE_CHIPS];

  const hasUserMessage = messages.some((m) => m.from === 'user');
  const showQuickReplies = messages.length <= 3 && !isLoading;

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
      {/* ──── Chat Panel ──── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ height: minimized ? 'auto' : '70vh' }}
            className="fixed bottom-24 left-4 w-[calc(100%-2rem)] sm:w-[420px] z-[60] flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[var(--sr-surface-raised)]/95 backdrop-blur-md shadow-2xl shadow-black/50"
          >
            {/* Gradient ring border — Aurora Luxe palette */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl p-px bg-gradient-to-br from-[var(--sr-customer)]/50 via-transparent to-[var(--sr-vendor)]/50 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude]" />

            {/* ──── Header ──── */}
            <div className="relative shrink-0 bg-gradient-to-r from-[var(--sr-customer)]/15 via-[#1A1D26] to-[var(--sr-vendor)]/15 border-b border-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[var(--sr-vendor)] to-[var(--sr-customer)] flex items-center justify-center shadow-lg shadow-[var(--sr-customer)]/20">
                    <ChefHat className="w-5 h-5 text-[var(--sr-surface-raised)]" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--sr-customer)] rounded-full border-2 border-[#0F1117]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-bold leading-tight">Safa AI</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[var(--sr-vendor)] to-[var(--sr-customer)] text-[var(--sr-surface-raised)] flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    </div>
                    <p className="text-white/50 text-[10px] leading-tight">Your Ramadan food &amp; lifestyle assistant</p>
                    <p className="text-[var(--sr-customer)] text-[10px] font-medium flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-[var(--sr-customer)] rounded-full animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Clear chat */}
                  <button
                    onClick={handleClearChat}
                    aria-label="Clear chat history"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors text-white/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                {/* ──── Messages ──── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, x: msg.from === 'user' ? 8 : -8 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ duration: 0.3, delay: idx === messages.length - 1 ? 0.05 : 0 }}
                      className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] flex gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                          msg.from === 'user'
                            ? 'bg-[var(--sr-customer)]/20'
                            : 'bg-gradient-to-br from-[var(--sr-vendor)]/30 to-[var(--sr-vendor)]/10'
                        }`}>
                          {msg.from === 'user' ? (
                            <User className="w-3.5 h-3.5 text-[var(--sr-customer)]" />
                          ) : (
                            <ChefHat className="w-3.5 h-3.5 text-[var(--sr-vendor)]" />
                          )}
                        </div>
                        {/* Bubble */}
                        <div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.from === 'user'
                              ? 'bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-semibold rounded-tr-sm'
                              : 'bg-[var(--sr-surface-elevated)] text-white/85 border-l-2 border-[var(--sr-vendor)]/60 rounded-tl-sm'
                          }`}>
                            {msg.from === 'bot' ? renderBotText(msg.text) : msg.text}
                          </div>
                          {/* Timestamp */}
                          <p className={`text-[9px] text-white/25 mt-1 ${msg.from === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* ──── Typing Indicator with Shimmer ──── */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 bg-gradient-to-br from-[var(--sr-vendor)]/30 to-[var(--sr-vendor)]/10">
                          <ChefHat className="w-3.5 h-3.5 text-[var(--sr-vendor)]" />
                        </div>
                        <div className="bg-[var(--sr-surface-elevated)] px-4 py-3 rounded-2xl border-l-2 border-[var(--sr-vendor)]/60 rounded-tl-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <div className="w-2 h-2 bg-[var(--sr-vendor)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-[var(--sr-vendor)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-[var(--sr-vendor)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[10px] text-white/60 shimmer-text">Safa is thinking…</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* ──── Quick Replies (scrollable) ──── */}
                <AnimatePresence>
                  {showQuickReplies && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
                        {allChips.map((chip) => (
                          <button
                            key={chip.label}
                            onClick={() => handleSend(chip.label)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] text-xs font-medium whitespace-nowrap hover:bg-[var(--sr-customer)]/20 transition-colors active:scale-95"
                          >
                            <span>{chip.icon}</span>
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ──── Input Bar ──── */}
                <div className="p-3 border-t border-white/5 bg-[#0a0a0a]/60">
                  <div className="flex items-center gap-2">
                    {/* Voice Input Button */}
                    <button
                      onClick={toggleVoiceInput}
                      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                      className={`w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all ${
                        isListening
                          ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                          : 'bg-white/5 hover:bg-white/10 text-white/60'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder={isListening ? '🎤 Listening…' : 'Ask Safa anything…'}
                      className="flex-1 bg-[var(--sr-surface-elevated)] border border-white/5 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[var(--sr-customer)]/30 transition-colors"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !message.trim()}
                      aria-label="Send message"
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity bg-gradient-to-br from-[var(--sr-customer)] to-[var(--sr-vendor)] active:scale-95"
                    >
                      <Send className="w-4 h-4 text-[var(--sr-surface-base)]" />
                    </button>
                  </div>
                  {/* Voice listening indicator */}
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-center gap-2 mt-2"
                    >
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-[var(--sr-customer)] rounded-full animate-pulse"
                            style={{
                              height: `${8 + Math.random() * 12}px`,
                              animationDelay: `${i * 100}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--sr-customer)]/60">Listening…</span>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Floating Button ──── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (isOpen ? closeWidget() : openWidget())}
        aria-label={isOpen ? 'Close Safa AI assistant' : 'Open Safa AI assistant'}
        className="fixed bottom-24 left-4 z-[60] group"
      >
        {/* Expanding ping ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[var(--sr-customer)] opacity-30 animate-ping" />
        )}
        {/* Soft pulsing glow */}
        <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-[var(--sr-customer)] to-[var(--sr-vendor)] opacity-40 blur-xl group-hover:opacity-70 transition-opacity animate-[glow-pulse_3s_ease-in-out_infinite]" />
        {/* Gradient orb */}
        <span className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[var(--sr-customer)] via-[var(--sr-customer)] to-[var(--sr-vendor)] flex items-center justify-center shadow-lg shadow-[var(--sr-customer)]/30">
          {isOpen ? <X className="w-6 h-6 text-[var(--sr-surface-base)]" /> : <ChefHat className="w-6 h-6 text-[var(--sr-surface-base)]" />}
          {/* Gold "new" notification dot */}
          {!isOpen && hasNew && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--sr-vendor)] rounded-full border-2 border-[#0F1117] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[var(--sr-surface-raised)] rounded-full" />
            </span>
          )}
        </span>
        {/* Desktop hover label */}
        <span className="absolute left-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--sr-surface-elevated)] border border-white/10 text-xs text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          <Sparkles className="w-3 h-3 text-[var(--sr-vendor)]" />
          Safa AI
        </span>
        {/* Mobile persistent AI badge */}
        <span className="absolute -top-1 -left-1 sm:hidden bg-[var(--sr-vendor)] text-[var(--sr-surface-base)] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#0F1117]">
          AI
        </span>
      </motion.button>

      {/* ──── Shimmer animation styles ──── */}
      <style jsx global>{`
        .shimmer-text {
          background: linear-gradient(90deg, rgba(245,196,81,0.3) 0%, rgba(16,224,122,0.6) 50%, rgba(245,196,81,0.3) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
