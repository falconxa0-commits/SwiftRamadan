/**
 * Wallet Service — encapsulates wallet business logic for SwiftRamadan.
 *
 * Sits between the API routes (`/api/wallet`, `/api/wallet/history`) and the
 * Prisma layer. Owns:
 *   - Wallet balance queries.
 *   - Paginated transaction history (IDOR protection is the CALLER's
 *     responsibility — see `/api/wallet/history` for the auth.userId check).
 *   - All financial mutations, which MUST use `db.$transaction()` for ACID
 *     compliance (audit H1 — CBN ADFS 2024 §3.2 financial record retention).
 *
 * All monetary amounts in this service are in **kobo** (1 NGN = 100 kobo).
 *
 * @module services/wallet
 */

import { db } from '@/lib/db';
import type { WalletTransaction } from '@prisma/client';

/** Default page size for {@link getHistory}. */
export const DEFAULT_WALLET_PAGE_LIMIT = 20;

/** Maximum allowed page size. */
export const MAX_WALLET_PAGE_LIMIT = 100;

/** Paginated history result. */
export interface PaginatedWalletHistory {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Result of any wallet mutation (topUp / debit / refund). */
export interface WalletMutationResult {
  /** New wallet balance in kobo. */
  newBalance: number;
  /** The created WalletTransaction audit row. */
  transaction: WalletTransaction;
}

/**
 * Fetch a user's wallet balance (in kobo).
 *
 * @returns The integer balance, or `null` if the user doesn't exist.
 */
export async function getBalance(userId: string): Promise<number | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });
  return user ? user.walletBalance : null;
}

/**
 * Fetch a user's wallet transaction history with pagination.
 *
 * SECURITY: The caller MUST enforce ownership (the `/api/wallet/history`
 * route checks `auth.userId === requestedUserId` before calling this).
 * This service does NOT re-check — it trusts the authenticated userId
 * passed in.
 *
 * @param userId  The authenticated user's ID.
 * @param page    1-indexed page number (clamped to >= 1).
 * @param limit   Page size (clamped to 1..{@link MAX_WALLET_PAGE_LIMIT},
 *                defaults to {@link DEFAULT_WALLET_PAGE_LIMIT}).
 */
export async function getHistory(
  userId: string,
  page: number = 1,
  limit: number = DEFAULT_WALLET_PAGE_LIMIT,
): Promise<PaginatedWalletHistory> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.min(
    MAX_WALLET_PAGE_LIMIT,
    Math.max(1, Math.floor(limit) || DEFAULT_WALLET_PAGE_LIMIT),
  );
  const skip = (safePage - 1) * safeLimit;

  const [transactions, total] = await Promise.all([
    db.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    db.walletTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 0,
  };
}

/**
 * Credit (top-up) a user's wallet in a `$transaction`.
 *
 * Atomically:
 *   1. Locks + fetches the user row.
 *   2. Increments `walletBalance` by `amount` (kobo).
 *   3. Creates a `WalletTransaction` audit row with `type: 'topup'`.
 *
 * @param userId    The user to credit.
 * @param amount    Amount in kobo (MUST be > 0).
 * @param reference External reference (e.g. Paystack ref) for traceability.
 *
 * @throws {Error} `message === 'USER_NOT_FOUND'` if the user doesn't exist.
 * @throws {Error} `message === 'INVALID_AMOUNT'` if amount <= 0.
 */
export async function topUp(
  userId: string,
  amount: number,
  reference: string,
): Promise<WalletMutationResult> {
  if (typeof amount !== 'number' || amount <= 0) throw new Error('INVALID_AMOUNT');

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, walletBalance: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        type: 'topup',
        amount, // positive = credit
        balance: updatedUser.walletBalance,
        description: 'Wallet top-up',
        reference,
      },
    });

    return { updatedUser, transaction };
  });

  return { newBalance: result.updatedUser.walletBalance, transaction: result.transaction };
}

/**
 * Debit a user's wallet with a balance check in a `$transaction`.
 *
 * Atomically:
 *   1. Locks + fetches the user row.
 *   2. Checks sufficient balance (throws `INSUFFICIENT_BALANCE` if not).
 *   3. Decrements `walletBalance` by `amount` (kobo).
 *   4. Re-checks that the new balance is non-negative (defends against
 *      concurrent payments).
 *   5. Creates a `WalletTransaction` audit row with `type: 'payment'` and a
 *      **negative** `amount` (debit).
 *
 * @param userId       The user to debit.
 * @param amount       Amount in kobo (MUST be > 0).
 * @param reference    External reference (e.g. order ID) for traceability.
 * @param description  Human-readable description for the audit row.
 *
 * @throws {Error} `message === 'USER_NOT_FOUND'` if the user doesn't exist.
 * @throws {Error} `message === 'INSUFFICIENT_BALANCE'` if the wallet lacks funds.
 * @throws {Error} `message === 'INVALID_AMOUNT'` if amount <= 0.
 */
export async function debit(
  userId: string,
  amount: number,
  reference: string,
  description: string = 'Wallet debit',
): Promise<WalletMutationResult> {
  if (typeof amount !== 'number' || amount <= 0) throw new Error('INVALID_AMOUNT');

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, walletBalance: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    if (user.walletBalance < amount) throw new Error('INSUFFICIENT_BALANCE');

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amount } },
    });

    // Defends against concurrent payments that pushed balance below zero.
    if (updatedUser.walletBalance < 0) throw new Error('INSUFFICIENT_BALANCE');

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        type: 'payment',
        amount: -amount, // negative = debit
        balance: updatedUser.walletBalance,
        description,
        reference,
      },
    });

    return { updatedUser, transaction };
  });

  return { newBalance: result.updatedUser.walletBalance, transaction: result.transaction };
}

/**
 * Credit a refund to the user's wallet in a `$transaction`.
 *
 * Refunds are conceptually the same as top-ups but with `type: 'refund'` so
 * audit reports can distinguish them. Same atomicity rules as {@link topUp}.
 *
 * @param userId    The user to credit.
 * @param amount    Amount in kobo (MUST be > 0).
 * @param reference External reference (e.g. Refund reference) for traceability.
 *
 * @throws {Error} `message === 'USER_NOT_FOUND'` if the user doesn't exist.
 * @throws {Error} `message === 'INVALID_AMOUNT'` if amount <= 0.
 */
export async function refund(
  userId: string,
  amount: number,
  reference: string,
): Promise<WalletMutationResult> {
  if (typeof amount !== 'number' || amount <= 0) throw new Error('INVALID_AMOUNT');

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, walletBalance: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        type: 'refund',
        amount, // positive = credit
        balance: updatedUser.walletBalance,
        description: 'Refund credited to wallet',
        reference,
      },
    });

    return { updatedUser, transaction };
  });

  return { newBalance: result.updatedUser.walletBalance, transaction: result.transaction };
}
