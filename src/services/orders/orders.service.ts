/**
 * Orders Service — encapsulates order business logic for SwiftRamadan.
 *
 * Sits between the API routes (`/api/orders`, `/api/orders/[id]/rate`) and the
 * Prisma layer. Owns:
 *   - Order creation in `$transaction` (atomic coupon redemption is the
 *     caller's responsibility — this service just creates the order row).
 *   - Ownership checks (IDOR protection, audit B9/B10).
 *   - Pagination defaults.
 *   - Rating de-duplication (one review per order per user).
 *
 * @module services/orders
 */

import { db } from '@/lib/db';
import type { Order, Review } from '@prisma/client';

/** A single order item in the items JSON array. */
export interface OrderItem {
  productId?: string;
  name: string;
  qty?: number;
  quantity?: number;
  price: number;
  image?: string;
  notes?: string;
  [key: string]: unknown;
}

/** An order with its items parsed back into a structured array. */
export interface ParsedOrder extends Omit<Order, 'items'> {
  items: OrderItem[];
}

/** Result of {@link createOrder}. */
export interface CreateOrderResult {
  order: ParsedOrder;
}

/** Paginated list result. */
export interface PaginatedOrders {
  orders: ParsedOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Default page size for {@link listUserOrders}. */
export const DEFAULT_ORDER_PAGE_LIMIT = 20;

/** Maximum allowed page size (prevents abuse). */
export const MAX_ORDER_PAGE_LIMIT = 100;

/** Parse the JSON-encoded `items` string on an Order row. */
function parseOrderItems(raw: string): OrderItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as OrderItem[];
    return [];
  } catch {
    return [];
  }
}

/** Convert a raw Prisma Order row into a {@link ParsedOrder}. */
function toParsedOrder(order: Order): ParsedOrder {
  return { ...order, items: parseOrderItems(order.items) };
}

/**
 * Create a new order in a `$transaction`.
 *
 * @param userId   The authenticated user's ID (always set on the order).
 * @param items    Array of order items (will be JSON-stringified).
 * @param total    Order total in kobo.
 * @param addressId  Optional delivery address ID. NOTE: the current Prisma
 *                   schema does not have an `addressId` column on `Order`,
 *                   so this is currently accepted for forward-compat but not
 *                   persisted. Callers may attach it via `items` metadata.
 * @param initialStatus  Defaults to `'Preparing'`.
 * @param progress       Defaults to `0`.
 *
 * @throws {Error} `message === 'USER_NOT_FOUND'` if the userId does not exist.
 * @throws {Error} `message === 'INVALID_TOTAL'` if total is not positive.
 */
export async function createOrder(
  userId: string,
  items: OrderItem[],
  total: number,
  addressId?: string,
  initialStatus: string = 'Preparing',
  progress: number = 0,
): Promise<CreateOrderResult> {
  if (!userId) throw new Error('USER_NOT_FOUND');
  if (typeof total !== 'number' || total <= 0) throw new Error('INVALID_TOTAL');

  // FK guard — Prisma throws on a missing user FK, so we pre-check.
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new Error('USER_NOT_FOUND');

  // addressId is accepted for forward-compat but the current schema has no
  // column for it. We intentionally do NOT include it in the create payload.
  void addressId;

  const order = await db.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        status: initialStatus,
        total,
        items: JSON.stringify(items || []),
        progress,
        userId,
      },
    });
  });

  return { order: toParsedOrder(order) };
}

/**
 * Fetch a single order by ID with an ownership check (audit B9/B10).
 *
 * @returns The {@link ParsedOrder} if found AND `order.userId === userId`.
 *          Returns `null` if the order does not exist OR the user does not
 *          own it. Admin/system callers should pass `userId = null` (or
 *          omit it) to bypass the ownership check — the route is responsible
 *          for enforcing admin role before calling this without a userId.
 */
export async function getOrderById(
  orderId: string,
  userId?: string | null,
): Promise<ParsedOrder | null> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  // Ownership check: if a userId is provided and the order's userId doesn't
  // match, return null (treat as "not found" to avoid leaking existence).
  if (userId !== null && userId !== undefined && order.userId !== userId) {
    return null;
  }

  return toParsedOrder(order);
}

/**
 * List a user's orders with pagination.
 *
 * @param userId  The authenticated user's ID.
 * @param page    1-indexed page number (clamped to >= 1).
 * @param limit   Page size (clamped to 1..{@link MAX_ORDER_PAGE_LIMIT},
 *                defaults to {@link DEFAULT_ORDER_PAGE_LIMIT}).
 */
export async function listUserOrders(
  userId: string,
  page: number = 1,
  limit: number = DEFAULT_ORDER_PAGE_LIMIT,
): Promise<PaginatedOrders> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.min(
    MAX_ORDER_PAGE_LIMIT,
    Math.max(1, Math.floor(limit) || DEFAULT_ORDER_PAGE_LIMIT),
  );
  const skip = (safePage - 1) * safeLimit;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    db.order.count({ where: { userId } }),
  ]);

  return {
    orders: orders.map(toParsedOrder),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 0,
  };
}

/**
 * Update an order's status with an optional ownership check.
 *
 * @param orderId  The order ID.
 * @param status   New status string (e.g. 'Preparing', 'Confirmed', 'Delivered').
 * @param userId   If provided, the order MUST belong to this user — otherwise
 *                 throws `'FORBIDDEN'`. Pass `null`/`undefined` to skip the
 *                 check (admin/system operations).
 * @param progress Optional 0-100 progress value to set alongside status.
 *
 * @throws {Error} `message === 'ORDER_NOT_FOUND'` if the order does not exist.
 * @throws {Error} `message === 'FORBIDDEN'` if a userId was provided and the
 *                 order does not belong to them.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  userId?: string | null,
  progress?: number,
): Promise<ParsedOrder> {
  const existing = await db.order.findUnique({ where: { id: orderId } });
  if (!existing) throw new Error('ORDER_NOT_FOUND');

  if (userId !== null && userId !== undefined && existing.userId !== userId) {
    throw new Error('FORBIDDEN');
  }

  const data: { status: string; progress?: number } = { status };
  if (typeof progress === 'number' && !Number.isNaN(progress)) {
    data.progress = progress;
  }

  const updated = await db.order.update({ where: { id: orderId }, data });
  return toParsedOrder(updated);
}

/**
 * Rate an order — creates a Review and links it to the order.
 *
 * Rules:
 *   - One review per order per user (de-duplicated inside a `$transaction`).
 *   - The order MUST belong to the caller (ownership enforced).
 *   - `rating` is clamped to the 1-5 range.
 *
 * @throws {Error} `message === 'ORDER_NOT_FOUND'` if the order does not exist.
 * @throws {Error} `message === 'FORBIDDEN'` if the user does not own the order.
 * @throws {Error} `message === 'DUPLICATE_REVIEW'` if they've already rated it.
 */
export async function rateOrder(
  orderId: string,
  userId: string,
  rating: number,
  comment: string = '',
): Promise<Review> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('ORDER_NOT_FOUND');

  // Ownership — only the order's owner can rate it.
  if (order.userId !== userId) throw new Error('FORBIDDEN');

  const clampedRating = Math.max(1, Math.min(5, Math.floor(rating) || 5));

  // Use $transaction to prevent race conditions on the duplicate check.
  const review = await db.$transaction(async (tx) => {
    const existing = await tx.review.findFirst({
      where: { orderId, userId },
    });
    if (existing) throw new Error('DUPLICATE_REVIEW');

    return tx.review.create({
      data: {
        orderId,
        userId,
        authorName: '', // Caller can patch via `updateProfile` lookups if needed
        authorAvatar: '',
        rating: clampedRating,
        comment: String(comment || ''),
        targetType: 'rider', // Default target — callers can refine via direct db writes
        targetId: null,
      },
    });
  });

  return review;
}
