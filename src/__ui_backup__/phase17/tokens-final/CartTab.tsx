'use client';

import { Minus, Plus, Trash2, ShoppingBag, Tag, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useCart } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface AppliedCouponData {
  discount: number;
  type: string;
  value: number;
  message: string;
}

export default function CartTab() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [appliedCouponData, setAppliedCouponData] = useState<AppliedCouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceFee = Math.round(subtotal * 0.02);
  const deliveryFee = subtotal >= 5000 ? 0 : 500;
  // Effective coupon state - coupon is void if cart is empty
  const effectiveCouponApplied = couponApplied && cartItems.length > 0 && appliedCouponData !== null;
  const discount = effectiveCouponApplied ? appliedCouponData!.discount : 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

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
        toast({ title: 'Invalid Coupon', description: data.message || 'This coupon code is not valid' });
      }
    } catch {
      toast({ title: 'Validation Failed', description: 'Could not validate coupon. Please try again.' });
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

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    useAppStore.getState().setCheckoutStep(0);
    useAppStore.getState().setActiveModal('checkout');
  };

  if (cartItems.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-5 pt-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight heading-accent">Your Cart</h1>
          <p className="text-white/50 text-sm mt-1">Items ready for checkout</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-20 px-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
            className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center mb-6 icon-tile float-soft"
            style={{ boxShadow: '0 0 28px rgba(16,224,122,0.18)' }}
          >
            <ShoppingBag className="w-10 h-10 text-[var(--sr-customer)] relative z-10" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-lg font-bold mb-2 tracking-tight"
          >
            Your cart is empty
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/65 text-sm text-center mb-6 max-w-xs"
          >
            Add some delicious meals — Iftar boxes, Sahur essentials, and more await.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => useAppStore.getState().setActiveTab('explore')}
            className="bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold py-3 px-8 rounded-xl text-sm active:scale-[0.98] transition-transform green-glow flex items-center gap-2"
          >
            Browse Menu
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="px-5 pt-6 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight heading-accent">Your Cart</h1>
          <p className="text-white/50 text-sm mt-1">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            clearCart();
            setCouponApplied(false);
            setAppliedCouponCode('');
            setAppliedCouponData(null);
            toast({ title: 'Cart Cleared', description: 'All items removed from cart' });
          }}
          className="text-[var(--sr-error)] text-xs font-bold uppercase tracking-wider hover:text-[var(--sr-error)]/80 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="px-5 mt-4 space-y-3">
        <AnimatePresence>
          {cartItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className="flex gap-3 sm:gap-4 p-3 sm:p-4 glass-card rounded-2xl"
            >
              <div
                className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0 border border-white/10 cursor-pointer"
                style={{ backgroundImage: `url("${item.image}")` }}
                onClick={() => {
                  useAppStore.getState().setSelectedProduct(item.id);
                  useAppStore.getState().setActiveModal('product');
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4
                    className="text-white font-bold text-sm truncate pr-2 cursor-pointer hover:text-[var(--sr-customer)] transition-colors tracking-tight"
                    onClick={() => {
                      useAppStore.getState().setSelectedProduct(item.id);
                      useAppStore.getState().setActiveModal('product');
                    }}
                  >
                    {item.name}
                  </h4>
                  <button
                    onClick={() => {
                      removeFromCart(item.id);
                      toast({ title: 'Removed', description: `${item.name} removed from cart` });
                    }}
                    className="shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 className="w-4 h-4 text-[var(--sr-error)]/60 hover:text-[var(--sr-error)]" />
                  </button>
                </div>
                <p className="text-[var(--sr-customer)] font-bold text-sm mt-1">{formatNaira(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 text-white" />
                  </button>
                  <span className="text-white font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3 text-white" />
                  </button>
                  <span className="text-white/65 text-xs ml-auto">{formatNaira(item.price * item.quantity)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Continue Shopping */}
      <div className="px-5 mt-4">
        <button
          onClick={() => useAppStore.getState().setActiveTab('home')}
          className="w-full flex items-center justify-center gap-2 text-white/50 hover:text-[var(--sr-customer)] text-xs font-bold py-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Continue shopping
        </button>
      </div>

      {/* Coupon Code */}
      <div className="px-5 mt-6">
        {couponApplied ? (
          <div className="flex items-center gap-3 bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--sr-customer)]/15 flex items-center justify-center icon-tile shrink-0">
              <Tag className="w-4 h-4 text-[var(--sr-customer)] relative z-10" />
            </div>
            <div className="flex-1">
              <p className="text-[var(--sr-customer)] text-sm font-bold uppercase font-mono">{appliedCouponCode}</p>
              <p className="text-[var(--sr-customer)]/60 text-[10px]">{appliedCouponData?.message || 'Discount applied'}</p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-white/65 text-xs font-bold hover:text-[var(--sr-error)] transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center glass-card rounded-xl px-3">
              <Tag className="w-4 h-4 text-white/60 shrink-0" />
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !couponLoading) handleApplyCoupon(); }}
                placeholder="Enter coupon code"
                className="flex-1 bg-transparent text-white text-sm py-3 px-2 focus:outline-none placeholder:text-white/60"
                aria-label="Coupon code input"
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              disabled={!coupon.trim() || couponLoading}
              className="bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] px-4 rounded-xl font-bold text-sm hover:bg-[var(--sr-customer)]/20 transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--sr-customer)]/10 flex items-center gap-1.5"
            >
              {couponLoading ? (
                <span className="w-4 h-4 border-2 border-[var(--sr-customer)]/30 border-t-[#10E07A] rounded-full animate-spin" />
              ) : (
                'Apply'
              )}
            </button>
          </div>
        )}
        {!couponApplied && (
          <p className="text-white/60 text-[10px] mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--sr-vendor)]" />
            Have a coupon? Enter it above for a discount
          </p>
        )}
      </div>

      {/* Order Summary */}
      <div className="px-5 mt-6">
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-white font-bold text-sm mb-3 tracking-tight">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white font-bold">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Delivery Fee</span>
            <span className={deliveryFee === 0 ? 'text-[var(--sr-customer)] font-bold' : 'text-white font-bold'}>
              {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Service Fee</span>
            <span className="text-white font-bold">{formatNaira(serviceFee)}</span>
          </div>
          {effectiveCouponApplied && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--sr-customer)]">
                Discount{appliedCouponData?.type === 'percent' ? ` (${appliedCouponData.value}%)` : ''}
              </span>
              <span className="text-[var(--sr-customer)] font-bold">-{formatNaira(discount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <p className="text-[var(--sr-customer)]/60 text-[10px]">
              Free delivery on orders above ₦5,000 (add {formatNaira(5000 - subtotal)} more)
            </p>
          )}
          <div className="h-px bg-white/5 my-2" />
          <div className="flex justify-between">
            <span className="text-white font-bold">Total</span>
            <span className="text-[var(--sr-customer)] font-black text-lg">{formatNaira(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-5 mt-6 mb-6">
        <button
          onClick={handleCheckout}
          className="w-full bg-[var(--sr-customer)] py-4 rounded-2xl text-[var(--sr-surface-base)] font-black text-sm uppercase tracking-widest shadow-lg shadow-[var(--sr-customer)]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform green-glow"
        >
          PROCEED TO CHECKOUT &bull; {formatNaira(total)}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}
