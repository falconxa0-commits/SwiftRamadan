# Task 1: Database Schema Update & API Routes Migration

**Agent**: DB & API Migration Agent  
**Status**: ✅ Completed

## Summary
Updated the Prisma schema to add a User model for auth persistence, added foreign key relationships to existing models, pushed the schema to the database, rewrote the auth API route to use real database operations via Prisma, created a new User API route, and migrated the Orders and Cart API routes from in-memory mock data to Prisma-based database operations.

## Files Modified

### 1. `prisma/schema.prisma`
- Added complete `User` model with all fields: auth (email, password), profile (name, phone, area, avatar), vendor-specific (storeName, businessCategory, etc.), rider-specific (vehicleType, plateNumber, etc.), loyalty (hasanatPoints, swiftPoints, loyaltyTier, dailyStreak), state (riderOnline, vendorOnline)
- Added `userId` foreign key and `user` relation to Order, CartItem, and Notification models
- Kept all existing models (Product, Order, CartItem, Notification) intact

### 2. `src/app/api/auth/route.ts`
- Replaced mock data with real Prisma database operations
- `login`: Finds user by email, verifies password (plain text), returns full user data with token
- `signup`: Creates user in DB with all provided fields (name, email, phone, area, role, vendor/rider fields), checks for duplicate email
- `verify-otp`: Accepts any 6-digit code (mock OTP), verifies user exists
- `get-user`: Finds user by email to restore session, returns all profile fields
- `update-profile`: Updates allowed user fields by email, returns updated user data
- Removed unused `z-ai-web-dev-sdk` import

### 3. `src/app/api/user/route.ts` (NEW)
- GET: Get user by email query parameter, returns complete user profile
- PUT: Update user profile fields with whitelist of allowed fields
- `action: 'switch-role'`: Changes user role between customer/vendor/rider with validation

### 4. `src/app/api/orders/route.ts`
- Replaced hardcoded mock data with Prisma `db.order.findMany()`
- GET: Supports optional `userId` filter, parses JSON items field
- POST: Creates new order in DB with items as JSON string
- PUT: Updates order status/progress/riderName by id

### 5. `src/app/api/cart/route.ts`
- Replaced in-memory array with Prisma `db.cartItem` operations
- GET: Fetches cart by sessionId or userId with calculated totals and delivery fee
- POST: Adds item or increments quantity if existing, by productId + session/user match
- DELETE: Removes specific item by DB id, or clears all items for session/user

## Key Design Decisions
1. User password stored as plain text (as specified) - production would use bcrypt
2. OTP verification is mock - accepts any 6-digit code
3. Cart uses `sessionId` for anonymous users and `userId` for authenticated users
4. Order items stored as JSON string (SQLite doesn't support arrays natively)
5. Both auth and user routes accept `email` as the user identifier (not id)
6. All API routes use `import { db } from '@/lib/db'` for Prisma access

## Lint Status
- 0 errors, 1 warning (pre-existing @next/next/no-page-custom-font)
- Dev server compiling successfully on port 3000
