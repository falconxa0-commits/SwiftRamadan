# Task C — Payment Hardening Agent Work Record

## Task Summary
Harden all payment libraries with production-grade error handling and rebuild the webhook callback.

## Files Modified

### 1. `src/lib/payments/paystack.ts` (148 → 340 lines)
- **Retry with exponential backoff**: 3 retries, 1s/2s/4s delays for 5xx errors only
- **Request timeout**: 10s via AbortController
- **Proper response status checking**: `PaystackError` thrown on non-2xx with status code + body preview
- **`refundTransaction(reference, amount?)`**: New refund endpoint with mock fallback
- **`verifyPaystackWebhookSignature(payload, signature)`**: HMAC-SHA512 verification using `crypto.timingSafeEqual`
- **`isPaystackHealthy()`**: Health check that pings `/bank?country=nigeria&perPage=1` with 5s timeout
- **`[Paystack]` prefix** on all log messages
- **Mock fallback** preserved for all functions when `PAYSTACK_SECRET_KEY` not set
- **`paystackFetch<T>()`**: Shared fetch wrapper handling retry, timeout, error classification

### 2. `src/lib/payments/flutterwave.ts` (63 → 265 lines)
- Same retry + timeout pattern as Paystack (3 retries, 1s/2s/4s, 10s timeout)
- **`verifyFlutterwaveWebhookSignature(payload, signature)`**: HMAC-SHA256 verification using `FLUTTERWAVE_WEBHOOK_HASH` env var
- **`refundFlutterwaveTransaction(transactionId, amount?)`**: Refund endpoint with mock fallback
- **`isFlutterwaveHealthy()`**: Health check pinging `/transactions?perPage=1` with 5s timeout
- **`FlutterwaveError`** class with `[Flutterwave]` prefix
- **`flutterwaveFetch<T>()`**: Shared fetch wrapper
- Mock fallback preserved

### 3. `src/lib/payments/monnify.ts` (91 → 429 lines)
- Same retry + timeout pattern (3 retries, 1s/2s/4s, 10s timeout)
- **Token caching fix**: `TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000` — token refreshed 2 minutes before actual expiry
- **401 handling**: `monnifyFetch` detects 401, clears cached token, calls `getAccessToken(true)`, retries request once with new token
- **`verifyTransaction(reference)`**: New endpoint to verify Monnify transactions
- **`refundTransaction(transactionReference, amount?)`**: Refund endpoint (kobo → naira conversion) with mock fallback
- **`verifyMonnifyWebhookHash(payload, hash)`**: HMAC-SHA512 hash verification
- **`isMonnifyHealthy()`**: Health check pinging `/banks` with 5s timeout
- **`MonnifyError`** class with `[Monnify]` prefix
- **`monnifyFetch<T>()`**: Shared fetch wrapper with 401 auto-refresh retry
- `isTokenValid()` helper for proactive token refresh
- Token refresh graceful fallback: if refresh fails, uses stale token if available

### 4. `src/lib/payments/bnpl.ts` (35 → 261 lines)
- **Creddit BNPL provider stub** (`initiateCredditBNPL`): Full HTTP client with 10s timeout, proper error handling, `CREDDIT_API_KEY` env var
- **Carbon BNPL provider stub** (`initiateCarbonBNPL`): Same pattern, `CARBON_API_KEY` env var
- **`calculateInstallmentPlan(amount, installments, interestRate)`**: Returns totalAmount, perInstallment, interestAmount, principalAmount, and full schedule with dates
- **`calculateLateFee(amount, daysLate, ratePerWeek=0.015, maxCap=0.15)`**: 1.5%/week late fee, 15% cap, ceiling-based weeks
- **Provider fallback chain**: Creddit → Carbon → Mock (`initiateBNPL` tries each in order)
- **`BNPLProvider`** type: `'creddit' | 'carbon' | 'mock'`
- Mock fallback preserved (returns same shape as original)

### 5. `src/app/api/payments/callback/route.ts` (64 → 305 lines)
- **POST handler** for payment gateway webhooks:
  - **Paystack**: reads `x-paystack-signature` header, verifies via `verifyPaystackWebhookSignature`, processes `charge.success` events
  - **Flutterwave**: reads `verif-hash` header, verifies via `verifyFlutterwaveWebhookSignature`, processes successful payments
  - **Monnify**: reads `monnify-signature` header, verifies via `verifyMonnifyWebhookHash`, processes `SUCCESSFUL_TRANSACTION` events
  - On successful verification: finds Payment by reference, updates status to 'success', updates linked Order to 'Confirmed' with progress 10, sends notification via `sendOrderNotification`
  - **Idempotent**: checks if payment already `success` — returns `{ status: 'already_processed' }`
  - Returns 400 for invalid signatures, 200 for valid webhooks
  - Notification failures are caught and logged but don't break the flow
  - Webhook events are logged via structured JSON `console.log`
- **GET handler** preserved for redirect-based payment flows (Paystack/Flutterwave redirect)
  - Added idempotent check (already success → redirect directly)
  - Added notification sending on success
  - Notification failures caught and logged

### 6. `src/lib/payments/index.ts` (175 → 199 lines)
- Added imports for all new functions from each provider
- **Re-exports**: `verifyPaystackWebhookSignature`, `isPaystackHealthy`, `paystackRefund`, `verifyFlutterwaveWebhookSignature`, `isFlutterwaveHealthy`, `flutterwaveRefund`, `verifyMonnifyWebhookHash`, `isMonnifyHealthy`, `monnifyVerify`, `monnifyRefund`, `calculateInstallmentPlan`, `calculateLateFee`
- **`checkAllPaymentProviders()`**: Runs all 3 health checks in parallel via `Promise.allSettled`, returns `{ paystack, flutterwave, monnify }` booleans

## Lint Result
0 errors, 4 warnings (all pre-existing — fonts in layout.tsx, unused eslint-disable in VoiceShoppingModal.tsx)

## Dev Server
Running successfully on port 3000, no compilation errors.
