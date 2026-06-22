# Task 8 — Meal Planner Builder

## Task
Build a NEW "Meal Planner" modal — a weekly calendar where users plan Iftar and Sahur meals. Single file: `src/components/swift/MealPlannerModal.tsx`. Triggered by `activeModal === 'meal-planner'`.

## Work Log
- Read `/home/z/my-project/worklog.md` to understand prior context. Key facts learned:
  * Project is in Beta; Smart Kitchen Hub already built by Task 3 with `'smart-kitchen'` modal key.
  * Established patterns: full-screen modal shell with `AnimatePresence` on `isOpen`, `bg-black/80` backdrop, slide-up `motion.div` `bg-[#05070A]`, sticky header with 2px gradient accent bar (`from-[#13ec13] via-[#FFD700] to-[#8b5cf6]`), `.beta-badge` CSS class available, `useToast` hook signature `{ toast }`, store exports `useAppStore` from `@/lib/store`.
  * `trendingMeals` shape (from `@/lib/data`): `{ id, name, description, price, image, deliveryTime, rating, reviews, category }`.
  * `addToCart` accepts `Omit<CartItem, 'quantity'> & { quantity?: number }` — needs `{ id: number, name: string, price: number, image: string, quantity? }`.
  * ESLint config: `react-hooks/exhaustive-deps` is OFF, `@typescript-eslint/no-unused-vars` is OFF, `@next/next/no-img-element` is OFF (so `eslint-disable-next-line` directives for that rule get flagged as unused — must NOT add them).
  * Prior agent's #1 lint hurdle was the `react-hooks/refs` rule. My component passes NO refs as props, so I avoided this entirely by inlining everything into a single file with three sub-components (`MealSection`, `SummaryStat`, `AddMealSheet`) that receive only plain props.
- Inspected sibling modal `SahurWakeUpModal.tsx` and the flagship `SmartKitchenHub.tsx` (header pattern at lines 720–761) for the canonical modal shell pattern.
- Created `/home/z/my-project/src/components/swift/MealPlannerModal.tsx` (~855 lines, single `'use client'` file) with:
  1. **Full-screen modal shell** — `AnimatePresence` on `activeModal === 'meal-planner'`, `bg-black/80` backdrop that closes on click, slide-up `motion.div` with `h-[100dvh] bg-[#05070A] overflow-hidden sk-aura`. Sticky header: 2px green→gold→purple gradient bar, `CalendarDays` icon in a green-gradient square, "Meal Planner" title + `.beta-badge`, subtitle "Plan your Iftar & Sahur for the week", close button.
  2. **Weekly calendar view (7 days)** — `getWeekDays()` helper returns next 7 days starting today; each chip shows day name (or "Today" if today), date number, and a colored dot (gold/green) when meals are planned. Selected day gets `border-[#13ec13]/60` ring; today's chip gets a small green dot indicator. Horizontally scrollable (`overflow-x-auto no-scrollbar`).
  3. **Day detail view** — Selected day header with "Today/Selected day" label, pretty-formatted long date, and a meal-count pill. Two `MealSection` cards: **Iftar** (green `#13ec13` accent, Moon icon, "Sunset meal · Maghrib" sublabel) and **Sahur** (gold `#FFD700` accent, Sun icon, "Pre-dawn meal · Fajr" sublabel). Each shows either the planned meal (image thumb or fallback ChefHat icon, name, servings pill, "Cook Now →" button → `setActiveModal('smart-kitchen')`, and a Trash2 "Remove" button) OR an empty state "Add {label} Meal" button with dashed border.
  4. **Add meal flow** — Clicking "Add Iftar/Sahur Meal" opens a bottom sheet (`AddMealSheet` sub-component) with: drag handle, "Add to {Iftar/Sahur}" header, horizontal-scroll recipe suggestions (`trendingMeals` mapped to image + name + deliveryTime cards, pickable with a checkmark badge), "Or type your own" custom-name text input (auto-clears picked recipe when typing), and a servings stepper (1–10, +/- buttons, disabled at bounds). "Add to {Iftar/Sahur}" button at the bottom calls `handleAddMeal` which validates, builds a `MealSlot`, writes it into `plan[selectedDate][slot]`, fires toast "Meal planned! 🗓️", and closes the sheet.
  5. **Persistence** — `plan` state initialized via lazy `useState` initializer (`if (typeof window === 'undefined') return {}` + `try/catch` around `JSON.parse(localStorage.getItem('swiftramadan-mealplan') || '{}')`). A `useEffect([plan])` writes back to `localStorage` on every change — this is the ONLY effect, it contains NO `setState` (just `localStorage.setItem` inside try/catch), satisfying the strict `react-hooks/set-state-in-effect` rule. Empty day entries are cleaned up on remove to keep storage tidy.
  6. **Weekly summary card** — Shows when at least one meal is planned this week. 3-col grid: Meals (white), Iftar (green), Sahur (gold) counts. "Add All Ingredients to Cart" button iterates each planned day, takes the main meal (Iftar preferred, falls back to Sahur), and calls `addToCart({ id: Math.floor(Math.random()*100000), name, price: 0, image: m.image || '/images/categories/cat-groceries.png' })` for each. Fires toast "Added X meals to cart! 🛒".
  7. **Empty state** — When `isWeekEmpty` (no meals in any of the 7 days), shows a dashed-border card with `CalendarPlus` icon in a purple/green gradient square, "Start planning your perfect Ramadan week" headline, helper text, and a "Jump to Today" button that resets `selectedDate` to today's key.
- **Critical lint pattern followed EXACTLY as specified**: lazy `useState` initializer for `plan`, lazy `useState` initializer for `selectedDate` (defaults to `formatKey(new Date())`), and a single side-effect-only `useEffect` for persistence. ALL `setState` calls happen inside event handlers (`handleSelectDay`, `openAddSheet`, `closeAddSheet`, `handleAddMeal`, `handleRemoveMeal`, `handleAddAllToCart`, `jumpToToday`, `adjustServings`, `setCustomName`, `setPickedRecipeId`) — zero `setState` in any effect body.
- Ran `bun run lint`:
  * First pass: 0 errors, 7 warnings — 5 pre-existing + 2 in my file (lines 564 & 756) about unused `eslint-disable-next-line @next/next/no-img-element` directives. The rule is OFF in eslint.config.mjs so the directives were flagged as unused.
  * Fix: removed both `eslint-disable-next-line @next/next/no-img-element` comment directives (kept the `<img>` tags as-is since the rule is off).
  * Second pass: **0 errors, 5 warnings** — all 5 pre-existing in unrelated files (`auth/route.ts` 1, `layout.tsx` 1, `VoiceShoppingModal.tsx` 3). MealPlannerModal.tsx is **100% lint-clean (0 errors, 0 warnings)**.
- Verified dev server log: clean compilation (`✓ Compiled in 20.1s`), no errors related to my file.

## Stage Summary
- **Files created (exactly this one, no existing files modified):**
  * `/home/z/my-project/src/components/swift/MealPlannerModal.tsx` (~855 lines, single `'use client'` component + 3 inline sub-components: `MealSection`, `SummaryStat`, `AddMealSheet`)
- **Files NOT modified** (per task rules): page.tsx, store.ts, globals.css — orchestrator will wire `activeModal === 'meal-planner'` trigger and add `<MealPlannerModal />` to `AllModals()`.
- **Key contracts:**
  * Component reads `activeModal, setActiveModal, addToCart` from `useAppStore`.
  * Triggers Smart Kitchen via `setActiveModal('smart-kitchen')` from "Cook Now" buttons.
  * localStorage key: `swiftramadan-mealplan`. Shape: `{ "YYYY-MM-DD": { iftar?: { name, image?, servings }, sahur?: { name, image?, servings } } }`.
  * Empty day entries are pruned on remove to keep storage tidy.
  * "Add All to Cart" uses Iftar as the main meal, falling back to Sahur. Each item gets `id: Math.floor(Math.random()*100000)`, `price: 0`, `image: m.image || '/images/categories/cat-groceries.png'`.
- **Key technical decisions:**
  * Lazy `useState` initializers for both `plan` (from localStorage) and `selectedDate` (today's date key) — never `setState` in an effect body.
  * Single side-effect-only `useEffect([plan])` for persistence — only `localStorage.setItem` inside `try/catch`, no `setState`.
  * All sub-components (`MealSection`, `SummaryStat`, `AddMealSheet`) receive plain props only (strings, numbers, callbacks) — NO refs passed as props, avoiding the `react-hooks/refs` rule that bit Task 3.
  * `weekDays` is `useMemo([])` (computed once on mount) since "today" doesn't change during a session.
  * Inline SVG `UtensilsMini` (9×9 px) used for the servings pill icon instead of importing a lucide icon to keep the icon set minimal.
  * Inline `style={{ borderColor: accentColor }}` (rather than dynamic Tailwind classes) for the per-slot accent colors (`#13ec13` vs `#FFD700`) — keeps Tailwind happy with static class names while still theming each section by meal type.
- **Lint result: 0 errors, 5 warnings (all 5 pre-existing in unrelated files). MealPlannerModal.tsx is 100% clean.**
- The Meal Planner is fully functional: open the modal → 7-day chips at top (today highlighted with green ring) → tap a day → see Iftar + Sahur sections → tap "Add Iftar Meal" → bottom sheet slides up with trending recipes + custom name field + servings stepper → tap "Add to Iftar" → meal saves to localStorage + toast → repeat for Sahur → scroll to bottom → "Add All Ingredients to Cart" pushes every planned meal's main dish to the cart. Tapping "Cook Now" on any planned meal hands off to Smart Kitchen (Chef Safa live AI coach). Empty week shows a friendly CalendarPlus empty state with a "Jump to Today" button.
