'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Film, Link2, Loader2, Check, Sparkles, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUpload } from '@/hooks/use-upload';

interface UploadVideoModalProps {
  onClose: () => void;
  onUploaded: () => void;
  authorName: string;
  authorHandle: string;
}

const CATEGORIES = [
  { id: 'cooking', label: 'Cooking' },
  { id: 'iftar', label: 'Iftar' },
  { id: 'sahur', label: 'Sahur' },
  { id: 'tips', label: 'Tips' },
  { id: 'reviews', label: 'Reviews' },
];

const SAMPLE_CLIPS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
];

export default function UploadVideoModal({
  onClose,
  onUploaded,
  authorName,
  authorHandle,
}: UploadVideoModalProps) {
  const { toast } = useToast();
  const { upload, uploading: thumbUploading } = useUpload();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('cooking');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleThumbFile = async (file: File) => {
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
      setThumbnailUrl(url);
      toast({
        title: 'Thumbnail uploaded! 🖼️',
        description: file.name,
      });
    }
  };

  const handleThumbInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleThumbFile(file);
    if (e.target) e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      toast({
        title: 'Missing details',
        description: 'Please add a title and a video URL',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          authorName,
          authorHandle,
          category,
        }),
      });
      if (!res.ok) throw new Error('Upload failed');
      setSuccess(true);
      toast({
        title: 'Reel uploaded! 🎬',
        description: 'Your reel is now live in the feed',
      });
      setTimeout(() => {
        onUploaded();
        onClose();
      }, 1200);
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: 'Could not upload your reel. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-[71] mx-auto max-w-lg max-h-[90vh] overflow-y-auto bg-[#0B0D14] rounded-t-3xl border-t border-white/10"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-[var(--sr-customer)]/15 border border-[var(--sr-customer)]/30 flex items-center justify-center">
              <Film className="w-4 h-4 text-[var(--sr-customer)]" />
            </div>
            <h3 className="text-white font-black text-base tracking-tight">Upload a Reel</h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="size-16 rounded-full bg-[var(--sr-customer)]/15 border-2 border-[var(--sr-customer)] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,224,122,0.4)]"
            >
              <Check className="w-8 h-8 text-[var(--sr-customer)]" strokeWidth={3} />
            </motion.div>
            <p className="text-white font-black text-lg">Reel Published!</p>
            <p className="text-white/50 text-sm mt-1">Loading your reel into the feed...</p>
          </div>
        ) : (
          <div className="px-5 pb-6 space-y-4">
            {/* Title */}
            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smoky Jollof in 90 seconds"
                maxLength={120}
                className="mt-1.5 w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Caption</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your reel... #iftar #ramadan"
                maxLength={500}
                rows={3}
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`px-3.5 h-8 rounded-full text-xs font-bold transition-all ${
                      category === c.id
                        ? 'bg-[var(--sr-customer)] text-[#04140C]'
                        : 'bg-white/5 text-white/60 border border-white/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3 h-3" /> Video URL
              </label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://...mp4"
                className="mt-1.5 w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors font-mono"
              />
              {/* Quick pick sample clips */}
              <div className="mt-2">
                <p className="text-white/65 text-[10px] font-medium mb-1.5">Quick pick a demo clip:</p>
                <div className="flex gap-2">
                  {SAMPLE_CLIPS.map((url, i) => (
                    <button
                      key={url}
                      onClick={() => setVideoUrl(url)}
                      className={`flex-1 h-9 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        videoUrl === url
                          ? 'border-[var(--sr-customer)] bg-[var(--sr-customer)]/10 text-[var(--sr-customer)]'
                          : 'border-white/10 bg-white/5 text-white/50'
                      }`}
                    >
                      <Film className="w-3 h-3" /> Clip {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Thumbnail upload + URL (optional) */}
            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Thumbnail <span className="text-white/60 normal-case font-normal">(optional)</span></label>

              {/* Preview / upload zone */}
              <div
                className="mt-1.5 relative h-28 rounded-xl overflow-hidden border border-white/10 bg-white/5"
                onClick={() => !thumbUploading && thumbInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    thumbInputRef.current?.click();
                  }
                }}
              >
                {thumbnailUrl ? (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 text-white/80 text-[9px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-[var(--sr-customer)]" />
                        Uploaded
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnailUrl('');
                        }}
                        className="px-2 py-0.5 rounded-md bg-black/60 text-white/80 text-[9px] font-bold hover:bg-black/80"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : thumbUploading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[var(--sr-customer)] animate-spin mb-1" />
                    <p className="text-white/60 text-[10px] font-bold">Uploading…</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-9 h-9 rounded-xl bg-[var(--sr-customer)]/15 border border-[var(--sr-customer)]/30 flex items-center justify-center mb-1">
                      <UploadCloud className="w-5 h-5 text-[var(--sr-customer)]" />
                    </div>
                    <p className="text-white/80 text-[11px] font-bold">Tap to upload thumbnail</p>
                    <p className="text-white/65 text-[9px] mt-0.5">JPG, PNG, WEBP, GIF · max 5 MB</p>
                  </div>
                )}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleThumbInputChange}
                />
              </div>

              {/* URL override (kept for manual paste) */}
              <div className="relative mt-2">
                <ImageIcon className="w-3.5 h-3.5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={thumbnailUrl.startsWith('/uploads/') ? '' : thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="…or paste a thumbnail URL"
                  disabled={thumbUploading}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors disabled:opacity-50 font-mono"
                />
              </div>
            </div>

            {/* Author note */}
            <div className="flex items-center gap-2 p-2 sm:p-3 rounded-xl bg-[#A78BFA]/8 border border-[#A78BFA]/15">
              <Sparkles className="w-4 h-4 text-[#A78BFA] shrink-0" />
              <p className="text-white/60 text-[11px]">
                Posting as <span className="text-white font-bold">{authorName}</span> ({authorHandle})
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || thumbUploading || !title.trim() || !videoUrl.trim()}
              className="w-full h-12 rounded-xl bg-[var(--sr-customer)] text-[#04140C] font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform shadow-[0_0_24px_rgba(16,224,122,0.35)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                </>
              ) : thumbUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading thumbnail...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" strokeWidth={2.5} /> Publish Reel
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
