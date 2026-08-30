'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  CameraOff,
  Eye,
  Loader2,
  Volume2,
  VolumeX,
  ChefHat,
  Sparkles,
  Send,
  Upload,
  SkipForward,
  SkipBack,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface LiveCoachRecipe {
  name: string;
  steps: string[];
  voiceIntro?: string;
}

interface Props {
  recipe: LiveCoachRecipe;
  initialStep?: number;
  onClose: () => void;
}

type Action = 'continue' | 'wait' | 'next' | 'trouble';

interface CoachNote {
  id: number;
  text: string;
  action: Action;
  tip?: string;
  time: number;
  spoken?: boolean;
}

const ACTION_META: Record<Action, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
  continue: { color: 'text-[#13ec13]', bg: 'bg-[#13ec13]/10 border-[#13ec13]/25', icon: CheckCircle2, label: 'On track' },
  wait: { color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10 border-[#FFD700]/25', icon: Clock, label: 'Give it time' },
  next: { color: 'text-[#13ec13]', bg: 'bg-[#13ec13]/15 border-[#13ec13]/30', icon: SkipForward, label: 'Step done' },
  trouble: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/25', icon: AlertTriangle, label: 'Heads up' },
};

const AUTO_COACH_INTERVAL = 12000; // 12 seconds between auto-captures

export default function LiveChefCoach({ recipe, initialStep = 0, onClose }: Props) {
  const { toast } = useToast();
  const totalSteps = recipe.steps.length;
  const [step, setStep] = useState(initialStep);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [autoCoach, setAutoCoach] = useState(true);
  const [muted, setMuted] = useState(false);
  const [latestNote, setLatestNote] = useState<CoachNote | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteIdRef = useRef(0);

  const currentStep = recipe.steps[step];

  /* --------------------------- camera lifecycle --------------------------- */

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setUploadedImage(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported on this device.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      toast({ title: 'Camera live 👁️', description: 'Chef Safa can now see your kitchen.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not access camera';
      setCameraError(message);
      toast({ title: 'Camera unavailable', description: 'You can upload a photo instead.' });
    }
  }, [toast]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  /* --------------------------- frame capture --------------------------- */

  const captureFrame = useCallback((): string | null => {
    if (uploadedImage) return uploadedImage;
    if (!videoRef.current || !canvasRef.current || !cameraOn) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video.videoWidth) return null;
    canvas.width = Math.min(video.videoWidth, 720);
    canvas.height = Math.min(video.videoHeight, 540);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, [cameraOn, uploadedImage]);

  /* --------------------------- TTS narration --------------------------- */

  const speak = useCallback(async (text: string) => {
    if (muted) return;
    try {
      const res = await fetch('/api/chef-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play().catch(() => {});
    } catch {
      /* ignore TTS failures */
    }
  }, [muted]);

  /* --------------------------- vision analysis --------------------------- */

  const analyze = useCallback(async (overrideImage?: string) => {
    const image = overrideImage ?? captureFrame();
    if (!image) {
      toast({ title: 'No image to analyze', description: 'Turn on the camera or upload a photo first.' });
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch('/api/chef-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          recipeName: recipe.name,
          step: currentStep,
          stepIndex: step,
        }),
      });
      const data = await res.json();
      const note: CoachNote = {
        id: ++noteIdRef.current,
        text: data.coaching || 'Looking good — keep going!',
        action: (data.action as Action) || 'continue',
        tip: data.tip || undefined,
        time: Date.now(),
      };
      setNotes((prev) => [note, ...prev].slice(0, 12));
      setLatestNote(note);
      speak(note.text);
      if (note.action === 'next' && step < totalSteps - 1) {
        toast({ title: 'Chef says: move to next step ⏭️', description: note.text });
      } else if (note.action === 'trouble') {
        toast({ title: 'Heads up! ⚠️', description: note.text, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Vision failed', description: 'Please try again.' });
    } finally {
      setAnalyzing(false);
    }
  }, [captureFrame, currentStep, recipe.name, step, totalSteps, toast, speak]);

  /* --------------------------- auto-coach loop --------------------------- */

  useEffect(() => {
    if (!autoCoach || !cameraOn || analyzing) return;
    // Initial analysis shortly after camera turns on
    const initialTimeout = setTimeout(() => analyze(), 2500);
    autoTimerRef.current = setInterval(() => {
      if (!analyzing) analyze();
    }, AUTO_COACH_INTERVAL);
    return () => {
      clearTimeout(initialTimeout);
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [autoCoach, cameraOn, analyzing, analyze]);

  /* --------------------------- photo upload fallback --------------------------- */

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedImage(dataUrl);
      stopCamera();
      toast({ title: 'Photo loaded 📸', description: 'Tap "Ask Chef" to get coaching on it.' });
    };
    reader.readAsDataURL(file);
  }, [stopCamera, toast]);

  /* --------------------------- step nav --------------------------- */

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const actionMeta = latestNote ? ACTION_META[latestNote.action] : null;
  const ActionIcon = actionMeta?.icon ?? Eye;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] bg-[#05070A] flex flex-col overflow-hidden"
      >
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera / image feed — full background */}
        <div className="absolute inset-0 bg-black">
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : uploadedImage ? (
             
            <img src={uploadedImage} alt="Your cooking" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#13ec13]/15 border border-[#FFD700]/30 flex items-center justify-center mb-5"
              >
                <Camera className="w-9 h-9 text-[#FFD700]" />
              </motion.div>
              <h2 className="text-white font-bold text-xl mb-2">Live Chef Coach</h2>
              <p className="text-white/50 text-sm max-w-xs mb-1">
                Let Chef Safa <span className="text-[#FFD700] font-semibold">see your kitchen</span> and guide you in real time as you cook <span className="text-white font-semibold">{recipe.name}</span>.
              </p>
              <p className="text-white/60 text-xs max-w-xs mb-6">
                She&rsquo;ll watch your pot, judge your heat, and tell you when to move on — out loud.
              </p>
              {cameraError && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-400/10 border border-red-400/25 text-red-300 text-xs max-w-xs">
                  {cameraError}
                </div>
              )}
              <div className="flex flex-col gap-2.5 w-full max-w-xs">
                <button
                  onClick={startCamera}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#05070A] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Turn on Camera
                </button>
                <label className="w-full py-3 rounded-2xl font-bold text-sm bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload a Photo Instead
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Dim overlay for readability when camera is on */}
          {cameraOn && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />}
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between p-3 sm:p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md">
              <Eye className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-tight">Live Chef Coach</p>
              <p className="text-white/50 text-[10px] leading-tight truncate max-w-[160px]">{recipe.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cameraOn && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 backdrop-blur-md">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-red-300 text-[10px] font-black">LIVE</span>
              </span>
            )}
            <button
              onClick={() => setMuted((m) => !m)}
              className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md hover:bg-white/15 transition-colors"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-white/60" /> : <Volume2 className="w-4 h-4 text-white/80" />}
            </button>
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md hover:bg-white/15 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Current step chip */}
        {(cameraOn || uploadedImage) && (
          <div className="relative z-10 px-4 shrink-0">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#FFD700] text-[10px] font-black">STEP {step + 1} / {totalSteps}</span>
                <div className="flex items-center gap-1">
                  <button onClick={goPrev} disabled={step === 0} className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center disabled:opacity-30">
                    <SkipBack className="w-3 h-3 text-white" />
                  </button>
                  <button onClick={goNext} disabled={step === totalSteps - 1} className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center disabled:opacity-30">
                    <SkipForward className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
              <p className="text-white text-sm leading-snug line-clamp-2">{currentStep}</p>
            </motion.div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Chef Safa avatar + latest coaching speech bubble */}
        {(cameraOn || uploadedImage) && (
          <div className="relative z-10 px-4 pb-2">
            <AnimatePresence mode="wait">
              {latestNote && !analyzing ? (
                <motion.div
                  key={latestNote.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-end gap-3"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FFD700]/50 bg-gradient-to-br from-[#FFD700]/20 to-[#13ec13]/15"
                    >
                      { }
                      <img src="/images/chef/safa-portrait.png" alt="Chef Safa" className="w-full h-full object-cover" />
                    </motion.div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-[#05070A] flex items-center justify-center ${actionMeta?.bg}`}>
                      <ActionIcon className={`w-2.5 h-2.5 ${actionMeta?.color}`} />
                    </span>
                  </div>
                  {/* Speech bubble */}
                  <div className={`flex-1 rounded-2xl border backdrop-blur-md p-3.5 ${actionMeta?.bg ?? 'bg-white/10 border-white/15'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-wide ${actionMeta?.color}`}>{actionMeta?.label}</span>
                      <Sparkles className="w-2.5 h-2.5 text-[#FFD700]" />
                    </div>
                    <p className="text-white text-sm leading-snug">{latestNote.text}</p>
                    {latestNote.tip && (
                      <p className="text-white/50 text-xs mt-1.5 pt-1.5 border-t border-white/10">💡 {latestNote.tip}</p>
                    )}
                  </div>
                </motion.div>
              ) : analyzing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-end gap-3"
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FFD700]/50 bg-gradient-to-br from-[#FFD700]/20 to-[#13ec13]/15">
                      { }
                      <img src="/images/chef/safa-portrait.png" alt="Chef Safa" className="w-full h-full object-cover" />
                    </div>
                    <motion.span
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-[#05070A] bg-[#FFD700] flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-2.5 h-2.5 text-[#05070A]" />
                    </motion.span>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-3.5">
                    <p className="text-white/70 text-sm">Chef Safa is looking at your kitchen…</p>
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#FFD700]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-end gap-3"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 bg-gradient-to-br from-[#FFD700]/20 to-[#13ec13]/15 shrink-0">
                    { }
                    <img src="/images/chef/safa-portrait.png" alt="Chef Safa" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-3.5">
                    <p className="text-white/60 text-sm">Tap <span className="text-[#FFD700] font-semibold">Ask Chef</span> to get live coaching on what&rsquo;s in front of you.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Coaching history (collapsible) */}
        {notes.length > 1 && (cameraOn || uploadedImage) && (
          <div className="relative z-10 px-4 pb-2 max-h-24 overflow-y-auto custom-scrollbar">
            <p className="text-white/60 text-[10px] font-bold mb-1">Earlier notes</p>
            <div className="space-y-1">
              {notes.slice(1, 5).map((n) => {
                const m = ACTION_META[n.action];
                const I = m.icon;
                return (
                  <div key={n.id} className="flex items-start gap-2 text-xs">
                    <I className={`w-3 h-3 mt-0.5 shrink-0 ${m.color}`} />
                    <p className="text-white/50 leading-snug line-clamp-1">{n.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        {(cameraOn || uploadedImage) && (
          <div className="relative z-10 p-3 sm:p-4 pb-6 shrink-0 bg-gradient-to-t from-black/80 to-transparent">
            {/* Auto-coach toggle */}
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setAutoCoach((a) => !a)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
                  autoCoach
                    ? 'bg-[#13ec13]/15 text-[#13ec13] border border-[#13ec13]/25'
                    : 'bg-white/10 text-white/50 border border-white/15'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoCoach ? 'bg-[#13ec13]' : 'bg-white/30'}`} />
                Auto-coach {autoCoach ? 'ON · every 12s' : 'OFF'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              {cameraOn ? (
                <button
                  onClick={stopCamera}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:bg-white/15 transition-colors backdrop-blur-md"
                  aria-label="Stop camera"
                >
                  <CameraOff className="w-5 h-5" />
                </button>
              ) : uploadedImage ? (
                <label className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:bg-white/15 transition-colors backdrop-blur-md cursor-pointer">
                  <RefreshCw className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              ) : null}

              <button
                onClick={() => analyze()}
                disabled={analyzing}
                className="px-6 h-14 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#05070A] font-bold text-sm shadow-lg shadow-[#FFD700]/30 disabled:opacity-60 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Looking…
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Ask Chef Now
                  </>
                )}
              </button>

              <button
                onClick={() => { setNotes([]); setLatestNote(null); }}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:bg-white/15 transition-colors backdrop-blur-md"
                aria-label="Clear history"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-white/65 text-[10px] mt-2.5">
              {cameraOn
                ? 'Chef Safa watches your pot and coaches you out loud'
                : uploadedImage
                  ? 'Photo loaded — ask Chef for feedback on it'
                  : 'Turn on your camera to begin'}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
