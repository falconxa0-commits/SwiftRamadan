'use client';

import { Minus, Plus, Trash2, ShoppingBag, Tag, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNaira } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function CartTab() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useAppStore();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 5000 ? 0 : 500;
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = () => {
    if (coupon.toLowerCase() === 'ramadan' || coupon.toLowerCase() === 'iftar') {
      setCouponApplied(true);
      toast({ title: 'Coupon Applied! 🎉', description: '10% discount added to your order' });
    } else if (coupon.trim()) {
      toast({ title: 'Invalid Coupon', description: 'Try "RAMADAN" or "IFTAR" for 10% off' });
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    useAppStore.getState().setCheckoutStep(0);
    useAppStore.getState().setActiveModal('checkout');
  };

  if (cartItems.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <p className="text-white/50 text-sm">Items ready for checkout</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-24 h-24 bg-[#1A1D26] rounded-full flex items-center justify-center mb-6 border border-white/5">
            <ShoppingBag className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-white text-lg font-bold mb-2">Your cart is empty</h3>
          <p className="text-white/40 text-sm text-center mb-6">
            Discover Iftar meals, Sahur boxes, and more to add to your cart
          </p>
          <button
            onClick={() => useAppStore.getState().setActiveTab('home')}
            className="bg-[#13ec13] text-[#05070A] font-bold py-3 px-8 rounded-xl text-sm"
          >
            Browse Menu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="px-4 pt-6 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <p className="text-white/50 text-sm">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            clearCart();
            setCouponApplied(false);
            toast({ title: 'Cart Cleared', description: 'All items removed from cart' });
          }}
          className="text-red-400 text-xs font-bold uppercase tracking-wider hover:text-red-300 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="px-4 mt-4 space-y-3">
        <AnimatePresence>
          {cartItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className="flex gap-4 p-4 bg-[#1A1D26] rounded-2xl border border-white/5"
            >
              <div
                className="w-20 h-20 rounded-xl bg-center bg-no-repeat bg-cover shrink-0 border border-white/10"
                style={{ backgroundImage: `url("${item.image}")` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-bold text-sm truncate pr-2">{item.name}</h4>
                  <button
                    onClick={() => {
                      removeFromCart(item.id);
                      toast({ title: 'Removed', description: `${item.name} removed from cart` });
                    }}
                    className="shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
                  </button>
                </div>
                <p className="text-[#13ec13] font-bold text-sm mt-1">{formatNaira(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-3 h-3 text-white" />
                  </button>
                  <span className="text-white font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
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

      {/* Coupon Code */}
      <div className="px-4 mt-6">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-[#1A1D26] rounded-xl border border-white/5 px-3">
            <Tag className="w-4 h-4 text-white/30 shrink-0" />
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 bg-transparent text-white text-sm py-3 px-2 focus:outline-none placeholder:text-white/30"
              disabled={couponApplied}
            />
          </div>
          <button
            onClick={handleApplyCoupon}
            disabled={couponApplied}
            className="bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] px-4 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#13ec13]/20 transition-colors"
          >
            {couponApplied ? 'Applied' : 'Apply'}
          </button>
        </div>
        {couponApplied && (
          <p className="text-[#13ec13] text-xs mt-2">✓ 10% discount applied with code: {coupon}</p>
        )}
        <p className="text-white/30 text-[10px] mt-2">Try &quot;RAMADAN&quot; or &quot;IFTAR&quot; for 10% off</p>
      </div>

      {/* Order Summary */}
      <div className="px-4 mt-6">
        <div className="bg-[#1A1D26] rounded-2xl p-5 border border-white/5 space-y-3">
          <h3 className="text-white font-bold text-sm mb-3">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white font-bold">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Delivery Fee</span>
            <span className={deliveryFee === 0 ? 'text-[#13ec13] font-bold' : 'text-white font-bold'}>
              {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
            </span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-sm">
              <span className="text-[#13ec13]">Discount (10%)</span>
              <span className="text-[#13ec13] font-bold">-{formatNaira(discount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <p className="text-[#13ec13]/60 text-[10px]">
              Free delivery on orders above ₦5,000 (add {formatNaira(5000 - subtotal)} more)
            </p>
          )}
          <div className="h-px bg-white/5 my-2" />
          <div className="flex justify-between">
            <span className="text-white font-bold">Total</span>
            <span className="text-[#13ec13] font-black text-lg">{formatNaira(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-4 mt-6 mb-6">
        <button
          onClick={handleCheckout}
          className="w-full bg-[#13ec13] py-4 rounded-2xl text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-[#13ec13]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          PROCEED TO CHECKOUT &bull; {formatNaira(total)}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}
