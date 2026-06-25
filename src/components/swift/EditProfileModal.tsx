'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Phone,
  MapPin,
  Camera,
  Loader2,
  Check,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useUpload } from '@/hooks/use-upload';

const LAGOS_AREAS = [
  'Lekki',
  'Victoria Island',
  'Ikeja',
  'Surulere',
  'Yaba',
  'Festac',
  'Ikoyi',
  'Gbagada',
];

const AVATAR_GRADIENTS = [
  'from-[#10E07A] to-[#0eB060]',
  'from-[#F5C451] to-[#d99a30]',
  'from-[#A78BFA] to-[#7d63e0]',
  'from-[#38BDF8] to-[#1f8fce]',
  'from-[#FB7185] to-[#e0526b]',
  'from-[#10E07A] to-[#A78BFA]',
];

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function gradientForName(name: string): string {
  if (!name) return AVATAR_GRADIENTS[0];
  const code = name.toUpperCase().charCodeAt(0) || 65;
  return AVATAR_GRADIENTS[(code - 65) % AVATAR_GRADIENTS.length];
}

function generateAvatarUrl(name: string): string {
  const initials = getInitials(name);
  // Use a deterministic, colorful initial-based avatar via DiceBear
  const seed = encodeURIComponent(name || 'guest');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=10E07A,F5C451,A78BFA,38BDF8,FB7185&textColor=ffffff&fontWeight=900&radius=50`;
}

export default function EditProfileModal() {
  const {
    activeModal,
    setActiveModal,
    userEmail,
    userName,
    userPhone,
    userArea,
    userAvatar,
    setUserName,
    setUserPhone,
    setUserArea,
    setUserAvatar,
  } = useAppStore();
  const { toast } = useToast();
  const { upload, uploading: avatarUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOpen = activeModal === 'edit-profile';

  const [name, setName] = useState(userName || '');
  const [phone, setPhone] = useState(userPhone || '');
  const [area, setArea] = useState(userArea || 'Lekki');
  const [avatar, setAvatar] = useState(userAvatar || '');
  const [saving, setSaving] = useState(false);

  const handleClose = () => setActiveModal(null);

  const handleGenerateFromInitials = () => {
    const url = generateAvatarUrl(name || userName);
    setAvatar(url);
    toast({ title: 'Avatar generated', description: `Created from initials: ${getInitials(name || userName)}` });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please pick a JPG, PNG, or WEBP image.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Max size is 5 MB.', variant: 'destructive' });
      return;
    }
    const url = await upload(file);
    if (url) {
      setAvatar(url);
      toast({ title: 'Avatar uploaded! ✅', description: file.name });
    }
    // Reset input value so picking the same file twice still fires onChange
    if (e.target) e.target.value = '';
  };

  const handleAvatarClick = () => {
    if (!avatarUploading) fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Please enter your name.', variant: 'destructive' });
      return;
    }
    if (!userEmail) {
      toast({ title: 'Sign in required', description: 'Please sign in to save changes.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: name.trim(),
          phone: phone.trim(),
          area,
          avatar,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        // Update Zustand store
        setUserName(name.trim());
        setUserPhone(phone.trim());
        setUserArea(area);
        setUserAvatar(avatar);
        toast({
          title: 'Profile updated! ✅',
          description: 'Your changes have been saved.',
        });
        setActiveModal(null);
      } else {
        toast({
          title: 'Update failed',
          description: data?.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(name || userName);
  const gradient = gradientForName(name || userName);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md max-h-[90vh] glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto"
              style={{ background: 'linear-gradient(180deg, rgba(15,17,24,0.95), rgba(11,13,20,0.98))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#10E07A]/10 border border-[#10E07A]/30 flex items-center justify-center icon-tile">
                    <User className="w-5 h-5 text-[#10E07A] relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-tight">Edit Profile</h2>
                    <p className="text-white/40 text-[11px]">Update your personal info</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close edit profile"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 space-y-5">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={avatarUploading}
                      className="block focus:outline-none"
                      aria-label="Change avatar"
                    >
                      <div
                        className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border-2 border-white/10 overflow-hidden relative transition-transform ${
                          avatarUploading ? 'opacity-60' : 'hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                        style={{ boxShadow: '0 0 24px rgba(16,224,122,0.25)' }}
                      >
                        {avatar && !avatarUploading ? (
                          <img
                            src={avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={() => setAvatar('')}
                          />
                        ) : avatarUploading ? (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : (
                          <span className="text-white text-3xl font-black">{initials}</span>
                        )}
                      </div>
                      <label
                        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#10E07A] flex items-center justify-center border-2 border-[#06070B] cursor-pointer hover:bg-[#0eB060] transition-colors active:scale-95"
                        title="Change avatar"
                      >
                        {avatarUploading ? (
                          <Loader2 className="w-4 h-4 text-[#06070B] animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-[#06070B]" />
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={avatarUploading}
                        />
                      </label>
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    {avatarUploading ? (
                      <p className="text-[#10E07A] text-xs font-bold flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading avatar…
                      </p>
                    ) : avatar.startsWith('/uploads/') ? (
                      <p className="text-[#10E07A] text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Avatar uploaded
                      </p>
                    ) : null}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={avatarUploading}
                        className="flex items-center gap-1.5 text-[#10E07A] text-xs font-bold hover:underline disabled:opacity-50"
                      >
                        <UploadCloud className="w-3 h-3" />
                        Upload photo
                      </button>
                      <span className="text-white/20 text-xs">·</span>
                      <button
                        onClick={handleGenerateFromInitials}
                        disabled={avatarUploading}
                        className="flex items-center gap-1.5 text-white/60 text-xs font-bold hover:text-[#10E07A] hover:underline disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Use initials
                      </button>
                    </div>
                    <p className="text-white/30 text-[10px] mt-0.5">JPG, PNG, WEBP, GIF · max 5 MB</p>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Full Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#0F1118] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10E07A]/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Phone Number
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +234 801 234 5678"
                    inputMode="tel"
                    className="w-full bg-[#0F1118] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10E07A]/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Area */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Area (Lagos)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {LAGOS_AREAS.map(a => (
                      <button
                        key={a}
                        onClick={() => setArea(a)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          area === a
                            ? 'bg-[#10E07A]/10 border-[#10E07A]/40 text-[#10E07A]'
                            : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-white/15'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || avatarUploading || !name.trim()}
                    className="w-full py-3.5 rounded-xl bg-[#10E07A] text-[#06070B] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0eB060] transition-colors active:scale-[0.98] green-glow"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : avatarUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading avatar…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
