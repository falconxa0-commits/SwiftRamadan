'use client';

/**
 * KingdomProductStudio — Auren Kingdom V2 reinterpretation of the legacy
 * SwiftRamdan VendorStoreTab.
 *
 * Same store hooks (`useAppStore`, `useNavigation`, `useUserEmail`,
 * `useAppStore.getState().setActiveModal`) and the same data import
 * (`formatNaira` from `@/lib/data`) are preserved. The visual layer is
 * completely replaced with the Kingdom V2 design system (KingdomShell,
 * IntelligenceCard, RoyalBadge, RoyalInput, RoyalSkeleton, kv-card /
 * kv-stagger / kv-empty / kv-backdrop / kv-btn-ghost / kv-btn-royal /
 * kv-gradient-gold / kv-accent-line).
 *
 * V2 spec sections:
 *  1. KingdomShell root
 *  2. Title "Product Studio" with kv-gradient-text + kv-accent-line
 *  3. kv-btn-royal "Add Product" (calls setActiveModal('vendor-add-product'))
 *  4. Category filter: RoyalBadge pills (All, Meals, Snacks, Drinks, Desserts,
 *     Groceries)
 *  5. Products as kv-card grid (grid-cols-1 sm:grid-cols-2):
 *     - Image area (rounded, overflow-hidden)
 *     - Product name (font-bold)
 *     - Price (kv-gradient-gold) + sale price if applicable
 *     - RoyalBadge "In Stock" (emerald) or "Out" (danger)
 *     - kv-btn-ghost "Edit" + kv-btn-ghost "Delete"
 *     - Hover: kv-card lift (built-in)
 *  6. Edit mode: inline RoyalInput fields within the card
 *  7. Delete: kv-backdrop confirmation dialog
 *  8. kv-empty: "Your studio is empty. Add your first masterpiece."
 *  9. RoyalSkeleton loading
 * 10. kv-stagger entrance
 * 11. Mobile-first layout
 * 12. Same API: GET /api/vendor/products, PUT, DELETE
 * 13. Same store hooks
 * 14. Route: `src/app/kingdom/vendor/products/page.tsx`
 *
 * The legacy `src/components/swift/VendorStoreTab.tsx` (637 LOC) is untouched.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Package,
  Trash2,
  Loader2,
  X,
  Check,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { formatNaira } from '@/lib/data';
import { useAppStore, useNavigation, useUserEmail } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import {
  KingdomShell,
  RoyalBadge,
  RoyalInput,
  RoyalSkeleton,
} from '../components';

/* ─────────────────────── Types ─────────────────────── */

type VendorProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  originalPrice?: number;
  category: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  inStock: boolean;
  image: string;
  images: string[];
  vendorId?: string;
  createdAt?: string;
};

type CategoryFilter = 'All' | 'meals' | 'snacks' | 'drinks' | 'desserts' | 'groceries';

type RoyalBadgeVariant = 'royal' | 'gold' | 'neutral';

/* ─────────────────────── Category pills (V2 spec) ─────────────────────── */

const CATEGORY_PILLS: { id: CategoryFilter; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'meals', label: 'Meals' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'groceries', label: 'Groceries' },
];

/* ─────────────────────── Skeleton card (uses RoyalSkeleton) ─────────────────────── */
function ProductCardSkeleton() {
  return (
    <div className="kv-card overflow-hidden p-3 flex flex-col gap-2">
      <RoyalSkeleton variant="rect" height={140} className="!rounded-xl" />
      <RoyalSkeleton variant="text" width="80%" />
      <RoyalSkeleton variant="text" width="50%" />
      <div className="flex items-center justify-between mt-1">
        <RoyalSkeleton variant="text" width={70} />
        <RoyalSkeleton variant="rect" width={56} height={32} className="!rounded-lg" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export function KingdomProductStudio() {
  /* ── SAME store hooks preserved (per legacy VendorStoreTab) ── */
  const { setActiveModal } = useNavigation();
  const userEmail = useUserEmail();
  const { toast } = useToast();

  /* ── Local UI state ── */
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VendorProduct>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | undefined>(undefined);

  /* ── Fetch products (legacy API: GET /api/vendor/products?vendorEmail=…) ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/vendor/products?vendorEmail=${encodeURIComponent(userEmail || '')}`,
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.products)) {
        setProducts(json.products as VendorProduct[]);
      } else {
        setProducts([]);
      }
    } catch {
      toast({
        title: 'Failed to load products',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userEmail, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Listen for cross-component refresh signals (e.g. when VendorAddProductModal
  // adds a product). Preserves the legacy window-event contract.
  useEffect(() => {
    const onChange = () => fetchProducts();
    if (typeof window !== 'undefined') {
      window.addEventListener('vendor-products-changed', onChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('vendor-products-changed', onChange);
      }
    };
  }, [fetchProducts]);

  /* ── Filtered items (legacy logic) ── */
  const filteredItems =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const unavailableCount = products.filter((p) => !p.inStock).length;
  const availableCount = products.filter((p) => p.inStock).length;

  /* ── Toggle inStock (legacy API: PUT /api/vendor/products?id=…&vendorEmail=…) ── */
  const toggleAvailability = async (product: VendorProduct) => {
    setBusyId(product.id);
    const nextStock = !product.inStock;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, inStock: nextStock } : p)),
    );
    try {
      const res = await fetch(
        `/api/vendor/products?id=${product.id}&vendorEmail=${encodeURIComponent(userEmail || '')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inStock: nextStock }),
        },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Update failed');
      toast({
        title: nextStock ? 'Item Available' : 'Item Unavailable',
        description: `${product.name} is now ${nextStock ? 'visible to customers' : 'hidden from customers'}`,
      });
    } catch {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, inStock: !nextStock } : p)),
      );
      toast({
        title: 'Update failed',
        description: 'Could not update availability.',
        variant: 'destructive',
      });
    } finally {
      setBusyId(undefined);
    }
  };

  /* ── Start inline edit ── */
  const startEdit = (product: VendorProduct) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      deliveryTime: product.deliveryTime,
      image: product.image,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  /* ── Save edit (legacy API: PUT /api/vendor/products?id=…&vendorEmail=…) ── */
  const saveEdit = async (productId: string) => {
    setBusyId(productId);
    try {
      const res = await fetch(
        `/api/vendor/products?id=${productId}&vendorEmail=${encodeURIComponent(userEmail || '')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editForm.name,
            description: editForm.description,
            price: Number(editForm.price) || 0,
            category: editForm.category,
            deliveryTime: editForm.deliveryTime,
            image: editForm.image,
          }),
        },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Update failed');
      // Update local state from API response
      const updated: VendorProduct = json.product ?? {
        ...(products.find((p) => p.id === productId) as VendorProduct),
        ...editForm,
      };
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updated } : p)));
      toast({
        title: 'Product Updated',
        description: `${updated.name} has been updated`,
      });
      cancelEdit();
    } catch {
      toast({
        title: 'Update failed',
        description: 'Could not save changes.',
        variant: 'destructive',
      });
    } finally {
      setBusyId(undefined);
    }
  };

  /* ── Delete product (legacy API: DELETE /api/vendor/products?id=…&vendorEmail=…) ── */
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setBusyId(confirmDeleteId);
    try {
      const res = await fetch(
        `/api/vendor/products?id=${confirmDeleteId}&vendorEmail=${encodeURIComponent(userEmail || '')}`,
        { method: 'DELETE' },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      setProducts((prev) => prev.filter((p) => p.id !== confirmDeleteId));
      toast({
        title: 'Product Deleted',
        description: 'Item removed from your menu',
        variant: 'destructive',
      });
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Could not delete product.',
        variant: 'destructive',
      });
    } finally {
      setBusyId(undefined);
      setConfirmDeleteId(null);
    }
  };

  /* ── Variant helpers for stock badge ── */
  const stockBadgeVariant = (inStock: boolean): RoyalBadgeVariant =>
    inStock ? 'gold' : 'neutral';

  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Title ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <p className="text-sm text-[var(--kv-text-tertiary)] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--kv-mystic)]" aria-hidden />
            Vendor Studio
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
            Product Studio
          </h1>
          <div className="kv-accent-line mt-3" />
          <p className="text-xs text-[var(--kv-text-tertiary)] mt-2">
            Curate your Ramadan menu — Safa will surface top sellers for you.
          </p>
        </motion.header>

        {/* ─────────────────────── Stock alert (preserves legacy) ─────────────────────── */}
        <AnimatePresence>
          {unavailableCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="kv-card p-3 mb-4"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.20)',
              }}
              role="alert"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.20)',
                  }}
                >
                  <AlertTriangle
                    className="w-4 h-4"
                    style={{ color: 'var(--kv-danger)' }}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-bold"
                    style={{ color: 'var(--kv-danger)' }}
                  >
                    Stock Alert
                  </p>
                  <p className="text-[var(--kv-text-tertiary)] text-xs mt-0.5">
                    {unavailableCount} item{unavailableCount > 1 ? 's' : ''} currently
                    unavailable — customers can&apos;t order them.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────────────────── Quick stats (preserves legacy surfaces) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-3 gap-2 mb-5"
        >
          <div className="kv-card p-3 text-center">
            <p
              className="text-lg font-extrabold"
              style={{ color: 'var(--kv-mystic)' }}
            >
              {products.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
              Menu Items
            </p>
          </div>
          <div className="kv-card p-3 text-center">
            <p
              className="text-lg font-extrabold"
              style={{ color: 'var(--kv-emerald)' }}
            >
              {availableCount}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
              Available
            </p>
          </div>
          <div className="kv-card p-3 text-center">
            <p
              className="text-lg font-extrabold"
              style={{ color: 'var(--kv-danger)' }}
            >
              {unavailableCount}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
              Out of Stock
            </p>
          </div>
        </motion.div>

        {/* ─────────────────────── Add product CTA + section header ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between gap-3 mb-4"
        >
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-extrabold text-white truncate">Menu Items</h2>
            <RoyalBadge variant="royal">{products.length}</RoyalBadge>
          </div>
          <button
            type="button"
            onClick={() =>
              useAppStore.getState().setActiveModal('vendor-add-product')
            }
            className="kv-btn kv-btn-royal text-xs py-2 px-4 min-h-[40px] flex items-center gap-1.5 shrink-0"
            aria-label="Add new product"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
            Add Product
          </button>
        </motion.div>

        {/* ─────────────────────── Category pills (RoyalBadge) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-5"
        >
          <div
            className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x"
            role="tablist"
            aria-label="Product categories"
          >
            {CATEGORY_PILLS.map((pill) => {
              const isActive = activeCategory === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(pill.id)}
                  className="snap-start shrink-0"
                >
                  <RoyalBadge variant={isActive ? 'royal' : 'neutral'}>
                    {pill.label}
                  </RoyalBadge>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ─────────────────────── Loading state (RoyalSkeleton) ─────────────────────── */}
        {loading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            role="status"
            aria-label="Loading products"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* ─────────────────────── Empty state (kv-empty) ─────────────────────── */
          <div className="kv-card kv-empty">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center kv-gold-glow"
              style={{ background: 'var(--kv-royal-light)' }}
            >
              <Package className="w-7 h-7 text-[var(--kv-mystic)]" aria-hidden />
            </div>
            <h3 className="text-white text-base font-bold tracking-tight">
              Your studio is empty
            </h3>
            <p className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs">
              Add your first masterpiece.
            </p>
            <button
              type="button"
              onClick={() =>
                useAppStore.getState().setActiveModal('vendor-add-product')
              }
              className="kv-btn kv-btn-royal text-sm py-2.5 px-5 min-h-[40px] flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
              Add your first product
            </button>
          </div>
        ) : (
          /* ─────────────────────── Products grid (kv-stagger) ─────────────────────── */
          <div className="kv-stagger grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const isEditing = editingId === item.id;
                const isBusy = busyId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`kv-card p-3 ${item.inStock ? '' : 'opacity-70'}`}
                    style={
                      item.inStock
                        ? undefined
                        : { borderColor: 'rgba(239, 68, 68, 0.20)' }
                    }
                  >
                    {isEditing ? (
                      /* ── Inline Edit Form (RoyalInput fields) ── */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className="text-sm font-bold"
                            style={{ color: 'var(--kv-mystic)' }}
                          >
                            Edit Item
                          </h3>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-[var(--kv-text-tertiary)] text-xs hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        <RoyalInput
                          label="Item name"
                          placeholder="Item name"
                          value={editForm.name ?? ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                        <RoyalInput
                          label="Description"
                          placeholder="Description"
                          value={editForm.description ?? ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, description: e.target.value }))
                          }
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <RoyalInput
                            label="Price (₦)"
                            type="number"
                            placeholder="Price"
                            value={editForm.price ?? ''}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                price: Number(e.target.value),
                              }))
                            }
                          />
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-[var(--kv-text-secondary)] tracking-wide">
                              Category
                            </label>
                            <select
                              value={editForm.category ?? 'meals'}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, category: e.target.value }))
                              }
                              className="kv-input"
                              aria-label="Category"
                            >
                              {CATEGORY_PILLS.filter((c) => c.id !== 'All').map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <RoyalInput
                          label="Image URL"
                          placeholder="Image URL"
                          value={editForm.image ?? ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, image: e.target.value }))
                          }
                        />
                        <RoyalInput
                          label="Delivery time (e.g. 25 min)"
                          placeholder="Delivery time"
                          value={editForm.deliveryTime ?? ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, deliveryTime: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          disabled={isBusy}
                          className="kv-btn kv-btn-royal w-full text-sm py-3 min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                          ) : (
                            <Check className="w-4 h-4" strokeWidth={3} aria-hidden />
                          )}
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      /* ── Normal Item View ── */
                      <>
                        {/* Image area (rounded, overflow-hidden) */}
                        <div
                          className="relative w-full aspect-square rounded-xl overflow-hidden bg-center bg-no-repeat bg-cover mb-3 border border-white/10"
                          style={
                            item.image
                              ? { backgroundImage: `url("${item.image}")` }
                              : { background: 'var(--kv-elevated)' }
                          }
                          aria-hidden
                        >
                          {!item.image && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package
                                className="w-8 h-8 text-[var(--kv-text-muted)]"
                                aria-hidden
                              />
                            </div>
                          )}
                          {/* Stock badge pinned top-right on the image */}
                          <div className="absolute top-2 right-2">
                            <RoyalBadge variant={stockBadgeVariant(item.inStock)}>
                              {item.inStock ? 'In Stock' : 'Out'}
                            </RoyalBadge>
                          </div>
                        </div>

                        {/* Item name (font-bold) */}
                        <p
                          className={`text-sm font-bold truncate ${item.inStock ? 'text-white' : 'text-[var(--kv-text-secondary)]'}`}
                        >
                          {item.name}
                        </p>

                        {/* Price (kv-gradient-gold) + sale price if applicable */}
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="font-extrabold kv-gradient-gold text-sm">
                            {formatNaira(item.salePrice ?? item.price)}
                          </span>
                          {item.originalPrice && item.salePrice && item.originalPrice > item.salePrice && (
                            <span className="text-xs text-[var(--kv-text-muted)] line-through">
                              {formatNaira(item.originalPrice)}
                            </span>
                          )}
                        </div>

                        {/* Meta row: category + delivery time */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <RoyalBadge variant="neutral">{item.category}</RoyalBadge>
                          {item.deliveryTime && (
                            <span className="text-[10px] text-[var(--kv-text-tertiary)] font-semibold">
                              {item.deliveryTime}
                            </span>
                          )}
                          {item.rating > 0 && (
                            <span className="text-[10px] text-[var(--kv-gold)] font-bold">
                              ★ {item.rating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Availability toggle (preserves legacy) */}
                        <div className="flex items-center justify-between mt-3 pt-3 kv-divider">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-bold"
                              style={{
                                color: item.inStock
                                  ? 'var(--kv-emerald)'
                                  : 'var(--kv-danger)',
                              }}
                            >
                              {item.inStock ? 'Available' : 'Unavailable'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleAvailability(item)}
                              disabled={isBusy}
                              className="relative w-12 h-6 rounded-full transition-all duration-300 disabled:opacity-60"
                              style={{
                                background: item.inStock
                                  ? 'var(--kv-emerald)'
                                  : 'rgba(255, 255, 255, 0.10)',
                              }}
                              aria-label="Toggle availability"
                              aria-pressed={item.inStock}
                            >
                              <motion.div
                                animate={{ x: item.inStock ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                              />
                            </button>
                          </div>
                        </div>

                        {/* Action row: Edit + Delete (kv-btn-ghost) */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            disabled={isBusy}
                            className="kv-btn kv-btn-ghost flex-1 text-xs py-2 min-h-[36px] flex items-center justify-center gap-1.5"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            disabled={isBusy}
                            className="kv-btn kv-btn-ghost flex-1 text-xs py-2 min-h-[36px] flex items-center justify-center gap-1.5"
                            style={{ color: 'var(--kv-danger)' }}
                            aria-label={`Delete ${item.name}`}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" aria-hidden />
                            )}
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ─────────────────────── Cancel-edit floating X (preserves legacy) ─────────────────────── */}
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="fixed bottom-24 left-6 w-12 h-12 rounded-full bg-[var(--kv-glass)] border border-[var(--kv-glass-border)] flex items-center justify-center z-40"
            aria-label="Cancel edit"
          >
            <X className="w-5 h-5 text-[var(--kv-text-tertiary)]" aria-hidden />
          </button>
        )}
      </main>

      {/* ─────────────────────── Delete confirmation (kv-backdrop) ─────────────────────── */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="kv-backdrop flex items-end sm:items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm product deletion"
            onClick={() => !busyId && setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="kv-card kv-card-royal w-full max-w-md p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <Trash2
                    className="w-5 h-5"
                    style={{ color: 'var(--kv-danger)' }}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white text-base font-bold">Delete Product</h3>
                  <p className="text-[var(--kv-text-tertiary)] text-xs mt-1">
                    This action cannot be undone. The item will be removed from your
                    menu immediately.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={busyId === confirmDeleteId}
                  className="kv-btn kv-btn-ghost flex-1 text-sm py-3 min-h-[44px] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={busyId === confirmDeleteId}
                  className="kv-btn flex-1 text-sm py-3 min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{
                    background: 'rgba(239, 68, 68, 0.20)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: 'var(--kv-danger)',
                  }}
                >
                  {busyId === confirmDeleteId ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="w-4 h-4" aria-hidden />
                  )}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </KingdomShell>
  );
}
