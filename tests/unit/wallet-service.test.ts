/**
 * Wallet Service unit tests.
 *
 * Locks in the contract documented in `src/services/wallet/wallet.service.ts`:
 *  - `getBalance` reads `walletBalance` from the user row, returns `null` if
 *    the user doesn't exist.
 *  - `getHistory` returns a paginated slice + total count, clamps page/limit.
 *  - `topUp`, `debit`, `refund` all run inside `db.$transaction` and write a
 *    `WalletTransaction` audit row.
 *  - `debit` throws `INSUFFICIENT_BALANCE` when the wallet lacks funds and
 *    also when a concurrent payment pushed the post-decrement balance below
 *    zero (defensive re-check).
 *  - `topUp`/`debit`/`refund` throw `INVALID_AMOUNT` on non-positive amounts.
 *
 * Mock strategy: replace `@/lib/db` with a fully controlled Prisma stub. The
 * `$transaction` mock passes the same `db` object as the `tx` argument so the
 * service code's `tx.user.findUnique` calls hit the same vi.fn instances we
 * assert against.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mock — the $transaction callback needs a reference to `db` so it can
// pass it to the service code as `tx`.
const { db } = vi.hoisted(() => {
  const db = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    walletTransaction: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: typeof db) => unknown) => fn(db)),
  };
  return { db };
});

vi.mock('@/lib/db', () => ({ db }));

import {
  getBalance,
  getHistory,
  topUp,
  debit,
  refund,
  DEFAULT_WALLET_PAGE_LIMIT,
  MAX_WALLET_PAGE_LIMIT,
} from '@/services/wallet/wallet.service';

describe('wallet.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish the $transaction behaviour in case a test restored it.
    db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  });

  describe('getBalance', () => {
    it('returns the user.walletBalance when the user exists', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 5000 });

      const result = await getBalance('u1');

      expect(result).toBe(5000);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: { walletBalance: true },
      });
    });

    it('returns null for a non-existent user (does not throw)', async () => {
      db.user.findUnique.mockResolvedValue(null);

      const result = await getBalance('ghost');

      expect(result).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('returns paginated transactions with metadata', async () => {
      const txs = [
        { id: 't1', userId: 'u1', amount: 100, type: 'topup', balance: 100, description: '', reference: 'r1', createdAt: new Date() },
        { id: 't2', userId: 'u1', amount: -50, type: 'payment', balance: 50, description: '', reference: 'r2', createdAt: new Date() },
      ];
      db.walletTransaction.findMany.mockResolvedValue(txs);
      db.walletTransaction.count.mockResolvedValue(25);

      const result = await getHistory('u1', 2, 10);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3); // ceil(25 / 10) = 3
      expect(db.walletTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        skip: 10, // (page 2 - 1) * 10
        take: 10,
      });
      expect(db.walletTransaction.count).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });

    it('clamps page to >= 1 and limit to the [1, MAX_WALLET_PAGE_LIMIT] range', async () => {
      db.walletTransaction.findMany.mockResolvedValue([]);
      db.walletTransaction.count.mockResolvedValue(0);

      const result = await getHistory('u1', -5, 9999);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(MAX_WALLET_PAGE_LIMIT);
      expect(db.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: MAX_WALLET_PAGE_LIMIT }),
      );
    });

    it('defaults to DEFAULT_WALLET_PAGE_LIMIT when limit is omitted', async () => {
      db.walletTransaction.findMany.mockResolvedValue([]);
      db.walletTransaction.count.mockResolvedValue(0);

      const result = await getHistory('u1');

      expect(result.limit).toBe(DEFAULT_WALLET_PAGE_LIMIT);
      expect(result.page).toBe(1);
    });
  });

  describe('topUp', () => {
    it('credits the wallet inside a $transaction and returns the new balance + transaction', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 1000 });
      db.user.update.mockResolvedValue({ id: 'u1', walletBalance: 6000 });
      const txRow = {
        id: 'wt1', userId: 'u1', type: 'topup', amount: 5000, balance: 6000,
        description: 'Wallet top-up', reference: 'ref-1', createdAt: new Date(),
      };
      db.walletTransaction.create.mockResolvedValue(txRow);

      const result = await topUp('u1', 5000, 'ref-1');

      expect(result.newBalance).toBe(6000);
      expect(result.transaction).toEqual(txRow);
      expect(db.$transaction).toHaveBeenCalledOnce();
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { walletBalance: { increment: 5000 } },
      });
    });

    it('creates a WalletTransaction audit row with type "topup" and a positive amount', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 0 });
      db.user.update.mockResolvedValue({ id: 'u1', walletBalance: 5000 });
      db.walletTransaction.create.mockResolvedValue({ id: 'wt1' });

      await topUp('u1', 5000, 'ref-2');

      expect(db.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          type: 'topup',
          amount: 5000, // positive = credit
          reference: 'ref-2',
        }),
      });
    });

    it('throws USER_NOT_FOUND when the user does not exist', async () => {
      db.user.findUnique.mockResolvedValue(null);

      await expect(topUp('ghost', 1000, 'ref')).rejects.toThrow('USER_NOT_FOUND');
      expect(db.user.update).not.toHaveBeenCalled();
      expect(db.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('throws INVALID_AMOUNT when amount is <= 0 (no DB call)', async () => {
      await expect(topUp('u1', 0, 'ref')).rejects.toThrow('INVALID_AMOUNT');
      await expect(topUp('u1', -100, 'ref')).rejects.toThrow('INVALID_AMOUNT');
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('debit', () => {
    it('debits the wallet when the user has sufficient balance and writes a negative-amount audit row', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 5000 });
      db.user.update.mockResolvedValue({ id: 'u1', walletBalance: 2000 });
      db.walletTransaction.create.mockResolvedValue({
        id: 'wt2', userId: 'u1', type: 'payment', amount: -3000, balance: 2000,
        description: 'Wallet debit', reference: 'order-1', createdAt: new Date(),
      });

      const result = await debit('u1', 3000, 'order-1', 'Order payment');

      expect(result.newBalance).toBe(2000);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { walletBalance: { decrement: 3000 } },
      });
      expect(db.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          type: 'payment',
          amount: -3000, // negative = debit
          reference: 'order-1',
          description: 'Order payment',
        }),
      });
    });

    it('throws INSUFFICIENT_BALANCE when the wallet has less than the requested amount', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 100 });

      await expect(debit('u1', 500, 'ref')).rejects.toThrow('INSUFFICIENT_BALANCE');
      expect(db.user.update).not.toHaveBeenCalled();
      expect(db.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('throws INSUFFICIENT_BALANCE when a concurrent payment pushed the post-decrement balance below zero (defensive re-check)', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 500 });
      // Simulate a concurrent decrement landing the row at -100.
      db.user.update.mockResolvedValue({ id: 'u1', walletBalance: -100 });

      await expect(debit('u1', 500, 'ref')).rejects.toThrow('INSUFFICIENT_BALANCE');
      // The audit row must NOT have been written for a failed debit.
      expect(db.walletTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('refund', () => {
    it('credits the wallet as a refund and returns the new balance + transaction', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 1000 });
      db.user.update.mockResolvedValue({ id: 'u1', walletBalance: 4000 });
      const txRow = {
        id: 'wt3', userId: 'u1', type: 'refund', amount: 3000, balance: 4000,
        description: 'Refund credited to wallet', reference: 'refund-1', createdAt: new Date(),
      };
      db.walletTransaction.create.mockResolvedValue(txRow);

      const result = await refund('u1', 3000, 'refund-1');

      expect(result.newBalance).toBe(4000);
      expect(result.transaction).toEqual(txRow);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { walletBalance: { increment: 3000 } },
      });
    });

    it('creates a WalletTransaction audit row with type "refund" and a positive amount', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 0 });
      db.user.update.mockResolvedValue({ id: 'u1', walletBalance: 2500 });
      db.walletTransaction.create.mockResolvedValue({ id: 'wt3' });

      await refund('u1', 2500, 'refund-2');

      expect(db.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          type: 'refund',
          amount: 2500, // positive = credit
          description: 'Refund credited to wallet',
          reference: 'refund-2',
        }),
      });
    });
  });

  describe('all financial mutations use $transaction (atomicity)', () => {
    it('topUp, debit, and refund all wrap their DB writes in a single $transaction call', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1', walletBalance: 10000 });
      db.user.update.mockResolvedValue({ id: 'u1', walletBalance: 11000 });
      db.walletTransaction.create.mockResolvedValue({ id: 'wt' });

      await topUp('u1', 1000, 'r-topup');
      await debit('u1', 1000, 'r-debit');
      await refund('u1', 1000, 'r-refund');

      // One $transaction call per mutation — three total.
      expect(db.$transaction).toHaveBeenCalledTimes(3);
    });
  });
});
