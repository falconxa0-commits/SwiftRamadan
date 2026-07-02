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
import { hashPassword, verifyPassword } from '@/lib/auth-utils';
import { setSessionCookie, clearSessionCookie } from '@/lib/session';
import { sendOTP } from '@/lib/communications';
import { filterProfileFields, PROFILE_BLOCKED_FIELDS, publicUserFields } from '@/lib/profile-update';

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

        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          return NextResponse.json(
            { success: false, message: 'No account found with this email' },
            { status: 404 },
          );
        }

        const hasRealPassword = typeof user.password === 'string' && user.password.length > 0;

        if (hasRealPassword) {
          // Real password account — require a matching password.
          if (typeof password !== 'string' || password.length === 0) {
            return NextResponse.json(
              { success: false, message: 'Password is required' },
              { status: 401 },
            );
          }
          // Use bcrypt comparison with legacy plain-text fallback
          const isValid = await verifyPassword(password, user.password);
          if (!isValid) {
            return NextResponse.json(
              { success: false, message: 'Incorrect password' },
              { status: 401 },
            );
          }
        } else {
          // Demo account (empty password in DB) — require a recent OTP
          // verification for this email, otherwise anyone could log in.
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

        const token = `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const response = NextResponse.json({
          success: true,
          message: 'Login successful',
          user: publicUserFields(user),
          token,
        });
        await setSessionCookie(response, { userId: user.id, email: user.email, role: user.role });
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

        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json(
            { success: false, message: 'An account with this email already exists' },
            { status: 409 },
          );
        }

        // Hash password with bcrypt before storing
        const hashedPassword = password ? await hashPassword(password) : '';

        const user = await db.user.create({
          data: {
            name,
            email,
            phone: phone || '',
            password: hashedPassword,
            role: role || 'customer',
            area: area || '',
            avatar: avatar || '',
            storeName: storeName || null,
            businessCategory: businessCategory || null,
            businessAddress: businessAddress || null,
            bankName: bankName || null,
            accountNumber: accountNumber || null,
            openTime: openTime || '08:00',
            closeTime: closeTime || '22:00',
            vehicleType: vehicleType || null,
            plateNumber: plateNumber || null,
            licenseNumber: licenseNumber || null,
            vehicleColor: vehicleColor || null,
            riderBankName: riderBankName || null,
            riderAccountNumber: riderAccountNumber || null,
          },
        });

        // Issue an OTP for the newly-created account so the subsequent
        // verify-otp call has something to verify against. Returned in the
        // response for demo purposes (in production it would be sent via SMS).
        const otpCode = generateOtp();
        await setOtpAsync(email, otpCode);
        // A brand-new account is not "verified" yet.
        await clearVerifiedAsync(email);

        // Try to send the OTP via SMS + Email (graceful degradation)
        try {
          await sendOTP({
            email,
            phone: phone || undefined,
            code: otpCode,
            name,
          });
        } catch (err) {
          // Don't fail the auth flow if notification sending fails
          console.error('[Auth] OTP notification error:', err);
        }

        const token = `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const signupResponse = NextResponse.json({
          success: true,
          message: 'Account created. Please verify your phone number.',
          // Demo only: expose the code so the caller (test/dev tooling) can
          // complete verification. Remove this field in production.
          otp: otpCode,
          user: publicUserFields(user),
          token,
        });
        await setSessionCookie(signupResponse, { userId: user.id, email: user.email, role: user.role });
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

        // Try to send the OTP via SMS + Email (graceful degradation)
        try {
          const otpUser = await db.user.findUnique({ where: { email: lookupEmail } });
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

        return NextResponse.json({
          success: true,
          message: 'OTP sent',
          // Demo only: return the code so the caller can read it. In
          // production this would be delivered out-of-band (SMS).
          code,
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
