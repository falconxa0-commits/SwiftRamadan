'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Upload,
  ScanLine,
  ShoppingCart,
  Sparkles,
  ChefHat,
  Check,
  AlertCircle,
  Plus,
  Loader2,
} from 'lucide-react';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface DetectedItem {
  name: string;
  confidence: number;
  inCart: boolean;
  price: number;
}

interface RecipeSuggestion {
  name: string;
  matchPercent: number;
  missingIngredients: string[];
  cookTime: string;
}

type Phase = 'idle' | 'preview' | 'analyzing' | 'result';

const MAX_WIDTH = 800;

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
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function FridgeScanner() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const isOpen = activeModal === 'fridge-scanner';
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, [setActiveModal]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setBase64Image(compressed);
      setPhase('preview');
    } catch {
      toast({ title: 'Image Error', description: 'Could not process image. Try again.', variant: 'destructive' });
    }
  }, [toast]);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleAnalyze = useCallback(async () => {
    if (!base64Image) return;
    setPhase('analyzing');

    try {
      const res = await fetch('/api/fridge-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();

      if (data.detectedItems) {
        setDetectedItems(data.detectedItems);
      }
      if (data.recipes) {
        setRecipes(data.recipes);
      }
      setPhase('result');
    } catch {
      toast({ title: 'Scan Failed', description: 'Could not analyze image. Please try again.', variant: 'destructive' });
      setPhase('preview');
    }
  }, [base64Image, toast]);

  const handleAddToCart = useCallback(
    (item: DetectedItem) => {
      addToCart({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: item.name,
        price: item.price,
        image: '/images/categories/cat-groceries.png',
      });
      setAddedItems((prev) => new Set(prev).add(item.name));
      toast({ title: 'Added to Cart', description: `${item.name} added to your cart` });
    },
    [addToCart, toast]
  );

  const handleAddAllMissing = useCallback(() => {
    const missingItems = detectedItems.filter((item) => !item.inCart && !addedItems.has(item.name));
    missingItems.forEach((item) => {
      addToCart({
        id: Date.now() + Math.floor(Math.random() * 10000),
        name: item.name,
        price: item.price,
        image: '/images/categories/cat-groceries.png',
      });
    });
    const newAdded = new Set(addedItems);
    missingItems.forEach((item) => newAdded.add(item.name));
    setAddedItems(newAdded);
    toast({ title: 'All Missing Items Added', description: `${missingItems.length} items added to cart` });
  }, [detectedItems, addedItems, addToCart, toast]);

  const handleRetake = useCallback(() => {
    setPhase('idle');
    setImagePreview(null);
    setBase64Image(null);
    setDetectedItems([]);
    setRecipes([]);
    setAddedItems(new Set());
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Fridge Scanner"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/8 shadow-2xl"
          style={{ backgroundColor: 'var(--sr-surface-raised)' }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/8" style={{ backgroundColor: 'var(--sr-surface-raised)' }}>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" style={{ color: 'var(--sr-vendor)' }} />
              <h2 className="text-white font-bold text-lg">Fridge Scanner</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Phase: Idle - Upload prompt */}
            {phase === 'idle' && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:border-white/20 transition-colors"
                  onClick={handleUpload}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--sr-vendor) 13%, transparent)' }}>
                    <ScanLine className="w-8 h-8" style={{ color: 'var(--sr-vendor)' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Scan Your Fridge</p>
                    <p className="text-white/65 text-sm mt-1">Take a photo to identify ingredients and get recipe suggestions</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ backgroundColor: 'var(--sr-vendor)', color: 'var(--sr-surface-base)' }}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Camera
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload fridge photo"
                />

                {/* Tips */}
                <div className="rounded-xl p-3 border border-white/8" style={{ backgroundColor: 'var(--sr-surface-base)' }}>
                  <p className="text-white/50 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--sr-vendor)' }} />
                    Tips: Open the fridge door wide, ensure good lighting, and capture most shelves in one shot.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Phase: Preview */}
            {phase === 'preview' && imagePreview && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="rounded-xl overflow-hidden border border-white/8">
                  <img
                    src={imagePreview}
                    alt="Fridge preview"
                    className="w-full max-h-64 object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRetake}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
                  >
                    Retake
                  </button>
                  <motion.button
                    onClick={handleAnalyze}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: 'var(--sr-vendor)', color: 'var(--sr-surface-base)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyze Fridge
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Phase: Analyzing */}
            {phase === 'analyzing' && (
              <motion.div
                className="py-12 flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--sr-vendor) 13%, transparent)' }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ScanLine className="w-8 h-8" style={{ color: 'var(--sr-vendor)' }} />
                </motion.div>
                <div className="text-center">
                  <p className="text-white font-medium">Scanning your fridge...</p>
                  <p className="text-white/65 text-sm mt-1">Identifying ingredients with AI</p>
                </div>
                <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
              </motion.div>
            )}

            {/* Phase: Result */}
            {phase === 'result' && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Detected Ingredients */}
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <ScanLine className="w-4 h-4" style={{ color: 'var(--sr-customer)' }} />
                    Detected Ingredients
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detectedItems.map((item, i) => (
                      <motion.div
                        key={item.name}
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/8"
                        style={{ backgroundColor: 'var(--sr-surface-base)' }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: item.inCart ? 'color-mix(in srgb, var(--sr-customer) 13%, transparent)' : 'color-mix(in srgb, var(--sr-vendor) 13%, transparent)',
                            color: item.inCart ? 'var(--sr-customer)' : 'var(--sr-vendor)',
                          }}
                        >
                          {item.inCart ? <Check className="w-4 h-4" /> : Math.round(item.confidence * 100)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{item.name}</p>
                          <p className="text-white/60 text-xs">
                            {item.inCart ? 'Already in cart' : formatNaira(item.price)}
                          </p>
                        </div>
                        {!item.inCart && (
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={addedItems.has(item.name)}
                            className="p-2 rounded-lg transition-colors disabled:opacity-50"
                            style={{
                              backgroundColor: addedItems.has(item.name) ? 'color-mix(in srgb, var(--sr-customer) 13%, transparent)' : 'color-mix(in srgb, var(--sr-vendor) 13%, transparent)',
                              color: addedItems.has(item.name) ? 'var(--sr-customer)' : 'var(--sr-vendor)',
                            }}
                            aria-label={`Add ${item.name} to cart`}
                          >
                            {addedItems.has(item.name) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Add All Missing */}
                {detectedItems.some((item) => !item.inCart && !addedItems.has(item.name)) && (
                  <motion.button
                    onClick={handleAddAllMissing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add All Missing Items to Cart
                  </motion.button>
                )}

                {/* Recipe Suggestions */}
                {recipes.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <ChefHat className="w-4 h-4" style={{ color: 'var(--sr-ai)' }} />
                      Recipe Suggestions
                    </h3>
                    <div className="space-y-2">
                      {recipes.map((recipe, i) => (
                        <motion.div
                          key={recipe.name}
                          className="p-3 rounded-xl border border-white/8"
                          style={{ backgroundColor: 'var(--sr-surface-base)' }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 + 0.2 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white text-sm font-medium">{recipe.name}</p>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: recipe.matchPercent >= 80 ? 'color-mix(in srgb, var(--sr-customer) 13%, transparent)' : 'color-mix(in srgb, var(--sr-vendor) 13%, transparent)',
                                color: recipe.matchPercent >= 80 ? 'var(--sr-customer)' : 'var(--sr-vendor)',
                              }}
                            >
                              {recipe.matchPercent}% match
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/65">
                            <span>{recipe.cookTime}</span>
                            {recipe.missingIngredients.length > 0 && (
                              <span>Missing: {recipe.missingIngredients.join(', ')}</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scan Again */}
                <button
                  onClick={handleRetake}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Scan Again
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
