'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  AlertTriangle,
  ShoppingBag,
  Package,
  TrendingUp,
  Star,
  Eye,
  Trash2,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import { formatNaira } from '@/lib/data';
import { useAppStore, useNavigation, useUserEmail } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────── Types ──────────────────── */

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

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function VendorStoreTab() {
  const { toast } = useToast();
  const { setActiveModal } = useNavigation();
  const userEmail = useUserEmail();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VendorProduct>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | undefined>(undefined);

  const categories: CategoryFilter[] = ['All', 'meals', 'snacks', 'drinks', 'desserts', 'groceries'];

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/vendor/products?vendorEmail=${encodeURIComponent(userEmail || '')}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.products)) {
        setProducts(json.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
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

  // Listen for cross-component refresh signals (e.g. when VendorAddProductModal adds a product)
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

  /* ── Filtered items ── */
  const filteredItems =
    activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory);

  const unavailableCount = products.filter((p) => !p.inStock).length;
  const totalOrders = products.reduce((sum, _p) => sum + 0, 0); // orders count not in DB schema; placeholder

  /* ── Toggle inStock ── */
  const toggleAvailability = async (product: VendorProduct) => {
    setBusyId(product.id);
    const nextStock = !product.inStock;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, inStock: nextStock } : p))
    );
    try {
      const res = await fetch(
        `/api/vendor/products?id=${product.id}&vendorEmail=${encodeURIComponent(userEmail || '')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inStock: nextStock }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Update failed');
      toast({
        title: nextStock ? 'Item Available ✅' : 'Item Unavailable ❌',
        description: `${product.name} is now ${nextStock ? 'visible to customers' : 'hidden from customers'}`,
      });
    } catch (err) {
      // Revert
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, inStock: !nextStock } : p))
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

  /* ── Save edit ── */
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
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Update failed');
      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...json.product } : p))
      );
      toast({
        title: 'Product Updated ✅',
        description: `${json.product.name} has been updated`,
      });
      cancelEdit();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: 'Could not save changes.',
        variant: 'destructive',
      });
    } finally {
      setBusyId(undefined);
    }
  };

  /* ── Delete product ── */
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setBusyId(confirmDeleteId);
    try {
      const res = await fetch(
        `/api/vendor/products?id=${confirmDeleteId}&vendorEmail=${encodeURIComponent(userEmail || '')}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      setProducts((prev) => prev.filter((p) => p.id !== confirmDeleteId));
      toast({
        title: 'Product Deleted',
        description: 'Item removed from your menu',
        variant: 'destructive',
      });
    } catch (err) {
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

  /* ── Render ── */
  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="flex flex-col gap-5 px-4 pt-2">
        {/* Stock Alert */}
        <AnimatePresence>
          {unavailableCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 sm:p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/20 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 text-sm font-bold">Stock Alert</p>
                  <p className="text-white/65 text-xs mt-0.5">
                    {unavailableCount} item{unavailableCount > 1 ? 's' : ''} currently unavailable —
                    customers can&apos;t order them
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
        >
          <div className="bg-[var(--sr-surface-raised)] rounded-xl p-3 border border-white/5 text-center">
            <p className="text-[var(--sr-vendor)] text-lg font-black">{products.length}</p>
            <p className="text-white/60 text-[9px] font-bold uppercase">Menu Items</p>
          </div>
          <div className="bg-[var(--sr-surface-raised)] rounded-xl p-3 border border-white/5 text-center">
            <p className="text-[var(--sr-customer)] text-lg font-black">{products.filter((i) => i.inStock).length}</p>
            <p className="text-white/60 text-[9px] font-bold uppercase">Available</p>
          </div>
          <div className="bg-[var(--sr-surface-raised)] rounded-xl p-3 border border-white/5 text-center">
            <p className="text-white text-lg font-black">{totalOrders.toLocaleString()}</p>
            <p className="text-white/60 text-[9px] font-bold uppercase">Total Orders</p>
          </div>
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-white text-lg font-black">Menu Items</h2>
            <span className="px-2 py-0.5 rounded-full bg-[var(--sr-vendor)]/20 text-[var(--sr-vendor)] text-[10px] font-black border border-[var(--sr-vendor)]/20">
              {products.length}
            </span>
          </div>
          <button
            onClick={() => setActiveModal('vendor-stock')}
            className="text-[var(--sr-vendor)] text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            Stock Control <Package className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Add Product CTA (top) */}
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => useAppStore.getState().setActiveModal('vendor-add-product')}
          className="w-full py-3 rounded-2xl bg-[var(--sr-vendor)] text-[#06070B] text-sm font-bold hover:bg-[var(--sr-vendor)]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 gold-glow"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add New Product
        </motion.button>

        {/* Category Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 capitalize ${
                activeCategory === cat
                  ? 'bg-[var(--sr-vendor)]/20 text-[var(--sr-vendor)] border border-[var(--sr-vendor)]/30'
                  : 'bg-[var(--sr-surface-raised)] text-white/65 border border-white/5 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Loader2 className="w-8 h-8 text-[var(--sr-vendor)] animate-spin mb-3" />
            <p className="text-white/65 text-sm font-semibold">Loading your menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--sr-vendor)]/10 flex items-center justify-center mb-4 border border-[var(--sr-vendor)]/20">
              <ShoppingBag className="w-8 h-8 text-[var(--sr-vendor)]/50" />
            </div>
            <p className="text-white/50 text-sm font-bold">No products yet</p>
            <p className="text-white/25 text-xs mt-1">
              Add your first product to start selling this Ramadan
            </p>
            <button
              onClick={() => useAppStore.getState().setActiveModal('vendor-add-product')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--sr-vendor)] text-[#06070B] text-xs font-bold hover:bg-[var(--sr-vendor)]/90 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              Add your first product
            </button>
          </div>
        ) : (
          /* Menu Item Cards */
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, i) => {
                const isEditing = editingId === item.id;
                const isBusy = busyId === item.id;
                const isConfirmDelete = confirmDeleteId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl bg-[var(--sr-surface-raised)] border p-3 sm:p-4 transition-all ${
                      item.inStock ? 'border-white/5' : 'border-red-500/20 opacity-70'
                    }`}
                  >
                    {isEditing ? (
                      /* ── Inline Edit Form ── */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-[var(--sr-vendor)] text-sm font-bold">Edit Item</h3>
                          <button
                            onClick={cancelEdit}
                            className="text-white/60 text-xs hover:text-white/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Item name"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full bg-[var(--sr-surface-base)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors"
                        />
                        <textarea
                          placeholder="Description"
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          rows={2}
                          className="w-full bg-[var(--sr-surface-base)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors resize-none"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="number"
                            placeholder="Price (₦)"
                            value={editForm.price ?? ''}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, price: Number(e.target.value) }))
                            }
                            className="w-full bg-[var(--sr-surface-base)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors"
                          />
                          <select
                            value={editForm.category || 'meals'}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                            className="w-full bg-[var(--sr-surface-base)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors"
                          >
                            {categories.filter((c) => c !== 'All').map((c) => (
                              <option key={c} value={c} className="bg-[var(--sr-surface-raised)]">
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={editForm.image || ''}
                          onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
                          className="w-full bg-[var(--sr-surface-base)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Delivery time (e.g. 25 min)"
                          value={editForm.deliveryTime || ''}
                          onChange={(e) => setEditForm((f) => ({ ...f, deliveryTime: e.target.value }))}
                          className="w-full bg-[var(--sr-surface-base)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors"
                        />
                        <button
                          onClick={() => saveEdit(item.id)}
                          disabled={isBusy}
                          className="w-full py-3 rounded-xl bg-[var(--sr-vendor)] text-[#06070B] text-sm font-bold hover:bg-[var(--sr-vendor)]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" strokeWidth={3} />
                          )}
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      /* ── Normal Item View ── */
                      <>
                        <div className="flex items-start gap-3">
                          {/* Item Image Thumbnail */}
                          <div
                            className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 border border-white/10 bg-white/5"
                            style={
                              item.image
                                ? { backgroundImage: `url(${item.image})` }
                                : undefined
                            }
                          >
                            {!item.image && (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-white/20" />
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-bold truncate ${
                                    item.inStock ? 'text-white' : 'text-white/50'
                                  }`}
                                >
                                  {item.name}
                                </p>
                                <p className="text-[var(--sr-vendor)] text-xs font-black mt-0.5">
                                  {formatNaira(item.price)}
                                </p>
                              </div>
                              {/* Edit Button */}
                              <button
                                onClick={() => startEdit(item)}
                                disabled={isBusy}
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 hover:bg-white/10 transition-all disabled:opacity-50"
                                aria-label="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5 text-white/65" />
                              </button>
                            </div>

                            {/* Item Stats */}
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3 text-white/60" />
                                <span className="text-white/60 text-[10px] font-semibold">
                                  {item.reviewCount} reviews
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-[var(--sr-customer)]/40" />
                                <span className="text-[var(--sr-customer)]/40 text-[10px] font-semibold">
                                  ⭐ {item.rating.toFixed(1)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-[var(--sr-vendor)]/40" />
                                <span className="text-[var(--sr-vendor)]/40 text-[10px] font-semibold">
                                  {item.deliveryTime}
                                </span>
                              </div>
                            </div>

                            {/* Category Badge */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/65 text-[10px] font-semibold capitalize">
                                {item.category}
                              </span>
                              {item.inStock && (
                                <span className="flex items-center gap-1 text-[var(--sr-customer)]/50 text-[9px]">
                                  <Eye className="w-2.5 h-2.5" />
                                  Visible
                                </span>
                              )}
                            </div>

                            {/* Availability Toggle + Delete */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    item.inStock ? 'text-[var(--sr-customer)]' : 'text-red-400'
                                  }`}
                                >
                                  {item.inStock ? 'Available' : 'Unavailable'}
                                </span>
                                <button
                                  onClick={() => toggleAvailability(item)}
                                  disabled={isBusy}
                                  className={`relative w-12 h-6 rounded-full transition-all duration-300 disabled:opacity-60 ${
                                    item.inStock ? 'bg-[var(--sr-customer)]' : 'bg-white/10'
                                  }`}
                                  aria-label="Toggle availability"
                                >
                                  <motion.div
                                    animate={{ x: item.inStock ? 24 : 2 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                                  />
                                </button>
                              </div>
                              {isConfirmDelete ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 text-[10px] font-bold border border-white/10"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={confirmDelete}
                                    disabled={isBusy}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 flex items-center gap-1 disabled:opacity-60"
                                  >
                                    {isBusy ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                    Confirm
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  disabled={isBusy}
                                  className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all disabled:opacity-50"
                                  aria-label="Delete"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Add New Item FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
          onClick={() => useAppStore.getState().setActiveModal('vendor-add-product')}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[var(--sr-vendor)] flex items-center justify-center shadow-lg z-40 gold-glow active:scale-95 transition-transform"
          aria-label="Add product"
        >
          <Plus className="w-6 h-6 text-[#06070B]" strokeWidth={3} />
        </motion.button>

        {/* Cancel-edit floating X (in case inline edit open + scroll) */}
        {editingId && (
          <button
            onClick={cancelEdit}
            className="fixed bottom-24 left-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center z-40"
            aria-label="Cancel edit"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>
    </main>
  );
}
