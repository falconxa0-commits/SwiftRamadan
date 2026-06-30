# W3-INFRA — Infrastructure Integration Specialist

## Task: Integrate Redis (session/OTP/rate-limiting), CDN configuration, and CI/CD setup

## Work Completed

### 1. Installed @upstash/redis
- `bun add @upstash/redis` → installed v1.38.0
- Serverless Redis via REST API — no local Redis server needed

### 2. Created `/src/lib/redis.ts`
- Upstash Redis client with graceful degradation (returns null if env vars not configured)
- Session store helpers: `redisSet`, `redisGet`, `redisDel`
- OTP store: `storeOTP`, `getOTP`, `deleteOTP` — Redis-backed with TTL
- Rate limiting: `checkRedisRateLimit` — sliding window counter with fallback
- Verified email tracking: `markEmailVerified`, `isEmailVerifiedRedis`
- Cache helpers: `cacheGet`, `cacheSet`, `cacheInvalidate`

### 3. Updated `/src/lib/otp-store.ts`
- Added Redis as primary store with in-memory fallback
- New async functions: `setOtpAsync`, `verifyOtpAsync`, `clearOtpAsync`, `isEmailVerifiedAsync`, `clearVerifiedAsync`
- Existing sync functions preserved for backward compatibility
- All async functions try Redis first, fall back to in-memory Maps

### 4. Updated `/src/lib/rate-limit.ts`
- Changed `checkRateLimit` from sync to async (returns `Promise<Response | null>`)
- Added Redis rate limiting as first check via `checkRedisRateLimit`
- Falls through to in-memory rate limiting when Redis is not configured
- Updated all 19 API route files to add `await` to `checkRateLimit` calls

### 5. Updated `/src/app/api/auth/route.ts`
- Switched from sync OTP functions to async versions:
  - `setOtp` → `setOtpAsync` (with await)
  - `verifyOtp` → `verifyOtpAsync` (with await)
  - `isEmailVerified` → `isEmailVerifiedAsync` (with await)
  - `clearOtp` → `clearOtpAsync` (with await)
  - `clearVerified` → `clearVerifiedAsync` (with await)

### 6. Created `/src/lib/cdn.ts`
- CDN URL configuration via `NEXT_PUBLIC_CDN_URL` env var
- `cdnUrl()` helper for static assets
- `imageCdn()` with Cloudinary transformation support
- `isCdnConfigured()` helper

### 7. Created `/.github/workflows/ci.yml`
- 3-job CI pipeline: lint-and-type-check → build-check, security-audit
- Uses `oven-sh/setup-bun@v2`
- Runs lint, type check, build, and security audit

### 8. Created `/src/middleware.ts`
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy
- Content Security Policy allowing necessary origins (Aladhan API, Cloudinary, Upstash, etc.)
- HTTPS redirect in production via x-forwarded-proto header check
- Matcher excludes static assets and favicon

### 9. Lint Results
- 0 errors, 4 warnings (all pre-existing, none from our changes)
- Dev server running fine, no compilation errors
- Note: Next.js 16 shows deprecation warning for middleware.ts (suggests proxy.ts), but functionality works

## Key Design Decisions
- **Graceful degradation**: Redis/Upstash is optional — when env vars are not set, all Redis functions return false/null and the in-memory fallbacks are used
- **Backward compatibility**: Sync OTP functions still work; new async versions added alongside
- **Rate limiting dual-layer**: Redis checked first (shared across instances), then in-memory (single-server fallback)
