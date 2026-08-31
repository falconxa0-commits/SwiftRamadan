'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CalendarDays,
  CalendarPlus,
  Moon,
  Sun,
  Plus,
  Minus,
  Trash2,
  Clock,
  ShoppingCart,
  ChefHat,
  Check,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { trendingMeals } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

/* ───────────────────────── Types ───────────────────────── */

type SlotKey = 'iftar' | 'sahur';

interface MealSlot {
  name: string;
  image?: string;
  servings: number;
}

interface DayPlan {
  iftar?: MealSlot;
  sahur?: MealSlot;
}

type PlanMap = Record<string, DayPlan>;

const STORAGE_KEY = 'swiftramadan-mealplan';
const FALLBACK_IMAGE = '/images/categories/cat-groceries.png';

/* ───────────────────────── Helpers ───────────────────────── */

function formatKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface DayChip {
  key: string;
  date: Date;
  dayName: string;
  dateNumber: number;
  isToday: boolean;
}

function getWeekDays(): DayChip[] {
  const today = new Date();
  const todayKey = formatKey(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      key: formatKey(d),
      date: d,
      dayName: d.toLocaleDateString('en', { weekday: 'short' }),
      dateNumber: d.getDate(),
      isToday: formatKey(d) === todayKey,
    };
  });
}

function prettyDate(d: Date): string {
  return d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
}

/* ───────────────────────── Component ───────────────────────── */

export default function MealPlannerModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const isOpen = activeModal === 'meal-planner';

  /* ── Persisted meal plan — lazy init from localStorage ── */
  const [plan, setPlan] = useState<PlanMap>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as PlanMap;
    } catch {
      return {};
    }
  });

  /* ── Selected day (defaults to today) ── */
  const [selectedDate, setSelectedDate] = useState<string>(() => formatKey(new Date()));

  /* ── Add-meal bottom sheet state ── */
  const [addSheet, setAddSheet] = useState<{ open: boolean; slot: SlotKey | null }>({
    open: false,
    slot: null,
  });
  const [customName, setCustomName] = useState('');
  const [servings, setServings] = useState(1);
  const [pickedRecipeId, setPickedRecipeId] = useState<number | null>(null);

  /* ── Persist on every plan change (side-effect only) ── */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // ignore quota / private-mode errors
    }
  }, [plan]);

  const weekDays = useMemo(() => getWeekDays(), []);
  const selectedDayPlan: DayPlan = plan[selectedDate] || {};
  const selectedDayMeta = weekDays.find((d) => d.key === selectedDate) || weekDays[0];

  const isWeekEmpty = useMemo(() => {
    return weekDays.every((d) => {
      const dp = plan[d.key];
      return !dp || (!dp.iftar && !dp.sahur);
    });
  }, [plan, weekDays]);

  const summary = useMemo(() => {
    let total = 0;
    let iftar = 0;
    let sahur = 0;
    weekDays.forEach((d) => {
      const dp = plan[d.key];
      if (dp?.iftar) {
        total++;
        iftar++;
      }
      if (dp?.sahur) {
        total++;
        sahur++;
      }
    });
    return { total, iftar, sahur };
  }, [plan, weekDays]);

  /* ─────────────── Handlers ─────────────── */

  const handleClose = () => setActiveModal(null);

  const handleSelectDay = (key: string) => setSelectedDate(key);

  const openAddSheet = (slot: SlotKey) => {
    setCustomName('');
    setServings(1);
    setPickedRecipeId(null);
    setAddSheet({ open: true, slot });
  };

  const closeAddSheet = () => setAddSheet({ open: false, slot: null });

  const handleAddMeal = () => {
    const slot = addSheet.slot;
    if (!slot) return;

    let meal: MealSlot | null = null;

    if (customName.trim()) {
      meal = { name: customName.trim(), servings };
    } else if (pickedRecipeId !== null) {
      const r = trendingMeals.find((m) => m.id === pickedRecipeId);
      if (r) meal = { name: r.name, image: r.image, servings };
    }

    if (!meal) {
      toast({
        title: 'Pick or type a meal',
        description: 'Choose a recipe above or enter a custom meal name.',
      });
      return;
    }

    setPlan((prev) => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] || {}),
        [slot]: meal,
      } as DayPlan,
    }));

    toast({
      title: 'Meal planned! 🗓️',
      description: `${meal.name} added to ${slot === 'iftar' ? 'Iftar' : 'Sahur'} for ${prettyDate(selectedDayMeta.date)}.`,
    });

    closeAddSheet();
  };

  const handleRemoveMeal = (slot: SlotKey) => {
    setPlan((prev) => {
      const day = prev[selectedDate];
      if (!day) return prev;
      const next: DayPlan = { ...day };
      delete next[slot];
      const updated = { ...prev, [selectedDate]: next };
      // Clean up empty day entries
      if (!next.iftar && !next.sahur) delete updated[selectedDate];
      return updated;
    });
    toast({
      title: 'Meal removed',
      description: `${slot === 'iftar' ? 'Iftar' : 'Sahur'} cleared for ${prettyDate(selectedDayMeta.date)}.`,
    });
  };

  const handleCookNow = () => {
    setActiveModal('smart-kitchen');
  };

  const handleAddAllToCart = () => {
    const planned: MealSlot[] = [];
    weekDays.forEach((d) => {
      const dp = plan[d.key];
      // Use Iftar as the "main meal" of the day, fall back to Sahur
      const main = dp?.iftar || dp?.sahur;
      if (main) planned.push(main);
    });

    if (planned.length === 0) {
      toast({
        title: 'Nothing to add',
        description: 'Plan at least one meal this week first.',
      });
      return;
    }

    planned.forEach((m) => {
      addToCart({
        id: Math.floor(Math.random() * 100000),
        name: m.name,
        price: 0,
        image: m.image || FALLBACK_IMAGE,
      });
    });

    toast({
      title: `Added ${planned.length} ${planned.length === 1 ? 'meal' : 'meals'} to cart! 🛒`,
      description: 'Ingredients for your weekly plan are ready to checkout.',
    });
  };

  const jumpToToday = () => setSelectedDate(formatKey(new Date()));

  /* ─────────────── Render ─────────────── */

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
            aria-hidden
          />

          {/* Full-screen sheet */}
          <motion.div
            className="relative mt-auto h-[100dvh] w-full bg-[var(--sr-surface-base)] flex flex-col overflow-hidden sk-aura"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            {/* ── Sticky header ── */}
            <div className="shrink-0 relative">
              <div className="h-[2px] w-full bg-gradient-to-r from-[var(--sr-customer)] via-[var(--sr-vendor)] to-[var(--sr-ai)]" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[var(--sr-surface-base)]/95 backdrop-blur">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--sr-customer)] to-[var(--sr-customer-hover)] flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-[var(--sr-surface-base)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-white text-base font-black tracking-tight truncate">
                        Meal Planner
                      </h2>
                      <span className="beta-badge">Beta</span>
                    </div>
                    <p className="text-white/50 text-[11px] truncate">
                      Plan your Iftar &amp; Sahur for the week
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="size-9 rounded-full bg-[var(--sr-surface-elevated)] border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors shrink-0"
                  aria-label="Close meal planner"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
              {/* Weekly chips */}
              <div className="px-4 pt-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                  {weekDays.map((d) => {
                    const dp = plan[d.key];
                    const hasMeals = !!(dp?.iftar || dp?.sahur);
                    const isSelected = selectedDate === d.key;
                    return (
                      <button
                        key={d.key}
                        onClick={() => handleSelectDay(d.key)}
                        className={`relative shrink-0 w-[68px] py-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[var(--sr-surface-elevated)] border-[var(--sr-customer)]/60 shadow-[0_0_0_1px_rgba(16,224,122,0.25)]'
                            : 'bg-[var(--sr-surface-raised)] border-white/5 hover:border-white/15'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold ${
                            d.isToday ? 'text-[var(--sr-customer)]' : 'text-white/65'
                          }`}
                        >
                          {d.isToday ? 'Today' : d.dayName}
                        </span>
                        <span
                          className={`text-lg font-black ${
                            isSelected ? 'text-white' : 'text-white/70'
                          }`}
                        >
                          {d.dateNumber}
                        </span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            hasMeals
                              ? d.isToday
                                ? 'bg-[var(--sr-customer)]'
                                : 'bg-[var(--sr-vendor)]'
                              : 'bg-transparent'
                          }`}
                        />
                        {d.isToday && !isSelected && (
                          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[var(--sr-customer)]/80" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected day header */}
              <div className="px-4 mt-5 flex items-center justify-between">
                <div>
                  <p className="text-white/65 text-[11px] uppercase tracking-wider font-bold">
                    {selectedDayMeta.isToday ? 'Today' : 'Selected day'}
                  </p>
                  <h3 className="text-white text-lg font-black">
                    {prettyDate(selectedDayMeta.date)}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--sr-surface-elevated)] border border-white/5">
                  <Sparkles className="w-3 h-3 text-[var(--sr-ai)]" />
                  <span className="text-white/60 text-[11px] font-bold">
                    {selectedDayPlan.iftar || selectedDayPlan.sahur
                      ? `${(selectedDayPlan.iftar ? 1 : 0) + (selectedDayPlan.sahur ? 1 : 0)} meal${(selectedDayPlan.iftar ? 1 : 0) + (selectedDayPlan.sahur ? 1 : 0) > 1 ? 's' : ''}`
                      : 'No meals'}
                  </span>
                </div>
              </div>

              {/* Iftar + Sahur sections */}
              <div className="px-4 mt-4 space-y-4">
                <MealSection
                  slot="iftar"
                  meal={selectedDayPlan.iftar}
                  accentColor="var(--sr-customer)"
                  accentSoft="rgba(16,224,122,0.12)"
                  icon={<Moon className="w-4 h-4" />}
                  label="Iftar"
                  sublabel="Sunset meal · Maghrib"
                  onAdd={() => openAddSheet('iftar')}
                  onRemove={() => handleRemoveMeal('iftar')}
                  onCookNow={handleCookNow}
                />
                <MealSection
                  slot="sahur"
                  meal={selectedDayPlan.sahur}
                  accentColor="var(--sr-vendor)"
                  accentSoft="rgba(245,196,81,0.12)"
                  icon={<Sun className="w-4 h-4" />}
                  label="Sahur"
                  sublabel="Pre-dawn meal · Fajr"
                  onAdd={() => openAddSheet('sahur')}
                  onRemove={() => handleRemoveMeal('sahur')}
                  onCookNow={handleCookNow}
                />
              </div>

              {/* Weekly summary card OR empty state */}
              {isWeekEmpty ? (
                <div className="px-4 mt-6">
                  <div className="rounded-3xl border border-dashed border-white/10 bg-[var(--sr-surface-raised)] p-8 flex flex-col items-center text-center">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-[var(--sr-ai)]/20 to-[var(--sr-customer)]/15 border border-[var(--sr-ai)]/30 flex items-center justify-center mb-4">
                      <CalendarPlus className="w-7 h-7 text-[var(--sr-ai)]" />
                    </div>
                    <h4 className="text-white font-black text-lg">
                      Start planning your perfect Ramadan week
                    </h4>
                    <p className="text-white/50 text-sm mt-1 max-w-xs">
                      Tap a day above, then add an Iftar or Sahur meal. We&apos;ll save it on this
                      device.
                    </p>
                    <button
                      onClick={jumpToToday}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[var(--sr-customer)] to-[var(--sr-customer-hover)] text-[var(--sr-surface-base)] font-black text-sm hover:opacity-90 transition-opacity"
                    >
                      <CalendarDays className="w-4 h-4" />
                      Jump to Today
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 mt-6">
                  <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[var(--sr-surface-elevated)] to-[var(--sr-surface-raised)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-[var(--sr-vendor)]" />
                        <h4 className="text-white font-black text-sm">This Week</h4>
                      </div>
                      <span className="text-white/65 text-[11px] font-bold">7 days</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      <SummaryStat label="Meals" value={summary.total} color="var(--sr-text-primary)" />
                      <SummaryStat label="Iftar" value={summary.iftar} color="var(--sr-customer)" />
                      <SummaryStat label="Sahur" value={summary.sahur} color="var(--sr-vendor)" />
                    </div>
                    <button
                      onClick={handleAddAllToCart}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[var(--sr-customer)] to-[var(--sr-customer-hover)] text-[var(--sr-surface-base)] font-black text-sm hover:opacity-90 transition-opacity"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add All Ingredients to Cart
                    </button>
                    <p className="text-white/60 text-[10px] text-center mt-2">
                      Adds the main meal of each planned day to your cart.
                    </p>
                  </div>
                </div>
              )}

              {/* Tip card */}
              <div className="px-4 mt-4">
                <div className="rounded-2xl border border-white/5 bg-[var(--sr-surface-raised)] p-3 sm:p-4 flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-[var(--sr-ai)]/15 flex items-center justify-center shrink-0">
                    <ChefHat className="w-4 h-4 text-[var(--sr-ai)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold">Smart Kitchen sync</p>
                    <p className="text-white/50 text-[11px] mt-0.5">
                      Tap “Cook Now” on any planned meal to launch Chef Safa&apos;s live AI cooking
                      coach.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Add-meal bottom sheet ── */}
            <AnimatePresence>
              {addSheet.open && addSheet.slot && (
                <AddMealSheet
                  slot={addSheet.slot}
                  customName={customName}
                  setCustomName={setCustomName}
                  servings={servings}
                  setServings={setServings}
                  pickedRecipeId={pickedRecipeId}
                  setPickedRecipeId={setPickedRecipeId}
                  onClose={closeAddSheet}
                  onAdd={handleAddMeal}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── Meal Section ───────────────────────── */

interface MealSectionProps {
  slot: SlotKey;
  meal?: MealSlot;
  accentColor: string;
  accentSoft: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onAdd: () => void;
  onRemove: () => void;
  onCookNow: () => void;
}

function MealSection({
  meal,
  accentColor,
  accentSoft,
  icon,
  label,
  sublabel,
  onAdd,
  onRemove,
  onCookNow,
}: MealSectionProps) {
  return (
    <div
      className="rounded-3xl border bg-[var(--sr-surface-raised)] p-3 sm:p-4"
      style={{ borderColor: meal ? accentColor : 'rgba(255,255,255,0.05)' }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="size-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: accentSoft, color: accentColor }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-black text-sm">{label}</h3>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: accentSoft, color: accentColor }}
            >
              {label === 'Iftar' ? 'Sunset' : 'Pre-dawn'}
            </span>
          </div>
          <p className="text-white/65 text-[11px]">{sublabel}</p>
        </div>
      </div>

      {/* Meal card OR empty state */}
      {meal ? (
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-[var(--sr-surface-elevated)] border border-white/5">
          {/* Thumb */}
          <div className="size-16 rounded-xl overflow-hidden bg-[var(--sr-surface-raised)] shrink-0 border border-white/5">
            {meal.image ? (
              <img
                src={meal.image}
                alt={meal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: accentSoft, color: accentColor }}
              >
                <ChefHat className="w-6 h-6" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-bold truncate">{meal.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: accentSoft, color: accentColor }}
              >
                <UtensilsMini />
                {meal.servings} serving{meal.servings > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="w-full p-3 sm:p-4 rounded-2xl border border-dashed flex items-center justify-center gap-2 text-sm font-bold transition-colors hover:bg-white/5"
          style={{
            borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
            color: accentColor,
          }}
        >
          <Plus className="w-4 h-4" />
          Add {label} Meal
        </button>
      )}

      {/* Action row */}
      {meal && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onCookNow}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor, color: 'var(--sr-surface-base)' }}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Cook Now
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="px-3 py-2.5 rounded-xl bg-[var(--sr-surface-elevated)] border border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/30 transition-colors"
            aria-label={`Remove ${label} meal`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function UtensilsMini() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h0v11h2V11h0c1.1 0 2-.9 2-2V2H8v5H7V2H6v5H5V2H3zM18 2c-1.66 0-3 2.24-3 5 0 1.71.7 3.23 1.74 4.04L17 11v11h2V11l.26-.05C20.3 10.23 21 8.71 21 7c0-2.76-1.34-5-3-5z" />
    </svg>
  );
}

/* ───────────────────────── Summary Stat ───────────────────────── */

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 text-center">
      <div className="text-2xl font-black" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-white/65 font-bold mt-0.5">
        {label}
      </div>
    </div>
  );
}

/* ───────────────────────── Add-Meal Bottom Sheet ───────────────────────── */

interface AddMealSheetProps {
  slot: SlotKey;
  customName: string;
  setCustomName: (v: string) => void;
  servings: number;
  setServings: (n: number) => void;
  pickedRecipeId: number | null;
  setPickedRecipeId: (id: number | null) => void;
  onClose: () => void;
  onAdd: () => void;
}

function AddMealSheet({
  slot,
  customName,
  setCustomName,
  servings,
  setServings,
  pickedRecipeId,
  setPickedRecipeId,
  onClose,
  onAdd,
}: AddMealSheetProps) {
  const accentColor = slot === 'iftar' ? 'var(--sr-customer)' : 'var(--sr-vendor)';
  const accentSoft = slot === 'iftar' ? 'rgba(16,224,122,0.12)' : 'rgba(245,196,81,0.12)';

  const adjustServings = (delta: number) => {
    const next = Math.min(10, Math.max(1, servings + delta));
    setServings(next);
  };

  return (
    <>
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        className="absolute left-0 right-0 bottom-0 z-20 bg-[var(--sr-surface-raised)] rounded-t-3xl border-t border-white/10 max-h-[88%] overflow-y-auto custom-scrollbar"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-center justify-between">
          <div>
            <p
              className="text-[10px] uppercase tracking-wider font-black"
              style={{ color: accentColor }}
            >
              Add to {slot === 'iftar' ? 'Iftar' : 'Sahur'}
            </p>
            <h3 className="text-white font-black text-lg">Pick a meal</h3>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-full bg-[var(--sr-surface-elevated)] border border-white/10 flex items-center justify-center"
            aria-label="Close add meal sheet"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Recipe suggestions */}
        <div className="px-5 pb-4">
          <p className="text-white/65 text-[11px] uppercase tracking-wider font-bold mb-2">
            Trending recipes
          </p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {trendingMeals.map((m) => {
              const picked = pickedRecipeId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPickedRecipeId(picked ? null : m.id)}
                  className={`relative shrink-0 w-[140px] rounded-2xl border overflow-hidden text-left transition-all ${
                    picked
                      ? 'border-2'
                      : 'border-white/8 hover:border-white/20'
                  }`}
                  style={picked ? { borderColor: accentColor } : undefined}
                >
                  <div className="h-20 w-full bg-[var(--sr-surface-elevated)] relative overflow-hidden">
                    <img
                      src={m.image}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                    {picked && (
                      <div
                        className="absolute top-1.5 right-1.5 size-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check className="w-3 h-3 text-[var(--sr-surface-base)]" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[var(--sr-surface-raised)]">
                    <p className="text-white text-xs font-bold leading-tight line-clamp-2">
                      {m.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-2.5 h-2.5 text-white/65" />
                      <span className="text-white/65 text-[10px]">{m.deliveryTime}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom meal name */}
        <div className="px-5 pb-4">
          <p className="text-white/65 text-[11px] uppercase tracking-wider font-bold mb-2">
            Or type your own
          </p>
          <input
            type="text"
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              if (e.target.value && pickedRecipeId !== null) setPickedRecipeId(null);
            }}
            placeholder="e.g. Auntie&apos;s Pepper Soup"
            className="w-full px-4 py-3 rounded-2xl bg-[var(--sr-surface-elevated)] border border-white/10 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Servings stepper */}
        <div className="px-5 pb-5">
          <p className="text-white/65 text-[11px] uppercase tracking-wider font-bold mb-2">
            Servings
          </p>
          <div className="flex items-center justify-between bg-[var(--sr-surface-elevated)] border border-white/10 rounded-2xl p-2">
            <button
              onClick={() => adjustServings(-1)}
              disabled={servings <= 1}
              className="size-10 rounded-xl bg-[var(--sr-surface-raised)] border border-white/5 flex items-center justify-center disabled:opacity-30 hover:border-white/20 transition-colors"
              aria-label="Decrease servings"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-baseline gap-1.5">
              <span className="text-white text-2xl font-black">{servings}</span>
              <span className="text-white/65 text-xs font-bold">
                serving{servings > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => adjustServings(1)}
              disabled={servings >= 10}
              className="size-10 rounded-xl bg-[var(--sr-surface-raised)] border border-white/5 flex items-center justify-center disabled:opacity-30 hover:border-white/20 transition-colors"
              aria-label="Increase servings"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Add button */}
        <div className="px-5 pb-6 sticky bottom-0 bg-gradient-to-t from-[var(--sr-surface-raised)] via-[var(--sr-surface-raised)] to-transparent pt-3">
          <button
            onClick={onAdd}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-black text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: accentColor,
              color: 'var(--sr-surface-base)',
              boxShadow: `0 8px 24px -8px ${accentSoft}`,
            }}
          >
            <Plus className="w-4 h-4" />
            Add to {slot === 'iftar' ? 'Iftar' : 'Sahur'}
          </button>
          {!customName.trim() && pickedRecipeId === null && (
            <p className="text-white/60 text-[10px] text-center mt-2">
              Pick a recipe above or type a custom name
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
}
