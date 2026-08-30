import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, signupSchema } from '@/lib/validation';
import { captureException } from '@/lib/monitoring/sentry';
import {
  generateOtp,
  setOtpAsync,
  verifyOtpAsync,
  clearOtpAsync,
  isEmailVerifiedAsync,
  clearVerifiedAsync,
} from '@/lib/otp-store';
import { hashPassword } from '@/lib/auth-utils';
import { setSessionCookie, clearSessionCookie, getSessionUser } from '@/lib/session';
import { sendOTP } from '@/lib/communications';
import { enqueueEmail, enqueueSMS } from '@/lib/queues';
import { filterProfileFields, PROFILE_BLOCKED_FIELDS, publicUserFields } from '@/lib/profile-update';
import * as authService from '@/services/auth/auth.service';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* -------------------------------------------------------------------------- */
/* Route handler                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP (brute-force protection)
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.auth);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { action, email, phone, name, otp, password, role, area, avatar,
            storeName, businessCategory, businessAddress, bankName, accountNumber,
            openTime, closeTime, vehicleType, plateNumber, licenseNumber,
            vehicleColor, riderBankName, riderAccountNumber } = body;

    // Validate signup payload. The login flow uses context-dependent validation
    // (password may be absent for OTP-verified demo accounts) so it is validated
    // inline below instead of via loginSchema.
    if (action === 'signup') {
      const v = validateInput(signupSchema, { name, email, phone, password, role });
      if (!v.success) return v.response;
    }

    switch (action) {
      /* ------------------------------------------------------------------- */
      /* login — S2 fix                                                      */
      /* ------------------------------------------------------------------- */
      case 'login': {
        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
          return NextResponse.json(
            { success: false, message: 'A valid email is required' },
            { status: 400 },
          );
        }

        // MIGRATED (Phase 10): credential check + token generation delegated
        // to `authService.loginUser`. To preserve the route's specific error
        // messages (which the service collapses into a single `null`), we
        // pre-check the failure modes the service hides:
        //   1. User not found → "Invalid email or password" (matches prior).
        //   2. Demo account without recent OTP → "OTP verification required..."
        //      (matches prior; the service would otherwise return null here).
        //   3. Real account with missing password → "Password is required"
        //      (matches prior).
        // After these pre-checks, the service handles the bcrypt compare
        // (real account) and the demo-account-verified path, and issues the
        // JWT + opaque token.
        const existingUser = await db.user.findUnique({ where: { email } });
        if (!existingUser) {
          return NextResponse.json(
            { success: false, message: 'Invalid email or password' },
            { status: 401 },
          );
        }

        const hasRealPassword =
          typeof existingUser.password === 'string' && existingUser.password.length > 0;

        if (hasRealPassword) {
          if (typeof password !== 'string' || password.length === 0) {
            return NextResponse.json(
              { success: false, message: 'Password is required' },
              { status: 401 },
            );
          }
        } else {
          // Demo account — require recent OTP verification
          if (!(await isEmailVerifiedAsync(email))) {
            return NextResponse.json(
              {
                success: false,
                message: 'OTP verification required. Please verify your phone number first.',
              },
              { status: 401 },
            );
          }
        }

        // Pre-checks passed → delegate the actual credential verify + token
        // issuance to the service. The service re-fetches the user (one
        // redundant query — acceptable) and applies the same bcrypt/OTP
        // rules. Returns null only on wrong password (the other failure
        // modes are pre-checked above).
        const result = await authService.loginUser(email, password || '');
        if (!result) {
          return NextResponse.json(
            { success: false, message: 'Invalid email or password' },
            { status: 401 },
          );
        }

        const response = NextResponse.json({
          success: true,
          message: 'Login successful',
          user: result.user,
          token: result.token,
        });
        // `result.user` is a `PublicUser` whose fields are typed as `unknown`
        // (because `publicUserFields` accepts `Record<string, unknown>`); we
        // coerce the three fields the cookie needs to strings. The values
        // come from a freshly-fetched Prisma User row so they are guaranteed
        // to be strings at runtime.
        await setSessionCookie(response, {
          userId: String(result.user.id),
          email: String(result.user.email),
          role: String(result.user.role),
        });
        return response;
      }

      /* ------------------------------------------------------------------- */
      /* signup                                                              */
      /* ------------------------------------------------------------------- */
      case 'signup': {
        if (!name || !email) {
          return NextResponse.json(
            { success: false, message: 'Name and email are required' },
            { status: 400 },
          );
        }

        // MIGRATED (Phase 10): inline user creation (findUnique → check →
        // hashPassword → user.create → generateOtp → setOtpAsync →
        // clearVerifiedAsync) replaced with `authService.signupCustomer`,
        // which performs the same steps internally and returns a
        // `SignupResult` with the OTP code. The service ALWAYS assigns role
        // `customer` (audit B2 — vendor/rider require admin approval via
        // switchRole), matching the previous inline behaviour. The client-
        // supplied `role` field is IGNORED.
        //
        // The service does NOT send the OTP notification — that remains the
        // route's responsibility (graceful degradation: notification failure
        // must not fail the signup).
        let signupResult;
        try {
          signupResult = await authService.signupCustomer({
            name,
            email,
            phone,
            password,
            area,
            avatar,
            storeName,
            businessCategory,
            businessAddress,
            bankName,
            accountNumber,
            openTime,
            closeTime,
            vehicleType,
            plateNumber,
            licenseNumber,
            vehicleColor,
            riderBankName,
            riderAccountNumber,
          });
        } catch (err) {
          if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
            return NextResponse.json(
              { success: false, message: 'An account with this email already exists' },
              { status: 409 },
            );
          }
          if (err instanceof Error && err.message === 'INVALID_EMAIL') {
            return NextResponse.json(
              { success: false, message: 'A valid email is required' },
              { status: 400 },
            );
          }
          if (err instanceof Error && err.message === 'NAME_AND_EMAIL_REQUIRED') {
            return NextResponse.json(
              { success: false, message: 'Name and email are required' },
              { status: 400 },
            );
          }
          throw err;
        }

        // Try to send the OTP via SMS + Email (graceful degradation).
        // The service has already stored the OTP code; we just dispatch it.
        try {
          await sendOTP({
            email,
            phone: phone || undefined,
            code: signupResult.otpCode,
            name,
          });
        } catch (err) {
          // Don't fail the auth flow if notification sending fails
          console.error('[Auth] OTP notification error:', err);
        }

        // PHASE-10: also enqueue via BullMQ for durable, retry-able
        // delivery. The direct `sendOTP` above is the primary path; the
        // queue is a backup channel that survives a transient Resend /
        // Termii outage (the worker retries with exponential backoff —
        // see `src/lib/queues/processors.ts`). The enqueue helpers fail
        // open (no throw) when Redis is unavailable, so this is safe to
        // call unconditionally.
        try {
          await enqueueEmail({
            to: email,
            subject: 'Your SwiftRamadan OTP',
            html: `<p>Welcome to SwiftRamadan, ${name}!</p><p>Your verification code is <strong>${signupResult.otpCode}</strong>.</p><p>It expires in 5 minutes. If you didn't sign up, you can safely ignore this email.</p>`,
          });
          if (typeof phone === 'string' && phone) {
            await enqueueSMS({
              to: phone,
              message: `Your SwiftRamadan code is ${signupResult.otpCode}`,
            });
          }
        } catch (err) {
          console.error('[Auth] OTP queue enqueue error (signup):', err);
        }

        const signupResponse = NextResponse.json({
          success: true,
          message: 'Account created. Please verify your phone number.',
          user: signupResult.user,
          token: signupResult.token,
        });
        // Coerce `unknown`-typed PublicUser fields to strings for the cookie
        // (see the login case above for the same pattern).
        await setSessionCookie(signupResponse, {
          userId: String(signupResult.user.id),
          email: String(signupResult.user.email),
          role: String(signupResult.user.role),
        });
        return signupResponse;
      }

      /* ------------------------------------------------------------------- */
      /* send-otp — new action (S1 fix)                                      */
      /* ------------------------------------------------------------------- */
      case 'send-otp': {
        let lookupEmail: string | undefined = typeof email === 'string' ? email : undefined;
        // If only phone was provided, resolve the email from the DB so we can
        // key the OTP store by email (consistent with verify-otp).
        if (!lookupEmail && phone) {
          const u = await db.user.findFirst({ where: { phone: String(phone) } });
          if (u) lookupEmail = u.email;
        }
        if (!lookupEmail || !EMAIL_RE.test(lookupEmail)) {
          return NextResponse.json(
            { success: false, message: 'A valid email is required' },
            { status: 400 },
          );
        }

        const code = generateOtp();
        await setOtpAsync(lookupEmail, code);

        // Look up the user once — used both for the direct send (needs
        // `name` and the canonical `phone`) and the SMS enqueue below.
        const otpUser = await db.user.findUnique({ where: { email: lookupEmail } });

        // Try to send the OTP via SMS + Email (graceful degradation)
        try {
          if (otpUser) {
            await sendOTP({
              email: lookupEmail,
              phone: otpUser.phone || undefined,
              code,
              name: otpUser.name,
            });
          }
        } catch (err) {
          // Don't fail the auth flow if notification sending fails
          console.error('[Auth] OTP notification error (send-otp):', err);
        }

        // PHASE-10: also enqueue via BullMQ for durable, retry-able
        // delivery. The direct `sendOTP` above is the primary path; the
        // queue is a backup channel that survives a transient Resend /
        // Termii outage (the worker retries with exponential backoff —
        // see `src/lib/queues/processors.ts`). The enqueue helpers fail
        // open (no throw) when Redis is unavailable. SMS is enqueued only
        // when we have a phone — either from the user record or from the
        // request body (the latter covers demo-account flows where the
        // user row doesn't exist yet).
        try {
          await enqueueEmail({
            to: lookupEmail,
            subject: 'Your SwiftRamadan OTP',
            html: `<p>Your SwiftRamadan verification code is <strong>${code}</strong>.</p><p>It expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>`,
          });
          const phoneForSMS =
            otpUser?.phone ?? (typeof phone === 'string' && phone ? phone : undefined);
          if (phoneForSMS) {
            await enqueueSMS({
              to: String(phoneForSMS),
              message: `Your SwiftRamadan code is ${code}`,
            });
          }
        } catch (err) {
          console.error('[Auth] OTP queue enqueue error (send-otp):', err);
        }

        return NextResponse.json({
          success: true,
          message: 'OTP sent',
          expiresIn: 300, // seconds (5 min)
        });
      }

      /* ------------------------------------------------------------------- */
      /* verify-otp — S1 fix                                                 */
      /* ------------------------------------------------------------------- */
      case 'verify-otp': {
        if (!otp || !/^\d{6}$/.test(String(otp))) {
          return NextResponse.json(
            { success: false, message: 'OTP must be a 6-digit code' },
            { status: 400 },
          );
        }

        let lookupEmail: string | undefined = typeof email === 'string' ? email : undefined;
        if (!lookupEmail && phone) {
          const u = await db.user.findFirst({ where: { phone: String(phone) } });
          if (u) lookupEmail = u.email;
        }
        if (!lookupEmail) {
          return NextResponse.json(
            { success: false, message: 'Email (or a recognized phone) is required' },
            { status: 400 },
          );
        }

        // Verify against the in-memory store. One-time use: a successful
        // verification deletes the OTP so it can't be replayed.
        const ok = await verifyOtpAsync(lookupEmail, String(otp));
        if (!ok) {
          return NextResponse.json(
            {
              success: false,
              message: 'Invalid, expired, or already-used OTP. Request a new code and try again.',
            },
            { status: 401 },
          );
        }

        // Optionally include user info if the verified email belongs to a
        // real account (it may not — e.g. for guest OTP flows).
        const user = await db.user.findUnique({ where: { email: lookupEmail } });

        const verifyResponse = NextResponse.json({
          success: true,
          message: 'Phone number verified successfully',
          verified: true,
          ...(user
            ? {
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  onboardingComplete: user.onboardingComplete,
                },
              }
            : {}),
        });
        if (user) {
          await setSessionCookie(verifyResponse, { userId: user.id, email: user.email, role: user.role });
        }
        return verifyResponse;
      }

      /* ------------------------------------------------------------------- */
      /* get-user                                                            */
      /* ------------------------------------------------------------------- */
      case 'get-user': {
        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
          return NextResponse.json(
            { success: false, message: 'A valid email is required' },
            { status: 400 },
          );
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          user: publicUserFields(user),
        });
      }

      /* ------------------------------------------------------------------- */
      /* update-profile — S3 fix                                              */
      /* ------------------------------------------------------------------- */
      case 'update-profile': {
        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
          return NextResponse.json(
            { success: false, message: 'A valid email is required' },
            { status: 400 },
          );
        }

        // Require the caller to have verified this email via OTP
        if (!(await isEmailVerifiedAsync(email))) {
          return NextResponse.json(
            {
              success: false,
              message: 'OTP verification required to update profile. Verify your phone number first.',
            },
            { status: 401 },
          );
        }

        // Use shared profile update logic (M13 dedup)
        const { updateData, blockedAttempts } = filterProfileFields(body);

        if (blockedAttempts.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot modify protected field(s): ${blockedAttempts.join(', ')}. These are server-authoritative.`,
            },
            { status: 400 },
          );
        }

        // If a new password is provided, hash it before storing
        if (typeof body.password === 'string' && body.password.length > 0) {
          updateData.password = await hashPassword(body.password);
        }

        const user = await db.user.update({
          where: { email },
          data: updateData,
        });

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          user: publicUserFields(user),
        });
      }

      /* ------------------------------------------------------------------- */
      /* oauth — Google / Apple sign-in                                       */
      /* ------------------------------------------------------------------- */
      case 'oauth': {
        const { provider } = body;
        if (!provider || !['google', 'apple'].includes(provider)) {
          return NextResponse.json(
            { success: false, message: 'Invalid OAuth provider' },
            { status: 400 },
          );
        }
        // In production, this would redirect to the OAuth provider's consent screen.
        // For now, check if a user with the same email exists from a previous OAuth flow.
        // Return a helpful message that OAuth needs to be configured with real credentials.
        return NextResponse.json({
          success: false,
          message: `${provider} OAuth requires client credentials. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in your environment variables.`,
          provider,
        });
      }

      /* ------------------------------------------------------------------- */
      /* logout — optional convenience action                                */
      /* ------------------------------------------------------------------- */
      case 'logout': {
        // Clear server-side verified flag if the caller provides an email so
        // a fresh OTP is required for any subsequent privileged action.
        if (typeof email === 'string' && email) {
          await clearVerifiedAsync(email);
          await clearOtpAsync(email);
        }
        const logoutResponse = NextResponse.json({ success: true, message: 'Logged out' });
        clearSessionCookie(logoutResponse);
        return logoutResponse;
      }

      /* ------------------------------------------------------------------- */
      /* switch-role — update session with new role                          */
      /* ------------------------------------------------------------------- */
      case 'switch-role': {
        if (!role || !['customer', 'vendor', 'rider'].includes(role)) {
          return NextResponse.json(
            { success: false, message: 'Valid role is required (customer, vendor, rider)' },
            { status: 400 },
          );
        }

        const authUser = await getSessionUser(request);
        if (!authUser) {
          return NextResponse.json(
            { success: false, message: 'Authentication required' },
            { status: 401 },
          );
        }

        // MIGRATED (Phase 10 Alpha): inline role validation + admin-approval
        // check + `db.user.update` replaced with `authService.switchRole`,
        // which performs the same validation and update internally. The
        // service throws `FORBIDDEN` (non-admin upgrade to vendor/rider) /
        // `USER_NOT_FOUND` / `INVALID_ROLE` — mapped to HTTP responses
        // below. The admin-approval enforcement (audit B2/B3) is now
        // unified between this route and `/api/user` PUT switch-role (which
        // was also migrated to the same service in this phase, closing
        // the previous inconsistency where /api/user allowed non-admin
        // upgrades).
        let updatedUser;
        try {
          updatedUser = await authService.switchRole(
            authUser.userId,
            role as 'customer' | 'vendor' | 'rider',
            authUser.role,
          );
        } catch (err) {
          if (err instanceof Error && err.message === 'FORBIDDEN') {
            return NextResponse.json(
              {
                success: false,
                message:
                  'Role upgrade requires admin approval. Please submit a vendor/rider application via your profile settings.',
              },
              { status: 403 },
            );
          }
          if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
            return NextResponse.json(
              { success: false, message: 'User not found' },
              { status: 404 },
            );
          }
          if (err instanceof Error && err.message === 'INVALID_ROLE') {
            return NextResponse.json(
              { success: false, message: 'Valid role is required (customer, vendor, rider)' },
              { status: 400 },
            );
          }
          throw err;
        }

        // Issue new session cookie with updated role
        const switchResponse = NextResponse.json({
          success: true,
          message: 'Role switched',
          user: updatedUser,
        });
        await setSessionCookie(switchResponse, {
          userId: String(updatedUser.id),
          email: String(updatedUser.email),
          role: String(updatedUser.role),
        });
        return switchResponse;
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid action. Use login, signup, send-otp, verify-otp, get-user, update-profile, oauth, or logout.',
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/auth' } });
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
