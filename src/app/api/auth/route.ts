import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, signupSchema } from '@/lib/validation';
import {
  generateOtp,
  setOtp,
  verifyOtp,
  clearOtp,
  isEmailVerified,
  clearVerified,
} from '@/lib/otp-store';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fields that update-profile is allowed to modify. `role`, `hasanatPoints`,
// `swiftPoints`, and `loyaltyTier` are intentionally excluded — they are
// server-authoritative (see S3 fix).
const PROFILE_ALLOWED_FIELDS = [
  'name', 'phone', 'area', 'avatar', 'onboardingComplete',
  'storeName', 'businessCategory', 'businessAddress',
  'bankName', 'accountNumber', 'openTime', 'closeTime',
  'vehicleType', 'plateNumber', 'licenseNumber', 'vehicleColor',
  'riderBankName', 'riderAccountNumber',
  'dailyStreak', 'riderOnline', 'vendorOnline',
] as const;

const PROFILE_BLOCKED_FIELDS = ['role', 'hasanatPoints', 'swiftPoints', 'loyaltyTier'] as const;

/** Shape of the user object returned to the client on login/signup/etc. */
function publicUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  area: string;
  avatar: string;
  onboardingComplete: boolean;
  storeName: string | null;
  businessCategory: string | null;
  businessAddress: string | null;
  bankName: string | null;
  accountNumber: string | null;
  openTime: string;
  closeTime: string;
  vehicleType: string | null;
  plateNumber: string | null;
  licenseNumber: string | null;
  vehicleColor: string | null;
  riderBankName: string | null;
  riderAccountNumber: string | null;
  hasanatPoints: number;
  swiftPoints: number;
  loyaltyTier: string;
  dailyStreak: number;
  riderOnline: boolean;
  vendorOnline: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    area: user.area,
    avatar: user.avatar,
    onboardingComplete: user.onboardingComplete,
    storeName: user.storeName,
    businessCategory: user.businessCategory,
    businessAddress: user.businessAddress,
    bankName: user.bankName,
    accountNumber: user.accountNumber,
    openTime: user.openTime,
    closeTime: user.closeTime,
    vehicleType: user.vehicleType,
    plateNumber: user.plateNumber,
    licenseNumber: user.licenseNumber,
    vehicleColor: user.vehicleColor,
    riderBankName: user.riderBankName,
    riderAccountNumber: user.riderAccountNumber,
    hasanatPoints: user.hasanatPoints,
    swiftPoints: user.swiftPoints,
    loyaltyTier: user.loyaltyTier,
    dailyStreak: user.dailyStreak,
    riderOnline: user.riderOnline,
    vendorOnline: user.vendorOnline,
  };
}

/* -------------------------------------------------------------------------- */
/* Route handler                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP (brute-force protection)
  const rateLimited = checkRateLimit(request, RATE_LIMITS.auth);
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
          if (user.password !== password) {
            return NextResponse.json(
              { success: false, message: 'Incorrect password' },
              { status: 401 },
            );
          }
        } else {
          // Demo account (empty password in DB) — require a recent OTP
          // verification for this email, otherwise anyone could log in.
          if (!isEmailVerified(email)) {
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

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: publicUser(user),
          token,
        });
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

        const user = await db.user.create({
          data: {
            name,
            email,
            phone: phone || '',
            password: password || '',
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
        setOtp(email, otpCode);
        // A brand-new account is not "verified" yet.
        clearVerified(email);

        const token = `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        return NextResponse.json({
          success: true,
          message: 'Account created. Please verify your phone number.',
          // Demo only: expose the code so the caller (test/dev tooling) can
          // complete verification. Remove this field in production.
          otp: otpCode,
          user: publicUser(user),
          token,
        });
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
        setOtp(lookupEmail, code);

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
        const ok = verifyOtp(lookupEmail, String(otp));
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

        return NextResponse.json({
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
          user: publicUser(user),
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

        // Require the caller to have verified this email via OTP in the last
        // 10 minutes. There's no JWT/session system, so the verified-email
        // flag is the closest thing to an auth token here.
        if (!isEmailVerified(email)) {
          return NextResponse.json(
            {
              success: false,
              message: 'OTP verification required to update profile. Verify your phone number first.',
            },
            { status: 401 },
          );
        }

        // Reject any attempt to change server-authoritative fields. `role`
        // is set only at signup/onboarding; the points/tier fields are
        // managed by the server (orders, redemptions, etc.).
        const attemptedBlocked = PROFILE_BLOCKED_FIELDS.filter(
          (f) => body[f] !== undefined,
        );
        if (attemptedBlocked.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot modify protected field(s): ${attemptedBlocked.join(', ')}. These are server-authoritative.`,
            },
            { status: 400 },
          );
        }

        const updateData: Record<string, unknown> = {};
        for (const field of PROFILE_ALLOWED_FIELDS) {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        }

        const user = await db.user.update({
          where: { email },
          data: updateData,
        });

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          user: publicUser(user),
        });
      }

      /* ------------------------------------------------------------------- */
      /* logout — optional convenience action                                */
      /* ------------------------------------------------------------------- */
      case 'logout': {
        // No server-side session to destroy; just clear the verified flag if
        // the caller provides an email so a fresh OTP is required for any
        // subsequent privileged action.
        if (typeof email === 'string' && email) {
          clearVerified(email);
          clearOtp(email);
        }
        return NextResponse.json({ success: true, message: 'Logged out' });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid action. Use login, signup, send-otp, verify-otp, get-user, update-profile, or logout.',
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
