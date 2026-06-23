'use client';

import { Minus, Plus, Trash2, ShoppingBag, Tag, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const VALID_COUPONS: Record<string, { discount: number; label: string }> = {
  ramadan: { discount: 0.10, label: '10% off - Ramadan Special' },
  iftar: { discount: 0.10, label: '10% off - Iftar Deal' },
  swift25: { discount: 0.25, label: '25% off - Swift25 Bonus' },
  sahur: { discount: 0.15, label: '15% off - Sahur Special' },
};

export default function CartTab() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useAppStore();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceFee = Math.round(subtotal * 0.02);
  const deliveryFee = subtotal >= 5000 ? 0 : 500;
  // Effective coupon state - coupon is void if cart is empty
  const effectiveCouponApplied = couponApplied && cartItems.length > 0;
  const discountPercent = effectiveCouponApplied ? (VALID_COUPONS[appliedCouponCode]?.discount || 0.10) : 0;
  const discount = effectiveCouponApplied ? Math.round(subtotal * discountPercent) : 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  const handleApplyCoupon = () => {
    const code = coupon.toLowerCase().trim();
    if (VALID_COUPONS[code]) {
      setCouponApplied(true);
      setAppliedCouponCode(code);
      toast({ title: 'Coupon Applied! 🎉', description: VALID_COUPONS[code].label });
    } else if (coupon.trim()) {
      toast({ title: 'Invalid Coupon', description: 'Try "RAMADAN", "IFTAR", "SWIFT25", or "SAHUR" for discounts' });
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setAppliedCouponCode('');
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
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center mb-6 icon-tile float-soft">
            <ShoppingBag className="w-10 h-10 text-white/20 relative z-10" />
          </div>
          <h3 className="text-white text-lg font-bold mb-2 tracking-tight">Your cart is empty</h3>
          <p className="text-white/40 text-sm text-center mb-6 max-w-xs">
            Discover Iftar meals, Sahur boxes, and more to add to your cart
          </p>
          <button
            onClick={() => useAppStore.getState().setActiveTab('explore')}
            className="bg-[#10E07A] text-[#06070B] font-bold py-3 px-8 rounded-xl text-sm active:scale-[0.98] transition-transform green-glow flex items-center gap-2"
          >
            Browse Menu
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
            toast({ title: 'Cart Cleared', description: 'All items removed from cart' });
          }}
          className="text-[#FB7185] text-xs font-bold uppercase tracking-wider hover:text-[#FB7185]/80 transition-colors"
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
              className="flex gap-4 p-4 glass-card rounded-2xl"
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
                    className="text-white font-bold text-sm truncate pr-2 cursor-pointer hover:text-[#10E07A] transition-colors tracking-tight"
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
                    <Trash2 className="w-4 h-4 text-[#FB7185]/60 hover:text-[#FB7185]" />
                  </button>
                </div>
                <p className="text-[#10E07A] font-bold text-sm mt-1">{formatNaira(item.price)}</p>
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
                  <span className="text-white/40 text-xs ml-auto">{formatNaira(item.price * item.quantity)}</span>
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
          className="w-full flex items-center justify-center gap-2 text-white/50 hover:text-[#10E07A] text-xs font-bold py-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Continue shopping
        </button>
      </div>

      {/* Coupon Code */}
      <div className="px-5 mt-6">
        {couponApplied ? (
          <div className="flex items-center gap-3 bg-[#10E07A]/10 border border-[#10E07A]/20 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-[#10E07A]/15 flex items-center justify-center icon-tile shrink-0">
              <Tag className="w-4 h-4 text-[#10E07A] relative z-10" />
            </div>
            <div className="flex-1">
              <p className="text-[#10E07A] text-sm font-bold uppercase font-mono">{appliedCouponCode}</p>
              <p className="text-[#10E07A]/60 text-[10px]">{VALID_COUPONS[appliedCouponCode]?.label || 'Discount applied'}</p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-white/40 text-xs font-bold hover:text-[#FB7185] transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center glass-card rounded-xl px-3">
              <Tag className="w-4 h-4 text-white/30 shrink-0" />
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                placeholder="Enter coupon code"
                className="flex-1 bg-transparent text-white text-sm py-3 px-2 focus:outline-none placeholder:text-white/30"
                aria-label="Coupon code input"
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              className="bg-[#10E07A]/10 border border-[#10E07A]/20 text-[#10E07A] px-4 rounded-xl font-bold text-sm hover:bg-[#10E07A]/20 transition-colors active:scale-95"
            >
              Apply
            </button>
          </div>
        )}
        {!couponApplied && (
          <p className="text-white/30 text-[10px] mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F5C451]" />
            Try &quot;RAMADAN&quot;, &quot;IFTAR&quot;, &quot;SWIFT25&quot;, or &quot;SAHUR&quot;
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
            <span className={deliveryFee === 0 ? 'text-[#10E07A] font-bold' : 'text-white font-bold'}>
              {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Service Fee</span>
            <span className="text-white font-bold">{formatNaira(serviceFee)}</span>
          </div>
          {effectiveCouponApplied && (
            <div className="flex justify-between text-sm">
              <span className="text-[#10E07A]">Discount ({Math.round(discountPercent * 100)}%)</span>
              <span className="text-[#10E07A] font-bold">-{formatNaira(discount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <p className="text-[#10E07A]/60 text-[10px]">
              Free delivery on orders above ₦5,000 (add {formatNaira(5000 - subtotal)} more)
            </p>
          )}
          <div className="h-px bg-white/5 my-2" />
          <div className="flex justify-between">
            <span className="text-white font-bold">Total</span>
            <span className="text-[#10E07A] font-black text-lg">{formatNaira(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-5 mt-6 mb-6">
        <button
          onClick={handleCheckout}
          className="w-full bg-[#10E07A] py-4 rounded-2xl text-[#06070B] font-black text-sm uppercase tracking-widest shadow-lg shadow-[#10E07A]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform green-glow"
        >
          PROCEED TO CHECKOUT &bull; {formatNaira(total)}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}
