# Task 3d - Support Ticket API Builder

## Summary
Created two API route files for the support ticket system.

## Files Created

### 1. `/src/app/api/support/route.ts`
POST handler with 5 actions for user-facing support ticket operations:
- **create** — Validates userId, subject, category (general/order/payment/delivery/account/vendor/rider), priority (default: medium). Creates SupportTicket + first TicketMessage via nested create.
- **list** — Returns user's tickets with messages, sorted by createdAt desc.
- **get** — Returns single ticket with messages (ordered asc), verifies userId ownership (403 if mismatch).
- **message** — Creates TicketMessage (isAdmin: false), updates ticket updatedAt.
- **close** — Verifies ownership, updates ticket status to 'closed'.

### 2. `/src/app/api/support/admin/route.ts`
POST handler with 3 actions for admin support ticket operations:
- **list-all** — Filters by status/category/priority, pagination (default page=1, limit=20, cap 100). Includes user relation (select id/name/email/role) and messages.
- **reply** — Creates TicketMessage (isAdmin: true), uses $transaction to atomically update ticket status to 'in_progress' and updatedAt.
- **update-status** — Validates status (open/in_progress/resolved/closed), optionally updates priority, returns updated ticket.

## Key Design Decisions
- Ownership verification for get/message/close actions (403 on mismatch)
- Admin reply uses `$transaction` for atomic message creation + status update
- Pagination capped at 100 items per page
- All validation returns descriptive 400 errors
- Follows existing project patterns (NextResponse.json, db import, try/catch)

## Lint Result
0 errors, 4 warnings (all pre-existing)
