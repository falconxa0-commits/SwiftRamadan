'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingBag, Clock, Gift, Users, Truck, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}

const typeIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  order: { icon: Truck, color: 'text-[#10E07A]' },
  promo: { icon: ShoppingBag, color: 'text-[#FFD700]' },
  reminder: { icon: Clock, color: 'text-cyan-400' },
  reward: { icon: Gift, color: 'text-amber-400' },
  social: { icon: Users, color: 'text-purple-400' },
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'order' | 'promo' | 'reminder' | 'reward' | 'social';

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const { setUnreadCount } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Use fallback
      setNotifications([
        { id: 1, title: "Order Confirmed!", message: "Your Ramadan Family Box is being prepared.", time: "2 min ago", read: false, type: "order" },
        { id: 2, title: "Flash Sale Alert", message: "30% off all Dates & Fruit Boxes - 1 hour left!", time: "15 min ago", read: false, type: "promo" },
        { id: 3, title: "Iftar Reminder", message: "Maghrib is at 6:45 PM. Order your Iftar now!", time: "1 hr ago", read: true, type: "reminder" },
        { id: 4, title: "SwiftRewards", message: "You've earned 500 points from your last order!", time: "3 hrs ago", read: true, type: "reward" },
        { id: 5, title: "Group Buy Update", message: "Your group buy for Groceries is 80% filled.", time: "5 hrs ago", read: true, type: "social" },
        { id: 6, title: "Delivery Update", message: "Your rider Ibrahim is 5 mins away!", time: "8 hrs ago", read: true, type: "order" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Orders', value: 'order' },
    { label: 'Promos', value: 'promo' },
    { label: 'Reminders', value: 'reminder' },
    { label: 'Rewards', value: 'reward' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#0F1117] z-[80] flex flex-col border-l border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#10E07A]" />
                <h2 className="text-white font-bold text-lg">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-[#10E07A] text-[#05070A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[#10E07A] text-xs font-bold">
                    Mark all read
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    filter === f.value
                      ? 'bg-[#10E07A] text-[#05070A]'
                      : 'bg-white/5 text-white/50 hover:text-white/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-20 bg-[#1A1D26]/40 rounded-xl" />
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(16,224,122,0.18), rgba(16,224,122,0.04))',
                      border: '1px solid rgba(16,224,122,0.3)',
                      boxShadow: '0 0 24px rgba(16,224,122,0.15)',
                    }}
                  >
                    <Bell className="w-9 h-9 text-[#10E07A]" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-white font-bold text-base"
                  >
                    No notifications
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/40 text-sm mt-1"
                  >
                    You&apos;re all caught up!
                  </motion.p>
                </motion.div>
              ) : (
                filteredNotifications.map((notification) => {
                  const config = typeIcons[notification.type] || typeIcons.order;
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: notification.id * 0.05 }}
                      onClick={() => {
                        if (!notification.read) {
                          setNotifications(prev =>
                            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                          );
                        }
                      }}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors w-full text-left ${
                        notification.read
                          ? 'bg-transparent border-white/5 opacity-60'
                          : 'bg-[#1A1D26]/60 border-[#10E07A]/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notification.read ? 'bg-white/5' : 'bg-[#10E07A]/10'}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold truncate ${notification.read ? 'text-white/60' : 'text-white'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && <span className="w-2 h-2 bg-[#10E07A] rounded-full shrink-0" />}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-white/20 text-[10px] mt-1">{notification.time}</p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
