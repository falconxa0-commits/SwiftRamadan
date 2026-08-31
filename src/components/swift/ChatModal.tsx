'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MessageCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/use-socket';

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
  customer: { label: 'Customer', bg: 'rgba(16,224,122,0.15)', color: 'var(--sr-customer)' },
  vendor: { label: 'Vendor', bg: 'rgba(245,196,81,0.15)', color: 'var(--sr-vendor)' },
  rider: { label: 'Rider', bg: 'rgba(56,189,248,0.15)', color: 'var(--sr-rider)' },
  admin: { label: 'Admin', bg: 'rgba(167,139,250,0.15)', color: 'var(--sr-ai)' },
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
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const userName = useAppStore(s => s.userName);
  const userRole = useAppStore(s => s.userRole);
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
  const [otherTyping, setOtherTyping] = useState<{
    userId?: string;
    userName?: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // ─── Socket.io for real-time chat ───
  // Only join the room while the modal is open. The useSocket hook
  // handles join / leave automatically.
  const activeRoomId = isOpen ? roomId : undefined;
  const { socket, isConnected: socketConnected } = useSocket(activeRoomId);

  // Register identity once socket is available
  useEffect(() => {
    if (!socket || !isOpen) return;
    socket.emit('register', {
      userId: currentUserId,
      userRole: currentRole,
      userName: currentName,
      userEmail,
    });
  }, [socket, isOpen, currentUserId, currentRole, currentName, userEmail]);

  // Listen for incoming chat-message + typing events
  useEffect(() => {
    if (!socket) return;

    const onChatMessage = (msg: ChatMessage) => {
      if (!msg || msg.roomId !== roomId) return;
      setMessages((prev) => {
        // Dedupe by id (server echoes back the persisted row to all
        // room members, including the sender)
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Clear typing indicator when a message arrives
      setOtherTyping(null);
      // Mark messages from others as read (silent)
      if (msg.senderId !== currentUserId && msg.senderName !== currentName) {
        fetch('/api/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId }),
        }).catch(() => {});
      }
    };

    const onTyping = (payload: {
      roomId: string;
      userId?: string;
      userName?: string;
      isTyping: boolean;
    }) => {
      if (!payload || payload.roomId !== roomId) return;
      if (payload.userId === currentUserId) return; // ignore self
      if (payload.isTyping) {
        setOtherTyping({
          userId: payload.userId,
          userName: payload.userName,
        });
        // Clear after 3 seconds of no updates
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setOtherTyping(null);
        }, 3000);
      } else {
        setOtherTyping(null);
      }
    };

    socket.on('chat-message', onChatMessage);
    socket.on('typing', onTyping);
    return () => {
      socket.off('chat-message', onChatMessage);
      socket.off('typing', onTyping);
    };
  }, [socket, roomId, currentUserId, currentName]);

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

  // Polling fallback: every 5 seconds while open AND socket not connected
  useEffect(() => {
    if (!isOpen) return;
    if (socketConnected) {
      // Socket is live — no need to poll, but do a slow safety poll every 15s
      pollingRef.current = setInterval(() => {
        loadMessages();
      }, 15000);
    } else {
      // Socket offline — poll every 3s as before
      pollingRef.current = setInterval(() => {
        loadMessages();
      }, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [isOpen, loadMessages, socketConnected]);

  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, otherTyping]);

  const handleClose = useCallback(() => {
    setActiveModal(null);
    setDraft('');
    setOtherTyping(null);
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

    // If socket is connected, send via socket (server will persist +
    // broadcast, including echoing back to us). Otherwise fall back
    // to a direct HTTP POST.
    try {
      if (socket && socketConnected) {
        socket.emit('chat-message', {
          roomId,
          senderId: currentUserId,
          senderName: currentName,
          senderRole: currentRole,
          content,
        });
        // The server will broadcast back a chat-message event with the
        // persisted row; when we receive it, replace the optimistic one.
        // Set a timeout to remove the optimistic message if no echo
        // arrives within 4s (in which case we re-fetch via polling).
        setTimeout(() => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === optimisticId)) {
              // Still present — remove it and reload
              loadMessages();
              return prev.filter((m) => m.id !== optimisticId);
            }
            return prev;
          });
        }, 4000);
      } else {
        // HTTP fallback
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
      }
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
  }, [draft, sending, roomId, currentUserId, currentName, currentRole, toast, socket, socketConnected, loadMessages]);

  /** Emit typing events when the user types in the textarea. */
  const handleDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDraft(value);
      if (!socket || !socketConnected) return;
      // Throttle typing events to once per second
      const now = Date.now();
      if (now - lastTypingSentRef.current > 1000) {
        lastTypingSentRef.current = now;
        socket.emit('typing', {
          roomId,
          userId: currentUserId,
          userName: currentName,
          isTyping: value.trim().length > 0,
        });
      }
    },
    [socket, socketConnected, roomId, currentUserId, currentName]
  );

  /** Send a "stopped typing" event on blur / submit. */
  const emitStopTyping = useCallback(() => {
    if (!socket || !socketConnected) return;
    socket.emit('typing', {
      roomId,
      userId: currentUserId,
      userName: currentName,
      isTyping: false,
    });
  }, [socket, socketConnected, roomId, currentUserId, currentName]);

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
            className="fixed inset-0 z-[150] bg-[var(--sr-surface-base)] flex flex-col"
          >
            {/* ─── Top bar ─── */}
            <div className="glass-effect border-b border-white/5">
              <div className="h-[3px] bg-gradient-to-r from-[var(--sr-customer)] via-[var(--sr-vendor)] to-[var(--sr-ai)]" />
              <div className="flex items-center gap-3 p-3 sm:p-4">
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
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[var(--sr-customer)] border-2 border-[var(--sr-surface-base)] shadow-[0_0_8px_var(--sr-customer)]" />
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
                  <p
                    className={`text-[11px] font-medium flex items-center gap-1 ${
                      socketConnected ? 'text-[var(--sr-customer)]' : 'text-[var(--sr-error)]'
                    }`}
                  >
                    {socketConnected ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        Reconnecting…
                      </>
                    )}
                  </p>
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
                  <Loader2 className="w-6 h-6 text-[var(--sr-customer)] animate-spin" />
                  <p className="text-white/65 text-xs">Loading conversation…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="size-16 rounded-2xl bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 flex items-center justify-center mb-4">
                    <MessageCircle className="w-7 h-7 text-[var(--sr-customer)]" />
                  </div>
                  <p className="text-white font-bold text-base">No messages yet</p>
                  <p className="text-white/65 text-sm mt-1">
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
                            ? 'bg-gradient-to-br from-[var(--sr-customer)] to-[var(--sr-customer-hover)] text-[var(--sr-surface-base)] font-medium rounded-br-md'
                            : 'bg-[var(--sr-surface-raised)] border border-white/5 text-white/90 rounded-bl-md'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-white/60 text-[10px] mt-1 px-1">
                        {formatTime(m.createdAt)}
                      </span>
                    </motion.div>
                  );
                })
              )}

              {/* Typing indicator */}
              {otherTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-1.5"
                >
                  <div className="bg-[var(--sr-surface-raised)] border border-white/5 px-3.5 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-white/60"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ─── Composer ─── */}
            <div className="glass-effect border-t border-white/5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-end gap-2">
                <div className="flex-1 flex items-center rounded-2xl bg-[var(--sr-surface-raised)] border border-white/8 focus-within:border-[var(--sr-customer)]/30 transition-all">
                  <textarea
                    value={draft}
                    onChange={handleDraftChange}
                    onBlur={emitStopTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        emitStopTyping();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm px-4 py-3 focus:outline-none placeholder:text-white/60 resize-none max-h-24 custom-scrollbar"
                  />
                </div>
                <button
                  onClick={() => {
                    emitStopTyping();
                    handleSend();
                  }}
                  disabled={!draft.trim() || sending}
                  className="size-12 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--sr-customer)] to-[var(--sr-customer-hover)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100 shadow-[0_0_16px_rgba(16,224,122,0.35)]"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 text-[var(--sr-surface-base)] animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-[var(--sr-surface-base)]" strokeWidth={2.5} />
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
