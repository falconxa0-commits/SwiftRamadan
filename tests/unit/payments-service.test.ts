/**
 * Payments Service unit tests.
 *
 * Locks in the contract documented in `src/services/payments/payments.service.ts`:
 *  - `initiatePayment` creates a Payment row, rejects non-positive amounts,
 *    surfaces `REFERENCE_TAKEN` on caller-supplied reference collisions,
 *    short-circuits COD (provider `swift-pay`) without calling the gateway,
 *    and confirms the linked order on COD success.
 *  - `verifyPayment` delegates to the provider verifier.
 *  - `processWebhook` is idempotent — a second call for an already-success
 *    payment is a no-op (`updated: false`, `reason: 'ALREADY_PROCESSED'`)
 *    and does NOT call `$transaction` or `db.payment.update`.
 *  - `processWebhook` returns `{ updated: false, payment: null }` for unknown
 *    references and uses `$transaction` for the actual status transition.
 *  - `getPaymentByReference` returns the row or null.
 *  - `listUserPayments` paginates with the standard clamp rules.
 *
 * Mock strategy:
 *  - `@/lib/db` is replaced with a stubbed Prisma client (same pattern as the
 *    wallet/orders tests). `$transaction` passes `db` as `tx`.
 *  - `@/lib/payments` is replaced with stubs for `initiatePayment` (aliased
 *    `providerInitiate` in the service) and `verifyPayment` (aliased
 *    `providerVerify`). This isolates the service from the live gateways.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { db, providerInitiate, providerVerify } = vi.hoisted(() => {
  const db = {
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), count: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    payment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: typeof db) => unknown) => fn(db)),
  };
  return {
    db,
    providerInitiate: vi.fn(),
    providerVerify: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db }));
vi.mock('@/lib/payments', () => ({
  initiatePayment: providerInitiate,
  verifyPayment: providerVerify,
  // Type-only re-exports the service imports — vitest strips these, but the
  // mock factory still needs to expose them so the module shape matches.
}));

import {
  initiatePayment,
  verifyPayment,
  processWebhook,
  getPaymentByReference,
  listUserPayments,
  AMOUNT_TOLERANCE_KOBO,
} from '@/services/payments/payments.service';

describe('payments.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  });

  describe('initiatePayment', () => {
    it('creates a Payment row with status "pending" for a non-COD provider', async () => {
      db.payment.findUnique.mockResolvedValue(null); // no collision
      providerInitiate.mockResolvedValue({
        success: true,
        provider: 'paystack',
        reference: 'ref-1',
        checkoutUrl: 'https://paystack/checkout/ref-1',
      });
      db.payment.create.mockResolvedValue({
        id: 'p1', userId: 'u1', orderId: 'o1', amount: 5000,
        method: 'card', status: 'pending', reference: 'ref-1',
        provider: 'paystack', createdAt: new Date(),
      });

      const result = await initiatePayment('u1', 'o1', 5000, 'card', 'paystack', 'ref-1');

      expect(result.payment.id).toBe('p1');
      expect(result.payment.status).toBe('pending');
      expect(result.init.success).toBe(true);
      expect(db.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          orderId: 'o1',
          amount: 5000,
          status: 'pending',
          reference: 'ref-1',
          provider: 'paystack',
        }),
      });
    });

    it('short-circuits the gateway for COD (provider "swift-pay") and marks the order Confirmed', async () => {
      db.payment.findUnique.mockResolvedValue(null);
      db.payment.create.mockResolvedValue({
        id: 'p2', status: 'success', reference: 'cod-1',
      });
      // The linked order is in 'Preparing' — should be auto-confirmed.
      db.order.findUnique.mockResolvedValue({ id: 'o1', status: 'Preparing', progress: 0 });

      const result = await initiatePayment('u1', 'o1', 3000, 'cash', 'swift-pay', 'cod-1');

      expect(providerInitiate).not.toHaveBeenCalled(); // no gateway call
      expect(result.init.success).toBe(true);
      expect(result.payment.status).toBe('success'); // COD is success immediately
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: 'Confirmed', progress: 10 },
      });
    });

    it('throws INVALID_AMOUNT when amount is not positive', async () => {
      await expect(initiatePayment('u1', null, 0, 'card', 'paystack')).rejects.toThrow('INVALID_AMOUNT');
      await expect(initiatePayment('u1', null, -100, 'card', 'paystack')).rejects.toThrow('INVALID_AMOUNT');
      expect(db.payment.create).not.toHaveBeenCalled();
      expect(providerInitiate).not.toHaveBeenCalled();
    });

    it('throws REFERENCE_TAKEN when a caller-supplied reference already exists', async () => {
      db.payment.findUnique.mockResolvedValue({
        id: 'existing', reference: 'dup-1',
      });

      await expect(initiatePayment('u1', null, 1000, 'card', 'paystack', 'dup-1')).rejects.toThrow('REFERENCE_TAKEN');
    });
  });

  describe('verifyPayment', () => {
    it('returns true (verified=true) for a valid provider reference', async () => {
      providerVerify.mockResolvedValue({
        verified: true,
        amount: 5000,
        currency: 'NGN',
        providerTransactionId: 'psk-1',
      });

      const result = await verifyPayment('ref-1', 'paystack');

      expect(result.verified).toBe(true);
      expect(result.amount).toBe(5000);
      expect(providerVerify).toHaveBeenCalledWith('paystack', 'ref-1', undefined);
    });

    it('returns false (verified=false) for an invalid provider reference', async () => {
      providerVerify.mockResolvedValue({ verified: false });

      const result = await verifyPayment('bad-ref', 'paystack', 'tx-1');

      expect(result.verified).toBe(false);
      expect(providerVerify).toHaveBeenCalledWith('paystack', 'bad-ref', 'tx-1');
    });
  });

  describe('processWebhook', () => {
    it('updates a pending payment to "success" and confirms the linked order inside a $transaction', async () => {
      const payment = {
        id: 'p1', reference: 'ref-1', status: 'pending', amount: 5000,
        orderId: 'o1', userId: 'u1', createdAt: new Date(),
      };
      // Outer findUnique (used for the early-exit check).
      db.payment.findUnique
        .mockResolvedValueOnce(payment)
        // Inner findUnique inside the $transaction (idempotency re-check).
        .mockResolvedValueOnce({ status: 'pending' })
        // Final findUnique (re-fetch for the return value).
        .mockResolvedValueOnce({ ...payment, status: 'success', verifiedAmount: 5000 });
      db.payment.update.mockResolvedValue({ ...payment, status: 'success' });

      const result = await processWebhook('ref-1', 'success', 5000, 'NGN', 'psk-tx-1');

      expect(result.updated).toBe(true);
      expect(result.payment?.status).toBe('success');
      expect(db.$transaction).toHaveBeenCalledOnce();
      expect(db.payment.update).toHaveBeenCalledWith({
        where: { reference: 'ref-1' },
        data: expect.objectContaining({
          status: 'success',
          verifiedAmount: 5000,
          providerTransactionId: 'psk-tx-1',
          providerCurrency: 'NGN',
        }),
      });
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: 'Confirmed', progress: 10 },
      });
    });

    it('is idempotent — a second webhook for an already-success payment is a no-op (no $transaction, no update)', async () => {
      const alreadySuccess = {
        id: 'p1', reference: 'ref-1', status: 'success', amount: 5000, orderId: 'o1',
      };
      db.payment.findUnique.mockResolvedValue(alreadySuccess);

      const result = await processWebhook('ref-1', 'success', 5000, 'NGN', 'psk-tx-1');

      expect(result.updated).toBe(false);
      expect(result.reason).toBe('ALREADY_PROCESSED');
      expect(result.payment).toEqual(alreadySuccess);
      expect(db.$transaction).not.toHaveBeenCalled();
      expect(db.payment.update).not.toHaveBeenCalled();
    });

    it('returns { updated: false, payment: null } when the reference does not match any payment', async () => {
      db.payment.findUnique.mockResolvedValue(null);

      const result = await processWebhook('unknown-ref', 'success', 5000);

      expect(result.updated).toBe(false);
      expect(result.payment).toBeNull();
      expect(result.reason).toBe('PAYMENT_NOT_FOUND');
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('throws AMOUNT_MISMATCH when the verified amount differs from the stored amount by more than the tolerance', async () => {
      const payment = {
        id: 'p1', reference: 'ref-1', status: 'pending', amount: 5000,
        orderId: null, userId: 'u1',
      };
      db.payment.findUnique.mockResolvedValue(payment);

      // Difference of 5000 kobo (way over the 100-kobo tolerance).
      await expect(processWebhook('ref-1', 'success', 10000)).rejects.toThrow('AMOUNT_MISMATCH');
      expect(db.payment.update).not.toHaveBeenCalled();
      // Sanity check on the tolerance constant — guards against silent
      // changes to the threshold that would weaken this test.
      expect(AMOUNT_TOLERANCE_KOBO).toBe(100);
    });
  });

  describe('getPaymentByReference', () => {
    it('returns the payment row when found', async () => {
      const payment = { id: 'p1', reference: 'ref-1', status: 'success', amount: 5000 };
      db.payment.findUnique.mockResolvedValue(payment);

      const result = await getPaymentByReference('ref-1');

      expect(result).toEqual(payment);
      expect(db.payment.findUnique).toHaveBeenCalledWith({ where: { reference: 'ref-1' } });
    });

    it('returns null when the reference does not exist', async () => {
      db.payment.findUnique.mockResolvedValue(null);
      const result = await getPaymentByReference('ghost');
      expect(result).toBeNull();
    });
  });

  describe('listUserPayments', () => {
    it('returns paginated payments with metadata and respects page + limit', async () => {
      const payments = [
        { id: 'p1', userId: 'u1', amount: 5000, status: 'success', reference: 'r1' },
        { id: 'p2', userId: 'u1', amount: 2500, status: 'pending', reference: 'r2' },
      ];
      db.payment.findMany.mockResolvedValue(payments);
      db.payment.count.mockResolvedValue(15);

      const result = await listUserPayments('u1', 2, 5);

      expect(result.payments).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3); // ceil(15 / 5)
      expect(db.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        skip: 5, // (2 - 1) * 5
        take: 5,
      });
    });
  });

  describe('error handling', () => {
    it('propagates DB errors from initiatePayment instead of swallowing them', async () => {
      db.payment.findUnique.mockResolvedValue(null);
      providerInitiate.mockResolvedValue({ success: true, provider: 'paystack', reference: 'r' });
      db.payment.create.mockRejectedValue(new Error('db down'));

      await expect(initiatePayment('u1', null, 1000, 'card', 'paystack', 'r')).rejects.toThrow('db down');
    });

    it('propagates DB errors from processWebhook', async () => {
      db.payment.findUnique
        .mockResolvedValueOnce({ id: 'p1', reference: 'r', status: 'pending', amount: 1000, orderId: null })
        .mockResolvedValueOnce({ status: 'pending' });
      db.payment.update.mockRejectedValue(new Error('write failed'));

      await expect(processWebhook('r', 'failed')).rejects.toThrow('write failed');
    });
  });
});
