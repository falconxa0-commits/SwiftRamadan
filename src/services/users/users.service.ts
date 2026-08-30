/**
 * Users Service — encapsulates user profile business logic for SwiftRamadan.
 *
 * Sits between the API routes (`/api/user`, `/api/admin/users`) and the Prisma
 * layer. Owns:
 *   - Public field projection (financial/loyalty data restricted to owner).
 *   - Allowed update fields (NEVER role — that's {@link switchRole} in the
 *     auth service).
 *   - Aggregate stats (order count, total spent).
 *   - Soft-delete placeholder for future compliance with CBN ADFS 2024 §3.2
 *     (financial records must be retained 7 years — see prisma/schema.prisma
 *     `onDelete: Restrict` notes).
 *
 * @module services/users
 */

import { db } from '@/lib/db';
import { publicUserFields, PROFILE_ALLOWED_FIELDS } from '@/lib/profile-update';

/** Public-safe user representation (no password, no sensitive fields). */
export type PublicUser = ReturnType<typeof publicUserFields>;

/** Stats for a user, returned by {@link getUserStats}. */
export interface UserStats {
  /** Total number of orders placed. */
  orderCount: number;
  /** Sum of all order totals (in kobo). */
  totalSpent: number;
  /** Sum of all *successful* payment amounts (in kobo). */
  totalPaid: number;
  /** Number of reviews written. */
  reviewCount: number;
  /** Most recent order's ISO timestamp, or null if none. */
  lastOrderAt: string | null;
}

/** Subset of {@link PROFILE_ALLOWED_FIELDS} that callers may update. */
export type AllowedProfileField = (typeof PROFILE_ALLOWED_FIELDS)[number];

/** Input for {@link updateProfile} — a partial set of allowed fields. */
export type UpdateProfileInput = Partial<Record<AllowedProfileField, unknown>>;

/**
 * Fetch a user's public fields by ID.
 *
 * @returns `PublicUser` if found, `null` otherwise. Password and sensitive
 *          fields are stripped by `publicUserFields`. The `requesterId`
 *          argument controls whether financial/loyalty fields are included;
 *          we pass the same `userId` so the caller sees their own data.
 */
export async function getUserById(userId: string): Promise<PublicUser | null> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return publicUserFields(user, userId);
}

/**
 * Update a user's profile. ONLY updates fields in {@link PROFILE_ALLOWED_FIELDS}
 * — `role` is explicitly excluded and must be changed via
 * {@link import('@/services/auth/auth.service').switchRole}.
 *
 * @param userId  The user to update.
 * @param data    A partial set of allowed fields. Unknown / blocked fields
 *                are silently dropped (callers wishing to detect attempts
 *                should use `filterProfileFields` from `@/lib/profile-update`
 *                before calling).
 * @returns The updated `PublicUser`.
 *
 * @throws {Error} `message === 'USER_NOT_FOUND'` if the user doesn't exist.
 * @throws {Error} `message === 'NO_FIELDS'` if no allowed fields were provided.
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileInput,
): Promise<PublicUser> {
  const existing = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) throw new Error('USER_NOT_FOUND');

  const updateData: Record<string, unknown> = {};
  for (const field of PROFILE_ALLOWED_FIELDS) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) throw new Error('NO_FIELDS');

  const updated = await db.user.update({ where: { id: userId }, data: updateData });
  return publicUserFields(updated, userId);
}

/**
 * Fetch a user's wallet balance (in kobo).
 *
 * @returns The integer wallet balance in kobo, or `null` if the user
 *          doesn't exist.
 */
export async function getUserWalletBalance(userId: string): Promise<number | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });
  return user ? user.walletBalance : null;
}

/**
 * Compute aggregate stats for a user.
 *
 * Includes order count, total spent (sum of order totals), total paid (sum of
 * successful payments), review count, and last order timestamp.
 *
 * @returns A {@link UserStats} object, or `null` if the user doesn't exist.
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return null;

  const [orders, payments, reviews] = await Promise.all([
    db.order.findMany({
      where: { userId },
      select: { total: true, createdAt: true },
    }),
    db.payment.findMany({
      where: { userId, status: 'success' },
      select: { amount: true },
    }),
    db.review.count({ where: { userId } }),
  ]);

  const orderCount = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastOrderAt =
    orders.length > 0
      ? orders
          .map((o) => o.createdAt)
          .reduce((latest, t) => (t > latest ? t : latest), orders[0].createdAt)
          .toISOString()
      : null;

  return {
    orderCount,
    totalSpent,
    totalPaid,
    reviewCount: reviews,
    lastOrderAt,
  };
}

/**
 * Soft-delete a user.
 *
 * PLACEHOLDER: returns `false` for now. The current Prisma schema uses
 * `onDelete: Restrict` for WalletTransaction, Payout, Refund, and KYCDocument
 * (audit H1 — CBN ADFS 2024 §3.2 requires 7-year retention of financial
 * records). A real soft-delete implementation must:
 *   1. Add a `deletedAt` column to the User model.
 *   2. Anonymize PII (name, email, phone) while preserving FK integrity.
 *   3. Mark the account as inactive without removing related records.
 *
 * @returns Always `false` until the schema migration is performed.
 */
export async function softDeleteUser(_userId: string): Promise<boolean> {
  // Intentional no-op — see JSDoc above. Implement after schema migration.
  return false;
}
