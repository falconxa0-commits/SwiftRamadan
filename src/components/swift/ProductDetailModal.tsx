'use client';

import { X, Star, Clock, Shield, Truck, Minus, Plus, ChevronRight, BadgeCheck, Heart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { allProducts, formatNaira } from '@/lib/data';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetailModal() {
  const { activeModal, setActiveModal, selectedProduct, addToCart, wishlist, toggleWishlist } = useAppStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [prevProductId, setPrevProductId] = useState(selectedProduct);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const isOpen = activeModal === 'product' || activeModal === 'product-detail';

  // Find product by selectedProduct ID
  const product = allProducts.find(p => p.id === selectedProduct) || allProducts[0];

  // Reset quantity when product changes (without useEffect)
  if (selectedProduct !== prevProductId) {
    setPrevProductId(selectedProduct);
    setQuantity(1);
    setActiveImageIdx(0);
  }

  const images = (product.images && product.images.length > 0) ? product.images : [product.image || ''];
  const mainImage = images[activeImageIdx] || images[0];

  const isWishlisted = wishlist.includes(product.id);

  const salePrice = ('salePrice' in product ? product.salePrice : product.price) || product.price || 0;
  const originalPrice = ('originalPrice' in product ? product.originalPrice : product.price) || product.price || 0;
  const totalPrice = salePrice * quantity;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: salePrice,
      image: product.image || '',
      quantity,
    });
    toast({ title: 'Added to Cart! 🛒', description: `${quantity}x ${product.name}` });
    setActiveModal(null);
    setQuantity(1);
  };

  const handleWishlist = () => {
    toggleWishlist(product.id);
    toast({
      title: isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist ❤️',
      description: product.name,
    });
  };

  const handleShare = () => {
    toast({ title: 'Share Link Copied! 📋', description: `Share ${product.name} with friends` });
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
            onClick={() => { setActiveModal(null); setQuantity(1); }}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={handleWishlist}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-white/60'}`} />
                </button>
                <button
                  onClick={() => { setActiveModal(null); setQuantity(1); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Product Image Gallery */}
              <div className="p-4">
                {/* Main Image */}
                <div
                  className="aspect-[4/3] bg-center bg-no-repeat bg-cover rounded-2xl border border-white/10 relative overflow-hidden"
                  style={{ backgroundImage: `url("${mainImage}")` }}
                >
                  {/* Image counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="text-white text-[10px] font-bold">{activeImageIdx + 1}/{images.length}</span>
                    </div>
                  )}
                  {/* Nav arrows */}
                  {images.length > 1 && (
                    <>
                      {activeImageIdx > 0 && (
                        <button
                          onClick={() => setActiveImageIdx(activeImageIdx - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-white rotate-180" />
                        </button>
                      )}
                      {activeImageIdx < images.length - 1 && (
                        <button
                          onClick={() => setActiveImageIdx(activeImageIdx + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIdx(i)}
                        className={`shrink-0 w-16 h-16 rounded-xl bg-center bg-cover border-2 transition-all ${
                          i === activeImageIdx
                            ? 'border-[#13ec13] ring-1 ring-[#13ec13]/30'
                            : 'border-white/10 opacity-50 hover:opacity-80'
                        }`}
                        style={{ backgroundImage: `url("${img}")` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="px-4">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {'salePrice' in product && product.salePrice && (
                    <span className="px-2 py-0.5 bg-[#13ec13]/10 text-[#13ec13] text-[10px] font-bold rounded-full border border-[#13ec13]/20 uppercase">Sale</span>
                  )}
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
                  <span className="text-[#13ec13] text-3xl font-black tracking-tighter">{formatNaira(salePrice)}</span>
                  {(('salePrice' in product && product.salePrice) || ('originalPrice' in product && product.originalPrice)) && (
                    <>
                      <span className="text-white/30 text-lg line-through mb-1">{formatNaira(originalPrice)}</span>
                      <span className="bg-[#13ec13]/10 text-[#13ec13] text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                        -{Math.round((1 - salePrice / originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Contents */}
                {'contents' in product && product.contents && (
                  <div className="flex items-center gap-2 mt-4 bg-black/30 p-3 rounded-xl border border-white/5">
                    <BadgeCheck className="w-5 h-5 text-[#FFD700] shrink-0" />
                    <p className="text-white/80 text-sm font-medium">{product.contents} Included</p>
                  </div>
                )}

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

                {/* Related Products */}
                <div className="mb-6">
                  <h4 className="text-white font-bold text-sm mb-3">You might also like</h4>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {allProducts
                      .filter(p => p.id !== product.id && p.category === product.category)
                      .slice(0, 3)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            useAppStore.getState().setSelectedProduct(p.id);
                            setQuantity(1);
                          }}
                          className="min-w-[120px] bg-[#1A1D26] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors text-left shrink-0"
                        >
                          <div
                            className="w-full aspect-square bg-center bg-cover"
                            style={{ backgroundImage: `url("${p.image}")` }}
                          />
                          <div className="p-2">
                            <p className="text-white text-[10px] font-bold truncate">{p.name}</p>
                            <p className="text-[#13ec13] text-xs font-black">{formatNaira(('salePrice' in p ? p.salePrice : p.price) || p.price || 0)}</p>
                          </div>
                        </button>
                      ))}
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
                  ADD TO CART &bull; {formatNaira(totalPrice)}
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
