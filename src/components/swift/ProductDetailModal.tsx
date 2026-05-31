'use client';

import { X, Star, Clock, Shield, Truck, Minus, Plus, ChevronRight, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { ramadanBox, formatNaira } from '@/lib/data';
import { useState } from 'react';

export default function ProductDetailModal() {
  const { activeModal, setActiveModal, setCartCount, cartCount } = useAppStore();
  const [quantity, setQuantity] = useState(1);
  const isOpen = activeModal === 'product';

  if (!isOpen) return null;

  const product = {
    name: ramadanBox.title,
    originalPrice: ramadanBox.originalPrice,
    salePrice: ramadanBox.salePrice,
    contents: ramadanBox.contents,
    images: ramadanBox.images,
    rating: 4.9,
    reviews: 234,
    deliveryTime: '25-35 min',
    description: 'Curated Iftar & Sahur essentials box filled with premium rice, cooking oil, dates, fruits, and spices to keep you and your family energized throughout the blessed month.',
  };

  const total = product.salePrice * quantity;

  const handleAddToCart = () => {
    setCartCount(cartCount + quantity);
    setActiveModal(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[70]"
            onClick={() => setActiveModal(null)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[90vh] bg-[#0F1117] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-white font-bold">Product Details</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Product Image */}
              <div className="grid grid-cols-2 gap-2 p-4">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-center bg-no-repeat bg-cover rounded-2xl border border-white/10"
                    style={{ backgroundImage: `url("${img}")` }}
                  />
                ))}
              </div>

              {/* Product Info */}
              <div className="px-4">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-[#13ec13]/10 text-[#13ec13] text-[10px] font-bold rounded-full border border-[#13ec13]/20 uppercase">Editor&apos;s Choice</span>
                  <span className="px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-bold rounded-full border border-[#FFD700]/20 uppercase">Ramadan Special</span>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight">{product.name}</h3>

                {/* Rating & Delivery */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                    <span className="text-white font-bold text-sm">{product.rating}</span>
                    <span className="text-white/40 text-xs">({product.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/50 text-xs">
                    <Clock className="w-3 h-3" />
                    {product.deliveryTime}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-[#13ec13] text-3xl font-black tracking-tighter">{formatNaira(product.salePrice)}</span>
                  <span className="text-white/30 text-lg line-through mb-1">{formatNaira(product.originalPrice)}</span>
                  <span className="bg-[#13ec13]/10 text-[#13ec13] text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                    -{Math.round((1 - product.salePrice / product.originalPrice) * 100)}%
                  </span>
                </div>

                {/* Contents */}
                <div className="flex items-center gap-2 mt-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  <BadgeCheck className="w-5 h-5 text-[#FFD700] shrink-0" />
                  <p className="text-white/80 text-sm font-medium">{product.contents} Included</p>
                </div>

                {/* Description */}
                <p className="text-white/50 text-sm leading-relaxed mt-4">{product.description}</p>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3 mt-6 mb-6">
                  <div className="bg-[#1A1D26] rounded-xl p-3 text-center border border-white/5">
                    <Truck className="w-5 h-5 text-[#13ec13] mx-auto mb-1" />
                    <p className="text-white text-[10px] font-bold">Free Delivery</p>
                    <p className="text-white/30 text-[9px]">Orders ₦5K+</p>
                  </div>
                  <div className="bg-[#1A1D26] rounded-xl p-3 text-center border border-white/5">
                    <Shield className="w-5 h-5 text-[#FFD700] mx-auto mb-1" />
                    <p className="text-white text-[10px] font-bold">Quality Assured</p>
                    <p className="text-white/30 text-[9px]">100% Fresh</p>
                  </div>
                  <div className="bg-[#1A1D26] rounded-xl p-3 text-center border border-white/5">
                    <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <p className="text-white text-[10px] font-bold">Iftar Ready</p>
                    <p className="text-white/30 text-[9px]">Timed Delivery</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="border-t border-white/5 p-4 bg-[#0F1117]/95 backdrop-blur-lg">
              <div className="flex items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center gap-3 bg-[#1A1D26] rounded-xl px-3 py-2 border border-white/5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white font-bold text-lg min-w-[24px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#13ec13] py-4 rounded-2xl text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-[#13ec13]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  ADD TO CART &bull; {formatNaira(total)}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
