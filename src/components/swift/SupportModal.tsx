'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones,
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle,
  X,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───────────────────────────────────────────────────

interface SupportMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  category: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'order', label: 'Order Issue' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'delivery', label: 'Delivery Issue' },
  { value: 'account', label: 'Account Issue' },
  { value: 'vendor', label: 'Vendor Issue' },
  { value: 'rider', label: 'Rider Issue' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-white/50' },
  { value: 'medium', label: 'Medium', color: 'text-[var(--sr-vendor)]' },
  { value: 'high', label: 'High', color: 'text-[#FB923C]' },
  { value: 'urgent', label: 'Urgent', color: 'text-[var(--sr-error)]' },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  open: { label: 'Open', bg: 'rgba(16,224,122,0.15)', color: '#10E07A' },
  in_progress: { label: 'In Progress', bg: 'rgba(245,196,81,0.15)', color: '#F5C451' },
  resolved: { label: 'Resolved', bg: 'rgba(56,189,248,0.15)', color: '#38BDF8' },
  closed: { label: 'Closed', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' },
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  general: { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA' },
  order: { bg: 'rgba(16,224,122,0.12)', color: '#10E07A' },
  payment: { bg: 'rgba(245,196,81,0.12)', color: '#F5C451' },
  delivery: { bg: 'rgba(56,189,248,0.12)', color: '#38BDF8' },
  account: { bg: 'rgba(251,113,133,0.12)', color: '#FB7185' },
  vendor: { bg: 'rgba(251,146,60,0.12)', color: '#FB923C' },
  rider: { bg: 'rgba(45,212,191,0.12)', color: '#2DD4BF' },
};

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

function getCategoryLabel(value: string): string {
  return CATEGORIES.find(c => c.value === value)?.label ?? value;
}

// ─── Component ───────────────────────────────────────────────

export default function SupportModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const { toast } = useToast();
  const isOpen = activeModal === 'support';

  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch tickets ───
  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', userId: userEmail || 'guest' }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      // silent
    }
  }, [userEmail]);

  // ─── Fetch single ticket ───
  const fetchTicket = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', userId: userEmail || 'guest', ticketId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ticket) setSelectedTicket(data.ticket);
    } catch {
      // silent
    }
  }, [userEmail]);

  // ─── Load on open ───
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchTickets().finally(() => setLoading(false));
  }, [isOpen, fetchTickets]);

  // ─── Reset on close ───
  useEffect(() => {
    if (isOpen) return;
    setActiveView('list');
    setSelectedTicket(null);
    setCategory('general');
    setSubject('');
    setMessage('');
    setPriority('medium');
  }, [isOpen]);

  // ─── Auto-scroll messages ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // ─── Handlers ───
  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, [setActiveModal]);

  const handleCreateTicket = useCallback(async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in subject and message.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: userEmail || 'guest',
          category,
          subject: subject.trim(),
          message: message.trim(),
          priority,
        }),
      });
      if (!res.ok) throw new Error('Create failed');
      const data = await res.json();
      toast({ title: 'Ticket created', description: 'Our support team will respond shortly.' });
      setActiveView('list');
      setSubject('');
      setMessage('');
      setCategory('general');
      setPriority('medium');
      fetchTickets();
    } catch {
      toast({ title: 'Error', description: 'Could not create ticket. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [subject, message, category, priority, userEmail, toast, fetchTickets]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedTicket) return;
    const text = message.trim();
    setMessage('');

    // Optimistic append
    const optimisticMsg: SupportMessage = {
      id: `local-${Date.now()}`,
      sender: 'user',
      text,
      createdAt: new Date().toISOString(),
    };
    setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          userId: userEmail || 'guest',
          ticketId: selectedTicket.id,
          message: text,
        }),
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();
      if (data.ticket) {
        setSelectedTicket(data.ticket);
      } else {
        // Replace optimistic with server response
        setSelectedTicket(prev => prev
          ? { ...prev, messages: prev.messages.map(m => m.id === optimisticMsg.id ? { ...m, id: data.message?.id || optimisticMsg.id } : m) }
          : prev
        );
      }
    } catch {
      // Remove optimistic message
      setSelectedTicket(prev => prev
        ? { ...prev, messages: prev.messages.filter(m => m.id !== optimisticMsg.id) }
        : prev
      );
      setMessage(text);
      toast({ title: 'Message not sent', description: 'Please try again.', variant: 'destructive' });
    }
  }, [message, selectedTicket, userEmail, toast]);

  const handleCloseTicket = useCallback(async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          userId: userEmail || 'guest',
          ticketId: selectedTicket.id,
        }),
      });
      if (!res.ok) throw new Error('Close failed');
      toast({ title: 'Ticket closed', description: 'This support ticket has been closed.' });
      fetchTickets();
      fetchTicket(selectedTicket.id);
    } catch {
      toast({ title: 'Error', description: 'Could not close ticket.', variant: 'destructive' });
    }
  }, [selectedTicket, userEmail, toast, fetchTickets, fetchTicket]);

  const openTicketDetail = useCallback(async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setActiveView('detail');
    await fetchTicket(ticket.id);
  }, [fetchTicket]);

  // ─── Render ───
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]"
            onClick={handleClose}
          />

          {/* Slide-up Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] flex flex-col"
          >
            {/* ─── Sticky Header ─── */}
            <div className="glass-effect border-b border-white/5 shrink-0">
              <div className="h-[3px] bg-gradient-to-r from-[var(--sr-customer)] via-[var(--sr-vendor)] to-[var(--sr-ai)]" />
              <div className="flex items-center gap-3 p-3 sm:p-4">
                {activeView === 'detail' ? (
                  <button
                    onClick={() => { setActiveView('list'); setSelectedTicket(null); }}
                    aria-label="Back to list"
                    className="size-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                  >
                    <ChevronRight className="w-5 h-5 text-white rotate-180" />
                  </button>
                ) : (
                  <div className="size-10 flex items-center justify-center rounded-2xl bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/30 shrink-0">
                    <Headphones className="w-5 h-5 text-[var(--sr-customer)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-base tracking-tight truncate">
                    {activeView === 'detail' ? selectedTicket?.subject ?? 'Ticket Details' : 'Support Center'}
                  </h2>
                  <p className="text-white/65 text-[11px]">
                    {activeView === 'detail'
                      ? `${getCategoryLabel(selectedTicket?.category ?? '')} · ${STATUS_CONFIG[selectedTicket?.status ?? 'open']?.label ?? ''}`
                      : 'Get help & submit tickets'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close support"
                  className="size-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* ─── Views ─── */}
            <AnimatePresence mode="wait">
              {/* ═══ LIST VIEW ═══ */}
              {activeView === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Create Ticket Button */}
                  <div className="px-4 pt-4 pb-2 shrink-0">
                    <button
                      onClick={() => setActiveView('create')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[var(--sr-customer)] to-[#0FB463] text-[var(--sr-surface-base)] font-bold text-sm active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(16,224,122,0.25)]"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      Create Ticket
                    </button>
                  </div>

                  {/* Tickets List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-3">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-2">
                        <Loader2 className="w-6 h-6 text-[var(--sr-customer)] animate-spin" />
                        <p className="text-white/65 text-xs">Loading tickets…</p>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="size-16 rounded-2xl bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 flex items-center justify-center mb-4">
                          <Headphones className="w-7 h-7 text-[var(--sr-customer)]" />
                        </div>
                        <p className="text-white font-bold text-base">No support tickets</p>
                        <p className="text-white/65 text-sm mt-1 max-w-[240px]">
                          Create a ticket and our team will get back to you quickly.
                        </p>
                      </div>
                    ) : (
                      tickets.map((ticket, i) => {
                        const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                        const catColor = CATEGORY_COLORS[ticket.category] ?? CATEGORY_COLORS.general;
                        const lastMsg = ticket.messages[ticket.messages.length - 1];
                        return (
                          <motion.button
                            key={ticket.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.04, 0.3) }}
                            onClick={() => openTicketDetail(ticket)}
                            className="w-full text-left glass-card rounded-2xl border border-white/[0.06] p-3 sm:p-4 hover:border-white/10 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 flex-1">
                                {ticket.subject}
                              </h3>
                              <ChevronRight className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span
                                className="text-[10px] font-bold px-2 h-5 rounded-full flex items-center"
                                style={{ backgroundColor: catColor.bg, color: catColor.color }}
                              >
                                {getCategoryLabel(ticket.category)}
                              </span>
                              <span
                                className="text-[10px] font-bold px-2 h-5 rounded-full flex items-center gap-1"
                                style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                              >
                                {ticket.status === 'open' && <Clock className="w-2.5 h-2.5" />}
                                {(ticket.status === 'resolved' || ticket.status === 'closed') && <CheckCircle className="w-2.5 h-2.5" />}
                                {statusCfg.label}
                              </span>
                            </div>
                            {lastMsg && (
                              <p className="text-white/65 text-xs line-clamp-1 mb-1">
                                {lastMsg.text}
                              </p>
                            )}
                            <p className="text-white/25 text-[10px]">
                              {formatDateTime(ticket.updatedAt || ticket.createdAt)}
                            </p>
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ CREATE VIEW ═══ */}
              {activeView === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4"
                >
                  {/* Category */}
                  <div>
                    <label htmlFor="support-category" className="text-white/50 text-xs font-bold mb-1.5 block">Category</label>
                    <select
                      id="support-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value} className="bg-[var(--sr-surface-raised)]">{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-white/50 text-xs font-bold mb-1.5 block">Priority</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {PRIORITIES.map(p => (
                        <button
                          key={p.value}
                          onClick={() => setPriority(p.value)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            priority === p.value
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-white/[0.02] border-white/5 text-white/65 hover:text-white/60'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="support-subject" className="text-white/50 text-xs font-bold mb-1.5 block">Subject</label>
                    <input
                      id="support-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors placeholder:text-white/25"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="support-message" className="text-white/50 text-xs font-bold mb-1.5 block">Message</label>
                    <textarea
                      id="support-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue in detail…"
                      rows={5}
                      className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors placeholder:text-white/25 resize-none custom-scrollbar"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleCreateTicket}
                    disabled={submitting || !subject.trim() || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--sr-customer)] to-[#0FB463] text-[var(--sr-surface-base)] font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100 shadow-[0_0_20px_rgba(16,224,122,0.25)]"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" strokeWidth={2.5} />
                    )}
                    {submitting ? 'Submitting…' : 'Submit Ticket'}
                  </button>

                  <button
                    onClick={() => setActiveView('list')}
                    className="w-full py-3 rounded-2xl border border-white/5 text-white/50 text-sm font-bold hover:text-white/70 hover:border-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}

              {/* ═══ DETAIL VIEW ═══ */}
              {activeView === 'detail' && selectedTicket && (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Ticket Info Header */}
                  <div className="px-4 pt-4 pb-3 shrink-0">
                    <div className="glass-card rounded-2xl border border-white/[0.06] p-3 sm:p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold px-2 h-5 rounded-full flex items-center"
                          style={{
                            backgroundColor: CATEGORY_COLORS[selectedTicket.category]?.bg ?? CATEGORY_COLORS.general.bg,
                            color: CATEGORY_COLORS[selectedTicket.category]?.color ?? CATEGORY_COLORS.general.color,
                          }}
                        >
                          {getCategoryLabel(selectedTicket.category)}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 h-5 rounded-full flex items-center gap-1"
                          style={{
                            backgroundColor: STATUS_CONFIG[selectedTicket.status]?.bg ?? STATUS_CONFIG.open.bg,
                            color: STATUS_CONFIG[selectedTicket.status]?.color ?? STATUS_CONFIG.open.color,
                          }}
                        >
                          {selectedTicket.status === 'open' && <Clock className="w-2.5 h-2.5" />}
                          {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && <CheckCircle className="w-2.5 h-2.5" />}
                          {STATUS_CONFIG[selectedTicket.status]?.label ?? 'Open'}
                        </span>
                        <span className="text-[10px] font-bold px-2 h-5 rounded-full flex items-center bg-white/5 text-white/65">
                          {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)} Priority
                        </span>
                      </div>
                      <p className="text-white/60 text-[10px]">
                        Created {formatDateTime(selectedTicket.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 max-h-96 overflow-y-auto custom-scrollbar px-4 space-y-3">
                    {selectedTicket.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare className="w-6 h-6 text-white/20 mb-2" />
                        <p className="text-white/65 text-xs">No messages yet</p>
                      </div>
                    ) : (
                      selectedTicket.messages.map((msg, i) => {
                        const isUser = msg.sender === 'user';
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.03, 0.2) }}
                            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                          >
                            <div
                              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                                isUser
                                  ? 'bg-[var(--sr-surface-raised)] border border-white/5 text-white/90 rounded-bl-md'
                                  : 'bg-gradient-to-br from-[var(--sr-customer)] to-[#0FB463] text-[var(--sr-surface-base)] font-medium rounded-br-md'
                              }`}
                            >
                              {isUser && (
                                <span className="text-[10px] font-bold text-white/60 block mb-1">You</span>
                              )}
                              {!isUser && (
                                <span className="text-[10px] font-bold text-[var(--sr-surface-base)]/50 block mb-1">Support</span>
                              )}
                              {msg.text}
                            </div>
                            <span className="text-white/25 text-[10px] mt-1 px-1">
                              {formatTime(msg.createdAt)}
                            </span>
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                    <div className="glass-effect border-t border-white/5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center rounded-2xl bg-[var(--sr-surface-raised)] border border-white/8 focus-within:border-[var(--sr-customer)]/30 transition-all">
                          <label htmlFor="support-chat-message" className="sr-only">Type a message</label>
                          <input
                            id="support-chat-message"
                            ref={messageInputRef}
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Type a message…"
                            className="flex-1 bg-transparent text-white text-sm px-4 py-3 focus:outline-none placeholder:text-white/60"
                          />
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={!message.trim()}
                          className="size-12 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--sr-customer)] to-[#0FB463] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100 shadow-[0_0_16px_rgba(16,224,122,0.35)]"
                          aria-label="Send message"
                        >
                          <Send className="w-5 h-5 text-[var(--sr-surface-base)]" strokeWidth={2.5} />
                        </button>
                      </div>
                      <button
                        onClick={handleCloseTicket}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/65 text-xs font-bold hover:text-white/60 hover:border-white/10 transition-colors"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Close Ticket
                      </button>
                    </div>
                  )}

                  {/* Ticket closed notice */}
                  {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                    <div className="px-4 py-3 border-t border-white/5 shrink-0">
                      <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl p-3">
                        <CheckCircle className="w-4 h-4 text-[var(--sr-rider)] shrink-0" />
                        <p className="text-white/65 text-xs">
                          This ticket is {selectedTicket.status}. Create a new ticket if you need more help.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
