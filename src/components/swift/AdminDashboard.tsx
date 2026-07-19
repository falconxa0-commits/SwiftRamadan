'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  AlertTriangle,
  DollarSign,
  Settings,
  Search,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Ban,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpRight,
  TrendingUp,
  Clock,
  BadgeCheck,
  MoreHorizontal,
  ChevronDown,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────── Types ──────────────────── */

type AdminTab = 'overview' | 'users' | 'vendors' | 'orders' | 'disputes' | 'finance' | 'content';

type PlatformMetrics = {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeVendors: number;
  activeRiders: number;
  revenueTrend: { day: string; revenue: number }[];
  ordersByStatus: { status: string; count: number; color: string }[];
  topVendors: { name: string; revenue: number; orders: number }[];
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin';
  status: 'active' | 'banned';
  joined: string;
  verified: boolean;
};

type AdminVendor = {
  id: string;
  storeName: string;
  owner: string;
  category: string;
  status: 'active' | 'pending' | 'banned';
  verified: boolean;
  commission: number;
  revenue: number;
  orders: number;
};

type AdminOrder = {
  id: string;
  shortId: string;
  customer: string;
  vendor: string;
  items: number;
  total: number;
  status: string;
  date: string;
  rider: string | null;
};

type AdminDispute = {
  id: string;
  orderId: string;
  type: 'refund' | 'quality' | 'delivery' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  date: string;
  amount: number;
};

type FinanceData = {
  totalRevenue: number;
  platformCommission: number;
  vendorPayouts: number;
  netProfit: number;
  transactions: {
    id: string;
    type: 'commission' | 'payout' | 'refund' | 'fee';
    amount: number;
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
  }[];
};

type FeaturedItem = {
  id: string;
  title: string;
  type: 'product' | 'vendor' | 'category';
  position: number;
  active: boolean;
  image: string;
};

/* ──────────────────── Tab Config ──────────────────── */

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'content', label: 'Content', icon: Settings },
];

/* ──────────────────── Reusable Components ──────────────────── */

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  delay = 0,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-[#0F1117] border border-white/10 p-4"
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 blur-[40px] opacity-20"
        style={{ background: color }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${color}15`,
              borderColor: `${color}30`,
            }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          {trend && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#10E07A]">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
        <p className="text-white/45 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-white text-xl font-black mt-0.5 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: 'rgba(16,224,122,0.15)', text: '#10E07A', border: 'rgba(16,224,122,0.25)' },
    pending: { bg: 'rgba(245,196,81,0.15)', text: '#F5C451', border: 'rgba(245,196,81,0.25)' },
    banned: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    verified: { bg: 'rgba(56,189,248,0.15)', text: '#38BDF8', border: 'rgba(56,189,248,0.25)' },
    open: { bg: 'rgba(245,196,81,0.15)', text: '#F5C451', border: 'rgba(245,196,81,0.25)' },
    investigating: { bg: 'rgba(56,189,248,0.15)', text: '#38BDF8', border: 'rgba(56,189,248,0.25)' },
    resolved: { bg: 'rgba(16,224,122,0.15)', text: '#10E07A', border: 'rgba(16,224,122,0.25)' },
    escalated: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    completed: { bg: 'rgba(16,224,122,0.15)', text: '#10E07A', border: 'rgba(16,224,122,0.25)' },
    failed: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    Preparing: { bg: 'rgba(245,196,81,0.15)', text: '#F5C451', border: 'rgba(245,196,81,0.25)' },
    Confirmed: { bg: 'rgba(56,189,248,0.15)', text: '#38BDF8', border: 'rgba(56,189,248,0.25)' },
    Ready: { bg: 'rgba(16,224,122,0.15)', text: '#10E07A', border: 'rgba(16,224,122,0.25)' },
    Dispatched: { bg: 'rgba(56,189,248,0.15)', text: '#38BDF8', border: 'rgba(56,189,248,0.25)' },
    Delivered: { bg: 'rgba(16,224,122,0.15)', text: '#10E07A', border: 'rgba(16,224,122,0.25)' },
    Cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    'In Transit': { bg: 'rgba(56,189,248,0.15)', text: '#38BDF8', border: 'rgba(56,189,248,0.25)' },
  };
  const c = config[status] || config.pending;
  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${sizeClass}`}
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  loading,
  variant = 'default',
  size = 'sm',
}: {
  label: string;
  icon?: typeof LayoutDashboard;
  onClick: () => void;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'success' | 'blue';
  size?: 'sm' | 'md';
}) {
  const colors = {
    default: 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20',
    success: 'bg-[#10E07A]/10 hover:bg-[#10E07A]/20 text-[#10E07A] border-[#10E07A]/20',
    blue: 'bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/20',
  };
  const sizeClass = size === 'md' ? 'px-4 py-2 text-xs' : 'px-2.5 py-1.5 text-[10px]';
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-lg border font-semibold transition-all active:scale-95 disabled:opacity-50 ${colors[variant]} ${sizeClass}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : Icon ? <Icon className="w-3 h-3" /> : null}
      {label}
    </button>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof LayoutDashboard; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white/40 text-sm font-semibold">{message}</p>
    </div>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-white/50 text-sm font-semibold mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0F1117] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#10E07A]/40 focus:outline-none transition-all"
      />
    </div>
  );
}

function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selected === opt
              ? 'bg-[#10E07A] text-[#04140C]'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-white/5'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function TableSkeleton({ cols = 5, rows = 4 }: { cols?: number; rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 rounded-xl bg-[#0F1117]/50">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-white/5 rounded animate-pulse flex-1"
              style={{ width: `${100 / cols}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────── Revenue Bar Chart ──────────────────── */

function RevenueBarChart({ data }: { data: { day: string; revenue: number }[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="rounded-2xl bg-[#0F1117] border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-bold">Revenue Trend (7 Days)</h3>
        <span className="text-[#10E07A] text-[10px] font-bold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          +12.5%
        </span>
      </div>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const height = Math.max((d.revenue / maxRevenue) * 100, 4);
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] text-white/40 font-semibold">
                {formatNaira(d.revenue).replace('₦', '₦').replace(/,.*/, '')}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                className="w-full rounded-t-lg relative overflow-hidden"
                style={{
                  background: 'linear-gradient(to top, #10E07A, #10E07A80)',
                  minHeight: 4,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
              </motion.div>
              <span className="text-[10px] text-white/40 font-semibold">{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const { setActiveModal } = useAppStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // ─── Overview state ───
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // ─── Users state ───
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // ─── Vendors state ───
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);

  // ─── Orders state ───
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // ─── Disputes state ───
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState<string | null>(null);

  // ─── Finance state ───
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [financePeriod, setFinancePeriod] = useState('This Month');

  // ─── Content state ───
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  /* ─── Fetch functions ─── */

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const res = await fetch('/api/admin/metrics');
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data);
      } else {
        throw new Error(json.error || 'Failed to load metrics');
      }
    } catch (err) {
      console.error('[AdminDashboard] metrics error:', err);
      setMetricsError('Failed to load platform metrics');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (page = 1, append = false) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (userSearch) params.set('search', userSearch);
      if (userRoleFilter !== 'All') params.set('role', userRoleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(append ? [...users, ...json.data] : json.data);
        setUsersHasMore(json.data.length >= 10);
      } else {
        throw new Error(json.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('[AdminDashboard] users error:', err);
      setUsersError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRoleFilter, users]);

  const fetchVendors = useCallback(async () => {
    setVendorsLoading(true);
    setVendorsError(null);
    try {
      const res = await fetch('/api/admin/vendors');
      const json = await res.json();
      if (json.success && json.data) {
        setVendors(json.data);
      } else {
        throw new Error(json.error || 'Failed to load vendors');
      }
    } catch (err) {
      console.error('[AdminDashboard] vendors error:', err);
      setVendorsError('Failed to load vendors');
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const params = new URLSearchParams();
      if (orderSearch) params.set('search', orderSearch);
      if (orderStatusFilter !== 'All') params.set('status', orderStatusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data);
      } else {
        throw new Error(json.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('[AdminDashboard] orders error:', err);
      setOrdersError('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [orderSearch, orderStatusFilter]);

  const fetchDisputes = useCallback(async () => {
    setDisputesLoading(true);
    setDisputesError(null);
    try {
      const res = await fetch('/api/admin/disputes');
      const json = await res.json();
      if (json.success && json.data) {
        setDisputes(json.data);
      } else {
        throw new Error(json.error || 'Failed to load disputes');
      }
    } catch (err) {
      console.error('[AdminDashboard] disputes error:', err);
      setDisputesError('Failed to load disputes');
    } finally {
      setDisputesLoading(false);
    }
  }, []);

  const fetchFinance = useCallback(async () => {
    setFinanceLoading(true);
    setFinanceError(null);
    try {
      const res = await fetch(`/api/admin/finance?period=${encodeURIComponent(financePeriod)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFinance(json.data);
      } else {
        throw new Error(json.error || 'Failed to load finance data');
      }
    } catch (err) {
      console.error('[AdminDashboard] finance error:', err);
      setFinanceError('Failed to load finance data');
    } finally {
      setFinanceLoading(false);
    }
  }, [financePeriod]);

  const fetchContent = useCallback(async () => {
    setContentLoading(true);
    setContentError(null);
    try {
      const res = await fetch('/api/admin/content');
      const json = await res.json();
      if (json.success && json.data) {
        setFeaturedItems(json.data);
      } else {
        throw new Error(json.error || 'Failed to load content');
      }
    } catch (err) {
      console.error('[AdminDashboard] content error:', err);
      setContentError('Failed to load content');
    } finally {
      setContentLoading(false);
    }
  }, []);

  /* ─── Load data on tab change ─── */

  useEffect(() => {
    if (activeTab === 'overview' && !metrics) fetchMetrics();
    if (activeTab === 'users') fetchUsers(1);
    if (activeTab === 'vendors' && vendors.length === 0) fetchVendors();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'disputes' && disputes.length === 0) fetchDisputes();
    if (activeTab === 'finance' && !finance) fetchFinance();
    if (activeTab === 'content' && featuredItems.length === 0) fetchContent();
  }, [activeTab]);

  /* ─── Action handlers ─── */

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading((p) => ({ ...p, [userId]: true }));
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `User ${action} successful`, description: `Action: ${action}` });
        fetchUsers(1);
      } else {
        throw new Error(json.error || 'Action failed');
      }
    } catch {
      toast({ title: 'Action failed', description: 'Could not update user', variant: 'destructive' });
    } finally {
      setActionLoading((p) => ({ ...p, [userId]: false }));
    }
  };

  const handleVendorAction = async (vendorId: string, action: string, data?: Record<string, unknown>) => {
    setActionLoading((p) => ({ ...p, [vendorId]: true }));
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, action, ...data }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `Vendor ${action} successful` });
        fetchVendors();
      } else {
        throw new Error(json.error || 'Action failed');
      }
    } catch {
      toast({ title: 'Action failed', description: 'Could not update vendor', variant: 'destructive' });
    } finally {
      setActionLoading((p) => ({ ...p, [vendorId]: false }));
    }
  };

  const handleOrderAction = async (orderId: string, action: string, data?: Record<string, unknown>) => {
    setActionLoading((p) => ({ ...p, [orderId]: true }));
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action, ...data }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `Order ${action} successful` });
        fetchOrders();
      } else {
        throw new Error(json.error || 'Action failed');
      }
    } catch {
      toast({ title: 'Action failed', description: 'Could not update order', variant: 'destructive' });
    } finally {
      setActionLoading((p) => ({ ...p, [orderId]: false }));
    }
  };

  const handleDisputeAction = async (disputeId: string, action: string) => {
    setActionLoading((p) => ({ ...p, [disputeId]: true }));
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId, action }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `Dispute ${action} successful` });
        fetchDisputes();
      } else {
        throw new Error(json.error || 'Action failed');
      }
    } catch {
      toast({ title: 'Action failed', description: 'Could not update dispute', variant: 'destructive' });
    } finally {
      setActionLoading((p) => ({ ...p, [disputeId]: false }));
    }
  };

  /* ─── Loading skeleton ─── */
  if (metricsLoading && !metrics) {
    return (
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#0F1117] border border-white/5 p-4 space-y-2">
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-40 bg-[#0F1117] rounded-2xl border border-white/5 animate-pulse" />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     TAB CONTENT RENDERERS
     ══════════════════════════════════════════════════════════════════ */

  function renderOverview() {
    if (metricsError) return <ErrorRetry message={metricsError} onRetry={fetchMetrics} />;
    if (!metrics) return null;

    return (
      <div className="space-y-4">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard icon={Users} label="Total Users" value={metrics.totalUsers.toLocaleString()} color="#10E07A" trend="+8.2%" delay={0} />
          <MetricCard icon={ShoppingBag} label="Total Orders" value={metrics.totalOrders.toLocaleString()} color="#F5C451" trend="+15.3%" delay={0.05} />
          <MetricCard icon={DollarSign} label="Total Revenue" value={formatNaira(metrics.totalRevenue)} color="#10E07A" trend="+12.5%" delay={0.1} />
          <MetricCard icon={Store} label="Active Vendors" value={metrics.activeVendors} color="#38BDF8" delay={0.15} />
          <MetricCard icon={AlertTriangle} label="Active Riders" value={metrics.activeRiders} color="#F5C451" delay={0.2} />
        </div>

        {/* Revenue Trend Chart */}
        <RevenueBarChart data={metrics.revenueTrend} />

        {/* Orders by Status */}
        <div className="rounded-2xl bg-[#0F1117] border border-white/10 p-4">
          <h3 className="text-white text-sm font-bold mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {metrics.ordersByStatus.map((s, i) => {
              const maxCount = Math.max(...metrics.ordersByStatus.map((x) => x.count), 1);
              const pct = Math.max((s.count / maxCount) * 100, 2);
              return (
                <div key={s.status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-xs font-semibold">{s.status}</span>
                    <span className="text-white/40 text-[10px] font-bold">{s.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.08, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Vendors */}
        <div className="rounded-2xl bg-[#0F1117] border border-white/10 p-4">
          <h3 className="text-white text-sm font-bold mb-4">Top Vendors by Revenue</h3>
          <div className="space-y-3">
            {metrics.topVendors.map((v, i) => (
              <div key={v.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F5C451]/15 text-[#F5C451] text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{v.name}</p>
                  <p className="text-white/30 text-[10px]">{v.orders} orders</p>
                </div>
                <span className="text-[#10E07A] text-xs font-bold">{formatNaira(v.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderUsers() {
    if (usersError) return <ErrorRetry message={usersError} onRetry={() => fetchUsers(1)} />;

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar value={userSearch} onChange={(v) => { setUserSearch(v); setUsersPage(1); }} placeholder="Search name or email..." />
          </div>
        </div>
        <FilterChips
          options={['All', 'Customer', 'Vendor', 'Rider', 'Admin']}
          selected={userRoleFilter}
          onSelect={(v) => { setUserRoleFilter(v); setUsersPage(1); }}
        />

        {usersLoading && users.length === 0 ? (
          <TableSkeleton cols={5} rows={5} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} message="No users found" />
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-[#0F1117] border border-white/10 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-[#10E07A]/10 border border-[#10E07A]/20 flex items-center justify-center shrink-0">
                      <span className="text-[#10E07A] text-xs font-black">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                        {user.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />}
                      </div>
                      <p className="text-white/30 text-[10px] truncate">{user.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-[10px] font-semibold capitalize">{user.role}</span>
                    <span className="text-white/15 text-[10px]">•</span>
                    <span className="text-white/25 text-[10px]">{user.joined}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <ActionButton
                      label={user.status === 'banned' ? 'Unban' : 'Ban'}
                      icon={user.status === 'banned' ? CheckCircle2 : Ban}
                      variant={user.status === 'banned' ? 'success' : 'danger'}
                      onClick={() => handleUserAction(user.id, user.status === 'banned' ? 'unban' : 'ban')}
                      loading={actionLoading[user.id]}
                    />
                    <ActionButton
                      label="Verify"
                      icon={ShieldCheck}
                      variant="blue"
                      onClick={() => handleUserAction(user.id, 'verify')}
                      loading={actionLoading[user.id]}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {usersHasMore && (
              <button
                onClick={() => { setUsersPage((p) => p + 1); fetchUsers(usersPage + 1, true); }}
                disabled={usersLoading}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-white/50 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                {usersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 rotate-90" />}
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderVendors() {
    if (vendorsError) return <ErrorRetry message={vendorsError} onRetry={fetchVendors} />;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-bold">Vendor Management</h3>
          <span className="text-white/30 text-xs font-semibold">{vendors.length} vendors</span>
        </div>

        {vendorsLoading ? (
          <TableSkeleton cols={6} rows={5} />
        ) : vendors.length === 0 ? (
          <EmptyState icon={Store} message="No vendors found" />
        ) : (
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-[#0F1117] border border-white/10 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-[#F5C451]/10 border border-[#F5C451]/20 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-[#F5C451]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-sm font-semibold truncate">{vendor.storeName}</p>
                        {vendor.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />}
                      </div>
                      <p className="text-white/30 text-[10px]">{vendor.owner} • {vendor.category}</p>
                    </div>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-[#10E07A] text-[10px] font-bold">{formatNaira(vendor.revenue)}</span>
                    <span className="text-white/15 text-[10px]">•</span>
                    <span className="text-white/30 text-[10px]">{vendor.orders} orders</span>
                    <span className="text-white/15 text-[10px]">•</span>
                    <span className="text-[#F5C451] text-[10px] font-semibold">{vendor.commission}% comm.</span>
                  </div>
                  <div className="flex gap-1.5">
                    {vendor.status === 'pending' && (
                      <>
                        <ActionButton
                          label="Approve"
                          icon={CheckCircle2}
                          variant="success"
                          onClick={() => handleVendorAction(vendor.id, 'approve')}
                          loading={actionLoading[vendor.id]}
                        />
                        <ActionButton
                          label="Reject"
                          icon={XCircle}
                          variant="danger"
                          onClick={() => handleVendorAction(vendor.id, 'reject')}
                          loading={actionLoading[vendor.id]}
                        />
                      </>
                    )}
                    <ActionButton
                      label={vendor.verified ? 'Unverify' : 'Verify'}
                      icon={BadgeCheck}
                      variant="blue"
                      onClick={() => handleVendorAction(vendor.id, vendor.verified ? 'unverify' : 'verify')}
                      loading={actionLoading[vendor.id]}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderOrders() {
    if (ordersError) return <ErrorRetry message={ordersError} onRetry={fetchOrders} />;

    return (
      <div className="space-y-4">
        <SearchBar value={orderSearch} onChange={setOrderSearch} placeholder="Search order ID..." />
        <FilterChips
          options={['All', 'Pending', 'Confirmed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled']}
          selected={orderStatusFilter}
          onSelect={setOrderStatusFilter}
        />

        {ordersLoading && orders.length === 0 ? (
          <TableSkeleton cols={6} rows={5} />
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} message="No orders found" />
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-[#0F1117] border border-white/10 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-bold">#{order.shortId}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {order.customer} → {order.vendor}
                    </p>
                  </div>
                  <span className="text-[#10E07A] text-sm font-black shrink-0">{formatNaira(order.total)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-[10px]">{order.items} items</span>
                    <span className="text-white/15 text-[10px]">•</span>
                    <span className="text-white/25 text-[10px]">{order.date}</span>
                    {order.rider && (
                      <>
                        <span className="text-white/15 text-[10px]">•</span>
                        <span className="text-[#38BDF8] text-[10px]">Rider: {order.rider}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <ActionButton
                      label="Status"
                      icon={Clock}
                      variant="default"
                      onClick={() => handleOrderAction(order.id, 'change-status')}
                      loading={actionLoading[order.id]}
                    />
                    <ActionButton
                      label="Rider"
                      icon={ArrowUpRight}
                      variant="blue"
                      onClick={() => handleOrderAction(order.id, 'assign-rider')}
                      loading={actionLoading[order.id]}
                    />
                    <ActionButton
                      label="Refund"
                      icon={DollarSign}
                      variant="danger"
                      onClick={() => handleOrderAction(order.id, 'refund')}
                      loading={actionLoading[order.id]}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDisputes() {
    if (disputesError) return <ErrorRetry message={disputesError} onRetry={fetchDisputes} />;

    const typeColors: Record<string, string> = {
      refund: '#F5C451',
      quality: '#ef4444',
      delivery: '#38BDF8',
      other: '#a78bfa',
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-bold">Dispute Management</h3>
          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-black border border-red-500/20">
            {disputes.filter((d) => d.status === 'open' || d.status === 'investigating').length} Active
          </span>
        </div>

        {disputesLoading ? (
          <TableSkeleton cols={5} rows={4} />
        ) : disputes.length === 0 ? (
          <EmptyState icon={AlertTriangle} message="No disputes found" />
        ) : (
          <div className="space-y-2">
            {disputes.map((dispute) => (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-[#0F1117] border border-white/10 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-bold">#{dispute.id.slice(-6).toUpperCase()}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ color: typeColors[dispute.type] || '#a78bfa', backgroundColor: `${typeColors[dispute.type] || '#a78bfa'}15` }}
                      >
                        {dispute.type}
                      </span>
                      <StatusBadge status={dispute.status} />
                    </div>
                    <p className="text-white/30 text-[10px] mt-0.5 line-clamp-1">{dispute.description}</p>
                  </div>
                  <span className="text-[#F5C451] text-xs font-bold shrink-0">{formatNaira(dispute.amount)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <span className="text-white/25 text-[10px]">Order: #{dispute.orderId.slice(-6).toUpperCase()} • {dispute.date}</span>
                  <div className="flex gap-1.5">
                    {dispute.status === 'open' && (
                      <ActionButton
                        label="Investigate"
                        icon={Eye}
                        variant="blue"
                        onClick={() => handleDisputeAction(dispute.id, 'investigate')}
                        loading={actionLoading[dispute.id]}
                      />
                    )}
                    {(dispute.status === 'investigating' || dispute.status === 'open') && (
                      <>
                        <ActionButton
                          label="Resolve"
                          icon={CheckCircle2}
                          variant="success"
                          onClick={() => handleDisputeAction(dispute.id, 'resolve')}
                          loading={actionLoading[dispute.id]}
                        />
                        <ActionButton
                          label="Escalate"
                          icon={ArrowUpRight}
                          variant="danger"
                          onClick={() => handleDisputeAction(dispute.id, 'escalate')}
                          loading={actionLoading[dispute.id]}
                        />
                      </>
                    )}
                    <ActionButton
                      label="Refund"
                      icon={DollarSign}
                      variant="danger"
                      onClick={() => handleDisputeAction(dispute.id, 'refund')}
                      loading={actionLoading[dispute.id]}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderFinance() {
    if (financeError) return <ErrorRetry message={financeError} onRetry={fetchFinance} />;
    if (financeLoading && !finance) return <TableSkeleton cols={3} rows={6} />;
    if (!finance) return null;

    return (
      <div className="space-y-4">
        {/* Period selector */}
        <FilterChips
          options={['Today', 'This Week', 'This Month', 'All Time']}
          selected={financePeriod}
          onSelect={setFinancePeriod}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={DollarSign} label="Total Revenue" value={formatNaira(finance.totalRevenue)} color="#10E07A" delay={0} />
          <MetricCard icon={Settings} label="Commission" value={formatNaira(finance.platformCommission)} color="#F5C451" delay={0.05} />
          <MetricCard icon={Store} label="Vendor Payouts" value={formatNaira(finance.vendorPayouts)} color="#38BDF8" delay={0.1} />
          <MetricCard icon={TrendingUp} label="Net Profit" value={formatNaira(finance.netProfit)} color="#10E07A" trend="+18.7%" delay={0.15} />
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-[#0F1117] border border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-bold">Recent Transactions</h3>
            <span className="text-white/30 text-[10px] font-semibold">{finance.transactions.length} entries</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {finance.transactions.map((tx) => {
              const typeConfig: Record<string, { icon: typeof DollarSign; color: string }> = {
                commission: { icon: DollarSign, color: '#10E07A' },
                payout: { icon: Store, color: '#38BDF8' },
                refund: { icon: RefreshCw, color: '#ef4444' },
                fee: { icon: Settings, color: '#F5C451' },
              };
              const tc = typeConfig[tx.type] || typeConfig.fee;
              const TxIcon = tc.icon;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${tc.color}15` }}
                  >
                    <TxIcon className="w-4 h-4" style={{ color: tc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{tx.description}</p>
                    <p className="text-white/25 text-[10px]">{tx.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold" style={{ color: tc.color }}>
                      {tx.type === 'payout' || tx.type === 'refund' ? '-' : '+'}{formatNaira(tx.amount)}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderContent() {
    if (contentError) return <ErrorRetry message={contentError} onRetry={fetchContent} />;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-bold">Featured Items</h3>
          <button
            onClick={() => toast({ title: 'Coming Soon', description: 'Add featured item form coming soon' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10E07A]/10 border border-[#10E07A]/20 text-[#10E07A] text-xs font-bold hover:bg-[#10E07A]/20 transition-all"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {contentLoading ? (
          <TableSkeleton cols={4} rows={4} />
        ) : featuredItems.length === 0 ? (
          <EmptyState icon={ImageIcon} message="No featured items" />
        ) : (
          <div className="space-y-2">
            {featuredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-[#0F1117] border border-white/10 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#10E07A]/10 border border-[#10E07A]/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[#10E07A]/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                      <StatusBadge status={item.active ? 'active' : 'banned'} />
                    </div>
                    <p className="text-white/30 text-[10px] capitalize">{item.type} • Position #{item.position}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <ActionButton
                      label={item.active ? 'Deactivate' : 'Activate'}
                      icon={item.active ? XCircle : CheckCircle2}
                      variant={item.active ? 'danger' : 'success'}
                      onClick={() => {
                        setFeaturedItems((prev) =>
                          prev.map((fi) => (fi.id === item.id ? { ...fi, active: !fi.active } : fi))
                        );
                        toast({ title: `Item ${item.active ? 'deactivated' : 'activated'}` });
                      }}
                    />
                    <ActionButton
                      label="Edit"
                      icon={Edit3}
                      variant="default"
                      onClick={() => toast({ title: 'Coming Soon', description: 'Edit featured item form coming soon' })}
                    />
                    <ActionButton
                      label="Delete"
                      icon={Trash2}
                      variant="danger"
                      onClick={() => {
                        setFeaturedItems((prev) => prev.filter((fi) => fi.id !== item.id));
                        toast({ title: 'Item removed' });
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Banner Management (Coming Soon) */}
        <div className="rounded-2xl bg-[#0F1117] border border-white/10 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-7 h-7 text-[#38BDF8]" />
          </div>
          <h3 className="text-white text-sm font-bold mb-1">Banner Management</h3>
          <p className="text-white/30 text-xs">Create and manage promotional banners for the home screen.</p>
          <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-[#F5C451]/10 text-[#F5C451] text-[10px] font-bold border border-[#F5C451]/20">
            <Clock className="w-3 h-3" />
            Coming Soon
          </span>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     MAIN RENDER
     ══════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-4 px-4 pb-32 pt-2">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">Admin Panel</h1>
          <p className="text-[#10E07A] text-xs font-bold mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Swift Eats Platform Management
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMetrics}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0F1118] border border-white/10 hover:border-[#10E07A]/30 transition-all"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-white/50 ${metricsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Tab Navigation — horizontal scroll on mobile */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
        <div className="flex gap-1.5 p-1 rounded-2xl bg-[#0F1117]/60 border border-white/5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive ? 'text-[#06070B]' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminTabBg"
                    className="absolute inset-0 rounded-xl bg-[#10E07A]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'vendors' && renderVendors()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'disputes' && renderDisputes()}
          {activeTab === 'finance' && renderFinance()}
          {activeTab === 'content' && renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
