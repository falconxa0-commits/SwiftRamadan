# Task 3d — User & Profile

Agent: User & Profile Builder
Task ID: 3d
Scope: Build 11 features for SwiftRamadan — settings, edit profile, help center, legal pages, loyalty redemption, onboarding skip, empty states, plus 3 backend API endpoints.

## Plan
1. Add PUT method to `/api/notifications` (single + bulk mark-read)
2. Create `/api/settings` route (GET creates default if missing; PUT upserts)
3. Create `/api/user/redeem` route (POST deducts swiftPoints, creates Coupon, returns code)
4. Create `SettingsModal.tsx` — notifications/appearance/language/currency/account/support/legal/logout
5. Create `EditProfileModal.tsx` — name/phone/area/avatar, saves via PUT /api/user, updates Zustand
6. Create `HelpCenterModal.tsx` — searchable FAQ accordion with 12+ FAQs across 5 categories + Contact/Report buttons
7. Create `LegalPagesModal.tsx` — tabs: Terms (15+ sections), Privacy (10+ sections), About
8. Modify `OnboardingFlow.tsx` — Skip button completes onboarding immediately (no celebration)
9. Modify `CartTab.tsx` — empty state with Framer Motion fade-in
10. Modify `NotificationCenter.tsx` — empty state with bell icon + accent color
11. Modify `CommunityForum.tsx` — empty state with MessageCircle icon + accent color
12. Modify `ProfileTab.tsx` — settings opens SettingsModal; add Edit Profile / Help / Legal menu items; add loyalty redemption section
13. Modify `page.tsx` — add 4 new modal imports inside AllModals()

## Verification
- `bun run lint` → 0 errors
- Dev server compiles cleanly
- All modals open via activeModal state
- PUT /api/notifications works for both single and bulk mark-read
- GET /api/settings creates default UserSetting if missing
- POST /api/user/redeem deducts points and creates Coupon with code
- All empty states animate in with Framer Motion

## Notes
- The existing `/api/user` route already has a PUT method that handles general profile updates (name, phone, area, avatar). No changes needed there — the requirement is already satisfied.
- All new modals use centered glass-card pattern with `fixed inset-0 z-[100]`, `backdrop blur`, `max-w-md`, scrollable content as per task spec.
- Color palette: Aurora Luxe dark (#0B0D14 bg, #10E07A green, #F5C451 gold) — uses glass-card, glass-effect, aurora-app-bg utilities.
