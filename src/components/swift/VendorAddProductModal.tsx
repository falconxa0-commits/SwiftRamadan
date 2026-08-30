'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, Tag, Truck, Plus, UploadCloud } from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';
import { useUpload } from '@/hooks/use-upload';

/* ──────────────────── Constants ──────────────────── */

const CATEGORIES = [
  { id: 'meals', label: 'Meals', emoji: '🍱' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' },
  { id: 'desserts', label: 'Desserts', emoji: '🍮' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
] as const;

const SAMPLE_IMAGES = [
  { url: '/images/meals/meal-jollof.png', label: 'Jollof' },
  { url: '/images/meals/meal-suya.png', label: 'Suya' },
  { url: '/images/meals/meal-moimoi.png', label: 'Moi Moi' },
  { url: '/images/meals/meal-smoothie.png', label: 'Smoothie' },
  { url: '/images/products/ramadan-box-1.png', label: 'Box' },
  { url: '/images/flash-sales/flash-dates.png', label: 'Dates' },
];

/* ──────────────────── Component ──────────────────── */

export default function VendorAddProductModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const { toast } = useToast();
  const { upload, uploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const isOpen = activeModal === 'vendor-add-product';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>('meals');
  const [image, setImage] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('30 min');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('meals');
    setImage('');
    setDeliveryTime('30 min');
    setDragOver(false);
  };

  const handleClose = () => {
    if (submitting) return;
    setActiveModal(null);
    setTimeout(resetForm, 200);
  };

  /** Handle a single file selected via input or drag-drop. */
  const handleFileSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please pick a JPG, PNG, WEBP or GIF image.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Max size is 5 MB.',
        variant: 'destructive',
      });
      return;
    }
    const url = await upload(file);
    if (url) {
      setImage(url);
      toast({
        title: 'Image uploaded! ✅',
        description: file.name,
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    // Reset input value so picking the same file twice still fires onChange
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a product name', variant: 'destructive' });
      return;
    }
    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: 'Invalid price', description: 'Please enter a valid price in ₦', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          category,
          image,
          deliveryTime,
          vendorEmail: userEmail || '',
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to add product');
      }
      toast({
        title: 'Product Added! 🎉',
        description: `${json.product.name} has been added to your menu`,
      });
      setActiveModal(null);
      setTimeout(resetForm, 200);
      // Trigger a refresh of the store tab via a custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vendor-products-changed'));
      }
    } catch (err) {
      toast({
        title: 'Failed to add product',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />

          {/* Full-Screen Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--sr-vendor)]/20 flex items-center justify-center border border-[var(--sr-vendor)]/30">
                    <Plus className="w-5 h-5 text-[var(--sr-vendor)]" />
                  </div>
                  <div>
                    <h2 className="text-white text-lg font-bold">Add Product</h2>
                    <p className="text-white/65 text-[10px]">Create a new item for your store</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32 pt-4">
              {/* Image Preview + Upload */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/5 overflow-hidden bg-[var(--sr-surface-raised)] mb-4"
              >
                <div
                  className={`relative h-44 flex items-center justify-center transition-all ${
                    dragOver
                      ? 'bg-[var(--sr-vendor)]/10 ring-2 ring-[#F5C451]/40'
                      : 'bg-white/5'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {image ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06070B]/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-bold">
                          Preview
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-2 py-1 rounded-md bg-[var(--sr-vendor)]/80 backdrop-blur-sm text-[#06070B] text-[10px] font-bold hover:bg-[var(--sr-vendor)] disabled:opacity-50"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => setImage('')}
                            disabled={uploading}
                            className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-bold hover:bg-black/70 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </>
                  ) : uploading ? (
                    <div className="flex flex-col items-center text-center px-4">
                      <Loader2 className="w-10 h-10 text-[var(--sr-vendor)] animate-spin mb-2" />
                      <p className="text-white/60 text-xs font-bold">Uploading…</p>
                      <p className="text-white/60 text-[10px] mt-0.5">Saving to /uploads</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center text-center px-4 group"
                      type="button"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[var(--sr-vendor)]/10 border border-[var(--sr-vendor)]/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-6 h-6 text-[var(--sr-vendor)]" />
                      </div>
                      <p className="text-white text-xs font-bold">Tap to upload</p>
                      <p className="text-white/60 text-[10px] mt-0.5">
                        or drop an image here • JPG, PNG, WEBP, GIF (max 5 MB)
                      </p>
                    </button>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {/* Quick image picker */}
                <div className="p-3">
                  <p className="text-white/65 text-[10px] font-bold uppercase tracking-widest mb-2">
                    Quick Pick
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {SAMPLE_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        onClick={() => setImage(img.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          image === img.url
                            ? 'border-[var(--sr-vendor)] shadow-[0_0_10px_rgba(245,196,81,0.4)]'
                            : 'border-transparent hover:border-white/20'
                        }`}
                        aria-label={img.label}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${img.url})` }}
                        />
                        {image === img.url && (
                          <div className="absolute inset-0 bg-[var(--sr-vendor)]/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-[var(--sr-vendor)]" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Form Fields */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-3"
              >
                {/* Name */}
                <div>
                  <label className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                    Product Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jollof Rice & Chicken"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/40 focus:outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the product..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/40 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Price + Delivery Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                      Price (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sr-vendor)] text-sm font-bold pointer-events-none">
                        ₦
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="4500"
                        value={price}
                        onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                      <Truck className="w-3 h-3 inline mr-1" />
                      Delivery Time
                    </label>
                    <input
                      type="text"
                      placeholder="30 min"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/40 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                    <Tag className="w-3 h-3 inline mr-1" />
                    Category
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`py-2.5 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 border ${
                          category === cat.id
                            ? 'bg-[var(--sr-vendor)]/20 text-[var(--sr-vendor)] border-[var(--sr-vendor)]/30'
                            : 'bg-[var(--sr-surface-raised)] text-white/65 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-base">{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image URL (optional override) */}
                <div>
                  <label className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                    Image URL <span className="text-white/60 normal-case font-normal">(optional — overrides upload)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or pick from samples above"
                    value={image.startsWith('/uploads/') ? '' : image}
                    onChange={(e) => setImage(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-[var(--sr-surface-raised)] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/40 focus:outline-none transition-colors disabled:opacity-50"
                  />
                  {image.startsWith('/uploads/') && (
                    <p className="text-[var(--sr-customer)] text-[10px] mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Uploaded image will be used — clear the URL field to override
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || uploading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-[var(--sr-vendor)] text-[#06070B] text-sm font-bold hover:bg-[var(--sr-vendor)]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed gold-glow"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding Product...
                    </>
                  ) : uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading image...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" strokeWidth={3} />
                      Add to Menu
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
