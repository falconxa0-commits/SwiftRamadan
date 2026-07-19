import { db } from '@/lib/db';

/**
 * Create a notification for a specific user.
 *
 * Wrapped in try/catch so a DB failure (e.g. FK violation on a bad userId)
 * is logged and returns `null` instead of throwing — callers that treat
 * notifications as best-effort side-effects (e.g. POST /api/orders) can
 * safely ignore the return value.
 */
export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type = 'info',
) {
  try {
    return await db.notification.create({
      data: { userId, title, message, type },
    });
  } catch (e) {
    console.error('notifyUser error:', e);
    return null;
  }
}

/**
 * Create a notification for multiple users (e.g. all vendors of an order).
 *
 * - De-duplicates the list (preserves insertion order via Set).
 * - Drops falsy entries (null/undefined/empty string) — those would either
 *   create a global notification (userId:null) or fail the FK constraint.
 * - Returns the created rows on success, or `[]` on a thrown DB error.
 *   Individual failures inside Promise.all will reject the whole batch —
 *   callers that want partial success should call notifyUser in a loop.
 */
export async function notifyUsers(
  userIds: string[],
  title: string,
  message: string,
  type = 'info',
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return [];
  try {
    return await Promise.all(
      unique.map((userId) =>
        db.notification.create({ data: { userId, title, message, type } }),
      ),
    );
  } catch (e) {
    console.error('notifyUsers error:', e);
    return [];
  }
}

/**
 * Resolve the vendor user IDs for a list of product names.
 *
 * Used by POST /api/orders to figure out which vendor(s) should be notified
 * about a new order. Matches by exact `Product.name` (the field that appears
 * on the order's items payload — `Product.id` is not known at order-creation
 * time because the frontend only sends `{ name, qty, price }`).
 *
 * Returns unique vendorId strings (excluding nulls). Empty array if no
 * matching products or none of them have a vendorId.
 */
export async function resolveVendorsForItems(
  itemNames: string[],
): Promise<string[]> {
  if (itemNames.length === 0) return [];
  const products = await db.product.findMany({
    where: { name: { in: itemNames } },
    select: { vendorId: true },
  });
  return [
    ...new Set(
      products.map((p) => p.vendorId).filter((id): id is string => !!id),
    ),
  ];
}
