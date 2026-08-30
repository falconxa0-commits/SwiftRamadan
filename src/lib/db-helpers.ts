/**
 * Shared database helper utilities for API routes.
 *
 * These functions consolidate common patterns used across multiple API routes
 * to avoid code duplication and ensure consistent behavior.
 *
 * @module db-helpers
 */

import { db } from './db';

/**
 * Returns true if the user exists (or userId is null/undefined).
 * Returns false if a userId was provided but no matching User record was found —
 * which would otherwise cause a Prisma foreign-key violation on create operations.
 *
 * @example
 * ```ts
 * if (userId && !(await assertUserExists(userId))) {
 *   return NextResponse.json({ success: false, message: 'User not found' }, { status: 400 });
 * }
 * ```
 */
export async function assertUserExists(userId: string | undefined): Promise<boolean> {
  if (!userId) return true;
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  return !!user;
}

/**
 * Finds a user by email and returns their ID, or null if not found.
 * Useful for resolving user identity from email-based lookups.
 *
 * @example
 * ```ts
 * const userId = await resolveUserIdByEmail(email);
 * if (!userId) {
 *   return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
 * }
 * ```
 */
export async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}
