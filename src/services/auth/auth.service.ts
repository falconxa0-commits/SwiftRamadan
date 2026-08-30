/**
 * Auth Service — encapsulates authentication business logic for SwiftRamadan.
 *
 * This service layer sits between the API routes (`/api/auth`, `/api/user`) and
 * the lower-level primitives (`@/lib/db`, `@/lib/auth-jwt`, `@/lib/session`,
 * `@/lib/otp-store`). It owns the rules:
 *
 *   - Login NEVER auto-creates accounts (audit B2).
 *   - Signup ALWAYS creates a `customer` role (audit B2) — vendor/rider require
 *     admin approval via {@link switchRole}.
 *   - Role upgrades require `admin` requester; downgrades to `customer` are
 *     allowed for any non-admin user (audit B2/B3).
 *
 * Routes remain responsible for HTTP concerns (cookies, status codes,
 * rate-limiting); services own data shape and invariants.
 *
 * @module services/auth
 */

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSessionToken } from '@/lib/auth-jwt';
import {
  generateOtp,
  setOtpAsync,
  verifyOtpAsync,
  isEmailVerifiedAsync,
  clearVerifiedAsync,
  clearOtpAsync,
} from '@/lib/otp-store';
import { publicUserFields } from '@/lib/profile-update';

/** Roles a user can hold. `admin` is reserved (set via DB seed/script). */
export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin';

/** Public-safe user representation (no password, no sensitive fields). */
export type PublicUser = ReturnType<typeof publicUserFields>;

/** Result of a successful login. */
export interface LoginResult {
  user: PublicUser;
  token: string;
  /** True if the login was for a demo account (no password in DB). */
  demoAccount: boolean;
}

/** Input for {@link signupCustomer}. All vendor/rider fields are stored on the
 *  User record for the application flow but the role is ALWAYS `customer`. */
export interface SignupCustomerInput {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  area?: string;
  avatar?: string;
  storeName?: string;
  businessCategory?: string;
  businessAddress?: string;
  bankName?: string;
  accountNumber?: string;
  openTime?: string;
  closeTime?: string;
  vehicleType?: string;
  plateNumber?: string;
  licenseNumber?: string;
  vehicleColor?: string;
  riderBankName?: string;
  riderAccountNumber?: string;
}

/** Result of a successful signup. */
export interface SignupResult {
  user: PublicUser;
  token: string;
  /** 6-digit OTP code generated for the new account — caller dispatches it. */
  otpCode: string;
}

/** bcrypt cost factor — matches `@/lib/auth-utils` (12 rounds). */
const SALT_ROUNDS = 12;

/** Simple email format check used for early validation. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Generate the legacy opaque session reference (kept for parity with existing
 *  client code that reads `token` from the auth response). The actual session
 *  is the JWT cookie set by the caller via `setSessionCookie`. */
function generateOpaqueToken(): string {
  return `sr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Login a user by email + password.
 *
 * Rules:
 *   - NEVER auto-creates an account (audit B2). Returns `null` if no user.
 *   - For real (bcrypt) passwords: verifies with `bcrypt.compare`.
 *   - For demo accounts (empty password in DB): requires a recent OTP
 *     verification via {@link isEmailVerifiedAsync}.
 *
 * @returns `LoginResult` on success, `null` on invalid credentials / unknown user.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResult | null> {
  if (!email || !EMAIL_RE.test(email)) return null;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;

  const hasRealPassword = typeof user.password === 'string' && user.password.length > 0;

  if (hasRealPassword) {
    // Real account — require a matching password.
    if (typeof password !== 'string' || password.length === 0) return null;
    // Support legacy plaintext (stored hash doesn't start with $2) AND bcrypt.
    const isMatch = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : password === user.password;
    if (!isMatch) return null;
  } else {
    // Demo account — require recent OTP verification for this email.
    if (!(await isEmailVerifiedAsync(email))) return null;
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: publicUserFields(user, user.id),
    token: generateOpaqueToken(),
    demoAccount: !hasRealPassword,
  };
}

/**
 * Sign up a new customer account. ALWAYS assigns role `customer` (audit B2).
 *
 * The client-supplied role (if any) is ignored — vendor/rider require admin
 * approval via {@link switchRole}. Vendor/rider fields are still persisted so
 * the user can submit an application; the role is just kept at `customer`
 * until an admin upgrades them.
 *
 * @throws {Error} with `message === 'EMAIL_TAKEN'` if the email is already in use.
 */
export async function signupCustomer(data: SignupCustomerInput): Promise<SignupResult> {
  const { name, email } = data;
  if (!name || !email) throw new Error('NAME_AND_EMAIL_REQUIRED');
  if (!EMAIL_RE.test(email)) throw new Error('INVALID_EMAIL');

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_TAKEN');

  const hashedPassword = data.password ? await bcrypt.hash(data.password, SALT_ROUNDS) : '';

  // SECURITY: role is hardcoded to 'customer' — vendor/rider require admin
  // approval via the switchRole flow. The client cannot self-escalate (audit B2).
  const user = await db.user.create({
    data: {
      name,
      email,
      phone: data.phone || '',
      password: hashedPassword,
      role: 'customer',
      area: data.area || '',
      avatar: data.avatar || '',
      referralCode: `SWIFT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      storeName: data.storeName || null,
      businessCategory: data.businessCategory || null,
      businessAddress: data.businessAddress || null,
      bankName: data.bankName || null,
      accountNumber: data.accountNumber || null,
      openTime: data.openTime || '08:00',
      closeTime: data.closeTime || '22:00',
      vehicleType: data.vehicleType || null,
      plateNumber: data.plateNumber || null,
      licenseNumber: data.licenseNumber || null,
      vehicleColor: data.vehicleColor || null,
      riderBankName: data.riderBankName || null,
      riderAccountNumber: data.riderAccountNumber || null,
    },
  });

  // Issue a fresh OTP so the immediately-following verify-otp call has a code.
  const otpCode = generateOtp();
  await setOtpAsync(email, otpCode);
  await clearVerifiedAsync(email);

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: publicUserFields(user, user.id),
    token: generateOpaqueToken(),
    otpCode,
  };
}

/**
 * Verify an OTP code for `email`. Marks the email as verified for 10 minutes
 * (one-time use — the underlying store deletes the code on success).
 *
 * @returns The matching `PublicUser` if a User record exists for the email and
 *          the OTP was valid; `null` if the OTP was invalid/expired/reused.
 *          If the OTP is valid but no user exists yet (guest flow), returns
 *          `{ user: null, verified: true }` — but for type simplicity we return
 *          `null` in that case and the caller can re-fetch the user separately.
 */
export async function verifyOtp(
  email: string,
  code: string,
): Promise<PublicUser | null> {
  if (!email || !code) return null;

  const ok = await verifyOtpAsync(email, String(code));
  if (!ok) return null;

  // Mark the email as verified (handled inside verifyOtpAsync already, but we
  // expose the flag explicitly for caller convenience).
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  return publicUserFields(user, user.id);
}

/**
 * Switch a user's role with admin-approval enforcement (audit B2/B3).
 *
 * Rules:
 *   - `newRole === 'customer'`: any user can downgrade themselves.
 *   - `newRole === 'vendor' | 'rider'`: requires `requesterRole === 'admin'`.
 *   - `newRole === 'admin'`: REJECTED — admin is set via DB only.
 *
 * @throws {Error} `message === 'FORBIDDEN'` if the requester lacks permission.
 * @throws {Error} `message === 'USER_NOT_FOUND'` if the target user doesn't exist.
 * @throws {Error} `message === 'INVALID_ROLE'` if `newRole` is not customer/vendor/rider.
 */
export async function switchRole(
  userId: string,
  newRole: Exclude<UserRole, 'admin'>,
  requesterRole: string,
): Promise<PublicUser> {
  if (!['customer', 'vendor', 'rider'].includes(newRole)) {
    throw new Error('INVALID_ROLE');
  }

  // SECURITY: Upgrades to vendor/rider require admin approval. Only downgrade
  // to customer is allowed for non-admins (audit B2/B3).
  if (newRole !== 'customer' && requesterRole !== 'admin') {
    throw new Error('FORBIDDEN');
  }

  const existing = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) throw new Error('USER_NOT_FOUND');

  const updated = await db.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  return publicUserFields(updated, updated.id);
}

/**
 * Fetch a user's public fields by ID.
 *
 * @returns `PublicUser` if found, `null` otherwise. Password and other
 *          sensitive fields are stripped by `publicUserFields`.
 */
export async function getUserById(userId: string): Promise<PublicUser | null> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  // The second arg (`requesterId`) controls whether financial/loyalty fields
  // are included. Here we pass the same ID so the caller sees their own data.
  return publicUserFields(user, userId);
}

/**
 * Clear the verified-email flag and any pending OTP for `email`.
 * Useful on logout or password change to force re-verification next time.
 */
export async function clearAuthState(email: string): Promise<void> {
  await clearVerifiedAsync(email);
  await clearOtpAsync(email);
}
