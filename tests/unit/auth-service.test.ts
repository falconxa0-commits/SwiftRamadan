/**
 * Auth Service unit tests.
 *
 * Locks in the contract documented in `src/services/auth/auth.service.ts`:
 *  - `loginUser` NEVER auto-creates accounts (audit B2). Returns `null` on
 *    unknown email, invalid email format, or wrong password. For real
 *    accounts, validates against bcrypt (or legacy plaintext). For demo
 *    accounts (empty password), requires a recent OTP verification.
 *  - `signupCustomer` ALWAYS assigns role `customer` (audit B2) — the
 *    client-supplied role, if any, is ignored. Vendor/rider require admin
 *    approval via `switchRole`.
 *  - `verifyOtp` returns the user (PublicUser) on a valid code, or `null`
 *    on invalid / expired / reused.
 *  - `switchRole` allows a customer downgrade (any requester) but rejects
 *    upgrades to vendor/rider unless the requester is an admin. Rejects
 *    `admin` as a target role entirely.
 *
 * Mock strategy:
 *  - `@/lib/db` — stubbed Prisma client (same pattern as the other service
 *    tests).
 *  - `bcryptjs` — stubbed `compare` and `hash` so tests are deterministic
 *    and don't pay the bcrypt cost factor (12 rounds) per call.
 *  - `@/lib/auth-jwt` — stubbed `createSessionToken` so we don't depend on
 *    the Web Crypto API + APP_SECRET env var.
 *  - `@/lib/otp-store` — stubbed so we can control OTP verification and the
 *    `isEmailVerifiedAsync` gate for demo logins.
 *  - `@/lib/profile-update` is left un-mocked — `publicUserFields` is a pure
 *    function and we want the test to assert that the service composes
 *    correctly with the real one (e.g. password is stripped, role is the
 *    value we set).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { db, bcryptCompare, bcryptHash, createSessionToken, generateOtp, setOtpAsync, verifyOtpAsync, isEmailVerifiedAsync, clearVerifiedAsync, clearOtpAsync } = vi.hoisted(() => {
  const db = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    order: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    payment: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    review: { findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  };
  return {
    db,
    bcryptCompare: vi.fn(),
    bcryptHash: vi.fn(),
    createSessionToken: vi.fn(),
    generateOtp: vi.fn(),
    setOtpAsync: vi.fn(),
    verifyOtpAsync: vi.fn(),
    isEmailVerifiedAsync: vi.fn(),
    clearVerifiedAsync: vi.fn(),
    clearOtpAsync: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db }));
vi.mock('bcryptjs', () => ({
  compare: bcryptCompare,
  hash: bcryptHash,
  default: { compare: bcryptCompare, hash: bcryptHash },
}));
vi.mock('@/lib/auth-jwt', () => ({ createSessionToken }));
vi.mock('@/lib/otp-store', () => ({
  generateOtp,
  setOtpAsync,
  verifyOtpAsync,
  isEmailVerifiedAsync,
  clearVerifiedAsync,
  clearOtpAsync,
  setOtp: vi.fn(),
  verifyOtp: vi.fn(),
  clearOtp: vi.fn(),
  isEmailVerified: vi.fn(),
  clearVerified: vi.fn(),
}));

import { loginUser, signupCustomer, verifyOtp, switchRole } from '@/services/auth/auth.service';

// Build a full User row that `publicUserFields` accepts.
function mockUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    phone: '+2348000000000',
    password: '', // demo account by default
    role: 'customer',
    area: 'Lagos',
    avatar: '',
    onboardingComplete: true,
    storeName: null,
    businessCategory: null,
    businessAddress: null,
    bankName: null,
    accountNumber: null,
    openTime: '08:00',
    closeTime: '22:00',
    vehicleType: null,
    plateNumber: null,
    licenseNumber: null,
    vehicleColor: null,
    riderBankName: null,
    riderAccountNumber: null,
    dailyStreak: 0,
    riderOnline: false,
    vendorOnline: false,
    referralCode: 'SWIFT-ABC',
    hasanatPoints: 0,
    swiftPoints: 0,
    loyaltyTier: 'bronze',
    ...overrides,
  };
}

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Sensible default: createSessionToken resolves to a fixed string.
    createSessionToken.mockResolvedValue('jwt-token-stub');
  });

  describe('loginUser', () => {
    it('returns the user + token on valid bcrypt credentials', async () => {
      const user = mockUser({ password: '$2a$12$hashedsecret' });
      db.user.findUnique.mockResolvedValue(user);
      bcryptCompare.mockResolvedValue(true);

      const result = await loginUser('ada@example.com', 'correct-password');

      expect(result).not.toBeNull();
      expect(result?.user.email).toBe('ada@example.com');
      expect(result?.demoAccount).toBe(false);
      expect(bcryptCompare).toHaveBeenCalledWith('correct-password', '$2a$12$hashedsecret');
      expect(createSessionToken).toHaveBeenCalledOnce();
    });

    it('returns null on an invalid email format (does not throw)', async () => {
      // No DB call should be made for malformed emails.
      const result = await loginUser('not-an-email', 'pass');
      expect(result).toBeNull();
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns null on an invalid password for a real account', async () => {
      db.user.findUnique.mockResolvedValue(mockUser({ password: '$2a$12$hashedsecret' }));
      bcryptCompare.mockResolvedValue(false);

      const result = await loginUser('ada@example.com', 'wrong-password');

      expect(result).toBeNull();
      expect(createSessionToken).not.toHaveBeenCalled();
    });

    it('returns null for an unknown email and does NOT auto-create an account (audit B2)', async () => {
      db.user.findUnique.mockResolvedValue(null);

      const result = await loginUser('nobody@example.com', 'pass');

      expect(result).toBeNull();
      // The login path must not call `db.user.create` — there is no
      // sign-in-with-email-and-auto-provision flow.
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it('returns null for a demo account when the email has NOT been recently OTP-verified', async () => {
      db.user.findUnique.mockResolvedValue(mockUser({ password: '' })); // demo
      isEmailVerifiedAsync.mockResolvedValue(false);

      const result = await loginUser('ada@example.com', 'ignored');

      expect(result).toBeNull();
      expect(isEmailVerifiedAsync).toHaveBeenCalledWith('ada@example.com');
    });

    it('logs in a demo account when the email was recently OTP-verified', async () => {
      db.user.findUnique.mockResolvedValue(mockUser({ password: '' })); // demo
      isEmailVerifiedAsync.mockResolvedValue(true);

      const result = await loginUser('ada@example.com', '');

      expect(result).not.toBeNull();
      expect(result?.demoAccount).toBe(true);
    });
  });

  describe('signupCustomer', () => {
    it('creates a customer account (role is hardcoded to "customer")', async () => {
      db.user.findUnique.mockResolvedValue(null); // no existing user
      bcryptHash.mockResolvedValue('$2a$12$hashed');
      db.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...mockUser(),
        ...data,
        id: 'new-user',
      }));
      generateOtp.mockReturnValue('123456');

      const result = await signupCustomer({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
      });

      expect(result.user.role).toBe('customer');
      expect(result.otpCode).toBe('123456');
      // The persisted row must have role: 'customer' regardless of the input.
      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: 'customer', email: 'ada@example.com' }),
      });
    });

    it('does NOT accept a vendor role from the client (role is forced to customer)', async () => {
      db.user.findUnique.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('$2a$12$hashed');
      db.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...mockUser(),
        ...data,
      }));

      // The SignupCustomerInput type doesn't have a `role` field — we cast to
      // simulate a malicious/legacy client smuggling one in.
      await signupCustomer({
        name: 'Mal',
        email: 'mal@example.com',
        password: 'secret',
        // @ts-expect-error — role is not a valid SignupCustomerInput field
        role: 'vendor',
      });

      const createData = db.user.create.mock.calls[0][0].data as Record<string, unknown>;
      expect(createData.role).toBe('customer'); // not 'vendor'
    });

    it('does NOT accept a rider role from the client (role is forced to customer)', async () => {
      db.user.findUnique.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('$2a$12$hashed');
      db.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...mockUser(),
        ...data,
      }));

      await signupCustomer({
        name: 'Ry',
        email: 'ry@example.com',
        password: 'secret',
        // @ts-expect-error — role is not a valid SignupCustomerInput field
        role: 'rider',
      });

      const createData = db.user.create.mock.calls[0][0].data as Record<string, unknown>;
      expect(createData.role).toBe('customer'); // not 'rider'
    });

    it('throws EMAIL_TAKEN when the email is already registered', async () => {
      db.user.findUnique.mockResolvedValue(mockUser());

      await expect(
        signupCustomer({ name: 'Ada', email: 'ada@example.com', password: 'secret' }),
      ).rejects.toThrow('EMAIL_TAKEN');
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it('throws NAME_AND_EMAIL_REQUIRED when name or email is missing', async () => {
      await expect(
        // @ts-expect-error — missing required fields on purpose
        signupCustomer({ email: 'ada@example.com' }),
      ).rejects.toThrow('NAME_AND_EMAIL_REQUIRED');
      await expect(
        // @ts-expect-error — missing required field on purpose
        signupCustomer({ name: 'Ada' }),
      ).rejects.toThrow('NAME_AND_EMAIL_REQUIRED');
    });
  });

  describe('verifyOtp', () => {
    it('returns the user (PublicUser) on a valid OTP code', async () => {
      verifyOtpAsync.mockResolvedValue(true);
      db.user.findUnique.mockResolvedValue(mockUser());

      const result = await verifyOtp('ada@example.com', '123456');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('ada@example.com');
      // Password is stripped by publicUserFields — never exposed.
      expect(result).not.toHaveProperty('password');
      expect(verifyOtpAsync).toHaveBeenCalledWith('ada@example.com', '123456');
    });

    it('returns null on an invalid / expired / reused OTP code', async () => {
      verifyOtpAsync.mockResolvedValue(false);
      const result = await verifyOtp('ada@example.com', 'wrong');
      expect(result).toBeNull();
      // On an invalid code, the service must NOT look up the user.
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('switchRole', () => {
    it('allows a customer downgrade (any non-admin requester can downgrade themselves)', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      db.user.update.mockResolvedValue(mockUser({ role: 'customer' }));

      const result = await switchRole('u1', 'customer', 'customer');

      expect(result.role).toBe('customer');
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { role: 'customer' },
      });
    });

    it('throws FORBIDDEN when a non-admin requester tries to upgrade to vendor', async () => {
      // No DB lookups should happen on a FORBIDDEN path.
      await expect(switchRole('u1', 'vendor', 'customer')).rejects.toThrow('FORBIDDEN');
      expect(db.user.findUnique).not.toHaveBeenCalled();
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when a non-admin requester tries to upgrade to rider', async () => {
      await expect(switchRole('u1', 'rider', 'customer')).rejects.toThrow('FORBIDDEN');
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('allows an admin requester to upgrade a user to vendor', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      db.user.update.mockResolvedValue(mockUser({ role: 'vendor' }));

      const result = await switchRole('u1', 'vendor', 'admin');

      expect(result.role).toBe('vendor');
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { role: 'vendor' },
      });
    });

    it('throws USER_NOT_FOUND when the target user does not exist', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(switchRole('ghost', 'vendor', 'admin')).rejects.toThrow('USER_NOT_FOUND');
    });

    it('throws INVALID_ROLE when newRole is "admin" (admin is set via DB only)', async () => {
      // The type signature prevents `admin` from being passed, but the
      // service defensively checks at runtime — cast to test the runtime path.
      await expect(
        switchRole('u1', 'admin' as 'customer', 'admin'),
      ).rejects.toThrow('INVALID_ROLE');
    });
  });
});
