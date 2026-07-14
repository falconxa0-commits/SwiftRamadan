# Task 3b - Payouts API Builder

## Task
Create TWO API route files for the payouts system (all monetary amounts in kobo).

## Files Created

### 1. `/src/app/api/payouts/route.ts`
POST handler with 3 actions:
- **`request`** - Vendor/Rider requests a payout
  - Validates: amount > 0, bankName required, accountNumber required
  - Checks walletBalance >= amount
  - Generates reference: `PO_{timestamp}_{random}`
  - Deducts from walletBalance, creates WalletTransaction (type: 'payout', amount: -amount), creates Payout (status: 'pending')
  - Returns: `{ success, payout, newBalance }`
- **`list`** - Get user's payouts sorted by createdAt desc
  - Returns: `{ success, payouts }`
- **`get`** - Get single payout by ID with userId verification
  - Returns: `{ success, payout }`

### 2. `/src/app/api/payouts/admin/route.ts`
POST handler (admin only) with 4 actions:
- **`list-all`** - Paginated list with optional status filter (default page=1, limit=20)
  - Returns: `{ success, payouts, total, page, totalPages }`
- **`process`** - Mark payout as processing, set adminNote
  - Returns: `{ success, payout }`
- **`complete`** - Mark payout as completed, set processedAt to now(), set adminNote
  - Returns: `{ success, payout }`
- **`reject`** - Reject payout, refund to wallet
  - Credits amount back to walletBalance
  - Creates WalletTransaction (type: 'refund', amount: payoutAmount, description: 'Payout rejected - refunded to wallet')
  - Returns: `{ success, payout, newBalance }`

## Key Decisions
- Used `import { db } from '@/lib/db'` as specified
- Used POST with `action` field pattern consistent with other routes in the project
- All monetary amounts in kobo (Int type) matching Prisma schema
- Proper try/catch error handling with appropriate HTTP status codes
- Lint: 0 errors, 4 warnings (all pre-existing)
