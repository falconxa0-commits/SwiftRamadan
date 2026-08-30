'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Sparkles, ChevronRight, Wrench, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';

/* ──────────────────── Types ──────────────────── */

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  greeting: string;
  quickActions: { label: string; prompt: string; icon?: string }[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId: string;
  toolCalls?: { name: string; arguments: Record<string, unknown> }[];
  timestamp: number;
}

/* ──────────────────── Agent Color Map ──────────────────── */
// Maps agent IDs to their accent colors for visual distinction
const AGENT_ACCENTS: Record<string, { bg: string; text: string; border: string; glow: string; dot: string }> = {
  support:   { bg: 'bg-[#38BDF8]/20', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30', glow: 'shadow-[#38BDF8]/20', dot: 'bg-[#38BDF8]' },
  marketing: { bg: 'bg-[#A78BFA]/20', text: 'text-[#A78BFA]', border: 'border-[#A78BFA]/30', glow: 'shadow-[#A78BFA]/20', dot: 'bg-[#A78BFA]' },
  chef:      { bg: 'bg-[#FB923C]/20', text: 'text-[#FB923C]', border: 'border-[#FB923C]/30', glow: 'shadow-[#FB923C]/20', dot: 'bg-[#FB923C]' },
  rider:     { bg: 'bg-[#22D3EE]/20', text: 'text-[#22D3EE]', border: 'border-[#22D3EE]/30', glow: 'shadow-[#22D3EE]/20', dot: 'bg-[#22D3EE]' },
  vendor:    { bg: 'bg-[#F5C451]/20', text: 'text-[#F5C451]', border: 'border-[#F5C451]/30', glow: 'shadow-[#F5C451]/20', dot: 'bg-[#F5C451]' },
  analytics: { bg: 'bg-[#10E07A]/20', text: 'text-[#10E07A]', border: 'border-[#10E07A]/30', glow: 'shadow-[#10E07A]/20', dot: 'bg-[#10E07A]' },
};

const DEFAULT_ACCENT = AGENT_ACCENTS.support;

/* ──────────────────── Fallback Agents ──────────────────── */
// Used when the API is unreachable so the UI still renders something useful
const FALLBACK_AGENTS: AgentInfo[] = [
  {
    id: 'support',
    name: 'Safa Support',
    description: 'Customer support & order help',
    icon: '🎧',
    color: 'text-blue-400',
    greeting: "Salam! 🎧 I'm Safa Support. How can I help you today?",
    quickActions: [
      { label: 'Track my order', prompt: 'Where is my latest order?' },
      { label: 'Request refund', prompt: 'I need a refund for my last order' },
      { label: 'Delivery issue', prompt: 'My delivery is late' },
      { label: 'Active promos', prompt: 'What promos are available?' },
    ],
  },
  {
    id: 'chef',
    name: 'Safa Chef',
    description: 'Recipes & meal planning',
    icon: '👨🏾‍🍳',
    color: 'text-orange-400',
    greeting: "Salam! 👨🏾‍🍳 Chef Safa here — what are we cooking today?",
    quickActions: [
      { label: 'Iftar recipe', prompt: 'Suggest an easy iftar meal' },
      { label: 'Sahur ideas', prompt: 'What should I eat for sahur?' },
      { label: 'Quick snacks', prompt: '5 quick Nigerian snacks' },
      { label: 'Meal plan', prompt: 'Create a 3-day iftar meal plan' },
    ],
  },
  {
    id: 'marketing',
    name: 'Safa Marketing',
    description: 'Campaigns & content creation',
    icon: '📣',
    color: 'text-purple-400',
    greeting: "Hey! 📣 Safa Marketing — your creative partner. What are we launching?",
    quickActions: [
      { label: 'Ramadan campaign', prompt: 'Create a Ramadan marketing campaign' },
      { label: 'Social media posts', prompt: 'Write 5 Instagram posts for iftar deals' },
      { label: 'Push notifications', prompt: 'Write push notification copy for a flash sale' },
      { label: 'Content calendar', prompt: 'Create a 7-day content calendar' },
    ],
  },
  {
    id: 'vendor',
    name: 'Safa Vendor',
    description: 'Menu & business insights',
    icon: '🏪',
    color: 'text-yellow-400',
    greeting: "Hello boss! 🏪 Safa Vendor — your business partner. What do you need?",
    quickActions: [
      { label: 'Menu tips', prompt: 'How can I optimize my menu for Ramadan?' },
      { label: 'Stock check', prompt: 'Check my stock levels' },
      { label: 'Pricing help', prompt: 'Help me set competitive prices' },
      { label: 'Growth tips', prompt: 'How can I get more orders?' },
    ],
  },
  {
    id: 'analytics',
    name: 'Safa Analytics',
    description: 'Business intelligence & trends',
    icon: '📊',
    color: 'text-green-400',
    greeting: "Salam! 📊 Safa Analytics — your numbers navigator. Let's look at the data.",
    quickActions: [
      { label: 'Performance summary', prompt: 'Give me my business performance summary' },
      { label: 'Revenue trends', prompt: 'How is my revenue trending?' },
      { label: 'Product analysis', prompt: 'Which products are performing best?' },
      { label: 'Demand forecast', prompt: 'What should I expect for demand next week?' },
    ],
  },
  {
    id: 'rider',
    name: 'Safa Rider',
    description: 'Route optimization & earnings',
    icon: '🏍️',
    color: 'text-cyan-400',
    greeting: "Hey rider! 🏍️ Safa Rider here — your partner on the road. How can I help?",
    quickActions: [
      { label: 'Earnings tips', prompt: 'How can I earn more during Ramadan?' },
      { label: 'Best areas', prompt: 'Which areas have the most deliveries?' },
      { label: 'Route help', prompt: 'How do I optimize my routes?' },
      { label: 'My earnings', prompt: 'Show me my earnings breakdown' },
    ],
  },
];

/* ──────────────────── Component ──────────────────── */

export default function SafaAgentHub() {
  const activeModal = useAppStore((s) => s.activeModal);
  const userName = useAppStore((s) => s.userName);
  const userRole = useAppStore((s) => s.userRole);
  const swiftPoints = useAppStore((s) => s.swiftPoints);
  const loyaltyTier = useAppStore((s) => s.loyaltyTier);
  const cartCount = useAppStore((s) => s.cartCount);
  const cartItems = useAppStore((s) => s.cartItems);
  const orders = useAppStore((s) => s.orders);
  const customerDietaryPrefs = useAppStore((s) => s.customerDietaryPrefs);

  const isOpen = activeModal === 'agent-hub';

  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>('support');
  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentList, setShowAgentList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  /* ── Load agents from API ── */
  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agent');
      if (res.ok) {
        const data = await res.json();
        const loadedAgents = data.agents || [];
        if (loadedAgents.length > 0) {
          setAgents(loadedAgents);
          // Set default active agent to first available
          if (!loadedAgents.find((a: AgentInfo) => a.id === activeAgentId)) {
            setActiveAgentId(loadedAgents[0].id);
          }
          return;
        }
      }
    } catch {
      // Network error — use fallback
    }
    // Fallback: filter by role locally
    const roleFiltered = FALLBACK_AGENTS.filter(a => {
      if (userRole === 'customer') return ['support', 'chef', 'marketing'].includes(a.id);
      if (userRole === 'vendor') return ['support', 'marketing', 'vendor', 'analytics'].includes(a.id);
      if (userRole === 'rider') return ['support', 'rider'].includes(a.id);
      return true;
    });
    setAgents(roleFiltered);
    if (!roleFiltered.find(a => a.id === activeAgentId) && roleFiltered.length > 0) {
      setActiveAgentId(roleFiltered[0].id);
    }
  }, [userRole, activeAgentId]);

  /* ── Load agents on open ── */
  useEffect(() => {
    if (isOpen) {
      loadAgents();
      const timer = setTimeout(() => inputRef.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadAgents]);

  /* ── Auto-scroll to bottom ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesByAgent, activeAgentId, isLoading, scrollToBottom]);

  /* ── Escape key to close ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useAppStore.getState().setActiveModal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  /* ── Derived state ── */
  const activeAgent = agents.find(a => a.id === activeAgentId);
  const currentMessages = messagesByAgent[activeAgentId] || [];
  const accent = activeAgentId ? (AGENT_ACCENTS[activeAgentId] || DEFAULT_ACCENT) : DEFAULT_ACCENT;

  /* ── Send message ── */
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text.trim(),
      agentId: activeAgentId,
      timestamp: Date.now(),
    };

    // Optimistically add user message
    setMessagesByAgent(prev => ({
      ...prev,
      [activeAgentId]: [...(prev[activeAgentId] || []), userMsg],
    }));
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context (last 10 messages)
      const history = (messagesByAgent[activeAgentId] || [])
        .slice(-10)
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: activeAgentId,
          message: text.trim(),
          messages: history,
          context: {
            userName,
            swiftPoints,
            loyaltyTier,
            cartCount,
            cartItems: cartItems.map(ci => ({ name: ci.name, qty: ci.quantity, price: ci.price })),
            orders: orders.slice(0, 5).map(o => ({ id: o.id, item: o.item, status: o.status })),
            dietaryPrefs: customerDietaryPrefs,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.message || "I'm here to help! Could you tell me more?",
          agentId: activeAgentId,
          toolCalls: data.toolCalls,
          timestamp: Date.now(),
        };
        setMessagesByAgent(prev => ({
          ...prev,
          [activeAgentId]: [...(prev[activeAgentId] || []), assistantMsg],
        }));
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg: Message = {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: errorData.error || 'Sorry, I encountered an error. Please try again.',
          agentId: activeAgentId,
          timestamp: Date.now(),
        };
        setMessagesByAgent(prev => ({
          ...prev,
          [activeAgentId]: [...(prev[activeAgentId] || []), errorMsg],
        }));
      }
    } catch {
      const errorMsg: Message = {
        id: `${Date.now()}-network`,
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.',
        agentId: activeAgentId,
        timestamp: Date.now(),
      };
      setMessagesByAgent(prev => ({
        ...prev,
        [activeAgentId]: [...(prev[activeAgentId] || []), errorMsg],
      }));
    }

    setIsLoading(false);
    // Re-focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  /* ── Switch agent ── */
  const switchAgent = (agentId: string) => {
    if (agentId === activeAgentId) {
      setShowAgentList(false);
      return;
    }
    setActiveAgentId(agentId);
    setShowAgentList(false);
    // Add greeting if first time switching to this agent
    if (!messagesByAgent[agentId]?.length) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        setMessagesByAgent(prev => ({
          ...prev,
          [agentId]: [{
            id: `greeting-${agentId}`,
            role: 'assistant',
            content: agent.greeting,
            agentId,
            timestamp: Date.now(),
          }],
        }));
      }
    }
    // Focus input after switch
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  /* ── Handle quick action ── */
  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  /* ── Close modal ── */
  const closeModal = () => {
    useAppStore.getState().setActiveModal(null);
  };

  /* ── Format tool call name ── */
  const formatToolName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  /* ── Count unread messages per agent ── */
  const getAgentUnread = (agentId: string) => {
    const msgs = messagesByAgent[agentId] || [];
    if (msgs.length === 0) return 0;
    // Show badge if there are messages user hasn't seen (simple: if last message is from assistant)
    return msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant' ? 1 : 0;
  };

  /* ══════════════════════ RENDER ══════════════════════ */

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      >
        {/* ─── Backdrop ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        />

        {/* ─── Main Panel ─── */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg h-[90vh] sm:h-[80vh] bg-[#0a0b10] border border-white/10 rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Gradient accent ring based on active agent */}
          <div className={`pointer-events-none absolute inset-0 rounded-t-2xl sm:rounded-2xl p-px bg-gradient-to-br from-[#10E07A]/30 via-transparent to-[${activeAgent?.icon === '🎧' ? '#38BDF8' : '#F5C451'}]/30 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] opacity-50`} />

          {/* ═══════ Header ═══════ */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0B0D14]/90 backdrop-blur-md shrink-0">
            <button
              onClick={() => setShowAgentList(!showAgentList)}
              className="flex items-center gap-2.5 flex-1 min-w-0 group"
            >
              {/* Agent avatar */}
              <div className={`w-9 h-9 rounded-full ${accent.bg} flex items-center justify-center shrink-0 transition-all`}>
                <span className="text-lg">{activeAgent?.icon || '🤖'}</span>
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-white truncate">{activeAgent?.name || 'Safa AI'}</h3>
                  <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#10E07A]/15 text-[#10E07A]">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                </div>
                <p className="text-[10px] text-white/65 truncate">{activeAgent?.description}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/65 transition-transform shrink-0 ${showAgentList ? 'rotate-90' : ''}`} />
            </button>

            {/* Online indicator */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#10E07A]/10">
              <span className="w-1.5 h-1.5 bg-[#10E07A] rounded-full animate-pulse" />
              <span className="text-[9px] text-[#10E07A] font-medium">Online</span>
            </div>

            {/* Close button */}
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close agent hub"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* ═══════ Agent Selector (collapsible) ═══════ */}
          <AnimatePresence>
            {showAgentList && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-white/10 shrink-0"
              >
                <div className="p-3 space-y-2">
                  <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold px-1">Choose an Agent</p>
                  <div className="flex flex-wrap gap-2">
                    {agents.map(agent => {
                      const isActive = activeAgentId === agent.id;
                      const agentAccent = AGENT_ACCENTS[agent.id] || DEFAULT_ACCENT;
                      const unread = getAgentUnread(agent.id);
                      return (
                        <button
                          key={agent.id}
                          onClick={() => switchAgent(agent.id)}
                          className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? `${agentAccent.bg} ${agentAccent.text} border ${agentAccent.border} shadow-lg ${agentAccent.glow}`
                              : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="text-base">{agent.icon}</span>
                          <span>{agent.name}</span>
                          {/* Unread badge */}
                          {unread > 0 && !isActive && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10E07A] rounded-full border border-[#0a0b10]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════ Messages Area ═══════ */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
          >
            {/* Empty state — agent welcome */}
            {currentMessages.length === 0 && activeAgent && (
              <div className="text-center py-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className={`w-16 h-16 rounded-2xl ${accent.bg} flex items-center justify-center mx-auto mb-4`}
                >
                  <span className="text-3xl">{activeAgent.icon}</span>
                </motion.div>
                <h3 className="text-lg font-semibold text-white">{activeAgent.name}</h3>
                <p className="text-sm text-white/50 mt-1 max-w-[260px] mx-auto">{activeAgent.description}</p>
                <p className="text-xs text-white/60 mt-3">Send a message or try a quick action below</p>
              </div>
            )}

            {/* Message list */}
            {currentMessages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot avatar */}
                {msg.role === 'assistant' && (
                  <div className={`w-7 h-7 rounded-full ${accent.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Bot className={`w-3.5 h-3.5 ${accent.text}`} />
                  </div>
                )}

                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  {/* Message bubble */}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#10E07A] text-black font-medium rounded-br-md'
                      : `bg-white/[0.06] text-white/90 rounded-bl-md border-l-2 ${accent.border}`
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{line}</p>
                    ))}
                  </div>

                  {/* Tool call badges */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {msg.toolCalls.map((tc, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${accent.bg} text-[10px] ${accent.text} font-medium`}
                        >
                          <Wrench className="w-2.5 h-2.5" />
                          {formatToolName(tc.name)}
                          {/* Show key argument if available */}
                          {tc.arguments && Object.keys(tc.arguments).length > 0 && (
                            <span className="opacity-60">
                              {(() => {
                                const firstKey = Object.keys(tc.arguments)[0];
                                const firstVal = tc.arguments[firstKey];
                                if (typeof firstVal === 'string' && firstVal.length < 20) return `: ${firstVal}`;
                                if (typeof firstVal === 'number') return `: ${firstVal}`;
                                return '';
                              })()}
                            </span>
                          )}
                        </motion.span>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-[9px] text-white/20 mt-0.5 block">
                    {new Date(msg.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* User avatar */}
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white/60" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading / thinking indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className={`w-7 h-7 rounded-full ${accent.bg} flex items-center justify-center shrink-0`}>
                  <Bot className={`w-3.5 h-3.5 ${accent.text}`} />
                </div>
                <div className="bg-white/[0.06] rounded-2xl rounded-bl-md border-l-2 border-white/10 px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className={`w-2 h-2 rounded-full ${accent.dot} animate-bounce`} style={{ animationDelay: '0ms' }} />
                    <div className={`w-2 h-2 rounded-full ${accent.dot} animate-bounce`} style={{ animationDelay: '150ms' }} />
                    <div className={`w-2 h-2 rounded-full ${accent.dot} animate-bounce`} style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ═══════ Quick Actions ═══════ */}
          <AnimatePresence>
            {activeAgent && !isLoading && currentMessages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2 shrink-0 overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5">
                  {activeAgent.quickActions.slice(0, 4).map((action, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
                    >
                      <Zap className="w-3 h-3 opacity-50" />
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════ Input Bar ═══════ */}
          <div className="px-4 py-3 border-t border-white/10 bg-[#0B0D14]/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              {/* Agent switcher shortcut */}
              {agents.length > 1 && (
                <button
                  onClick={() => setShowAgentList(true)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Switch agent"
                  title="Switch agent"
                >
                  <span className="text-sm">{activeAgent?.icon || '🤖'}</span>
                </button>
              )}

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={`Ask ${activeAgent?.name || 'Safa'}...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#10E07A]/50 focus:ring-1 focus:ring-[#10E07A]/20 transition-all"
                disabled={isLoading}
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#10E07A] text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#10E07A]/80 active:scale-95 transition-all shrink-0"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
