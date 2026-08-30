'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Pause, SkipForward, CheckCircle2, Clock, ChefHat, Trophy, RotateCcw, Flame, ListChecks, Sparkles, Video } from 'lucide-react';
import { useNavigation, useCookAlong, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

function guessCuisine(category: string | undefined, name: string): string {
  const s = `${category ?? ''} ${name}`.toLowerCase();
  if (s.match(/jollof|suya|moi|asaro|egusi|ogbono|sahur|nigerian|yam|plantain/)) return 'Nigerian';
  if (s.match(/sushi|ramen|tempura|stir|noodle|asian|chinese|thai/)) return 'Asian';
  if (s.match(/pasta|pizza|risotto|italian|tiramisu/)) return 'Italian';
  if (s.match(/taco|burrito|mexican|salsa|quesadilla/)) return 'Mexican';
  if (s.match(/curry|biryani|naan|indian|pakora|samosa/)) return 'South Asian';
  if (s.match(/kebab|shawarma|falafel|middle eastern|mezze|knafeh/)) return 'Middle Eastern';
  if (s.match(/burger|steak|american|bbq|ribs/)) return 'American';
  if (s.match(/crepe|quiche|french|baguette/)) return 'French';
  return 'Other';
}

export default function CookAlongMode() {
  const { activeModal, setActiveModal } = useNavigation();
  const { activeRecipe, setActiveRecipe, setSmartKitchenInitialTab } = useCookAlong();
  const userEmail = useAppStore(s => s.userEmail);
  const isOpen = activeModal === 'cook-along' && activeRecipe !== null;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const postedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const recipe = activeRecipe;
  const steps = recipe?.steps ?? [];
  const total = steps.length;

  useEffect(() => {
    if (isPlaying && !done) {
      intervalRef.current = setInterval(() => { setElapsed((e) => e + 1); }, 1000);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isPlaying, done]);

  // Reset when a new recipe loads (lazy initializer pattern avoids setState-in-effect)
  const recipeId = recipe?.id;
  const [loadedRecipeId, setLoadedRecipeId] = useState<string | number | null>(null);
  if (isOpen && recipeId !== undefined && recipeId !== loadedRecipeId) {
    setLoadedRecipeId(recipeId);
    setCurrentStep(0); setIsPlaying(false); setElapsed(0); setDone(false);
    postedRef.current = false; startedAtRef.current = Date.now();
  }

  useEffect(() => {
    if (!done || postedRef.current || !recipe) return;
    postedRef.current = true;
    const durationSec = startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : elapsed;
    const cuisine = guessCuisine(recipe.category, recipe.name);
    fetch('/api/cooking-sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: userEmail || 'guest', recipeName: recipe.name, cuisine, difficulty: recipe.difficulty || 'Medium', stepsCount: total, durationSec }),
    }).catch(() => { /* silent */ });
    toast({ title: 'Session logged! 🎉', description: `${recipe.name} added to your cooking insights` });
  }, [done, recipe, userEmail, elapsed, total, toast]);

  const handleClose = useCallback(() => {
    setActiveModal(null); setActiveRecipe(null);
  }, [setActiveModal, setActiveRecipe]);

  const handleNext = () => {
    if (currentStep < total - 1) { setCurrentStep((s) => s + 1); }
    else { setIsPlaying(false); setDone(true); }
  };

  const handleRestart = () => {
    setCurrentStep(0); setIsPlaying(false); setElapsed(0); setDone(false);
    postedRef.current = false; startedAtRef.current = Date.now();
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!recipe) return null;

  const progress = total > 0 ? ((done ? total : currentStep) / total) * 100 : 0;
  const cuisine = guessCuisine(recipe.category, recipe.name);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[110]" onClick={handleClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 h-[94vh] bg-[#05070A] rounded-t-3xl z-[115] flex flex-col overflow-hidden border-t border-[#13ec13]/20">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/5 shrink-0 bg-gradient-to-r from-[#13ec13]/5 to-[#FFD700]/5">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 bg-gradient-to-br from-[#13ec13]/20 to-[#FFD700]/20 rounded-2xl flex items-center justify-center border border-[#13ec13]/30">
                  <ChefHat className="w-6 h-6 text-[#13ec13]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">Cook-Along</h2>
                  <p className="text-white/65 text-xs truncate max-w-[200px]">{recipe.name}</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="shrink-0 px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{done ? 'Completed' : `Step ${currentStep + 1} of ${total}`}</span>
                <span className="text-white/65 text-xs font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#13ec13] to-[#FFD700]" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
              {done ? (
                <CompletionView recipeName={recipe.name} cuisine={cuisine} elapsed={elapsed} totalSteps={total} onRestart={handleRestart} onClose={handleClose} />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#0F1117] border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FFD700]" />
                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Cooking Time</span>
                      </div>
                      <span className="text-white font-mono font-black text-2xl tabular-nums">{fmtTime(elapsed)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">{cuisine}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${recipe.difficulty === 'Easy' ? 'bg-[#13ec13]/10 border-[#13ec13]/20 text-[#13ec13]' : recipe.difficulty === 'Hard' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#FFD700]/10 border-[#FFD700]/20 text-[#FFD700]'}`}>{recipe.difficulty || 'Medium'}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-[#13ec13]/8 to-[#FFD700]/5 border border-[#13ec13]/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#13ec13] text-[#05070A] font-black text-sm flex items-center justify-center">{currentStep + 1}</div>
                      <span className="text-[#13ec13] text-[10px] font-black uppercase tracking-wider">Now Cooking</span>
                    </div>
                    <motion.p key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-white text-base font-medium leading-relaxed">{steps[currentStep]}</motion.p>
                  </div>

                  {currentStep < total - 1 && (
                    <div className="rounded-2xl bg-[#0F1117] border border-white/10 p-3">
                      <p className="text-white/65 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><ListChecks className="w-3 h-3" /> Up Next</p>
                      <div className="space-y-1.5">
                        {steps.slice(currentStep + 1, currentStep + 4).map((s, i) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <span className="w-4 h-4 rounded-full bg-white/5 text-white/65 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">{currentStep + 2 + i}</span>
                            <span className="text-white/50 line-clamp-2">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safa Live Vision — deep-link into Smart Kitchen Live Coach tab */}
                  <button
                    onClick={() => { setSmartKitchenInitialTab('coach'); setActiveModal('smart-kitchen'); }}
                    className="w-full rounded-2xl p-[1px] bg-gradient-to-r from-[#13ec13] via-[#FFD700] to-[#13ec13] active:scale-[0.98] transition-transform"
                  >
                    <span className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-[#05070A] px-4">
                      <span className="relative flex items-center justify-center">
                        <span className="absolute inline-flex h-5 w-5 rounded-full bg-[#13ec13]/40 live-dot" />
                        <Video className="w-4 h-4 text-[#13ec13] relative z-10" />
                      </span>
                      <span className="text-white font-bold text-sm">Let Safa Watch Me Cook</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30">LIVE AI</span>
                    </span>
                  </button>

                  <div className="flex items-center justify-center gap-1.5">
                    {steps.map((_, i) => (
                      <button key={i} onClick={() => setCurrentStep(i)}
                        className={`h-1.5 rounded-full transition-all ${i < currentStep ? 'w-4 bg-[#13ec13]' : i === currentStep ? 'w-6 bg-[#FFD700]' : 'w-1.5 bg-white/10'}`}
                        aria-label={`Go to step ${i + 1}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!done && (
              <div className="shrink-0 p-3 sm:p-4 border-t border-white/5 bg-[#05070A]/95 backdrop-blur-lg">
                <div className="flex gap-2">
                  <button onClick={() => setIsPlaying((p) => !p)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0" aria-label={isPlaying ? 'Pause timer' : 'Start timer'}>
                    {isPlaying ? <Pause className="w-5 h-5 text-[#FFD700]" /> : <Play className="w-5 h-5 text-[#13ec13] fill-current" />}
                  </button>
                  <button onClick={handleNext} className="flex-1 h-12 rounded-2xl bg-[#13ec13] text-[#05070A] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                    {currentStep === total - 1 ? <><CheckCircle2 className="w-5 h-5" /> Finish Cooking</> : <>Next Step <SkipForward className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CompletionView({ recipeName, cuisine, elapsed, totalSteps, onRestart, onClose }: {
  recipeName: string; cuisine: string; elapsed: number; totalSteps: number; onRestart: () => void; onClose: () => void;
}) {
  const mins = Math.floor(elapsed / 60); const secs = elapsed % 60;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FFD700] to-[#f2b90d] flex items-center justify-center gold-glow">
        <Trophy className="w-10 h-10 text-black" />
      </motion.div>
      <h2 className="text-white font-black text-2xl">Bismillah, bon appetit! 🎉</h2>
      <p className="text-white/50 text-sm mt-1">You just cooked</p>
      <p className="text-[#13ec13] font-bold text-lg mt-0.5">{recipeName}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-5">
        <div className="rounded-xl bg-[#0F1117] border border-white/10 p-3">
          <Clock className="w-4 h-4 text-[#FFD700] mx-auto mb-1" />
          <p className="text-white font-black text-lg leading-none">{mins}:{secs.toString().padStart(2, '0')}</p>
          <p className="text-white/65 text-[9px] mt-1 uppercase tracking-wider">Minutes</p>
        </div>
        <div className="rounded-xl bg-[#0F1117] border border-white/10 p-3">
          <ListChecks className="w-4 h-4 text-[#13ec13] mx-auto mb-1" />
          <p className="text-white font-black text-lg leading-none">{totalSteps}</p>
          <p className="text-white/65 text-[9px] mt-1 uppercase tracking-wider">Steps</p>
        </div>
        <div className="rounded-xl bg-[#0F1117] border border-white/10 p-3">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <p className="text-white font-black text-sm leading-none mt-1">{cuisine}</p>
          <p className="text-white/65 text-[9px] mt-1 uppercase tracking-wider">Cuisine</p>
        </div>
      </div>
      <div className="rounded-xl bg-[#13ec13]/5 border border-[#13ec13]/20 p-3 mt-4 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-[#13ec13] shrink-0 mt-0.5" />
        <p className="text-white/70 text-xs text-left">This session has been logged to your Smart Kitchen insights. Check your Badges tab to see if you unlocked anything new!</p>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onRestart} className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
          <RotateCcw className="w-4 h-4" /> Cook Again
        </button>
        <button onClick={onClose} className="flex-1 h-11 rounded-2xl bg-[#13ec13] text-[#05070A] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">Done</button>
      </div>
    </motion.div>
  );
}
