'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, ScanLine, Sparkles, ChefHat, Leaf, Snowflake, AlertTriangle } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface DetectedItem {
  name: string;
  category: string;
  estimated_quantity: string;
  freshness: string;
}

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
        const ctx = canvas.getContext('2d');
        if (!ctx) {
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

function FreshnessIndicator({ freshness }: { freshness: string }) {
  const config = {
    fresh: { color: '#10E07A', bg: 'bg-[var(--sr-customer)]/10', border: 'border-[var(--sr-customer)]/20', icon: Leaf, label: 'Fresh' },
    aging: { color: '#F5C451', bg: 'bg-[var(--sr-vendor)]/10', border: 'border-[var(--sr-vendor)]/20', icon: Snowflake, label: 'Aging' },
    expiring: { color: '#EF4444', bg: 'bg-[var(--sr-error)]/10', border: 'border-[var(--sr-error)]/20', icon: AlertTriangle, label: 'Expiring' },
  }[freshness] || { color: '#10E07A', bg: 'bg-[var(--sr-customer)]/10', border: 'border-[var(--sr-customer)]/20', icon: Leaf, label: 'Fresh' };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 ${config.bg} border ${config.border} rounded-full px-2 py-0.5`}>
      <Icon className="w-3 h-3" style={{ color: config.color }} />
      <span className="text-[10px] font-bold" style={{ color: config.color }}>{config.label}</span>
    </span>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    produce: '🥬',
    dairy: '🥛',
    grain: '🌾',
    protein: '🥩',
    spice: '🌶️',
    beverage: '🥤',
    condiment: '🫙',
    other: '📦',
  };
  return <span className="text-lg">{icons[category] || icons.other}</span>;
}

export default function FridgeScanModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'fridge-scanner';

  const [items, setItems] = useState<DetectedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => setActiveModal(null);

  const processAndScan = useCallback(async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      setLoading(true);
      setScanned(false);
      setItems([]);

      const res = await fetch('/api/fridge-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed }),
      });

      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
        setSource(data.source || 'mock');
        setScanned(true);
        toast({ title: 'Fridge Scanned! 📸', description: `Found ${data.items.length} items` });
      } else {
        toast({ title: 'Scan failed', description: data.message || 'Could not detect items', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Scan Error', description: 'Failed to process image. Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAndScan(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRescan = () => {
    setPreview(null);
    setItems([]);
    setScanned(false);
    setSource('');
  };

  const handleGenerateRecipes = () => {
    toast({ title: 'Coming Soon! 🍳', description: 'Recipe generation from detected ingredients is on the way.' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--sr-rider)]/10 rounded-xl flex items-center justify-center border border-[var(--sr-rider)]/20">
                  <Camera className="w-5 h-5 text-[var(--sr-rider)]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">📸 Fridge Scanner</h2>
                  <p className="text-white/65 text-xs">Snap your fridge, get ingredient insights</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[var(--sr-surface-elevated)] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Camera/Upload Section */}
          <div className="px-4 pt-6">
            {!preview ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-dashed border-white/10 p-8 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-[var(--sr-rider)]/10 rounded-2xl flex items-center justify-center border border-[var(--sr-rider)]/20 mb-4">
                  <Camera className="w-8 h-8 text-[var(--sr-rider)]" />
                </div>
                <h3 className="text-white font-bold text-base mb-1">Scan Your Fridge</h3>
                <p className="text-white/65 text-xs text-center mb-6 max-w-[260px]">
                  Take a photo or upload an image of your fridge and we&apos;ll identify all the ingredients
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-5 py-3 rounded-xl bg-[var(--sr-rider)] text-[var(--sr-surface-base)] font-bold text-sm flex items-center gap-2 hover:bg-[var(--sr-rider)]/90 active:scale-[0.98] transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>

                {/* Hidden inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                {/* Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src={preview}
                    alt="Fridge scan preview"
                    className="w-full max-h-64 object-cover"
                  />
                  {/* Scan overlay animation */}
                  {loading && (
                    <div className="absolute inset-0 bg-[var(--sr-surface-base)]/60 flex items-center justify-center">
                      <div className="text-center">
                        <motion.div
                          animate={{ y: [0, 200, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="w-full max-w-[200px] mx-auto"
                        >
                          <ScanLine className="w-8 h-8 text-[var(--sr-rider)] mx-auto" />
                        </motion.div>
                        <p className="text-white text-sm font-bold mt-4">Scanning...</p>
                        <p className="text-white/65 text-xs">Detecting ingredients</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rescan button */}
                {!loading && (
                  <button
                    onClick={handleRescan}
                    className="mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold flex items-center gap-1.5 hover:bg-white/10 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Scan Again
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Loading indicator when no preview yet */}
          {loading && !preview && (
            <div className="px-4 py-12 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 border-3 border-white/10 border-t-[#38BDF8] rounded-full mb-4"
              />
              <p className="text-white/50 text-sm">Analyzing your fridge...</p>
            </div>
          )}

          {/* Detected Items */}
          <AnimatePresence>
            {scanned && items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 mt-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-base">Detected Items</h3>
                  <span className="text-[10px] text-white/60 bg-white/5 px-2 py-1 rounded-full">
                    {source === 'vlm' ? '✨ VLM Detected' : source === 'mock' ? 'Fallback Data' : 'AI Scanned'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className="bg-[var(--sr-surface-elevated)] rounded-xl border border-white/5 p-3.5 flex items-center gap-3 hover:border-white/10 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <CategoryIcon category={item.category} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-white font-bold text-sm">{item.name}</h4>
                          <FreshnessIndicator freshness={item.freshness} />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-white/60 text-[10px] capitalize">
                            {item.category}
                          </span>
                          <span className="text-white/10">•</span>
                          <span className="text-white/60 text-[10px]">
                            Qty: {item.estimated_quantity}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Freshness Summary */}
                <div className="mt-4 bg-[var(--sr-surface-elevated)] rounded-xl border border-white/5 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[var(--sr-rider)]" />
                    <h4 className="text-white font-bold text-xs">Freshness Summary</h4>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[var(--sr-customer)]" />
                      <span className="text-white/50 text-[10px]">
                        {items.filter((i) => i.freshness === 'fresh').length} Fresh
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[var(--sr-vendor)]" />
                      <span className="text-white/50 text-[10px]">
                        {items.filter((i) => i.freshness === 'aging').length} Aging
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[var(--sr-error)]" />
                      <span className="text-white/50 text-[10px]">
                        {items.filter((i) => i.freshness === 'expiring').length} Expiring
                      </span>
                    </div>
                  </div>
                </div>

                {/* Generate Recipes */}
                <div className="mt-4 mb-32">
                  <motion.button
                    onClick={handleGenerateRecipes}
                    className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[var(--sr-rider)] text-[var(--sr-surface-base)] hover:bg-[var(--sr-rider)]/90 active:scale-[0.98] transition-all"
                  >
                    <ChefHat className="w-4 h-4" />
                    Generate Recipes
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state after scan with no results */}
          {scanned && items.length === 0 && !loading && (
            <div className="px-4 py-12 text-center">
              <p className="text-white/65 text-sm">No items detected. Try a clearer photo!</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
