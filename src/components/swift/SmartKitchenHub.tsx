'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChefHat,
  Camera,
  ScanLine,
  Sparkles,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Bot,
  Clock,
  Flame,
  Trophy,
  Target,
  Star,
  Crown,
  Medal,
  Zap,
  Brain,
  Users,
  Utensils,
  RefreshCw,
  Video,
  CookingPot,
  ShoppingCart,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { trendingMeals, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

/* ───────────────────────── Types ───────────────────────── */

type TabId = 'coach' | 'pantry' | 'insights' | 'badges';
type CoachPhase = 'select' | 'ready' | 'live' | 'scanner';
type Difficulty = 'easy' | 'medium' | 'hard';
type Mood = 'praise' | 'guide' | 'correct' | 'encourage';

interface SelectedRecipe {
  name: string;
  image: string;
  difficulty: Difficulty;
  timeMins: number;
}

interface Coaching {
  tip: string;
  mood: Mood;
  progress: number;
  done: boolean;
}

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiresAt?: string | null;
}

interface RescueRecipe {
  recipeName: string;
  description: string;
  timeMins: number;
  difficulty: string;
  ingredients: { name: string; use: string }[];
  steps: string[];
  chefTip: string;
}

interface VisualSearchResult {
  foodName: string;
  category: string;
  description: string;
  tags: string[];
  estimatedPriceNGN: number;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

interface Analytics {
  totalSessions: number;
  completedSessions: number;
  totalCookTimeMins: number;
  avgSessionMins: number;
  liveAIUses: number;
  lastCooked: string | null;
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  weeklyData: { day: string; count: number; mins: number }[];
  achievements: Achievement[];
}

const EMPTY_ANALYTICS: Analytics = {
  totalSessions: 0,
  completedSessions: 0,
  totalCookTimeMins: 0,
  avgSessionMins: 0,
  liveAIUses: 0,
  lastCooked: null,
  difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
  weeklyData: [
    { day: 'Mon', count: 0, mins: 0 },
    { day: 'Tue', count: 0, mins: 0 },
    { day: 'Wed', count: 0, mins: 0 },
    { day: 'Thu', count: 0, mins: 0 },
    { day: 'Fri', count: 0, mins: 0 },
    { day: 'Sat', count: 0, mins: 0 },
    { day: 'Sun', count: 0, mins: 0 },
  ],
  achievements: [],
};

/* ───────────────────────── Helpers ───────────────────────── */

const PANTRY_CATEGORIES = ['produce', 'dairy', 'grain', 'protein', 'spice', 'other'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  produce: '🥬 Produce',
  dairy: '🥛 Dairy',
  grain: '🌾 Grains',
  protein: '🍖 Protein',
  spice: '🌶️ Spices',
  other: '📦 Other',
};

const MOOD_STYLES: Record<Mood, { border: string; bg: string; emoji: string; label: string }> = {
  praise: { border: 'border-[#10E07A]/60', bg: 'bg-[#10E07A]/8', emoji: '🎉', label: 'Praise' },
  guide: { border: 'border-[#F5C451]/60', bg: 'bg-[#F5C451]/8', emoji: '💡', label: 'Tip' },
  correct: { border: 'border-[#ef4444]/60', bg: 'bg-[#ef4444]/8', emoji: '⚠️', label: 'Heads up' },
  encourage: { border: 'border-[#8b5cf6]/60', bg: 'bg-[#8b5cf6]/8', emoji: '💪', label: 'Keep going' },
};

const BADGE_ICONS: Record<string, typeof Trophy> = {
  '🏆': Trophy,
  '⭐': Star,
  '🔥': Flame,
  '🤖': Bot,
  '⚔️': Zap,
  '👨‍🍳': ChefHat,
  '🏃': Target,
  '🧭': Medal,
  '🍳': CookingPot,
  '👑': Crown,
};

const GENERIC_STEPS = [
  'Prep ingredients: wash, chop, and measure everything before you start.',
  'Heat oil in a pan over medium heat until shimmering.',
  'Cook the base: sauté onions and aromatics until fragrant.',
  'Add main ingredients and season generously — stir to coat.',
  'Season & simmer: lower heat, cover, and let flavors develop.',
  'Final touches: taste, adjust salt, and garnish before serving.',
];

function generateSteps(recipeName: string): string[] {
  const n = recipeName.toLowerCase();
  const steps = [...GENERIC_STEPS];
  if (n.includes('smoothie') || n.includes('drink') || n.includes('juice')) {
    return [
      'Prep ingredients: wash fruits and measure liquids.',
      'Add base liquids (milk/water/yogurt) to the blender first.',
      'Toss in fruits, dates, and nuts.',
      'Blend on high for 45–60 seconds until silky.',
      'Taste, sweeten if needed, and pour over ice.',
    ];
  }
  if (n.includes('suya') || n.includes('grill')) {
    return [
      'Prep & cut protein into thin strips; thread onto skewers.',
      'Mix suya spice (kuli-kuli, paprika, ginger, salt) on a plate.',
      'Coat skewers generously with the spice mix.',
      'Grill over high heat, 2–3 min per side, until charred.',
      'Rest 2 minutes, then serve with onions and tomatoes.',
    ];
  }
  // default 6-step generic flow
  return steps;
}

function difficultyColor(d: string): string {
  if (d === 'easy') return '#10E07A';
  if (d === 'hard') return '#ef4444';
  return '#F5C451';
}

/* ───────────────────────── Component ───────────────────────── */

export default function SmartKitchenHub() {
  const { activeModal, setActiveModal, userEmail, userName, addToCart } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'smart-kitchen';

  const email = userEmail || 'guest';

  /* ── Tab + coach phase ── */
  const [activeTab, setActiveTab] = useState<TabId>('coach');
  const [coachPhase, setCoachPhase] = useState<CoachPhase>('select');

  /* ── Recipe selection ── */
  const [selectedRecipe, setSelectedRecipe] = useState<SelectedRecipe | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty>('medium');

  /* ── Live session ── */
  const [stepIndex, setStepIndex] = useState(0);
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  /* ── Scanner ── */
  const [scanResult, setScanResult] = useState<VisualSearchResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  /* ── Pantry ── */
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [showAddPantry, setShowAddPantry] = useState(false);
  const [pantryForm, setPantryForm] = useState({
    name: '',
    category: 'produce' as string,
    quantity: '1',
    unit: 'pcs',
    expiresAt: '',
  });
  const [rescueRecipe, setRescueRecipe] = useState<RescueRecipe | null>(null);
  const [rescueLoading, setRescueLoading] = useState(false);

  /* ── Insights ── */
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY_ANALYTICS);
  const [insightsLoading, setInsightsLoading] = useState(true);

  /* ── Refs (mirror state for interval callback — CRITICAL lint pattern) ── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  const stepIndexRef = useRef(stepIndex);
  const recipeRef = useRef<SelectedRecipe | null>(selectedRecipe);
  const stepsRef = useRef<string[]>([]);
  const emailRef = useRef(email);
  const coachPhaseRef = useRef<CoachPhase>(coachPhase);

  // keep refs in sync with state — these effects only assign to refs, no setState
  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);
  useEffect(() => { recipeRef.current = selectedRecipe; }, [selectedRecipe]);
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { coachPhaseRef.current = coachPhase; }, [coachPhase]);
  useEffect(() => {
    if (selectedRecipe) stepsRef.current = generateSteps(selectedRecipe.name);
  }, [selectedRecipe]);

  /* ── Camera lifecycle ── */
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab !== 'coach') return;
    if (coachPhase !== 'live' && coachPhase !== 'scanner') return;

    setCameraError(null);
    let cancelled = false;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (!cancelled) setCameraError('unavailable');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const name = (err as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setCameraError('denied');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setCameraError('unavailable');
        } else {
          setCameraError('unavailable');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        try { videoRef.current.srcObject = null; } catch { /* noop */ }
      }
    };
  }, [isOpen, activeTab, coachPhase]);

  /* ── Frame capture interval (5s) — reads from refs, never setState in body ── */
  useEffect(() => {
    if (!isOpen || coachPhase !== 'live') return;

    const tick = async () => {
      const video = videoRef.current;
      const stream = streamRef.current;
      if (!video || !stream || video.readyState < 2) return;
      if (coachPhaseRef.current !== 'live') return;

      const idx = stepIndexRef.current;
      const recipe = recipeRef.current;
      if (!recipe) return;
      const stepText = stepsRef.current[idx] || '';
      const mail = emailRef.current;

      const canvas = document.createElement('canvas');
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      let image = '';
      try {
        image = canvas.toDataURL('image/jpeg', 0.7);
      } catch {
        return;
      }
      if (!image) return;

      try {
        setVisionLoading(true);
        const res = await fetch('/api/live-vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image,
            recipeName: recipe.name,
            currentStep: stepText,
            stepIndex: idx,
            email: mail,
          }),
        });
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        if (data?.coaching) {
          setCoaching(data.coaching as Coaching);
        }
      } catch {
        /* silent — next tick will retry */
      } finally {
        setVisionLoading(false);
      }
    };

    // fire one immediately so the user gets feedback fast, then every 5s
    tick();
    const id = setInterval(tick, 5000);
    intervalRef.current = id;

    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [isOpen, coachPhase]);

  /* ── Pantry fetch on tab open ── */
  const fetchPantry = useCallback(async () => {
    try {
      const res = await fetch(`/api/pantry?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data?.items)) setPantry(data.items as PantryItem[]);
    } catch { /* silent */ }
  }, [email]);

  useEffect(() => {
    if (isOpen && activeTab === 'pantry') fetchPantry();
  }, [isOpen, activeTab, fetchPantry]);

  /* ── Analytics fetch on tab open ── */
  const fetchAnalytics = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch(`/api/cooking-sessions?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data && typeof data === 'object') {
        setAnalytics({ ...EMPTY_ANALYTICS, ...data } as Analytics);
      }
    } catch { /* silent */ }
    setInsightsLoading(false);
  }, [email]);

  useEffect(() => {
    if (isOpen && (activeTab === 'insights' || activeTab === 'badges')) {
      fetchAnalytics();
    }
  }, [isOpen, activeTab, fetchAnalytics]);

  /* ── Reset coach state when modal closes ── */
  useEffect(() => {
    if (!isOpen) {
      // defer reset so exit animation is clean
      const t = setTimeout(() => {
        setCoachPhase('select');
        setSelectedRecipe(null);
        setStepIndex(0);
        setCoaching(null);
        setCameraError(null);
        setScanResult(null);
        setCustomName('');
        setCustomDifficulty('medium');
        setActiveTab('coach');
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ───────────────────────── Handlers ───────────────────────── */

  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, [setActiveModal]);

  const handleSelectMeal = (meal: typeof trendingMeals[number]) => {
    setSelectedRecipe({
      name: meal.name,
      image: meal.image,
      difficulty: (meal.price > 4000 ? 'hard' : meal.price > 3000 ? 'medium' : 'easy') as Difficulty,
      timeMins: parseInt(meal.deliveryTime) || 25,
    });
    setStepIndex(0);
    setCoaching(null);
    setCoachPhase('ready');
  };

  const handleStartCustom = () => {
    const name = customName.trim();
    if (!name) {
      toast({ title: 'Recipe name needed', description: 'Tell Chef Safa what you want to cook.', variant: 'destructive' });
      return;
    }
    setSelectedRecipe({
      name,
      image: '/images/categories/cat-groceries.png',
      difficulty: customDifficulty,
      timeMins: customDifficulty === 'easy' ? 20 : customDifficulty === 'hard' ? 45 : 30,
    });
    setStepIndex(0);
    setCoaching(null);
    setCoachPhase('ready');
  };

  const handleStartLive = () => {
    sessionStartRef.current = Date.now();
    setStepIndex(0);
    stepIndexRef.current = 0;
    setCoaching(null);
    setCoachPhase('live');
  };

  const handleNextStep = () => {
    if (!selectedRecipe) return;
    const steps = stepsRef.current;
    const next = Math.min(steps.length - 1, stepIndex + 1);
    stepIndexRef.current = next;
    setStepIndex(next);
  };

  const handlePrevStep = () => {
    const prev = Math.max(0, stepIndex - 1);
    stepIndexRef.current = prev;
    setStepIndex(prev);
  };

  const handleCompleteSession = async () => {
    if (!selectedRecipe) return;
    const durationSec = Math.max(5, Math.round((Date.now() - sessionStartRef.current) / 1000));
    try {
      const sessionRes = await fetch('/api/cooking-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recipeName: selectedRecipe.name,
          difficulty: selectedRecipe.difficulty,
          durationSec,
          completed: true,
          usedLiveAI: true,
        }),
      });
      if (!sessionRes.ok) {
        throw new Error(`API error: ${sessionRes.status}`);
      }
    } catch { /* still celebrate */ }

    // stop camera explicitly
    const s = streamRef.current;
    if (s) { s.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

    setShowConfetti(true);
    toast({
      title: '🎉 Session complete!',
      description: `${selectedRecipe.name} logged. Chef Safa is proud of you!`,
    });
    setTimeout(() => {
      setShowConfetti(false);
      setCoachPhase('select');
      setSelectedRecipe(null);
      setStepIndex(0);
      stepIndexRef.current = 0;
      setCoaching(null);
    }, 2400);
  };

  const handleOpenScanner = () => {
    setScanResult(null);
    setCoachPhase('scanner');
  };

  const handleSnapAndIdentify = async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || video.readyState < 2) {
      toast({ title: 'Camera not ready', description: 'Give the camera a moment to start.', variant: 'destructive' });
      return;
    }
    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    let image = '';
    try { image = canvas.toDataURL('image/jpeg', 0.8); } catch { return; }
    if (!image) return;

    setScanLoading(true);
    try {
      const res = await fetch('/api/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data?.result) {
        setScanResult(data.result as VisualSearchResult);
        toast({ title: '🔍 Identified!', description: data.result.foodName });
      }
    } catch {
      toast({ title: 'Scan failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setScanLoading(false);
    }
  };

  const handleAddScanToCart = () => {
    if (!scanResult) return;
    addToCart({
      id: Math.floor(Math.random() * 100000),
      name: scanResult.foodName,
      price: scanResult.estimatedPriceNGN,
      image: '/images/categories/cat-groceries.png',
      quantity: 1,
    });
    toast({ title: '🛒 Added to cart', description: `${scanResult.foodName} — ${formatNaira(scanResult.estimatedPriceNGN)}` });
  };

  /* ── Pantry handlers ── */
  const handleAddPantry = async () => {
    const name = pantryForm.name.trim();
    if (!name) {
      toast({ title: 'Name needed', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          category: pantryForm.category,
          quantity: pantryForm.quantity,
          unit: pantryForm.unit,
          expiresAt: pantryForm.expiresAt || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data?.item) {
        setPantry((prev) => [data.item as PantryItem, ...prev]);
        setPantryForm({ name: '', category: 'produce', quantity: '1', unit: 'pcs', expiresAt: '' });
        setShowAddPantry(false);
        toast({ title: '✅ Added to pantry', description: name });
      }
    } catch { /* silent */ }
  };

  const handleDeletePantry = async (id: string) => {
    setPantry((prev) => prev.filter((p) => p.id !== id));
    try {
      const delRes = await fetch(`/api/pantry?email=${encodeURIComponent(email)}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!delRes.ok) {
        throw new Error(`API error: ${delRes.status}`);
      }
    } catch { /* silent */ }
  };

  const handleRescue = async () => {
    if (pantry.length === 0) {
      toast({ title: 'Pantry empty', description: 'Add a few items first!', variant: 'destructive' });
      return;
    }
    setRescueLoading(true);
    setRescueRecipe(null);
    try {
      const res = await fetch('/api/pantry/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pantry.map((p) => p.name), email }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data?.recipe) setRescueRecipe(data.recipe as RescueRecipe);
    } catch { /* silent */ }
    setRescueLoading(false);
  };

  const handleCookRescueNow = () => {
    if (!rescueRecipe) return;
    setSelectedRecipe({
      name: rescueRecipe.recipeName,
      image: '/images/categories/cat-groceries.png',
      difficulty: (rescueRecipe.difficulty === 'easy' || rescueRecipe.difficulty === 'hard' ? rescueRecipe.difficulty : 'medium') as Difficulty,
      timeMins: rescueRecipe.timeMins || 30,
    });
    setStepIndex(0);
    stepIndexRef.current = 0;
    setCoachPhase('ready');
    setActiveTab('coach');
    setRescueRecipe(null);
  };

  // The <video> element is created here (so the ref lives in the parent) and passed
  // down as a ReactNode. Passing a ref object OR a ref-callback as a prop triggers the
  // react-hooks/refs rule on every props.* access in the child — ReactNode sidesteps it.
  const videoElement = (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full aspect-[3/4] sm:aspect-video object-cover"
    />
  );

  /* ───────────────────────── Derived ───────────────────────── */

  const steps = selectedRecipe ? stepsRef.current : [];
  const unlockedCount = analytics.achievements.filter((a) => a.unlocked).length;

  // Precompute donut segments so we never mutate during render
  const donutSegments = useMemo(() => {
    const { easy, medium, hard } = analytics.difficultyBreakdown;
    const total = easy + medium + hard;
    const r = 40;
    const C = 2 * Math.PI * r;
    const segs = [
      { value: easy, color: '#10E07A' },
      { value: medium, color: '#F5C451' },
      { value: hard, color: '#8b5cf6' },
    ];
    if (total === 0) return { segments: segs.map((s) => ({ ...s, length: 0, offset: 0 })), total: 0, C };
    let acc = 0;
    const out = segs.map((s) => {
      const length = (s.value / total) * C;
      const offset = -acc;
      acc += length;
      return { ...s, length, offset };
    });
    return { segments: out, total, C };
  }, [analytics.difficultyBreakdown]);

  const weeklyMax = useMemo(
    () => Math.max(1, ...analytics.weeklyData.map((d) => d.count)),
    [analytics.weeklyData],
  );

  /* ───────────────────────── Render ───────────────────────── */

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative mt-auto h-[100dvh] w-full bg-[#05070A] flex flex-col overflow-hidden sk-aura"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            {/* ── Header ── */}
            <div className="shrink-0 relative">
              <div className="h-[2px] w-full bg-gradient-to-r from-[#10E07A] via-[#F5C451] to-[#8b5cf6]" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-10 rounded-xl bg-gradient-to-br from-[#10E07A] to-[#0a8a0a] flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5 text-[#05070A]" />
                    <span className="absolute -top-1 -right-1 size-2.5 bg-[#ef4444] rounded-full live-ring" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-white text-base font-black tracking-tight truncate">Smart Kitchen</h2>
                      <span className="beta-badge">Beta</span>
                    </div>
                    <p className="text-white/50 text-[11px] truncate">
                      Chef Safa {userName ? `· ${userName.split(' ')[0]}` : 'is live'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="size-9 rounded-full bg-[#1A1D26] border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
              {activeTab === 'coach' && (
                <CoachTab
                  coachPhase={coachPhase}
                  selectedRecipe={selectedRecipe}
                  stepIndex={stepIndex}
                  steps={steps}
                  coaching={coaching}
                  cameraError={cameraError}
                  visionLoading={visionLoading}
                  scanResult={scanResult}
                  scanLoading={scanLoading}
                  videoElement={videoElement}
                  customName={customName}
                  setCustomName={setCustomName}
                  customDifficulty={customDifficulty}
                  setCustomDifficulty={setCustomDifficulty}
                  onSelectMeal={handleSelectMeal}
                  onStartCustom={handleStartCustom}
                  onStartLive={handleStartLive}
                  onNextStep={handleNextStep}
                  onPrevStep={handlePrevStep}
                  onComplete={handleCompleteSession}
                  onOpenScanner={handleOpenScanner}
                  onSnapAndIdentify={handleSnapAndIdentify}
                  onAddScanToCart={handleAddScanToCart}
                  onScanAnother={() => setScanResult(null)}
                  onBackToSelect={() => { setCoachPhase('select'); setSelectedRecipe(null); }}
                />
              )}
              {activeTab === 'pantry' && (
                <PantryTab
                  pantry={pantry}
                  showAddPantry={showAddPantry}
                  setShowAddPantry={setShowAddPantry}
                  pantryForm={pantryForm}
                  setPantryForm={setPantryForm}
                  onAdd={handleAddPantry}
                  onDelete={handleDeletePantry}
                  rescueRecipe={rescueRecipe}
                  rescueLoading={rescueLoading}
                  onRescue={handleRescue}
                  onCookNow={handleCookRescueNow}
                />
              )}
              {activeTab === 'insights' && (
                <InsightsTab
                  analytics={analytics}
                  loading={insightsLoading}
                  donutSegments={donutSegments}
                  weeklyMax={weeklyMax}
                />
              )}
              {activeTab === 'badges' && (
                <BadgesTab
                  analytics={analytics}
                  unlockedCount={unlockedCount}
                  loading={insightsLoading}
                />
              )}
            </div>

            {/* ── Bottom tab bar ── */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0F1117]/95 backdrop-blur-lg border-t border-white/5 px-2 py-2 grid grid-cols-4 gap-1">
              <TabButton
                active={activeTab === 'coach'}
                onClick={() => setActiveTab('coach')}
                icon={<ChefHat className="w-5 h-5" />}
                label="Live Coach"
              />
              <TabButton
                active={activeTab === 'pantry'}
                onClick={() => setActiveTab('pantry')}
                icon={<Utensils className="w-5 h-5" />}
                label="Pantry"
              />
              <TabButton
                active={activeTab === 'insights'}
                onClick={() => setActiveTab('insights')}
                icon={<Brain className="w-5 h-5" />}
                label="Insights"
              />
              <TabButton
                active={activeTab === 'badges'}
                onClick={() => setActiveTab('badges')}
                icon={<Trophy className="w-5 h-5" />}
                label="Badges"
              />
            </div>

            {/* ── Confetti ── */}
            <AnimatePresence>
              {showConfetti && <Confetti />}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── Tab Button ───────────────────────── */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
        active ? 'bg-[#10E07A]/12 text-[#10E07A]' : 'text-white/50 hover:text-white/80'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold tracking-tight">{label}</span>
    </button>
  );
}

/* ───────────────────────── Coach Tab ───────────────────────── */

interface CoachTabProps {
  coachPhase: CoachPhase;
  selectedRecipe: SelectedRecipe | null;
  stepIndex: number;
  steps: string[];
  coaching: Coaching | null;
  cameraError: string | null;
  visionLoading: boolean;
  scanResult: VisualSearchResult | null;
  scanLoading: boolean;
  videoElement: React.ReactNode;
  customName: string;
  setCustomName: (v: string) => void;
  customDifficulty: Difficulty;
  setCustomDifficulty: (d: Difficulty) => void;
  onSelectMeal: (m: typeof trendingMeals[number]) => void;
  onStartCustom: () => void;
  onStartLive: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onComplete: () => void;
  onOpenScanner: () => void;
  onSnapAndIdentify: () => void;
  onAddScanToCart: () => void;
  onScanAnother: () => void;
  onBackToSelect: () => void;
}

function CoachTab(props: CoachTabProps) {
  /* ── Step A: Recipe selection ── */
  if (props.coachPhase === 'select') {
    return (
      <div className="p-4 space-y-5">
        {/* Scanner CTA */}
        <button
          onClick={props.onOpenScanner}
          className="gradient-border w-full p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="size-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#10E07A] flex items-center justify-center shrink-0">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-white font-black text-sm flex items-center gap-2">
              🍽️ Identify Any Food
            </div>
            <p className="text-white/60 text-xs mt-0.5">
              Point your camera at any dish — Safa AI names it, prices it, and adds it to cart.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/40 shrink-0" />
        </button>

        <div>
          <h3 className="text-white text-base font-black tracking-tight mb-3">Pick a recipe to cook</h3>
          <div className="grid grid-cols-2 gap-3">
            {trendingMeals.map((meal) => (
              <button
                key={meal.id}
                onClick={() => props.onSelectMeal(meal)}
                className="bg-[#0F1117] border border-white/5 hover:border-[#10E07A]/40 rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all"
              >
                <div className="aspect-square bg-[#1A1D26] overflow-hidden relative">
                  <Image src={meal.image} alt={meal.name} fill className="object-cover" />
                </div>
                <div className="p-2.5">
                  <div className="text-white text-xs font-bold leading-tight line-clamp-2 min-h-[2rem]">{meal.name}</div>
                  <div className="flex items-center gap-1 mt-1 text-white/50 text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>{meal.deliveryTime}</span>
                  </div>
                </div>
              </button>
            ))}

            {/* Custom Recipe card */}
            <CustomRecipeCard
              customName={props.customName}
              setCustomName={props.setCustomName}
              customDifficulty={props.customDifficulty}
              setCustomDifficulty={props.setCustomDifficulty}
              onStart={props.onStartCustom}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ── Step A.2: Ready to cook ── */
  if (props.coachPhase === 'ready' && props.selectedRecipe) {
    const r = props.selectedRecipe;
    return (
      <div className="p-4 space-y-5">
        <button
          onClick={props.onBackToSelect}
          className="flex items-center gap-1.5 text-white/60 text-sm hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-[#0F1117] rounded-3xl overflow-hidden border border-white/5">
          <div className="aspect-[16/10] bg-[#1A1D26] overflow-hidden relative">
            <Image src={r.image} alt={r.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${difficultyColor(r.difficulty)}22`, color: difficultyColor(r.difficulty) }}
                >
                  {r.difficulty.toUpperCase()}
                </span>
                <span className="text-white/70 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.timeMins} min
                </span>
              </div>
              <h3 className="text-white text-xl font-black tracking-tight">{r.name}</h3>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#10E07A]" /> Cooking Plan
          </h4>
          <ol className="space-y-2">
            {props.steps.map((step, i) => (
              <li key={`step-${i}`} className="flex gap-3 bg-[#0F1117] border border-white/5 rounded-xl p-3">
                <span className="size-6 rounded-full bg-[#10E07A]/15 text-[#10E07A] text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-white/80 text-sm leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={props.onStartLive}
          className="w-full bg-[#10E07A] text-[#05070A] font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform green-glow"
        >
          <Sparkles className="w-5 h-5" />
          ▶ Start Live Cooking with Chef Safa
        </button>
        <p className="text-center text-white/40 text-xs -mt-2">
          Safa AI will watch your webcam and guide you in real-time.
        </p>
      </div>
    );
  }

  /* ── Step B: Live coaching session ── */
  if (props.coachPhase === 'live' && props.selectedRecipe) {
    const r = props.selectedRecipe;
    const stepText = props.steps[props.stepIndex] || '';
    const totalSteps = props.steps.length;
    const isLast = props.stepIndex >= totalSteps - 1;
    const mood = props.coaching?.mood ? MOOD_STYLES[props.coaching.mood] : MOOD_STYLES.encourage;
    const progress = props.coaching?.progress ?? Math.min(95, 30 + props.stepIndex * 15);

    return (
      <div className="p-4 space-y-4">
        {/* Current step card */}
        <div className="bg-[#0F1117] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#10E07A] text-xs font-black tracking-wider">
              STEP {props.stepIndex + 1} OF {totalSteps}
            </span>
            <span className="text-white/40 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {r.timeMins}m
            </span>
          </div>
          <p className="text-white text-sm font-medium leading-snug mb-3">{stepText}</p>
          {/* Overall step progress */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#10E07A] to-[#F5C451] transition-all duration-500"
              style={{ width: `${((props.stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Camera denied fallback */}
        {props.cameraError ? (
          <CameraErrorCard error={props.cameraError} onRetry={() => { /* re-trigger effect by toggling phase */ props.onBackToSelect(); }} />
        ) : (
          <>
            {/* Webcam */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
              {props.videoElement}
              {/* LIVE badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <span className="relative size-2 bg-[#ef4444] rounded-full live-ring" />
                <span className="text-white text-[10px] font-black tracking-wider">LIVE</span>
              </div>
              {/* Loading pip */}
              {props.visionLoading && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                  <RefreshCw className="w-3 h-3 text-[#F5C451] animate-spin" />
                  <span className="text-white text-[10px] font-bold">Safa analyzing…</span>
                </div>
              )}
            </div>

            {/* Chef Safa says… */}
            <div className={`rounded-2xl border-2 ${mood.border} ${mood.bg} p-4`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{mood.emoji}</span>
                <span className="text-white font-black text-sm">Chef Safa says…</span>
                <span
                  className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  {mood.label}
                </span>
              </div>
              <p className="text-white text-sm leading-snug">
                {props.coaching?.tip || 'Safa is getting ready… position your camera so she can see your pan.'}
              </p>
              {/* Live progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                  <span>Cooking progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10E07A] to-[#F5C451] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step navigation */}
            <div className="flex gap-2">
              <button
                onClick={props.onPrevStep}
                disabled={props.stepIndex === 0}
                className="flex-1 bg-[#1A1D26] border border-white/10 text-white/80 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-30 active:scale-[0.97] transition"
              >
                <ArrowLeft className="w-4 h-4" /> Prev
              </button>
              {isLast ? (
                <button
                  onClick={props.onComplete}
                  className="flex-[2] bg-[#10E07A] text-[#05070A] font-black py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition green-glow"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Complete & Log
                </button>
              ) : (
                <button
                  onClick={props.onNextStep}
                  className="flex-[2] bg-[#F5C451] text-[#05070A] font-black py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={props.onBackToSelect}
              className="w-full text-white/40 text-xs hover:text-white/70 py-1"
            >
              End session without logging
            </button>
          </>
        )}
      </div>
    );
  }

  /* ── Step C: Food Scanner ── */
  if (props.coachPhase === 'scanner') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={props.onBackToSelect}
            className="flex items-center gap-1.5 text-white/60 text-sm hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-white/40 text-xs">Food Scanner</span>
        </div>

        {props.cameraError ? (
          <CameraErrorCard error={props.cameraError} onRetry={props.onBackToSelect} />
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
            {props.videoElement}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Camera className="w-3 h-3 text-[#F5C451]" />
              <span className="text-white text-[10px] font-black tracking-wider">SCANNER</span>
            </div>
            {props.scanLoading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-[#F5C451] animate-spin" />
                <span className="text-white text-xs font-bold">Identifying…</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={props.onSnapAndIdentify}
          disabled={!!props.cameraError || props.scanLoading}
          className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#10E07A] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-40"
        >
          <Camera className="w-5 h-5" /> 📸 Snap & Identify
        </button>

        {/* Result */}
        {props.scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F1117] border-2 border-[#10E07A]/40 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[#10E07A] text-[10px] font-black tracking-wider mb-0.5">IDENTIFIED</div>
                <h3 className="text-white text-lg font-black leading-tight truncate">{props.scanResult.foodName}</h3>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5C451]/15 text-[#F5C451]">
                  {props.scanResult.category}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white/40 text-[10px]">Est. price</div>
                <div className="text-[#F5C451] font-black text-lg">{formatNaira(props.scanResult.estimatedPriceNGN)}</div>
              </div>
            </div>
            <p className="text-white/70 text-xs leading-snug">{props.scanResult.description}</p>
            {props.scanResult.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {props.scanResult.tags.slice(0, 5).map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">#{t}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={props.onAddScanToCart}
                className="flex-1 bg-[#10E07A] text-[#05070A] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
              <button
                onClick={props.onScanAnother}
                className="flex-1 bg-[#1A1D26] border border-white/10 text-white/80 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition"
              >
                <RefreshCw className="w-4 h-4" /> Scan Another
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}

/* ── Custom Recipe Card ── */
function CustomRecipeCard({
  customName,
  setCustomName,
  customDifficulty,
  setCustomDifficulty,
  onStart,
}: {
  customName: string;
  setCustomName: (v: string) => void;
  customDifficulty: Difficulty;
  setCustomDifficulty: (d: Difficulty) => void;
  onStart: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
  return (
    <div className="bg-[#0F1117] border border-dashed border-[#8b5cf6]/40 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 flex flex-col items-center justify-center min-h-[140px] text-center"
      >
        <div className="size-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#10E07A] flex items-center justify-center mb-2">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div className="text-white text-xs font-bold">Custom Recipe</div>
        <div className="text-white/40 text-[10px] mt-0.5">Cook anything with Safa</div>
      </button>
      {expanded && (
        <div className="p-3 pt-0 space-y-2">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Egusi Soup"
            className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:border-[#10E07A]/40 outline-none"
          />
          <div className="flex gap-1.5">
            {diffs.map((d) => (
              <button
                key={d}
                onClick={() => setCustomDifficulty(d)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold capitalize transition ${
                  customDifficulty === d
                    ? 'text-[#05070A]'
                    : 'bg-[#1A1D26] text-white/60 border border-white/10'
                }`}
                style={customDifficulty === d ? { background: difficultyColor(d) } : undefined}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={onStart}
            className="w-full bg-[#10E07A] text-[#05070A] font-black py-2 rounded-xl text-sm active:scale-[0.97] transition"
          >
            Start Cooking →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Camera error fallback ── */
function CameraErrorCard({ error, onRetry }: { error: string; onRetry: () => void }) {
  const isDenied = error === 'denied';
  return (
    <div className="bg-[#0F1117] border-2 border-[#ef4444]/30 rounded-2xl p-6 text-center space-y-3">
      <div className="size-14 rounded-full bg-[#ef4444]/15 flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7 text-[#ef4444]" />
      </div>
      <div>
        <h4 className="text-white font-black text-base">
          {isDenied ? 'Camera access blocked' : 'Camera unavailable'}
        </h4>
        <p className="text-white/60 text-xs mt-1 leading-relaxed">
          {isDenied
            ? 'Chef Safa needs your camera to watch you cook and give real-time tips. Enable camera permission in your browser settings, then retry.'
            : 'No camera was found on this device. Try a different device or check that your camera is connected.'}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="bg-[#10E07A] text-[#05070A] font-black px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-1.5 active:scale-[0.97] transition"
      >
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  );
}

/* ───────────────────────── Pantry Tab ───────────────────────── */

function PantryTab({
  pantry,
  showAddPantry,
  setShowAddPantry,
  pantryForm,
  setPantryForm,
  onAdd,
  onDelete,
  rescueRecipe,
  rescueLoading,
  onRescue,
  onCookNow,
}: {
  pantry: PantryItem[];
  showAddPantry: boolean;
  setShowAddPantry: (v: boolean) => void;
  pantryForm: { name: string; category: string; quantity: string; unit: string; expiresAt: string };
  setPantryForm: React.Dispatch<React.SetStateAction<{
    name: string; category: string; quantity: string; unit: string; expiresAt: string;
  }>>;
  onAdd: () => void;
  onDelete: (id: string) => void;
  rescueRecipe: RescueRecipe | null;
  rescueLoading: boolean;
  onRescue: () => void;
  onCookNow: () => void;
}) {
  const grouped = useMemo(() => {
    const g: Record<string, PantryItem[]> = {};
    for (const c of PANTRY_CATEGORIES) g[c] = [];
    for (const item of pantry) {
      const cat = PANTRY_CATEGORIES.includes(item.category as typeof PANTRY_CATEGORIES[number])
        ? item.category
        : 'other';
      g[cat].push(item);
    }
    return g;
  }, [pantry]);

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white text-lg font-black tracking-tight">My Pantry</h3>
          <p className="text-white/50 text-xs">{pantry.length} item{pantry.length !== 1 ? 's' : ''} stocked</p>
        </div>
        <button
          onClick={() => setShowAddPantry(!showAddPantry)}
          className="bg-[#10E07A] text-[#05070A] font-bold text-sm px-3 py-2 rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddPantry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0F1117] border border-white/5 rounded-2xl p-4 space-y-3">
              <input
                value={pantryForm.name}
                onChange={(e) => setPantryForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Item name (e.g. Tomatoes)"
                className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:border-[#10E07A]/40 outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={pantryForm.category}
                  onChange={(e) => setPantryForm((f) => ({ ...f, category: e.target.value }))}
                  className="bg-[#1A1D26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#10E07A]/40 outline-none"
                >
                  {PANTRY_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#1A1D26]">{c}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={pantryForm.quantity}
                    onChange={(e) => setPantryForm((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder="Qty"
                    className="w-16 bg-[#1A1D26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:border-[#10E07A]/40 outline-none"
                  />
                  <input
                    value={pantryForm.unit}
                    onChange={(e) => setPantryForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="unit"
                    className="flex-1 bg-[#1A1D26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:border-[#10E07A]/40 outline-none"
                  />
                </div>
              </div>
              <input
                type="date"
                value={pantryForm.expiresAt}
                onChange={(e) => setPantryForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#10E07A]/40 outline-none"
              />
              <button
                onClick={onAdd}
                className="w-full bg-[#10E07A] text-[#05070A] font-black py-2.5 rounded-xl text-sm active:scale-[0.97] transition"
              >
                Save to Pantry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Fridge Rescue CTA */}
      <button
        onClick={onRescue}
        disabled={rescueLoading}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#F5C451] via-[#f5b800] to-[#F5C451] text-[#05070A] font-black flex items-center gap-3 active:scale-[0.98] transition disabled:opacity-50 gold-glow"
      >
        {rescueLoading ? (
          <RefreshCw className="w-6 h-6 animate-spin" />
        ) : (
          <Bot className="w-6 h-6" />
        )}
        <div className="text-left flex-1">
          <div className="text-sm">🤖 What can I cook?</div>
          <div className="text-[11px] opacity-80 font-bold">Chef Safa invents a recipe from your pantry</div>
        </div>
      </button>

      {/* Rescue result */}
      <AnimatePresence>
        {rescueRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F1117] border-2 border-[#F5C451]/40 rounded-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#F5C451]/15 to-transparent p-4 border-b border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#F5C451]" />
                <span className="text-[#F5C451] text-[10px] font-black tracking-wider">CHEF SAFA SUGGESTS</span>
              </div>
              <h4 className="text-white text-lg font-black leading-tight">{rescueRecipe.recipeName}</h4>
              <p className="text-white/70 text-xs mt-1 leading-snug">{rescueRecipe.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px]">
                <span className="text-white/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {rescueRecipe.timeMins} min
                </span>
                <span
                  className="font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${difficultyColor(rescueRecipe.difficulty)}22`, color: difficultyColor(rescueRecipe.difficulty) }}
                >
                  {rescueRecipe.difficulty}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-white font-bold text-xs mb-2">Ingredients (from your pantry)</div>
                <ul className="space-y-1.5">
                  {rescueRecipe.ingredients?.map((ing, i) => (
                    <li key={`rescue-ing-${i}`} className="flex gap-2 text-xs">
                      <span className="text-[#10E07A]">•</span>
                      <span className="text-white/80">
                        <span className="font-bold">{ing.name}</span>
                        <span className="text-white/50"> — {ing.use}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-white font-bold text-xs mb-2">Steps</div>
                <ol className="space-y-1.5">
                  {rescueRecipe.steps?.map((s, i) => (
                    <li key={`rescue-step-${i}`} className="flex gap-2 text-xs">
                      <span className="size-5 rounded-full bg-[#10E07A]/15 text-[#10E07A] text-[10px] font-black flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-white/80 leading-snug">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {rescueRecipe.chefTip && (
                <div className="bg-[#F5C451]/8 border border-[#F5C451]/30 rounded-xl p-3 flex gap-2">
                  <Lightbulb className="w-4 h-4 text-[#F5C451] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[#F5C451] text-[10px] font-black tracking-wider mb-0.5">CHEF TIP</div>
                    <p className="text-white/80 text-xs leading-snug">{rescueRecipe.chefTip}</p>
                  </div>
                </div>
              )}
              <button
                onClick={onCookNow}
                className="w-full bg-[#10E07A] text-[#05070A] font-black py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-[0.97] transition green-glow"
              >
                Cook This Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items grouped by category */}
      {pantry.length === 0 && !showAddPantry ? (
        <div className="text-center py-10">
          <CookingPot className="w-10 h-10 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">Your pantry is empty.</p>
          <p className="text-white/30 text-xs">Add items so Chef Safa can suggest recipes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {PANTRY_CATEGORIES.map((cat) => {
            const items = grouped[cat] || [];
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-white/60 text-xs font-black tracking-wider mb-2">
                  {CATEGORY_LABELS[cat]} · {items.length}
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#0F1117] border border-white/5 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-bold truncate">{item.name}</div>
                        <div className="text-white/40 text-xs">
                          {item.quantity} {item.unit}
                          {item.expiresAt && ` · exp ${new Date(item.expiresAt).toLocaleDateString()}`}
                        </div>
                      </div>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="size-8 rounded-lg bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center hover:bg-[#ef4444]/20 transition"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Insights Tab ───────────────────────── */

function InsightsTab({
  analytics,
  loading,
  donutSegments,
  weeklyMax,
}: {
  analytics: Analytics;
  loading: boolean;
  donutSegments: { segments: { value: number; color: string; length: number; offset: number }[]; total: number; C: number };
  weeklyMax: number;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-[#0F1117] rounded-2xl animate-pulse" />
        <div className="h-48 bg-[#0F1117] rounded-2xl animate-pulse" />
        <div className="h-48 bg-[#0F1117] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Sessions', value: analytics.totalSessions, icon: <Utensils className="w-4 h-4" />, color: '#10E07A' },
    { label: 'Completed', value: analytics.completedSessions, icon: <CheckCircle2 className="w-4 h-4" />, color: '#F5C451' },
    { label: 'Cook Time (min)', value: analytics.totalCookTimeMins, icon: <Clock className="w-4 h-4" />, color: '#8b5cf6' },
    { label: 'Live AI Sessions', value: analytics.liveAIUses, icon: <Bot className="w-4 h-4" />, color: '#ef4444' },
  ];

  return (
    <div className="p-4 space-y-5">
      <h3 className="text-white text-lg font-black tracking-tight">Your Cooking Insights</h3>

      {/* 2x2 stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#0F1117] border border-white/5 rounded-2xl p-4">
            <div
              className="size-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${s.color}22`, color: s.color }}
            >
              {s.icon}
            </div>
            <div className="text-white text-2xl font-black leading-none">{s.value}</div>
            <div className="text-white/50 text-[11px] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-[#0F1117] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-black text-sm">Weekly Activity</h4>
          <span className="text-white/40 text-[10px]">last 7 days</span>
        </div>
        <svg viewBox="0 0 320 140" className="w-full h-32">
          {/* baseline */}
          <line x1="10" y1="110" x2="310" y2="110" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {analytics.weeklyData.map((d, i) => {
            const barW = 28;
            const gap = (300 - barW * 7) / 6;
            const x = 10 + i * (barW + gap);
            const h = d.count === 0 ? 2 : Math.max(4, (d.count / weeklyMax) * 90);
            const y = 110 - h;
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={4}
                  fill="url(#barGrad)"
                  className="hover:opacity-80 transition-opacity"
                />
                {d.count > 0 && (
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="fill-white text-[9px] font-bold">
                    {d.count}
                  </text>
                )}
                <text x={x + barW / 2} y={128} textAnchor="middle" className="fill-white/40 text-[9px]">
                  {d.day}
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10E07A" />
              <stop offset="100%" stopColor="#F5C451" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Difficulty donut */}
      <div className="bg-[#0F1117] border border-white/5 rounded-2xl p-4">
        <h4 className="text-white font-black text-sm mb-3">Difficulty Breakdown</h4>
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
            {donutSegments.segments.map((s, i) => (
              <circle
                key={`donut-${i}`}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={`${s.length} ${donutSegments.C - s.length}`}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
              />
            ))}
            <text x="50" y="50" textAnchor="middle" className="fill-white text-[14px] font-black" transform="rotate(90 50 50)">
              {donutSegments.total}
            </text>
          </svg>
          <div className="flex-1 space-y-2">
            {[
              { label: 'Easy', value: analytics.difficultyBreakdown.easy, color: '#10E07A' },
              { label: 'Medium', value: analytics.difficultyBreakdown.medium, color: '#F5C451' },
              { label: 'Hard', value: analytics.difficultyBreakdown.hard, color: '#8b5cf6' },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2 text-xs">
                <span className="size-3 rounded-sm" style={{ background: d.color }} />
                <span className="text-white/70 flex-1">{d.label}</span>
                <span className="text-white font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last cooked */}
      {analytics.lastCooked && (
        <div className="bg-[#0F1117] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#10E07A]/15 flex items-center justify-center">
            <CookingPot className="w-5 h-5 text-[#10E07A]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/50 text-[10px] font-black tracking-wider">LAST COOKED</div>
            <div className="text-white text-sm font-bold">
              {new Date(analytics.lastCooked).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric',
              })}{' · '}
              {new Date(analytics.lastCooked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Badges Tab ───────────────────────── */

function BadgesTab({
  analytics,
  unlockedCount,
  loading,
}: {
  analytics: Analytics;
  unlockedCount: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-8 bg-[#0F1117] rounded-xl animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={`skel-${i}`} className="h-20 bg-[#0F1117] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const achievements = analytics.achievements.length > 0
    ? analytics.achievements
    : [
        { id: 'first-dish', title: 'First Dish', desc: 'Cook your first meal', unlocked: false, icon: '🍳' },
        { id: 'dedicated', title: 'Dedicated Cook', desc: 'Complete 5 sessions', unlocked: false, icon: '⭐' },
        { id: 'marathon', title: 'Marathon Chef', desc: 'Cook 120+ minutes total', unlocked: false, icon: '🏃' },
        { id: 'live-ai', title: 'Live AI Pioneer', desc: 'Use Live AI coaching once', unlocked: false, icon: '🤖' },
        { id: 'week-warrior', title: 'Week Warrior', desc: 'Cook on 5+ distinct days', unlocked: false, icon: '⚔️' },
        { id: 'master-chef', title: 'Master Chef', desc: 'Complete 20 sessions', unlocked: false, icon: '👨‍🍳' },
        { id: 'quick-fire', title: 'Quick Fire', desc: 'Finish in under 10 min', unlocked: false, icon: '🔥' },
        { id: 'explorer', title: 'Explorer', desc: 'Try 5+ different recipes', unlocked: false, icon: '🧭' },
      ];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-white text-lg font-black tracking-tight">Achievements</h3>
        <p className="text-white/50 text-xs">Unlock badges by cooking with Chef Safa</p>
      </div>

      {/* Progress bar */}
      <div className="bg-[#0F1117] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-black text-sm">Progress</span>
          <span className="text-[#10E07A] font-black text-sm">
            {unlockedCount} / {achievements.length}
          </span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#10E07A] to-[#F5C451] transition-all duration-500"
            style={{ width: `${(unlockedCount / Math.max(1, achievements.length)) * 100}%` }}
          />
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a) => {
          const IconComp = BADGE_ICONS[a.icon] || Trophy;
          return (
            <div
              key={a.id}
              className={`relative rounded-2xl p-4 border ${
                a.unlocked
                  ? 'border-[#F5C451]/50 bg-gradient-to-br from-[#F5C451]/10 to-[#10E07A]/8 gold-glow'
                  : 'border-white/5 bg-[#0F1117] opacity-50 grayscale'
              }`}
            >
              <div
                className={`size-12 rounded-xl flex items-center justify-center mb-2 ${
                  a.unlocked ? 'bg-[#F5C451]/15' : 'bg-white/5'
                }`}
              >
                {a.unlocked ? (
                  <IconComp className="w-6 h-6 text-[#F5C451]" />
                ) : (
                  <IconComp className="w-6 h-6 text-white/30" />
                )}
              </div>
              <div className="text-white font-black text-sm leading-tight">{a.title}</div>
              <div className="text-white/50 text-[11px] mt-0.5 leading-snug">{a.desc}</div>
              {a.unlocked && (
                <div className="absolute top-2 right-2 size-5 rounded-full bg-[#10E07A] flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-[#05070A]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Confetti ───────────────────────── */

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 60,
        angle: Math.random() * 360,
        color: ['#10E07A', '#F5C451', '#8b5cf6', '#ef4444', '#ffffff'][i % 5],
        delay: Math.random() * 0.15,
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 720 - 360,
      })),
    [],
  );

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30" />
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            left: `${p.x}%`,
            top: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: (p.x - 50) * 6,
            y: -150 - Math.random() * 200,
            opacity: 0,
            rotate: p.rotate,
          }}
          transition={{ duration: 1.8 + p.delay, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 text-center"
      >
        <div className="text-5xl mb-2">🎉</div>
        <div className="text-white font-black text-xl">Session Logged!</div>
        <div className="text-[#F5C451] text-sm font-bold">Keep cooking, keep leveling up.</div>
      </motion.div>
    </motion.div>
  );
}
