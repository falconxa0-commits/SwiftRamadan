# Task 1-c-auth: Add requireAuth() to Critical API Routes

## Agent: Auth Guard Agent

## Summary
Added `requireAuth()` authentication checks to 10 API route files (14 handler methods total) across the SwiftRamadan application.

## Files Modified

| File | Methods Protected | Auth Strategy |
|------|------------------|---------------|
| `src/app/api/user/route.ts` | GET, PUT | auth.email preferred over query/body email |
| `src/app/api/payments/route.ts` | POST | auth.userId preferred over body userId |
| `src/app/api/orders/route.ts` | GET, POST | auth.email → userId lookup; auth.userId preferred |
| `src/app/api/cart/route.ts` | GET, POST, DELETE | auth.email → userId lookup; auth.userId preferred |
| `src/app/api/rider/route.ts` | GET, POST | auth.email + role check (rider only) |
| `src/app/api/vendor/route.ts` | GET, POST | auth.email + role check (vendor only) |
| `src/app/api/communications/email/route.ts` | POST | Basic auth (spam prevention) |
| `src/app/api/communications/sms/route.ts` | POST | Basic auth (spam prevention) |
| `src/app/api/communications/whatsapp/route.ts` | POST | Basic auth (spam prevention) |
| `src/app/api/notifications/push/route.ts` | POST | Basic auth |

## Pattern Applied
```typescript
import { requireAuth } from '@/lib/session';

// After rate limit check in each handler:
const auth = await requireAuth(request);
if (auth instanceof NextResponse) return auth; // 401 if unauthenticated

// Role-specific routes also add:
if (auth.role !== 'rider') return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
```

## Key Decisions
- Auth checks always placed AFTER rate limit, BEFORE business logic
- Session values (auth.email, auth.userId) take priority; original params kept as fallback
- Role-specific routes (rider, vendor) return 403 for wrong role
- Public routes (products GET, prayer-times, etc.) left untouched
- Orders PUT not modified (not in task spec)

## Verification
- `bun run lint`: 0 errors, 4 warnings (all pre-existing)
- Dev server compiles and runs without errors
