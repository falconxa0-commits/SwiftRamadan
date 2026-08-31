'use client';

/**
 * KingdomCartTab — Auren Kingdom V2 reinterpretation of the legacy SwiftRamadan CartTab.
 *
 * Same store hooks (useCart, useCartCount, useAppStore.getState().setActiveModal,
 * useAppStore.getState().setCheckoutStep, useAppStore.getState().setActiveTab)
 * and the same data import (formatNaira from @/lib/data) are preserved. The
 * visual layer is completely replaced with the Kingdom V2 design system
 * (KingdomShell, kv-card / kv-list-item / kv-stagger / kv-gradient-gold /
 * kv-btn-gold / kv-empty / kv-metric-value / kv-accent-line).
 *
 * V2 spec sections:
 *  1. KingdomShell root
 *  2. Title "Provision Basket" with kv-gradient-text + kv-accent-line
 *  3. Cart items as kv-list-item wrapped in kv-card
 *  4. Quantity controls: 44px+ touch targets, kv-btn-ghost style
 *  5. Each item: image + name + price (kv-gradient-gold) + quantity
 *  6. Order summary in kv-card-gold
 *  7. Total: kv-metric-value + kv-metric-label
 *  8. Checkout button: kv-btn-gold "Prepare Your Iftar"
 *  9. Empty state: kv-empty with story ("Your basket is waiting. Safa can help you fill it.")
 * 10. kv-stagger entrance on items
 * 11. Mobile-first layout
 * 12. Same store hooks preserved (cartItems, cartCount, updateQuantity,
 *     removeFromCart, setActiveModal)
 * 13. Coupon validate API call to /api/coupons/validate (legacy behaviour preserved)
 *
 * The legacy `src/components/swift/CartTab.tsx` is untouched.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useCart, useCartCount } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { KingdomShell } from '../components';

/* ─────────────────────── Local coupon state ─────────────────────── */
interface AppliedCouponData {
  discount: number;
  type: string;
  value: number;
  message: string;
}

export function KingdomCartTab() {
  /* ── SAME store hooks preserved ── */
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const cartCount = useCartCount();
  const { toast } = useToast();

  /* ── Coupon state (mirrors legacy behaviour) ── */
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [appliedCouponData, setAppliedCouponData] =
    useState<AppliedCouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  /* ── Calculations (identical to legacy) ── */
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const serviceFee = Math.round(subtotal * 0.02);
  const deliveryFee = subtotal >= 5000 ? 0 : 500;
  // Effective coupon state — coupon is void if cart is empty
  const effectiveCouponApplied =
    couponApplied && cartItems.length > 0 && appliedCouponData !== null;
  const discount = effectiveCouponApplied ? appliedCouponData!.discount : 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  /* ── Coupon handlers (identical to legacy) ── */
  const handleApplyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });
      const data = await res.json();

      if (data.valid) {
        setCouponApplied(true);
        setAppliedCouponCode(code.toUpperCase());
        setAppliedCouponData({
          discount: data.discount,
          type: data.type,
          value: data.value,
          message: data.message,
        });
        toast({ title: 'Coupon Applied! 🎉', description: data.message });
      } else {
        toast({
          title: 'Invalid Coupon',
          description: data.message || 'This coupon code is not valid',
        });
      }
    } catch {
      toast({
        title: 'Validation Failed',
        description: 'Could not validate coupon. Please try again.',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setAppliedCouponCode('');
    setAppliedCouponData(null);
    setCoupon('');
    toast({ title: 'Coupon Removed', description: 'Discount has been removed' });
  };

  /* ── Checkout handler — SAME store hook usage as legacy ── */
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    useAppStore.getState().setCheckoutStep(0);
    useAppStore.getState().setActiveModal('checkout');
  };

  /* ─────────────────────── Empty cart state ─────────────────────── */
  if (cartItems.length === 0) {
    return (
      <KingdomShell>
        <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
              Provision Basket
            </h1>
            <div className="kv-accent-line mt-3" />
            <p className="text-xs text-[var(--kv-text-tertiary)] mt-2">
              Items ready for checkout
            </p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="kv-card kv-empty"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                damping: 14,
                stiffness: 180,
                delay: 0.1,
              }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 kv-gold-glow"
              style={{ background: 'var(--kv-gold-light)' }}
            >
              <ShoppingBag
                className="w-9 h-9 text-[var(--kv-gold)] relative z-10"
                aria-hidden
              />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-lg font-bold tracking-tight"
            >
              Your basket is waiting
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[var(--kv-text-secondary)] text-sm text-center max-w-xs"
            >
              Your basket is waiting. Safa can help you fill it.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              type="button"
              onClick={() => useAppStore.getState().setActiveTab('explore')}
              className="kv-btn kv-btn-gold mt-2 text-sm py-3 px-6 min-h-[48px] flex items-center gap-2"
            >
              Browse Menu
              <ChevronRight className="w-4 h-4" aria-hidden />
            </motion.button>
          </motion.div>
        </main>
      </KingdomShell>
    );
  }

  /* ─────────────────────── Populated cart ─────────────────────── */
  return (
    <KingdomShell>
      <main className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* ─────────────────────── Title ─────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-between items-start mb-6"
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight kv-gradient-text">
              Provision Basket
            </h1>
            <div className="kv-accent-line mt-3" />
            <p className="text-xs text-[var(--kv-text-tertiary)] mt-2">
              {cartCount} item{cartCount !== 1 ? 's' : ''} ready for checkout
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearCart();
              setCouponApplied(false);
              setAppliedCouponCode('');
              setAppliedCouponData(null);
              toast({
                title: 'Cart Cleared',
                description: 'All items removed from cart',
              });
            }}
            className="text-[var(--kv-danger)] text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
            aria-label="Clear all items from cart"
          >
            Clear All
          </button>
        </motion.header>

        {/* ─────────────────────── Cart items ─────────────────────── */}
        <div className="kv-stagger space-y-3">
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="kv-card kv-list-item flex gap-3 sm:gap-4 p-3 sm:p-4 items-start"
              >
                {/* Item image */}
                <div
                  className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0 border border-white/10 cursor-pointer"
                  style={{ backgroundImage: `url("${item.image}")` }}
                  onClick={() => {
                    useAppStore.getState().setSelectedProduct(item.id);
                    useAppStore.getState().setActiveModal('product');
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${item.name}`}
                />

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4
                      className="text-white font-bold text-sm truncate cursor-pointer hover:text-[var(--kv-mystic)] transition-colors tracking-tight"
                      onClick={() => {
                        useAppStore.getState().setSelectedProduct(item.id);
                        useAppStore.getState().setActiveModal('product');
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {item.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        removeFromCart(item.id);
                        toast({
                          title: 'Removed',
                          description: `${item.name} removed from cart`,
                        });
                      }}
                      className="shrink-0 p-1.5 hover:bg-[var(--kv-glass-hover)] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2
                        className="w-4 h-4 text-[var(--kv-danger)]/80 hover:text-[var(--kv-danger)]"
                        aria-hidden
                      />
                    </button>
                  </div>

                  <p className="kv-gradient-gold font-extrabold text-sm mt-1">
                    {formatNaira(item.price)}
                  </p>

                  {/* Quantity controls — 44px+ touch targets, kv-btn-ghost */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="kv-btn kv-btn-ghost !min-h-[44px] !min-w-[44px] !p-0 !rounded-xl flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4 text-white" aria-hidden />
                    </button>
                    <span
                      className="text-white font-bold text-base min-w-[28px] text-center select-none"
                      aria-live="polite"
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="kv-btn kv-btn-ghost !min-h-[44px] !min-w-[44px] !p-0 !rounded-xl flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4 text-white" aria-hidden />
                    </button>
                    <span className="text-[var(--kv-text-tertiary)] text-xs ml-auto font-semibold">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ─────────────────────── Continue shopping ─────────────────────── */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => useAppStore.getState().setActiveTab('home')}
            className="w-full flex items-center justify-center gap-2 text-[var(--kv-text-tertiary)] hover:text-[var(--kv-mystic)] text-xs font-bold py-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Continue shopping
          </button>
        </div>

        {/* ─────────────────────── Coupon code ─────────────────────── */}
        <div className="mt-6">
          {couponApplied ? (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 kv-card-gold"
              style={{ background: 'var(--kv-gold-light)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(212, 175, 55, 0.18)' }}
              >
                <Tag className="w-4 h-4 text-[var(--kv-gold)] relative z-10" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--kv-gold)] text-sm font-bold uppercase font-mono tracking-wider">
                  {appliedCouponCode}
                </p>
                <p className="text-[var(--kv-gold)]/70 text-[10px] truncate">
                  {appliedCouponData?.message || 'Discount applied'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-[var(--kv-text-secondary)] text-xs font-bold hover:text-[var(--kv-danger)] transition-colors min-h-[36px] px-2"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center kv-card rounded-xl px-3 !py-0">
                <Tag
                  className="w-4 h-4 text-[var(--kv-text-tertiary)] shrink-0"
                  aria-hidden
                />
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !couponLoading) handleApplyCoupon();
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1 bg-transparent text-white text-sm py-3 px-2 focus:outline-none placeholder:text-[var(--kv-text-muted)] min-h-[44px]"
                  aria-label="Coupon code input"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!coupon.trim() || couponLoading}
                className="kv-btn kv-btn-ghost !min-h-[44px] px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {couponLoading ? (
                  <span className="w-4 h-4 border-2 border-[var(--kv-mystic)]/30 border-t-[var(--kv-mystic)] rounded-full animate-spin" />
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          )}
          {!couponApplied && (
            <p className="text-[var(--kv-text-tertiary)] text-[10px] mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
              Have a coupon? Enter it above for a discount
            </p>
          )}
        </div>

        {/* ─────────────────────── Order summary (kv-card-gold) ─────────────────────── */}
        <div className="mt-6">
          <div className="kv-card kv-card-gold p-5 space-y-3">
            <h3 className="text-white font-bold text-sm tracking-tight uppercase">
              Order Summary
            </h3>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--kv-text-tertiary)]">Subtotal</span>
              <span className="text-white font-bold">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--kv-text-tertiary)]">Delivery Fee</span>
              <span
                className={
                  deliveryFee === 0
                    ? 'kv-gradient-gold font-bold'
                    : 'text-white font-bold'
                }
              >
                {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--kv-text-tertiary)]">Service Fee</span>
              <span className="text-white font-bold">{formatNaira(serviceFee)}</span>
            </div>
            {effectiveCouponApplied && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--kv-gold)]">
                  Discount
                  {appliedCouponData?.type === 'percent'
                    ? ` (${appliedCouponData.value}%)`
                    : ''}
                </span>
                <span className="text-[var(--kv-gold)] font-bold">
                  -{formatNaira(discount)}
                </span>
              </div>
            )}
            {deliveryFee > 0 && (
              <p className="text-[var(--kv-gold)]/70 text-[10px]">
                Free delivery on orders above ₦5,000 (add{' '}
                {formatNaira(5000 - subtotal)} more)
              </p>
            )}
            <div className="kv-divider my-2" />
            {/* Total — kv-metric-value + kv-metric-label */}
            <div className="flex items-end justify-between">
              <div>
                <p className="kv-metric-label">Total Due</p>
                <p className="kv-metric-value kv-gradient-gold mt-1">
                  {formatNaira(total)}
                </p>
              </div>
              <span className="text-[10px] text-[var(--kv-text-tertiary)] uppercase tracking-wider">
                Inclusive of fees
              </span>
            </div>
          </div>
        </div>

        {/* ─────────────────────── Checkout button (kv-btn-gold) ─────────────────────── */}
        <div className="mt-6 mb-6">
          <button
            type="button"
            onClick={handleCheckout}
            className="kv-btn kv-btn-gold w-full !py-4 text-sm uppercase tracking-widest font-extrabold flex items-center justify-center gap-2"
          >
            Prepare Your Iftar · {formatNaira(total)}
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </main>
    </KingdomShell>
  );
}
