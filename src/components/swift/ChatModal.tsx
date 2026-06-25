'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────
// Lightweight chat context — set externally before opening the modal.
// Usage:
//   setChatContext({ orderId: 'SWR-XXXX', recipientName: 'Tunde R.' });
//   setActiveModal('chat');
// ─────────────────────────────────────────────────────────────
export interface ChatContext {
  roomId?: string;
  orderId?: string;
  recipientId?: string;
  recipientName?: string;
  recipientRole?: string;
}

let _chatContext: ChatContext = {};

export function setChatContext(ctx: ChatContext) {
  _chatContext = { ...ctx };
}

export function getChatContext(): ChatContext {
  return _chatContext;
}

// ─────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  roomId: string;
  senderId?: string | null;
  senderName: string;
  senderRole: string;
  content: string;
  read: boolean;
  createdAt: string;
}

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  customer: { label: 'Customer', bg: 'rgba(16,224,122,0.15)', color: '#10E07A' },
  vendor: { label: 'Vendor', bg: 'rgba(245,196,81,0.15)', color: '#F5C451' },
  rider: { label: 'Rider', bg: 'rgba(56,189,248,0.15)', color: '#38BDF8' },
  admin: { label: 'Admin', bg: 'rgba(167,139,250,0.15)', color: '#A78BFA' },
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function buildRoomId(ctx: ChatContext, currentUserId: string): string {
  if (ctx.roomId) return ctx.roomId;
  if (ctx.orderId) return `order-${ctx.orderId}`;
  if (ctx.recipientId && currentUserId) {
    // Deterministic room id for DMs (sorted ids)
    const [a, b] = [currentUserId, ctx.recipientId].sort();
    return `dm-${a}-${b}`;
  }
  return 'general';
}

export default function ChatModal() {
  const { activeModal, setActiveModal, userEmail, userName, userRole } = useAppStore();
  const { toast } = useToast();

  const isOpen = activeModal === 'chat';
  const ctx = getChatContext();

  const currentUserId = userEmail || 'guest';
  const currentName = userName || 'Guest';
  const currentRole = userRole || 'customer';

  const roomId = buildRoomId(ctx, currentUserId);
  const recipientName = ctx.recipientName || 'Conversation';
  const recipientRole = ctx.recipientRole || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Load messages (called from effect, never setState in effect body)
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?roomId=${encodeURIComponent(roomId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: ChatMessage[] = data.messages || [];
      // Detect if there are new messages since last fetch
      const newest = list[list.length - 1];
      const hasNew = newest && newest.id !== lastMessageIdRef.current;
      setMessages(list);
      if (newest) lastMessageIdRef.current = newest.id;

      // Mark messages from others as read
      if (hasNew || list.some((m) => !m.read && m.senderId !== currentUserId && m.senderName !== currentName)) {
        fetch('/api/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId }),
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, [roomId, currentUserId, currentName]);

  // Initial load when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    lastMessageIdRef.current = null;
    loadMessages().finally(() => setLoading(false));
  }, [isOpen, loadMessages]);

  // Polling: every 3 seconds while open
  useEffect(() => {
    if (!isOpen) return;
    pollingRef.current = setInterval(() => {
      loadMessages();
    }, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [isOpen, loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleClose = useCallback(() => {
    setActiveModal(null);
    setDraft('');
  }, [setActiveModal]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;

    // Optimistic append
    const optimisticId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      roomId,
      senderId: currentUserId,
      senderName: currentName,
      senderRole: currentRole,
      content,
      read: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          senderId: currentUserId,
          senderName: currentName,
          senderRole: currentRole,
          content,
        }),
      });
      if (!res.ok) throw new Error('send failed');
      const data = await res.json();
      // Replace optimistic with server message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? (data.message as ChatMessage) : m))
      );
    } catch {
      // Remove optimistic message and notify
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(content); // restore draft
      toast({
        title: 'Message not sent',
        description: 'Network issue — please try again.',
      });
    } finally {
      setSending(false);
    }
  }, [draft, sending, roomId, currentUserId, currentName, currentRole, toast]);

  const recipientBadge = recipientRole ? ROLE_BADGES[recipientRole] : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140]"
            onClick={handleClose}
          />

          {/* Full-screen chat modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed inset-0 z-[150] bg-[#0B0D14] flex flex-col"
          >
            {/* ─── Top bar ─── */}
            <div className="glass-effect border-b border-white/5">
              <div className="h-[3px] bg-gradient-to-r from-[#10E07A] via-[#F5C451] to-[#A78BFA]" />
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={handleClose}
                  aria-label="Back"
                  className="size-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>

                <div className="relative shrink-0">
                  <div
                    className="size-11 rounded-2xl flex items-center justify-center border border-white/10 font-black text-white text-base"
                    style={{ backgroundColor: 'rgba(16,224,122,0.15)' }}
                  >
                    {recipientName.charAt(0).toUpperCase()}
                  </div>
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#10E07A] border-2 border-[#0B0D14] shadow-[0_0_8px_#10E07A]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold text-base leading-tight truncate">
                      {recipientName}
                    </h2>
                    {recipientBadge && (
                      <span
                        className="shrink-0 text-[10px] font-bold px-2 h-4 rounded-full flex items-center"
                        style={{ backgroundColor: recipientBadge.bg, color: recipientBadge.color }}
                      >
                        {recipientBadge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[#10E07A] text-[11px] font-medium">Online</p>
                </div>
              </div>
            </div>

            {/* ─── Messages ─── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="w-6 h-6 text-[#10E07A] animate-spin" />
                  <p className="text-white/40 text-xs">Loading conversation…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="size-16 rounded-2xl bg-[#10E07A]/10 border border-[#10E07A]/20 flex items-center justify-center mb-4">
                    <MessageCircle className="w-7 h-7 text-[#10E07A]" />
                  </div>
                  <p className="text-white font-bold text-base">No messages yet</p>
                  <p className="text-white/40 text-sm mt-1">
                    Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === currentUserId || m.senderName === currentName;
                  const badge = ROLE_BADGES[m.senderRole] || ROLE_BADGES.customer;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                    >
                      {!mine && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-white/60 text-[11px] font-bold">{m.senderName}</span>
                          <span
                            className="text-[9px] font-bold px-1.5 h-3.5 rounded-full flex items-center"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                          mine
                            ? 'bg-gradient-to-br from-[#10E07A] to-[#0FB463] text-[#04140C] font-medium rounded-br-md'
                            : 'bg-[#0F1118] border border-white/5 text-white/90 rounded-bl-md'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-white/30 text-[10px] mt-1 px-1">
                        {formatTime(m.createdAt)}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* ─── Composer ─── */}
            <div className="glass-effect border-t border-white/5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-end gap-2">
                <div className="flex-1 flex items-center rounded-2xl bg-[#0F1118] border border-white/8 focus-within:border-[#10E07A]/30 transition-all">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm px-4 py-3 focus:outline-none placeholder:text-white/30 resize-none max-h-24 custom-scrollbar"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="size-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#10E07A] to-[#0FB463] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100 shadow-[0_0_16px_rgba(16,224,122,0.35)]"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 text-[#04140C] animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-[#04140C]" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
