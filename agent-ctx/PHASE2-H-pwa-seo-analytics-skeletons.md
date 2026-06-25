# PHASE2-H — PWA / SEO / Analytics / Loading Skeletons Builder

**Task ID:** PHASE2-H
**Agent:** PWA / SEO / Analytics / Skeletons Builder
**Scope:** 4 polish/UX features for SwiftRamadan (Next.js 16 App Router, TypeScript, Tailwind 4, Aurora Luxe dark theme)

## Files Created (11)
| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest — name, icons, shortcuts, theme color |
| `public/sw.js` | Service worker — app shell cache, network-first nav, cache-first assets |
| `public/icon.svg` | 512×512 SVG icon — crescent + star + plate, Aurora Luxe palette |
| `src/components/PWARegister.tsx` | Client component — registers SW in production only |
| `src/app/robots.ts` | MetadataRoute.Robots — allow /, disallow /api/, sitemap link |
| `src/app/sitemap.ts` | MetadataRoute.Sitemap — single entry for / |
| `src/lib/analytics.ts` | 27 typed events, localStorage queue, flushAnalytics() |
| `src/hooks/use-analytics.ts` | useAnalytics() — page_view on mount, 30s flush, beforeunload flush |
| `src/app/api/analytics/route.ts` | POST endpoint — receives event batches, 500-event cap |
| `src/components/swift/Skeletons.tsx` | 7 reusable skeleton components |
| (verified existing) `src/components/ui/skeleton.tsx` | shadcn Skeleton — already present |

## Files Modified (12)
| File | Change |
|------|--------|
| `src/app/layout.tsx` | Rewrote metadata (title template, OG, Twitter, robots, icons), added viewport export, added `<PWARegister />` in body |
| `src/components/swift/BottomNav.tsx` | track('tab_switch', {tab}) on tab click |
| `src/components/swift/ProductDetailModal.tsx` | track('product_view' / 'add_to_cart' / 'review_submit') |
| `src/components/swift/CheckoutModal.tsx` | track('checkout_start' / 'coupon_apply' / 'order_placed' / 'checkout_complete') |
| `src/components/swift/VideoCard.tsx` | track('video_view' / 'video_like' / 'video_save' / 'follow_user' / 'video_comment' / 'video_share') |
| `src/components/swift/AuthScreen.tsx` | track('login' / 'signup' / 'role_switch') |
| `src/components/swift/SearchOverlay.tsx` | track('search', {query}) |
| `src/components/swift/AIChatWidget.tsx` | track('ai_chat_message', {length}) |
| `src/components/swift/OrdersTab.tsx` | Replaced inline loading with `<OrdersTabSkeleton />` |
| `src/components/swift/ReelsTab.tsx` | Replaced Loader2 spinner with `<ReelsTabSkeleton />` |
| `src/components/swift/VendorDashboard.tsx` | Added early-return `<VendorDashboardSkeleton />` if loading && !data |
| `src/components/swift/RiderDashboard.tsx` | Replaced 38-line inline skeleton with `<RiderDashboardSkeleton />` |
| `src/components/swift/HomeTab.tsx` | Replaced 27-line inline loading block with `<HomeTabSkeleton />` |

## Files Deleted (1)
- `public/robots.txt` — would conflict with `src/app/robots.ts` (Next.js route handler wins)

## Coordination Notes
- **Agent F** had already modified `VendorDashboard.tsx` and `RiderDashboard.tsx` to add `useSocket` hook imports. I preserved those imports alongside my new Skeletons imports.
- Briefly clobbered the `useSocket` import in RiderDashboard.tsx during an Edit operation; restored immediately by re-adding the import line.
- **Agent G** may modify `layout.tsx` for ErrorBoundary wrapper. My changes are minimal: 1 import (PWARegister) + 1 component placement (`<PWARegister />` as first child of body, before `{children}`). Easy to wrap in ErrorBoundary if needed.

## Verification Results
- `bun run lint` → 0 errors, 6 pre-existing warnings (all in unrelated files: auth/route.ts, layout.tsx Material Symbols font warning, VoiceShoppingModal.tsx ×3, use-socket.ts:75)
- `curl /manifest.json` → 200 (1175 bytes)
- `curl /sw.js` → 200 (1800 bytes)
- `curl /icon.svg` → 200 (2178 bytes)
- `curl /robots.txt` → 200 (returns generated rules from src/app/robots.ts)
- `curl /sitemap.xml` → 200 (returns valid XML urlset)
- `POST /api/analytics` with valid events → 200 `{"success":true,"received":N}`
- `POST /api/analytics` with missing events → 400
- HTML head (curl /) contains: 1× manifest link, 1× icon link, 1× apple-touch-icon link, 1× theme-color meta, plus full OG + Twitter card metadata
- Dev server log: consistent `GET / 200 in ~80-130ms`, no new errors after edits

## Architecture Decisions
1. **PWA SW in production only** — registered only when `NODE_ENV === 'production'` to avoid stale-cache issues during development.
2. **Analytics uses localStorage queue + 30s periodic flush + beforeunload flush** — non-blocking, survives page navigation. Production swap point is the `track()` function body.
3. **All track() calls are non-blocking** — wrapped in try/catch where applicable, never thrown to break user flows.
4. **Skeletons use the existing shadcn Skeleton component** — `bg-accent` resolves to `#1B1F2A` (dark slate) which fits Aurora Luxe dark theme.
5. **Top-level skeleton for VendorDashboard** — added early return `if (loading && !data)` so the dashboard shows the full skeleton on first load, but inner `OrderCardSkeleton` (existing) still handles subsequent refreshes.
6. **Manifest references `/icon.svg` (any size) + 2 PNG fallbacks** — `/swiftramadan-logo.png` is already in public/ from prior sessions.
7. **Removed manual `<link>` tags in `<head>`** — Next.js metadata API auto-injects manifest/icon/theme-color from the `metadata` and `viewport` exports, so manual duplicates were causing doubled-up tags.
