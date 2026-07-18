'use client';

import { X, Star, Clock, Shield, Truck, Minus, Plus, ChevronRight, BadgeCheck, Heart, Share2, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { allProducts, formatNaira } from '@/lib/data';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { track } from '@/lib/analytics';

interface Review {
  id: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
}

function StarRow({ rating, size = 'w-3.5 h-3.5' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(rating) ? 'text-[#F5C451] fill-[#F5C451]' : 'text-white/15'}`}
        />
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ProductDetailModal() {
  const { activeModal, setActiveModal, selectedProduct, addToCart, wishlist, toggleWishlist, userName, userEmail, userAvatar } = useAppStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [prevProductId, setPrevProductId] = useState(selectedProduct);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const isOpen = activeModal === 'product' || activeModal === 'product-detail';

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Find product by selectedProduct ID
  const product = allProducts.find(p => p.id === selectedProduct) || allProducts[0];

  // Reset quantity + reviews when product changes (without useEffect)
  if (selectedProduct !== prevProductId) {
    setPrevProductId(selectedProduct);
    setQuantity(1);
    setActiveImageIdx(0);
    setReviews([]);
    setShowReviewForm(false);
    setNewRating(5);
    setNewComment('');
  }

  // Fetch reviews for the current product
  useEffect(() => {
    if (!isOpen || !product?.id) return;
    let cancelled = false;
    // Analytics: track product view
    track('product_view', { productId: product.id, name: product.name });
    const fetchReviews = async () => {
      setFetchingReviews(true);
      try {
        const res = await fetch(`/api/products/${product.id}/reviews`);
        const data = await res.json();
        if (cancelled) return;
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setFetchingReviews(false);
      }
    };
    fetchReviews();
    return () => { cancelled = true; };
  }, [isOpen, product?.id]);

  const images = (product.images && product.images.length > 0) ? product.images : [product.image || ''];
  const mainImage = images[activeImageIdx] || images[0];

  const isWishlisted = wishlist.includes(product.id);

  const salePrice = ('salePrice' in product ? product.salePrice : product.price) || product.price || 0;
  const originalPrice = ('originalPrice' in product ? product.originalPrice : product.price) || product.price || 0;
  const totalPrice = salePrice * quantity;

  // Compute average rating from fetched reviews (overrides mock when reviews exist)
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : product.rating;
  const displayReviewCount = reviewCount > 0 ? reviewCount : (product.reviews || 0);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: salePrice,
      image: product.image || '',
      quantity,
    });
    track('add_to_cart', { productId: product.id, name: product.name, quantity, price: salePrice });
    toast({ title: 'Added to Cart! 🛒', description: `${quantity}x ${product.name}` });
    setActiveModal(null);
    setQuantity(1);
  };

  const handleWishlist = () => {
    toggleWishlist(product.id);
    // Also sync to /api/wishlist (best-effort, non-blocking)
    try {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: useAppStore.getState().userEmail || 'guest',
          productId: product.id,
          name: product.name,
          price: salePrice,
          image: product.image || '',
        }),
      }).catch(() => {});
    } catch {
      // ignore — local toggle is the source of truth for UI
    }
    toast({
      title: isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist ❤️',
      description: product.name,
    });
  };

  const handleShare = () => {
    toast({ title: 'Share Link Copied! 📋', description: `Share ${product.name} with friends` });
  };

  const handleSubmitReview = async () => {
    if (submittingReview) return;
    if (!newComment.trim()) {
      toast({ title: 'Review incomplete', description: 'Please write a comment', variant: 'destructive' });
      return;
    }
    setSubmittingReview(true);
    const authorName = userName || 'Guest Reviewer';
    const authorAvatar = userAvatar || '';
    const currentUserEmail = userEmail || 'guest';

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          userId: currentUserEmail,
          authorName,
          authorAvatar,
          rating: newRating,
          comment: newComment.trim(),
          images: [],
        }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        // Prepend to list
        setReviews(prev => [data.review, ...prev]);
        setNewComment('');
        setNewRating(5);
        setShowReviewForm(false);
        track('review_submit', { productId: product.id, rating: newRating });
        toast({ title: 'Review Posted! ⭐', description: 'Thanks for sharing your feedback' });
      } else {
        toast({ title: 'Could not post review', description: data.message || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Could not post review', description: 'Network error — please try again', variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
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
                        key={`thumb-${i}`}
                        onClick={() => setActiveImageIdx(i)}
                        className={`shrink-0 w-16 h-16 rounded-xl bg-center bg-cover border-2 transition-all ${
                          i === activeImageIdx
                            ? 'border-[#10E07A] ring-1 ring-[#10E07A]/30'
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
                    <span className="px-2 py-0.5 bg-[#10E07A]/10 text-[#10E07A] text-[10px] font-bold rounded-full border border-[#10E07A]/20 uppercase">Sale</span>
                  )}
                  <span className="px-2 py-0.5 bg-[#F5C451]/10 text-[#F5C451] text-[10px] font-bold rounded-full border border-[#F5C451]/20 uppercase">Ramadan Special</span>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight">{product.name}</h3>

                {/* Rating & Delivery */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <StarRow rating={avgRating} size="w-4 h-4" />
                    <span className="text-white font-bold text-sm">{avgRating.toFixed(1)}</span>
                    <span className="text-white/40 text-xs">({displayReviewCount} review{displayReviewCount !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/50 text-xs">
                    <Clock className="w-3 h-3" />
                    {product.deliveryTime}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-[#10E07A] text-3xl font-black tracking-tighter">{formatNaira(salePrice)}</span>
                  {(('salePrice' in product && product.salePrice) || ('originalPrice' in product && product.originalPrice)) && originalPrice > salePrice && (
                    <>
                      <span className="text-white/30 text-lg line-through mb-1">{formatNaira(originalPrice)}</span>
                      <span className="bg-[#10E07A]/10 text-[#10E07A] text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                        -{Math.round((1 - salePrice / originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Contents */}
                {'contents' in product && product.contents && (
                  <div className="flex items-center gap-2 mt-4 bg-black/30 p-3 rounded-xl border border-white/5">
                    <BadgeCheck className="w-5 h-5 text-[#F5C451] shrink-0" />
                    <p className="text-white/80 text-sm font-medium">{product.contents} Included</p>
                  </div>
                )}

                {/* Description */}
                <p className="text-white/50 text-sm leading-relaxed mt-4">{product.description}</p>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3 mt-6 mb-6">
                  <div className="bg-[#1A1D26] rounded-xl p-3 text-center border border-white/5">
                    <Truck className="w-5 h-5 text-[#10E07A] mx-auto mb-1" />
                    <p className="text-white text-[10px] font-bold">Free Delivery</p>
                    <p className="text-white/30 text-[9px]">Orders ₦5K+</p>
                  </div>
                  <div className="bg-[#1A1D26] rounded-xl p-3 text-center border border-white/5">
                    <Shield className="w-5 h-5 text-[#F5C451] mx-auto mb-1" />
                    <p className="text-white text-[10px] font-bold">Quality Assured</p>
                    <p className="text-white/30 text-[9px]">100% Fresh</p>
                  </div>
                  <div className="bg-[#1A1D26] rounded-xl p-3 text-center border border-white/5">
                    <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <p className="text-white text-[10px] font-bold">Iftar Ready</p>
                    <p className="text-white/30 text-[9px]">Timed Delivery</p>
                  </div>
                </div>

                {/* ─── Reviews Section ─── */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-bold text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#A78BFA]" />
                      Reviews ({reviewCount})
                    </h4>
                    <button
                      onClick={() => setShowReviewForm(s => !s)}
                      className="text-[#10E07A] text-xs font-bold hover:text-[#10E07A]/80 transition-colors"
                    >
                      {showReviewForm ? 'Cancel' : 'Write a review'}
                    </button>
                  </div>

                  {/* Average rating summary */}
                  {reviewCount > 0 && (
                    <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 mb-3 flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[#F5C451] text-3xl font-black">{avgRating.toFixed(1)}</p>
                        <StarRow rating={avgRating} />
                        <p className="text-white/40 text-[10px] mt-1">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = reviews.filter(r => r.rating === star).length;
                          const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-[10px]">
                              <span className="text-white/50 w-3">{star}</span>
                              <Star className="w-2.5 h-2.5 text-[#F5C451] fill-[#F5C451]" />
                              <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-[#F5C451] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-white/40 w-5 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Write review form */}
                  <AnimatePresence>
                    {showReviewForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#1A1D26] rounded-2xl border border-[#10E07A]/20 p-4 mb-3 space-y-3">
                          <div>
                            <p className="text-white/60 text-xs font-bold mb-2">Your rating</p>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map(n => (
                                <button
                                  key={n}
                                  onClick={() => setNewRating(n)}
                                  className="active:scale-90 transition-transform"
                                  aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                                >
                                  <Star
                                    className={`w-7 h-7 ${n <= newRating ? 'text-[#F5C451] fill-[#F5C451]' : 'text-white/15'}`}
                                  />
                                </button>
                              ))}
                              <span className="text-white font-bold text-sm ml-2">{newRating}/5</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs font-bold mb-2">Your review</p>
                            <textarea
                              value={newComment}
                              onChange={e => setNewComment(e.target.value)}
                              rows={3}
                              placeholder="Share your experience with this product..."
                              className="w-full bg-[#0F1117] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[#10E07A]/30 focus:outline-none placeholder:text-white/20 resize-none"
                            />
                          </div>
                          <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || !newComment.trim()}
                            className="w-full bg-[#10E07A] text-[#06070B] font-bold py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                          >
                            {submittingReview ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              'Post Review'
                            )}
                          </button>
                          <p className="text-white/30 text-[10px] text-center">
                            Posting as {userName || 'Guest Reviewer'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Reviews list */}
                  {fetchingReviews ? (
                    <div className="flex items-center gap-2 p-4 bg-[#1A1D26] rounded-xl border border-white/5">
                      <Loader2 className="w-4 h-4 text-[#10E07A] animate-spin" />
                      <span className="text-white/40 text-sm">Loading reviews...</span>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="p-4 bg-[#1A1D26] rounded-xl border border-white/5 text-center">
                      <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">No reviews yet</p>
                      <p className="text-white/30 text-xs mt-0.5">Be the first to share your experience!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                      {reviews.map(review => (
                        <div key={review.id} className="bg-[#1A1D26] rounded-xl border border-white/5 p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10E07A] to-[#A78BFA] flex items-center justify-center text-[#06070B] font-black text-sm shrink-0 overflow-hidden relative">
                              {review.authorAvatar ? (
                                <Image src={review.authorAvatar} alt={review.authorName} fill unoptimized className="object-cover" />
                              ) : (
                                review.authorName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-white font-bold text-sm truncate">{review.authorName}</p>
                                <span className="text-white/30 text-[10px] shrink-0">{timeAgo(review.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <StarRow rating={review.rating} size="w-3 h-3" />
                                <span className="text-white/40 text-[10px]">{review.rating}.0</span>
                              </div>
                              <p className="text-white/60 text-xs mt-2 leading-relaxed">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                            <p className="text-[#10E07A] text-xs font-black">{formatNaira(('salePrice' in p ? p.salePrice : p.price) || p.price || 0)}</p>
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
                  className="flex-1 bg-[#10E07A] py-4 rounded-2xl text-[#06070B] font-black text-sm uppercase tracking-widest shadow-lg shadow-[#10E07A]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
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
