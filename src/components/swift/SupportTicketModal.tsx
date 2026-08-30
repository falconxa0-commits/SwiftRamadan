'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageSquare,
  ChevronLeft,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Headphones,
  Package,
  CreditCard,
  Truck,
  User,
  HelpCircle,
} from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface TicketMessage {
  id: string;
  senderId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

const CATEGORIES = [
  { value: 'order', label: 'Order Issue', icon: Package, color: '#F5C451' },
  { value: 'payment', label: 'Payment', icon: CreditCard, color: '#10E07A' },
  { value: 'delivery', label: 'Delivery', icon: Truck, color: '#38BDF8' },
  { value: 'account', label: 'Account', icon: User, color: '#A78BFA' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: '#9CA3AF' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Open', color: '#38BDF8', bgColor: 'rgba(56,189,248,0.12)', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: '#F5C451', bgColor: 'rgba(245,196,81,0.12)', icon: Clock },
  resolved: { label: 'Resolved', color: '#10E07A', bgColor: 'rgba(16,224,122,0.12)', icon: CheckCircle2 },
  closed: { label: 'Closed', color: '#9CA3AF', bgColor: 'rgba(156,163,175,0.12)', icon: CheckCircle2 },
};

export default function SupportTicketModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const { toast } = useToast();
  const isOpen = activeModal === 'support';

  const [view, setView] = useState<'list' | 'create' | 'conversation'>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Create form
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState('');

  const fetchTickets = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/support?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/support?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success) {
        const ticket = data.tickets.find((t: SupportTicket) => t.id === ticketId);
        if (ticket) {
          setSelectedTicket(ticket);
          setMessages(ticket.messages || []);
        }
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchTickets();
      setView('list');
      setSelectedTicket(null);
    }
  }, [isOpen, userEmail, fetchTickets]);

  const handleCreateTicket = async () => {
    if (!userEmail || !category || !subject || !message) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, category, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Ticket created',
          description: 'Our support team will respond shortly.',
        });
        setCategory('');
        setSubject('');
        setMessage('');
        fetchTickets();
        setView('list');
      } else {
        toast({
          title: 'Failed to create ticket',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !userEmail || !replyText.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          ticketId: selectedTicket.id,
          email: userEmail,
          message: replyText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        fetchMessages(selectedTicket.id);
      } else {
        toast({
          title: 'Failed to send',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setMessages(ticket.messages || []);
    setView('conversation');
  };

  const handleClose = () => {
    setActiveModal(null);
    setView('list');
    setSelectedTicket(null);
    setCategory('');
    setSubject('');
    setMessage('');
    setReplyText('');
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
    const Icon = config.icon;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{
          color: config.color,
          backgroundColor: config.bgColor,
        }}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getCategoryIcon = (cat: string) => {
    const config = CATEGORIES.find(c => c.value === cat);
    return config || CATEGORIES[4];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md max-h-[85vh] glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto"
              style={{ background: 'linear-gradient(180deg, rgba(15,17,24,0.95), rgba(11,13,20,0.98))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  {view === 'conversation' && (
                    <button
                      onClick={() => setView('list')}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      aria-label="Back to list"
                    >
                      <ChevronLeft className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center icon-tile"
                    style={{
                      backgroundColor: 'rgba(56,189,248,0.10)',
                      border: '1px solid rgba(56,189,248,0.30)',
                    }}
                  >
                    <Headphones className="w-5 h-5 text-[#38BDF8] relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-tight">
                      {view === 'create' ? 'New Ticket' : view === 'conversation' ? selectedTicket?.subject : 'Support'}
                    </h2>
                    <p className="text-white/40 text-[11px]">
                      {view === 'create'
                        ? 'Describe your issue'
                        : view === 'conversation'
                          ? getStatusBadge(selectedTicket?.status || 'open')
                          : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close support modal"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                <AnimatePresence mode="wait">
                  {/* ──── LIST VIEW ──── */}
                  {view === 'list' && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="p-5 space-y-3"
                    >
                      {/* Create ticket button */}
                      <button
                        onClick={() => setView('create')}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#0F1118] border border-white/5 hover:border-[#38BDF8]/20 transition-all group"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: 'rgba(56,189,248,0.10)',
                            border: '1px solid rgba(56,189,248,0.25)',
                          }}
                        >
                          <Plus className="w-5 h-5 text-[#38BDF8]" />
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm font-semibold">Create New Ticket</p>
                          <p className="text-white/35 text-[11px]">Report an issue or ask for help</p>
                        </div>
                      </button>

                      {/* Tickets list */}
                      {loading && tickets.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                        </div>
                      ) : tickets.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-10 h-10 text-white/15 mx-auto mb-3" />
                          <p className="text-white/40 text-sm">No support tickets yet</p>
                          <p className="text-white/25 text-xs mt-1">Create a ticket if you need help</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tickets.map((ticket) => {
                            const catConfig = getCategoryIcon(ticket.category);
                            const CatIcon = catConfig.icon;
                            return (
                              <motion.button
                                key={ticket.id}
                                onClick={() => handleTicketClick(ticket)}
                                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#0F1118] border border-white/5 hover:border-white/10 transition-all text-left"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor: `${catConfig.color}15`,
                                  }}
                                >
                                  <CatIcon className="w-4 h-4" style={{ color: catConfig.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-semibold truncate">{ticket.subject}</p>
                                  <p className="text-white/30 text-[10px] mt-0.5">
                                    {formatDate(ticket.updatedAt)} • {catConfig.label}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  {getStatusBadge(ticket.status)}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ──── CREATE VIEW ──── */}
                  {view === 'create' && (
                    <motion.div
                      key="create"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="p-5 space-y-4"
                    >
                      {/* Category selector */}
                      <div>
                        <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider block mb-2">
                          Category
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {CATEGORIES.map((cat) => {
                            const CatIcon = cat.icon;
                            return (
                              <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-xs ${
                                  category === cat.value
                                    ? 'bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8]'
                                    : 'bg-white/[0.03] border border-white/5 text-white/70 hover:bg-white/[0.06]'
                                }`}
                              >
                                <CatIcon className="w-4 h-4" />
                                <span className="font-medium">{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider block mb-1.5">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief description of your issue"
                          className="w-full bg-[#06070B] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#38BDF8]/40 transition-colors"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider block mb-1.5">
                          Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Describe your issue in detail…"
                          rows={4}
                          className="w-full bg-[#06070B] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#38BDF8]/40 transition-colors resize-none"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        onClick={handleCreateTicket}
                        disabled={sending || !category || !subject || !message}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: sending
                            ? 'rgba(56,189,248,0.15)'
                            : 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
                          color: '#0C2D3F',
                          boxShadow: sending ? 'none' : '0 4px 20px rgba(56,189,248,0.25)',
                        }}
                      >
                        {sending ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Send className="w-4 h-4" />
                            Create Ticket
                          </span>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {/* ──── CONVERSATION VIEW ──── */}
                  {view === 'conversation' && selectedTicket && (
                    <motion.div
                      key="conversation"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col h-full"
                    >
                      {/* Messages */}
                      <div
                        className="flex-1 p-5 space-y-3 overflow-y-auto"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent', maxHeight: 'calc(85vh - 140px)' }}
                      >
                        {messages.length === 0 ? (
                          <div className="text-center py-6">
                            <MessageSquare className="w-8 h-8 text-white/15 mx-auto mb-2" />
                            <p className="text-white/30 text-xs">No messages yet</p>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                                  msg.isAdmin
                                    ? 'bg-white/[0.05] border border-white/5 rounded-bl-md'
                                    : 'bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-br-md'
                                }`}
                              >
                                {msg.isAdmin && (
                                  <p className="text-[#38BDF8] text-[10px] font-semibold mb-1">Support Team</p>
                                )}
                                <p className="text-white/85 text-xs leading-relaxed">{msg.message}</p>
                                <p className="text-white/25 text-[9px] mt-1.5 text-right">
                                  {formatDate(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Reply input */}
                      {selectedTicket.status !== 'closed' && (
                        <div className="shrink-0 px-4 py-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
                                  e.preventDefault();
                                  handleReply();
                                }
                              }}
                              placeholder="Type a message…"
                              className="flex-1 bg-[#06070B] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#38BDF8]/40 transition-colors"
                            />
                            <button
                              onClick={handleReply}
                              disabled={sending || !replyText.trim()}
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                              style={{
                                backgroundColor: 'rgba(56,189,248,0.15)',
                                border: '1px solid rgba(56,189,248,0.30)',
                              }}
                            >
                              {sending ? (
                                <Loader2 className="w-4 h-4 text-[#38BDF8] animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 text-[#38BDF8]" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
