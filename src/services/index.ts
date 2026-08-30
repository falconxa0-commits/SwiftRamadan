/**
 * Service Layer — barrel export for all SwiftRamadan business-logic services.
 *
 * Phase 2 of the Repair Swarm: extract business logic out of API routes into
 * pure, testable services. Routes remain thin HTTP adapters (auth, rate
 * limiting, response shaping); services own invariants and data access.
 *
 * Each service is independently importable:
 *   - `auth`   → {@link import('./auth/auth.service')}
 *   - `orders` → {@link import('./orders/orders.service')}
 *   - `payments` → {@link import('./payments/payments.service')}
 *   - `users`  → {@link import('./users/users.service')}
 *   - `wallet` → {@link import('./wallet/wallet.service')}
 *   - `ai`     → {@link import('./ai/ai.service')}
 *
 * @module services
 */

export * as authService from './auth/auth.service';
export * as ordersService from './orders/orders.service';
export * as paymentsService from './payments/payments.service';
export * as usersService from './users/users.service';
export * as walletService from './wallet/wallet.service';
export * as aiService from './ai/ai.service';

// Re-export the most commonly used types so callers can do a single import:
//   import { authService, type PublicUser } from '@/services';
export type { PublicUser, UserRole, LoginResult, SignupResult, SignupCustomerInput } from './auth/auth.service';
export type { ParsedOrder, PaginatedOrders, OrderItem, CreateOrderResult } from './orders/orders.service';
export type {
  InitiatePaymentResult,
  PaginatedPayments,
  WebhookProcessResult,
} from './payments/payments.service';
export type { UserStats, UpdateProfileInput, AllowedProfileField } from './users/users.service';
export type {
  PaginatedWalletHistory,
  WalletMutationResult,
} from './wallet/wallet.service';
export type {
  ChatMessage,
  ChatRole,
  ChatContext,
  SendMessageResult,
} from './ai/ai.service';
