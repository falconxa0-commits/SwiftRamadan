'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Upload,
  ScanLine,
  Sparkles,
  ShoppingCart,
  RefreshCw,
  Check,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { allProducts, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface VisualSearchResult {
  foodName: string;
  category:
    | 'Iftar Meals'
    | 'Sahur'
    | 'Dates'
    | 'Drinks'
    | 'Snacks'
    | 'Fruits'
    | 'Groceries';
  description: string;
  tags: string[];
  estimatedPriceNGN: number;
}

type Phase = 'idle' | 'analyzing' | 'result';

const MAX_WIDTH = 800;
const PREVIEW_MAX_HEIGHT = 400;

/**
 * Reads an image File and returns a compressed JPEG data URL.
 * Draws to an offscreen canvas at MAX_WIDTH (preserving aspect ratio),
 * exports as JPEG quality 0.8.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Image load failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if canvas is unavailable
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function findSimilarProducts(
  result: VisualSearchResult,
  limit = 4
) {
  const foodNameLower = result.foodName.toLowerCase();
  const tags = result.tags || [];

  // Map the VLM category to the lowercase category strings stored in allProducts.
  // allProducts categories are like 'iftar meals', 'sahur', 'dates', 'drinks',
  // 'snacks', 'fruits', 'groceries', 'bundles', 'flash-sale', 'charity', etc.
  const targetCategory = result.category.toLowerCase();

  const scored = allProducts
    .filter((p) => p.inStock !== false)
    .map((p) => {
      const pName = p.name.toLowerCase();
      const pCategory = String(p.category || '').toLowerCase();
      let score = 0;

      // Category match (highest weight)
      if (pCategory === targetCategory) score += 50;
      else if (pCategory.includes(targetCategory) || targetCategory.includes(pCategory))
        score += 25;

      // Tag matches against product name
      for (const tag of tags) {
        if (tag && pName.includes(tag)) score += 15;
      }

      // Food name tokens against product name
      const nameTokens = foodNameLower
        .split(/\s+/)
        .filter((t) => t.length > 2);
      for (const token of nameTokens) {
        if (pName.includes(token)) score += 10;
      }

      // Tag matches against category
      for (const tag of tags) {
        if (tag && pCategory.includes(tag)) score += 5;
      }

      return { product: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);

  // If nothing matched, return the first few products so the section isn't empty
  if (scored.length === 0) {
    return allProducts.slice(0, limit);
  }
  return scored;
}

export default function VisualSearchModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const isOpen = activeModal === 'visual-search';

  const [phase, setPhase] = useState<Phase>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
    setAddedIds(new Set());
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = () => {
    setActiveModal(null);
    // Defer reset so the exit animation looks clean
    setTimeout(reset, 300);
  };

  const handleFileSelected = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select an image file.');
        toast({
          title: 'Unsupported file',
          description: 'Please pick a JPG, PNG, or WEBP image.',
          variant: 'destructive',
        });
        return;
      }

      setErrorMsg(null);
      setAddedIds(new Set());

      try {
        const compressed = await compressImage(file);
        setPreviewUrl(compressed);
        setPhase('analyzing');
        setResult(null);

        const res = await fetch('/api/visual-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressed }),
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const data = (await res.json()) as { result?: VisualSearchResult };
        if (data?.result) {
          setResult(data.result);
          setPhase('result');
          toast({
            title: 'Identified! 🎉',
            description: `AI thinks this is ${data.result.foodName}`,
          });
        } else {
          throw new Error('No result in response');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setErrorMsg(`Could not analyze image: ${message}`);
        setPhase('idle');
        toast({
          title: 'Analysis failed',
          description: 'Please try another photo.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const handleAddToCart = (product: (typeof allProducts)[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice ?? product.price ?? 0,
      image: product.image,
    });
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    toast({
      title: 'Added to Cart! 🛒',
      description: `${product.name} added`,
    });
  };

  const similarProducts = result ? findSimilarProducts(result, 4) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[90]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 h-[94vh] bg-[#05070A] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-[#10E07A]/20"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 bg-[#05070A]/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10E07A]/10 rounded-xl flex items-center justify-center border border-[#10E07A]/30 relative">
                  <ScanLine className="w-5 h-5 text-[#10E07A]" />
                  <motion.span
                    className="absolute inset-0 rounded-xl border border-[#10E07A]/40"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg flex items-center gap-1.5">
                    Snap to Shop
                    <Sparkles className="w-4 h-4 text-[#F5C451]" />
                  </h2>
                  <p className="text-white/40 text-xs">
                    AI-powered visual food search
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-5">
              {/* IDLE: Drop zone + upload buttons */}
              {phase === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="rounded-3xl border-2 border-dashed border-[#10E07A]/30 bg-[#10E07A]/[0.03] p-8 flex flex-col items-center text-center">
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(16,224,122,0.0)',
                          '0 0 0 12px rgba(16,224,122,0.08)',
                          '0 0 0 0 rgba(16,224,122,0.0)',
                        ],
                      }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                      className="w-20 h-20 rounded-full bg-[#10E07A]/10 flex items-center justify-center mb-4 border border-[#10E07A]/30"
                    >
                      <Camera className="w-9 h-9 text-[#10E07A]" />
                    </motion.div>
                    <h3 className="text-white font-bold text-base mb-1">
                      Snap any food, shop instantly
                    </h3>
                    <p className="text-white/50 text-sm max-w-xs">
                      Take a photo or upload an image of any food and our AI
                      will identify it and find similar products in our catalog.
                    </p>

                    {errorMsg && (
                      <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-[#10E07A] text-[#05070A] font-bold active:scale-[0.98] transition-transform shadow-lg shadow-[#10E07A]/20"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-sm">Take Photo 📷</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-white/5 text-white font-bold border border-white/10 active:scale-[0.98] transition-transform hover:border-[#10E07A]/30"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Upload Image</span>
                    </button>
                  </div>

                  {/* Tips */}
                  <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4">
                    <h4 className="text-white font-bold text-xs mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F5C451]" />
                      Tips for best results
                    </h4>
                    <ul className="space-y-1.5 text-white/50 text-xs">
                      <li className="flex gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10E07A] shrink-0 mt-0.5" />
                        Good lighting & center the food in frame
                      </li>
                      <li className="flex gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10E07A] shrink-0 mt-0.5" />
                        One dish per photo works best
                      </li>
                      <li className="flex gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10E07A] shrink-0 mt-0.5" />
                        Works great with restaurant menus too!
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* ANALYZING: Preview + scanner */}
              {phase === 'analyzing' && previewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="relative rounded-3xl overflow-hidden border border-[#10E07A]/30 bg-black">
                    <img
                      src={previewUrl}
                      alt="Uploaded food preview"
                      className="w-full object-contain"
                      style={{ maxHeight: `${PREVIEW_MAX_HEIGHT}px` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                    {/* Animated scanner line */}
                    <motion.div
                      className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#10E07A] to-transparent shadow-[0_0_18px_rgba(16,224,122,0.8)]"
                      initial={{ top: '5%' }}
                      animate={{ top: ['5%', '92%', '5%'] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    {/* Grid overlay corners */}
                    <div className="absolute inset-4 pointer-events-none">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#10E07A]/70 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#10E07A]/70 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#10E07A]/70 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#10E07A]/70 rounded-br-lg" />
                    </div>

                    {/* Loading label */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#05070A]/80 backdrop-blur border border-[#10E07A]/30 flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#10E07A]" />
                      </motion.div>
                      <span className="text-[#10E07A] text-[11px] font-bold tracking-wide">
                        ANALYZING WITH AI...
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      'Detecting food type...',
                      'Matching against catalog...',
                      'Estimating price...',
                    ].map((label, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.4 }}
                        className="flex items-center gap-2 text-white/60 text-xs"
                      >
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-1.5 h-1.5 rounded-full bg-[#10E07A]"
                        />
                        {label}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* RESULT: Identified + similar products */}
              {phase === 'result' && result && previewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Preview thumbnail + result overlay */}
                  <div className="relative rounded-3xl overflow-hidden border border-[#10E07A]/30 bg-black">
                    <img
                      src={previewUrl}
                      alt="Identified food"
                      className="w-full object-contain opacity-90"
                      style={{ maxHeight: `${PREVIEW_MAX_HEIGHT}px` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10E07A] text-[#05070A] text-[10px] font-black uppercase tracking-wide">
                          <Check className="w-3 h-3" />
                          Identified
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5C451]/15 text-[#F5C451] text-[10px] font-bold border border-[#F5C451]/30">
                          {result.category}
                        </span>
                      </div>
                      <h3 className="text-white font-black text-2xl leading-tight">
                        {result.foodName}
                      </h3>
                    </div>
                  </div>

                  {/* AI description + estimated price */}
                  <div className="rounded-2xl bg-[#1A1D26] border border-white/5 p-4 space-y-3">
                    <div>
                      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#F5C451]" />
                        AI Description
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {result.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-white/40 text-xs">
                        Estimated price
                      </span>
                      <span className="text-[#10E07A] font-black text-lg">
                        {formatNaira(result.estimatedPriceNGN)}
                      </span>
                    </div>
                    {result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {result.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px] border border-white/10"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Similar products */}
                  <div>
                    <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-[#10E07A]" />
                      Found Similar Products
                      <span className="text-white/30 text-xs font-normal">
                        ({similarProducts.length})
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {similarProducts.map((product, i) => {
                        const price = product.salePrice ?? product.price ?? 0;
                        const inCart = addedIds.has(product.id);
                        return (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="rounded-2xl bg-[#1A1D26] border border-white/5 overflow-hidden flex flex-col"
                          >
                            <div className="relative aspect-square bg-[#0F1117]">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              {product.salePrice && product.originalPrice && (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-black">
                                  -
                                  {Math.round(
                                    (1 -
                                      product.salePrice /
                                        product.originalPrice) *
                                      100
                                  )}
                                  %
                                </span>
                              )}
                            </div>
                            <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                              <h5 className="text-white text-xs font-bold leading-tight line-clamp-2">
                                {product.name}
                              </h5>
                              <div className="flex items-center gap-1 text-[10px] text-white/40">
                                <span>★ {product.rating?.toFixed(1) ?? '4.5'}</span>
                                <span>•</span>
                                <span>{product.deliveryTime ?? '20 min'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                                <span className="text-[#10E07A] font-black text-sm">
                                  {formatNaira(price)}
                                </span>
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  aria-label={`Add ${product.name} to cart`}
                                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                    inCart
                                      ? 'bg-[#10E07A]/20 text-[#10E07A] border border-[#10E07A]/40'
                                      : 'bg-[#10E07A] text-[#05070A] active:scale-95 hover:shadow-md hover:shadow-[#10E07A]/30'
                                  }`}
                                >
                                  {inCart ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Plus />
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Try another photo */}
                  <button
                    onClick={reset}
                    className="w-full py-3.5 rounded-2xl bg-white/5 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10 hover:border-[#10E07A]/30 hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-[#10E07A]" />
                    Try Another Photo
                  </button>
                </motion.div>
              )}
            </div>

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleFileSelected(file);
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleFileSelected(file);
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Small inline Plus icon (avoids extra import noise in the product card)
function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'w-4 h-4'}
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// Keep the ImageIcon import referenced for tree-shaking clarity & future use
void ImageIcon;
