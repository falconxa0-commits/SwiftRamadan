/**
 * Users Service unit tests.
 *
 * Locks in the contract documented in `src/services/users/users.service.ts`:
 *  - `getUserById` returns the public-safe user (via `publicUserFields`) or
 *    `null` if the user doesn't exist.
 *  - `updateProfile` ONLY writes fields in `PROFILE_ALLOWED_FIELDS`. The
 *    server-authoritative fields (`role`, `password`, `hasanatPoints`,
 *    `swiftPoints`, `loyaltyTier`) are silently dropped — the caller cannot
 *    escalate or overwrite them via this code path.
 *  - `updateProfile` throws `USER_NOT_FOUND` / `NO_FIELDS` appropriately.
 *  - `getUserWalletBalance` returns the balance or `null`.
 *  - `getUserStats` aggregates order count + total spent + total paid + review
 *    count + last order timestamp, and returns `null` for a missing user.
 *  - `softDeleteUser` is a placeholder that always returns `false` (the schema
 *    currently uses `onDelete: Restrict` for financial records — see the
 *    service JSDoc).
 *
 * Mock strategy: replace `@/lib/db` with a stubbed Prisma client. The real
 * `publicUserFields` and `PROFILE_ALLOWED_FIELDS` from `@/lib/profile-update`
 * are used unmodified — they're pure functions and we WANT to assert that the
 * service's allowed-fields list strips `role` / `password`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { db } = vi.hoisted(() => {
  const db = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    review: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    walletTransaction: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { db };
});

vi.mock('@/lib/db', () => ({ db }));

import {
  getUserById,
  updateProfile,
  getUserWalletBalance,
  getUserStats,
  softDeleteUser,
} from '@/services/users/users.service';

// Minimal user shape used across tests. `publicUserFields` requires `id`
// and a handful of optional fields; we provide all the optional ones so the
// resulting PublicUser is fully populated and the assertions are tight.
function mockUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    phone: '+2348000000000',
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
    referralCode: 'SWIFT-ABC123',
    hasanatPoints: 50,
    swiftPoints: 100,
    loyaltyTier: 'bronze',
    walletBalance: 7500,
    password: 'hashed-secret',
    ...overrides,
  };
}

describe('users.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserById', () => {
    it('returns the public-safe user (with financial fields visible to the owner)', async () => {
      db.user.findUnique.mockResolvedValue(mockUser());

      const result = await getUserById('u1');

      expect(result?.id).toBe('u1');
      expect(result?.name).toBe('Ada');
      // Owner sees financial/loyalty fields (requesterId === user.id).
      expect(result).toHaveProperty('hasanatPoints', 50);
      expect(result).toHaveProperty('swiftPoints', 100);
      expect(result).toHaveProperty('loyaltyTier', 'bronze');
      // Password is NEVER exposed.
      expect(result).not.toHaveProperty('password');
      expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('returns null for a non-existent user (does not throw)', async () => {
      db.user.findUnique.mockResolvedValue(null);
      const result = await getUserById('ghost');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('updates allowed fields (name, phone, area) and returns the updated public user', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      db.user.update.mockResolvedValue(mockUser({ name: 'Updated', phone: '+234999', area: 'Abuja' }));

      const result = await updateProfile('u1', { name: 'Updated', phone: '+234999', area: 'Abuja' });

      expect(result.name).toBe('Updated');
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { name: 'Updated', phone: '+234999', area: 'Abuja' },
      });
    });

    it('does NOT update role even when the caller tries to pass it', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      db.user.update.mockResolvedValue(mockUser({ role: 'customer' }));

      await updateProfile('u1', { role: 'admin', name: 'Hacker' } as unknown as Record<string, unknown>);

      // The data passed to Prisma must NOT contain a `role` key — the
      // allowed-fields filter silently drops it.
      const arg = db.user.update.mock.calls[0][0] as { where: unknown; data: Record<string, unknown> };
      expect(arg.data).not.toHaveProperty('role');
      expect(arg.data).toEqual({ name: 'Hacker' });
    });

    it('does NOT update password even when the caller tries to pass it', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      db.user.update.mockResolvedValue(mockUser());

      await updateProfile('u1', { password: 'pwned', name: 'Attacker' } as unknown as Record<string, unknown>);

      const arg = db.user.update.mock.calls[0][0] as { where: unknown; data: Record<string, unknown> };
      expect(arg.data).not.toHaveProperty('password');
      expect(arg.data).toEqual({ name: 'Attacker' });
    });

    it('throws USER_NOT_FOUND when the user does not exist', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(updateProfile('ghost', { name: 'X' })).rejects.toThrow('USER_NOT_FOUND');
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('throws NO_FIELDS when no allowed fields are provided', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      // Only blocked fields provided — nothing survives the filter.
      await expect(
        updateProfile('u1', { role: 'admin', hasanatPoints: 999 } as unknown as Record<string, unknown>),
      ).rejects.toThrow('NO_FIELDS');
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserWalletBalance', () => {
    it('returns the wallet balance for an existing user', async () => {
      db.user.findUnique.mockResolvedValue({ walletBalance: 12345 });
      const result = await getUserWalletBalance('u1');
      expect(result).toBe(12345);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: { walletBalance: true },
      });
    });

    it('returns null for a non-existent user', async () => {
      db.user.findUnique.mockResolvedValue(null);
      const result = await getUserWalletBalance('ghost');
      expect(result).toBeNull();
    });
  });

  describe('getUserStats', () => {
    it('returns orderCount, totalSpent, totalPaid, reviewCount, and lastOrderAt', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      const order1Date = new Date('2024-03-10T10:00:00Z');
      const order2Date = new Date('2024-03-15T18:30:00Z');
      db.order.findMany.mockResolvedValue([
        { total: 5000, createdAt: order1Date },
        { total: 3000, createdAt: order2Date },
      ]);
      db.payment.findMany.mockResolvedValue([{ amount: 5000 }, { amount: 2500 }]);
      db.review.count.mockResolvedValue(7);

      const result = await getUserStats('u1');

      expect(result).not.toBeNull();
      expect(result?.orderCount).toBe(2);
      expect(result?.totalSpent).toBe(8000); // 5000 + 3000
      expect(result?.totalPaid).toBe(7500); // 5000 + 2500 (only successful payments)
      expect(result?.reviewCount).toBe(7);
      expect(result?.lastOrderAt).toBe(order2Date.toISOString()); // most recent
      expect(db.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        select: { total: true, createdAt: true },
      });
      expect(db.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', status: 'success' },
        select: { amount: true },
      });
      expect(db.review.count).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });

    it('returns null when the user does not exist', async () => {
      db.user.findUnique.mockResolvedValue(null);
      const result = await getUserStats('ghost');
      expect(result).toBeNull();
      expect(db.order.findMany).not.toHaveBeenCalled();
    });

    it('returns lastOrderAt=null when the user has no orders', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      db.order.findMany.mockResolvedValue([]);
      db.payment.findMany.mockResolvedValue([]);
      db.review.count.mockResolvedValue(0);

      const result = await getUserStats('u1');
      expect(result?.orderCount).toBe(0);
      expect(result?.totalSpent).toBe(0);
      expect(result?.totalPaid).toBe(0);
      expect(result?.reviewCount).toBe(0);
      expect(result?.lastOrderAt).toBeNull();
    });
  });

  describe('softDeleteUser', () => {
    it('returns false (placeholder — see JSDoc for the schema migration required)', async () => {
      const result = await softDeleteUser('u1');
      expect(result).toBe(false);
      // The placeholder must NOT touch the DB yet — schema uses
      // onDelete: Restrict for financial records (audit H1).
      expect(db.user.update).not.toHaveBeenCalled();
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
