/**
 * Orders Service unit tests.
 *
 * Locks in the contract documented in `src/services/orders/orders.service.ts`:
 *  - `createOrder` runs inside `db.$transaction`, validates the userId FK
 *    before insert, and rejects non-positive totals.
 *  - `getOrderById` enforces ownership — returns `null` if the order doesn't
 *    exist OR doesn't belong to the requesting user (IDOR protection).
 *  - `listUserOrders` paginates with the same clamp rules as the wallet
 *    service (page >= 1, limit in [1, MAX_ORDER_PAGE_LIMIT]).
 *  - `updateOrderStatus` throws `FORBIDDEN` if a userId is provided and the
 *    order doesn't belong to them; throws `ORDER_NOT_FOUND` if missing.
 *  - `rateOrder` enforces one-review-per-order (DUPLICATE_REVIEW), ownership
 *    (FORBIDDEN), and clamps the rating to the 1-5 range.
 *
 * Mock strategy: same as the wallet tests — `@/lib/db` is replaced with a
 * stubbed Prisma client. The `$transaction` mock passes `db` as `tx` so the
 * service's `tx.order.create` / `tx.review.findFirst` / `tx.review.create`
 * calls land on the same vi.fn instances we assert against.
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
    review: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: typeof db) => unknown) => fn(db)),
  };
  return { db };
});

vi.mock('@/lib/db', () => ({ db }));

import {
  createOrder,
  getOrderById,
  listUserOrders,
  updateOrderStatus,
  rateOrder,
  DEFAULT_ORDER_PAGE_LIMIT,
  MAX_ORDER_PAGE_LIMIT,
} from '@/services/orders/orders.service';

describe('orders.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  });

  describe('createOrder', () => {
    it('creates an order with the correct fields inside a $transaction', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      const items = [{ name: 'Jollof', price: 5000, qty: 1 }];
      // The mock echoes the items the service just JSON.stringified back to
      // the caller, mimicking Prisma returning the persisted row.
      db.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'o1',
        status: data.status,
        total: data.total,
        items: data.items,
        progress: data.progress,
        userId: data.userId,
        createdAt: new Date(),
      }));

      const result = await createOrder('u1', items, 5000, 'addr-1');

      expect(result.order.id).toBe('o1');
      expect(result.order.items).toEqual(items); // items parsed back to array
      expect(db.order.create).toHaveBeenCalledWith({
        data: {
          status: 'Preparing',
          total: 5000,
          items: JSON.stringify(items),
          progress: 0,
          userId: 'u1',
        },
      });
      expect(db.$transaction).toHaveBeenCalledOnce();
    });

    it('throws USER_NOT_FOUND when userId is empty or no such user exists', async () => {
      // Empty userId — rejected before any DB call.
      await expect(createOrder('', [], 1000)).rejects.toThrow('USER_NOT_FOUND');
      // FK check fails — no user row.
      db.user.findUnique.mockResolvedValue(null);
      await expect(createOrder('ghost', [], 1000)).rejects.toThrow('USER_NOT_FOUND');
      expect(db.order.create).not.toHaveBeenCalled();
    });

    it('throws INVALID_TOTAL when total is not a positive number', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(createOrder('u1', [], 0)).rejects.toThrow('INVALID_TOTAL');
      await expect(createOrder('u1', [], -500)).rejects.toThrow('INVALID_TOTAL');
      expect(db.order.create).not.toHaveBeenCalled();
    });
  });

  describe('getOrderById', () => {
    it('returns the parsed order when the user owns it', async () => {
      const order = {
        id: 'o1', status: 'Preparing', total: 1000, items: JSON.stringify([{ name: 'Suya', price: 1000 }]),
        progress: 0, userId: 'u1', createdAt: new Date(),
      };
      db.order.findUnique.mockResolvedValue(order);

      const result = await getOrderById('o1', 'u1');

      expect(result?.id).toBe('o1');
      expect(result?.items).toEqual([{ name: 'Suya', price: 1000 }]);
    });

    it('returns null when the order does NOT belong to the requesting user (IDOR protection)', async () => {
      const order = {
        id: 'o1', status: 'Preparing', total: 1000, items: '[]',
        progress: 0, userId: 'owner', createdAt: new Date(),
      };
      db.order.findUnique.mockResolvedValue(order);

      const result = await getOrderById('o1', 'attacker');

      expect(result).toBeNull();
    });

    it('returns null when the order does not exist', async () => {
      db.order.findUnique.mockResolvedValue(null);
      const result = await getOrderById('ghost', 'u1');
      expect(result).toBeNull();
    });

    it('skips the ownership check when userId is null (admin/system callers)', async () => {
      const order = {
        id: 'o1', status: 'Delivered', total: 1000, items: '[]',
        progress: 100, userId: 'someone-else', createdAt: new Date(),
      };
      db.order.findUnique.mockResolvedValue(order);

      const result = await getOrderById('o1', null);
      expect(result?.id).toBe('o1');
    });
  });

  describe('listUserOrders', () => {
    it('returns paginated orders with metadata', async () => {
      const orders = [
        { id: 'o1', status: 'Delivered', total: 5000, items: '[]', progress: 100, userId: 'u1', createdAt: new Date() },
        { id: 'o2', status: 'Preparing', total: 2500, items: '[]', progress: 0, userId: 'u1', createdAt: new Date() },
      ];
      db.order.findMany.mockResolvedValue(orders);
      db.order.count.mockResolvedValue(15);

      const result = await listUserOrders('u1', 1, 10);

      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2); // ceil(15 / 10)
      expect(db.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('respects page + limit and clamps to the allowed range', async () => {
      db.order.findMany.mockResolvedValue([]);
      db.order.count.mockResolvedValue(0);

      const result = await listUserOrders('u1', 3, 5);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }), // (3 - 1) * 5
      );
    });

    it('clamps limit to MAX_ORDER_PAGE_LIMIT and page to >= 1', async () => {
      db.order.findMany.mockResolvedValue([]);
      db.order.count.mockResolvedValue(0);

      const result = await listUserOrders('u1', -2, 9999);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(MAX_ORDER_PAGE_LIMIT);
    });

    it('defaults page to 1 and limit to DEFAULT_ORDER_PAGE_LIMIT', async () => {
      db.order.findMany.mockResolvedValue([]);
      db.order.count.mockResolvedValue(0);

      const result = await listUserOrders('u1');

      expect(result.page).toBe(1);
      expect(result.limit).toBe(DEFAULT_ORDER_PAGE_LIMIT);
    });
  });

  describe('updateOrderStatus', () => {
    it('updates the order status and returns the parsed order', async () => {
      db.order.findUnique.mockResolvedValue({
        id: 'o1', status: 'Preparing', total: 1000, items: '[]',
        progress: 0, userId: 'u1', createdAt: new Date(),
      });
      db.order.update.mockResolvedValue({
        id: 'o1', status: 'Confirmed', total: 1000, items: '[]',
        progress: 10, userId: 'u1', createdAt: new Date(),
      });

      const result = await updateOrderStatus('o1', 'Confirmed', 'u1', 10);

      expect(result.status).toBe('Confirmed');
      expect(result.progress).toBe(10);
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: 'Confirmed', progress: 10 },
      });
    });

    it('throws FORBIDDEN when a userId is provided and the order does not belong to them', async () => {
      db.order.findUnique.mockResolvedValue({
        id: 'o1', status: 'Preparing', total: 1000, items: '[]',
        progress: 0, userId: 'owner', createdAt: new Date(),
      });

      await expect(updateOrderStatus('o1', 'Delivered', 'attacker')).rejects.toThrow('FORBIDDEN');
      expect(db.order.update).not.toHaveBeenCalled();
    });

    it('throws ORDER_NOT_FOUND when the order does not exist', async () => {
      db.order.findUnique.mockResolvedValue(null);
      await expect(updateOrderStatus('ghost', 'Delivered', 'u1')).rejects.toThrow('ORDER_NOT_FOUND');
    });
  });

  describe('rateOrder', () => {
    it('creates a review when the user owns the order and has not rated it yet', async () => {
      db.order.findUnique.mockResolvedValue({
        id: 'o1', status: 'Delivered', total: 1000, items: '[]',
        progress: 100, userId: 'u1', createdAt: new Date(),
      });
      db.review.findFirst.mockResolvedValue(null);
      const review = {
        id: 'rev1', orderId: 'o1', userId: 'u1', authorName: '', authorAvatar: '',
        rating: 5, comment: 'Great!', targetType: 'rider', targetId: null, createdAt: new Date(),
      };
      db.review.create.mockResolvedValue(review);

      const result = await rateOrder('o1', 'u1', 5, 'Great!');

      expect(result).toEqual(review);
      expect(db.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'o1',
          userId: 'u1',
          rating: 5,
          comment: 'Great!',
        }),
      });
      expect(db.$transaction).toHaveBeenCalledOnce();
    });

    it('throws DUPLICATE_REVIEW when a review already exists for (orderId, userId)', async () => {
      db.order.findUnique.mockResolvedValue({
        id: 'o1', status: 'Delivered', total: 1000, items: '[]',
        progress: 100, userId: 'u1', createdAt: new Date(),
      });
      db.review.findFirst.mockResolvedValue({ id: 'existing-rev' });

      await expect(rateOrder('o1', 'u1', 4, 'Second attempt')).rejects.toThrow('DUPLICATE_REVIEW');
      expect(db.review.create).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when the order does not belong to the requesting user', async () => {
      db.order.findUnique.mockResolvedValue({
        id: 'o1', status: 'Delivered', total: 1000, items: '[]',
        progress: 100, userId: 'owner', createdAt: new Date(),
      });

      await expect(rateOrder('o1', 'attacker', 5, 'Nice')).rejects.toThrow('FORBIDDEN');
      expect(db.review.findFirst).not.toHaveBeenCalled();
      expect(db.review.create).not.toHaveBeenCalled();
    });

    it('clamps the rating to the 1-5 range before creating the review', async () => {
      db.order.findUnique.mockResolvedValue({
        id: 'o1', status: 'Delivered', total: 1000, items: '[]',
        progress: 100, userId: 'u1', createdAt: new Date(),
      });
      db.review.findFirst.mockResolvedValue(null);
      db.review.create.mockResolvedValue({ id: 'rev' });

      await rateOrder('o1', 'u1', 99, '');

      expect(db.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ rating: 5 }),
      });
    });
  });

  describe('error handling', () => {
    it('propagates DB errors from createOrder instead of silently swallowing them', async () => {
      db.user.findUnique.mockResolvedValue({ id: 'u1' });
      db.order.create.mockRejectedValue(new Error('connection lost'));
      await expect(createOrder('u1', [], 1000)).rejects.toThrow('connection lost');
    });

    it('propagates DB errors from updateOrderStatus', async () => {
      db.order.findUnique.mockResolvedValue({
        id: 'o1', status: 'Preparing', total: 1000, items: '[]',
        progress: 0, userId: 'u1', createdAt: new Date(),
      });
      db.order.update.mockRejectedValue(new Error('write failed'));
      await expect(updateOrderStatus('o1', 'Delivered', 'u1')).rejects.toThrow('write failed');
    });
  });
});
