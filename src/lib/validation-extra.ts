import { z } from 'zod';

/* ─────────────────────────────────────────────────────────────────────
 * validation-extra.ts — Zod schemas owned by FIX-F agent.
 *
 * DO NOT edit `src/lib/validation.ts` (owned by Agent G). All new schemas
 * introduced for the rate-limit + Zod rollout live here so concurrent agents
 * don't collide on the shared validation module.
 *
 * Schemas are deliberately lenient (`.passthrough()` or many optional
 * fields) because the goal of FIX-F is to *wrap* existing route bodies
 * with input validation — not to change the routes' existing logic or
 * response shape. Unknown keys are kept so legacy callers don't break.
 * ───────────────────────────────────────────────────────────────────── */

/* ───────────────────── Pantry ───────────────────── */

export const pantryItemSchema = z.object({
  email: z.string().optional().default('guest'),
  name: z.string().min(1).max(100),
  category: z.string().default('other'),
  quantity: z.union([z.string(), z.number()]).default('1'),
  unit: z.string().default('pcs'),
  expiresAt: z
    .union([z.string(), z.number(), z.date()])
    .nullable()
    .optional(),
}).passthrough();

/* ───────────────────── Wishlist ───────────────────── */

export const wishlistItemSchema = z.object({
  userId: z.string().min(1),
  productId: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  price: z.number().nonnegative().default(0),
  image: z.string().optional().default(''),
}).passthrough();

/* ───────────────────── Settings ───────────────────── */

export const settingsSchema = z.object({
  email: z.string().email(),
  notificationsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  language: z.string().max(10).optional(),
  currency: z.string().max(10).optional(),
  theme: z.string().max(20).optional(),
}).passthrough();

/* ───────────────────── Follow ───────────────────── */

export const followSchema = z.object({
  followerId: z.string().min(1),
  followeeId: z.string().min(1),
}).passthrough();

/* ───────────────────── Chat (/api/chat — Safa assistant) ─────────────────────
 * NOTE: /api/chat takes `{ message: string }` — NOT the chat-room shape
 * (that's `chatMessageSchema` in validation.ts, used by /api/messages).
 */
export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
}).passthrough();

/* ───────────────────── AI Recipe ─────────────────────
 * /api/ai-recipe accepts `{ prompt: string, dietaryPrefs?: string[] }`.
 * Both fields are optional in practice — empty prompt falls back to a
 * hardcoded recipe. Schema uses `.optional()` to preserve that behavior.
 */
export const aiRecipeSchema = z.object({
  prompt: z.string().max(2000).optional(),
  dietaryPrefs: z.array(z.string()).optional(),
}).passthrough();

/* ───────────────────── Group Buy ───────────────────── */

export const groupBuyJoinSchema = z.object({
  userId: z.string().optional(),
  groupBuyId: z.union([z.string(), z.number()]),
}).passthrough();

/* ───────────────────── Payments ─────────────────────
 * `method` is intentionally `z.string().optional()` (NOT a strict enum) so we
 * preserve the existing route behaviour of falling back to `'card'` for
 * unrecognised values rather than 400-ing the caller.
 */
export const paymentSchema = z.object({
  orderId: z.string().optional(),
  userId: z.string().optional(),
  amount: z.number().positive(),
  method: z.string().optional(),
  reference: z.string().min(1).optional(),
}).passthrough();

/* ───────────────────── Rider update (toggle online) ───────────────────── */

export const riderUpdateSchema = z.object({
  email: z.string().email(),
  online: z.boolean().optional(),
}).passthrough();

/* ───────────────────── Vendor profile update ─────────────────────
 * `email` is optional at the schema level — only `toggle-online` requires it
 * (the route enforces that in-branch). `withdraw` does not strictly need an
 * email, so we can't require it globally without breaking the existing
 * behaviour.
 */
export const vendorUpdateSchema = z.object({
  action: z.enum(['toggle-online', 'withdraw']).optional(),
  email: z.string().email().optional(),
  online: z.boolean().optional(),
  amount: z.number().nonnegative().optional(),
}).passthrough();

/* ───────────────────── User profile update ─────────────────────
 * /api/user PUT supports many actions (`switch-role`, general update) and
 * many fields. We only enforce `email` is present and well-formed; the
 * route's existing allow-list handles the rest.
 */
export const userUpdateSchema = z.object({
  email: z.string().email(),
}).passthrough();

/* ───────────────────── Video comment ───────────────────── */

export const videoCommentSchema = z.object({
  authorName: z.string().min(1).max(100),
  authorHandle: z.string().max(100).optional().default(''),
  authorAvatar: z.string().optional().default(''),
  content: z.string().min(1).max(500),
}).passthrough();
