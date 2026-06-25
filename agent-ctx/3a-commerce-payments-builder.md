# Task 3a — Commerce & Payments Builder

## Scope
Built 15 features for SwiftRamadan: 8 new API routes + 4 modified UI components.

## Files Created
- `src/app/api/wishlist/route.ts` — GET/POST/DELETE wishlist items with toggle semantics
- `src/app/api/addresses/route.ts` — GET/POST/PUT/DELETE saved delivery addresses
- `src/app/api/payments/route.ts` — GET/POST simulated successful payments; links to orders
- `src/app/api/coupons/route.ts` — GET active coupons (auto-seeds defaults if DB empty)
- `src/app/api/coupons/validate/route.ts` — POST validate a coupon against a cart total
- `src/app/api/products/[id]/reviews/route.ts` — GET/POST product reviews; recomputes Product.rating
- `src/app/api/offers/route.ts` — GET mix of DB coupons + curated flash-sale/Ramadan offers
- `src/app/api/group-buy/route.ts` — GET/POST join with in-memory server-side slot tracking

## Files Modified
- `src/components/swift/CheckoutModal.tsx` — added saved-addresses picker (fetches `/api/addresses`), "Add New Address" inline form (POSTs to `/api/addresses`), coupon input field that calls `/api/coupons/validate` (shows discount + error states), payment processing via `/api/payments` POST in handlePlaceOrder, success screen shows applied coupon + payment reference
- `src/components/swift/OrdersTab.tsx` — added `handleCancelOrder` (PUT `/api/orders` with status='Cancelled'), `handleDownloadReceipt` (generates a .txt receipt via Blob + URL.createObjectURL), Cancelled status added to statusConfig, activeOrders/pastOrders filters updated to treat Cancelled as past, 3-button grid (Reorder/Cancel/Receipt) in expanded active order, 2-button grid (Reorder/Receipt) in past orders
- `src/components/swift/ProductDetailModal.tsx` — full rewrite adding: reviews section that fetches `/api/products/[id]/reviews`, average rating summary card with star distribution bars, write-a-review form (interactive 1-5 star selector, comment textarea, POST to reviews API), reviews list with avatar/name/star/comment/time-ago, sync wishlist to `/api/wishlist` on toggle, average rating overrides mock `product.rating` when reviews exist
- `src/components/swift/OffersTab.tsx` — wired Active Coupons + Limited-Time Offers sections to `/api/offers` API, kept static fallback arrays for offline/error cases, retained existing Copy Code button (already worked)

## Key Design Decisions
1. **userId resolution**: All user-scoped APIs accept either an email or a real cuid as `userId`. The backend resolves it to a real `User.id` by checking both `id` and `email` columns. This handles the task's "use userEmail as userId" instruction while still satisfying the FK constraints on WishlistItem, Address, Payment, Review.
2. **Product reviews with no DB product**: When a numeric product ID (e.g. 100) doesn't match a Product.cuid, the Review is stored with `productId=null` and `targetId=String(productId)`. The GET endpoint matches on either `productId` OR `targetId`, so reviews work even for products that exist only in the mock `allProducts` array.
3. **Coupon validation**: Increments `uses` on successful validation. Returns `valid: false` with a 200 status for known-failure cases (expired, max uses, min order not met) so the UI can show a helpful error message.
4. **Payment simulation**: Always returns `status: 'success'` (per task spec — simulated). If `orderId` is provided and the order is still in the early stages, the order's status is bumped to "Confirmed" with progress=10.
5. **Group Buy**: Used an in-memory `Map` for slot tracking since there's no GroupBuy model in the schema. The slot state persists across requests but resets on server restart — acceptable for the demo.
6. **Auto-seeding**: `/api/coupons` and `/api/offers` auto-seed 5 default coupons into the DB on first GET if the table is empty, so the UI works out of the box without a separate seed script.

## Verification
- `bun run lint`: **0 errors, 5 warnings** (all pre-existing in files I don't own — auth/route.ts, layout.tsx, VoiceShoppingModal.tsx, EditProfileModal.tsx)
- All 8 new APIs verified via curl with both happy-path and edge-case tests:
  - GET endpoints return 200 with seeded/empty data as appropriate
  - POST endpoints return 201 (or 200 for toggle/already-joined cases)
  - Toggle semantics work (POST wishlist item twice → removed)
  - DELETE addresses works
  - alreadyJoined detection works for group-buy
  - Coupon validate computes discount correctly (10% of ₦8,000 = ₦800)
- Dev log shows only 2xx responses for all my new API routes (no 4xx/5xx errors)
- Pre-existing dev log errors in `/api/messages`, `/api/videos/save`, and `/api/rider` are from other agents' work, not mine
