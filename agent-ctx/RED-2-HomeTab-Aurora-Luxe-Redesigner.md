# RED-2 — HomeTab Aurora Luxe Redesigner

## Task
Completely rewrite `/home/z/my-project/src/components/swift/HomeTab.tsx` with the new Aurora Luxe design language established by RED-1 (foundation globals.css + core shell already redesigned).

## Inputs Read
- `/home/z/my-project/worklog.md` — RED-1 entry documents the new design system (color palette, utility classes).
- `/home/z/my-project/src/app/globals.css` — full list of new utilities available: `.aurora-app-bg`, `.aurora-hero`, `.aurora-soft`, `.glass-card`, `.premium-card`, `.aurora-card`, `.glass-effect`, `.green-glow`, `.nav-glow`, `.gold-glow`, `.gold-gradient`, `.emerald-gradient`, `.text-gradient-emerald/gold/aurora`, `.beta-badge`, `.sk-aura`, `.gradient-border`, `.float-soft`, `.live-ring`, `.aurora-drift`, `.shimmer-line`, `.pulse-soft`, `.heading-accent`, `.soft-chip`, `.icon-tile`, `.no-scrollbar`, `.custom-scrollbar`.
- `/home/z/my-project/src/components/swift/HomeTab.tsx` — original 646-line file (read in full).
- `/home/z/my-project/src/lib/data.ts` — verified types for heroSlides, categories, ramadanBox, trendingMeals, flashSales, quickActions.
- `/home/z/my-project/src/lib/store.ts` — verified store API: setActiveModal, setSelectedProduct, setActiveTab, setActiveCategory, addToCart, setShowSearch, activeCategory.
- `/home/z/my-project/eslint.config.js` — confirmed `@typescript-eslint/no-unused-vars` and `react-hooks/exhaustive-deps` are OFF, `@next/next/no-img-element` is OFF.

## Work Performed
- Completely rewrote HomeTab.tsx (646 → ~570 lines) end-to-end with Aurora Luxe design language.
- Migrated every color reference: #1A1D26 → #0F1118, #13ec13 → #10E07A, #FFD700 → #F5C451, #8b5cf6 → #A78BFA, #05070A → #06070B.
- Applied new utility classes throughout: `.premium-card` (Smart Kitchen hero + Ramadan Box), `.glass-card` (flash sales items, trending meals, quick action buttons, empty state, search bar), `.aurora-card` (Community CTA), `.icon-tile` (ChefHat, CalendarDays, Flame, Sparkles, Users icon containers), `.soft-chip` (delivery time + rating chips in trending meals), `.heading-accent` (all section h3 titles), `.text-gradient-emerald` (Ramadan Box price), `.text-gradient-aurora` (Community CTA heading), `.emerald-gradient` (Launch Live Coach + Details buttons), `.gold-gradient` (flash sale progress bars), `.sk-aura` (Smart Kitchen hero aura), `.green-glow` (active category circle), `.no-scrollbar` + `.custom-scrollbar` (horizontal scroll strips + trending list).
- Spacing refined: `space-y-6` → `space-y-7` between major sections; `px-4` → `px-5` horizontal padding throughout; `pb-32` bottom padding kept.
- Typography refined: tracking-[0.10em]/[0.12em]/[0.14em]/[0.16em]/[0.18em] scale across uppercase labels; tighter leading-tight on headings.
- Loading skeleton refined: all `bg-[#1A1D26]` → `bg-[#0F1118]`; added brand-strip skeleton row at top for visual continuity with the redesigned greeting.
- Floating aurora glow orbs on hero + community CTA updated to new emerald/violet palette.

## Preserved Contracts (verified)
- 'use client' directive at top ✓
- ALL imports kept (lucide icons, data, store, motion, toast, RamadanCountdown) ✓
- quickActionConfig mapping kept verbatim ✓
- All handler functions kept: handleCategoryClick, handleMealClick, handleQuickAdd, handleQuickAction ✓
- Auto-scroll carousel useEffect kept (4s interval, currentSlide state, carouselRef) ✓
- Loading-skeleton useEffect kept (800ms timeout) ✓
- Smart Kitchen "Launch Live Coach" CTA → setActiveModal('smart-kitchen') ✓
- Community CTA → setActiveModal('community') ✓
- Visual search button → setActiveModal('visual-search') ✓
- Search bar → setShowSearch(true) ✓
- Meal Planner quick action → setActiveModal('meal-planner') ✓
- All handleQuickAdd calls preserve the {id, name, price, image} contract ✓
- All handleMealClick calls preserved (id mapping unchanged) ✓

## Lint Result
- `bun run lint 2>&1 | tail -30`: **0 errors, 5 warnings** (all 5 pre-existing in unrelated files: auth/route.ts 1, layout.tsx 1, VoiceShoppingModal.tsx 3).
- HomeTab.tsx is 100% clean — no errors, no warnings attributable to this file.

## Dev Log Verification
- ✓ Compiled in 20.8s / 20.2s; no errors related to HomeTab; GET / returns 200 cleanly.

## Output
- File: `/home/z/my-project/src/components/swift/HomeTab.tsx` (~570 lines, fully rewritten with Aurora Luxe design).
- Worklog entry appended to `/home/z/my-project/worklog.md` under "Task ID: RED-2".
