import { z } from 'zod';

/* ───────────────────────────── Auth ───────────────────────────── */

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number too short'),
  // Password optional to preserve existing signup flow (which doesn't send a
  // password). When provided, it must be at least 6 characters.
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  role: z.enum(['customer', 'vendor', 'rider']),
});

/* ─────────────────────────── Products ─────────────────────────── */

export const productCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().default(''),
  price: z.number().int().positive(),
  salePrice: z.number().int().positive().optional(),
  image: z.string().url().optional().or(z.literal('')),
  category: z.string().default('meals'),
  deliveryTime: z.string().default('30 min'),
  vendorId: z.string().optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

/* ─────────────────────────── Orders ──────────────────────────── */

export const orderCreateSchema = z.object({
  status: z.string().default('Preparing'),
  total: z.number().int().positive(),
  riderName: z.string().nullable().optional(),
  items: z.array(z.object({
    name: z.string(),
    qty: z.number().int().positive(),
    price: z.number().int().nonnegative(),
  })),
  progress: z.number().int().min(0).max(100).default(0),
  userId: z.string().optional(),
});

export const orderUpdateSchema = z.object({
  id: z.string(),
  status: z.enum(['Preparing', 'Confirmed', 'Ready', 'In Transit', 'Delivered', 'Cancelled']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  riderName: z.string().nullable().optional(),
});

/* ─────────────────────────── Reviews ─────────────────────────── */

export const reviewSchema = z.object({
  productId: z.string().optional(),
  orderId: z.string().optional(),
  userId: z.string().optional(),
  authorName: z.string().min(1),
  authorAvatar: z.string().optional().default(''),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().default(''),
  targetType: z.enum(['product', 'rider', 'vendor']).default('product'),
  targetId: z.string().optional(),
});

/* ─────────────────────────── Addresses ───────────────────────── */

export const addressSchema = z.object({
  userId: z.string(),
  label: z.string().min(1).max(50),
  address: z.string().min(5).max(200),
  area: z.string().optional().default(''),
  city: z.string().default('Lagos'),
  instructions: z.string().max(300).optional().default(''),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().default(false),
});

/* ─────────────────────────── Coupons ─────────────────────────── */

export const couponValidateSchema = z.object({
  code: z.string().min(3).max(20),
  cartTotal: z.number().int().nonnegative(),
});

/* ───────────────────────── Chat messages ─────────────────────── */

export const chatMessageSchema = z.object({
  roomId: z.string().min(1),
  senderId: z.string().nullable().optional(),
  senderName: z.string().min(1),
  senderRole: z.enum(['customer', 'vendor', 'rider']).default('customer'),
  content: z.string().min(1).max(1000),
});

/* ─────────────────────────── Videos ──────────────────────────── */

export const videoCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional().default(''),
  videoUrl: z.string().url('Must be a valid URL'),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  authorName: z.string().min(1),
  authorHandle: z.string().optional().default(''),
  authorAvatar: z.string().optional().default(''),
  category: z.enum(['cooking', 'iftar', 'sahur', 'tips', 'reviews']).default('cooking'),
  duration: z.number().int().nonnegative().default(0),
});

/* ─────────────────────────── Cart ────────────────────────────── */

export const cartItemSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  image: z.string().optional().default(''),
  quantity: z.number().int().positive().default(1),
  sessionId: z.string().optional().default('default'),
  userId: z.string().optional(),
});

/* ─────────────────────────── Helper ──────────────────────────── */

export const communityPostSchema = z.object({
  authorName: z.string().min(1).max(100).default('Anonymous'),
  authorInitial: z.string().max(5).default('U'),
  authorEmail: z.string().email().optional(),
  category: z.string().max(50).default('General'),
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const communityCommentSchema = z.object({
  postId: z.string().min(1),
  authorName: z.string().min(1).max(100).default('Anonymous'),
  authorInitial: z.string().max(5).default('U'),
  authorEmail: z.string().email().optional(),
  content: z.string().min(1).max(1000),
});

export const communityLikeSchema = z.object({
  postId: z.string().min(1),
  authorEmail: z.string().email().optional(),
});

export const pantryItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(50).default('other'),
  quantity: z.union([z.string(), z.number()]).default('1'),
  unit: z.string().max(20).default('pcs'),
  expiresAt: z.string().optional(),
});

export const cookingSessionSchema = z.object({
  recipeName: z.string().min(1).max(200).default('Untitled Recipe'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  durationSec: z.number().int().nonnegative().default(0),
  completed: z.boolean().default(false),
  usedLiveAI: z.boolean().default(false),
});

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

/**
 * Validate `data` against a Zod schema.
 * On success returns `{ success: true, data }` with the parsed/transformed value.
 * On failure returns `{ success: false, response }` containing a ready-to-return
 * HTTP 400 Response (JSON body with `{ success, message, errors }`).
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const body = JSON.stringify({
      success: false,
      message: 'Validation error',
      errors: result.error.flatten().fieldErrors,
    });
    return {
      success: false,
      response: new Response(body, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { success: true, data: result.data };
}

/* ──────────────────── Body Size Limit ──────────────────── */

const DEFAULT_MAX_BODY_BYTES = 1_000_000; // 1 MB

/**
 * Check that a request's body does not exceed a maximum size.
 * Reads the body as text first (up to maxBytes + 1), then returns it
 * for the caller to parse. Returns a 413 Response if the body is too large.
 *
 * Usage:
 * ```ts
 * const bodyResult = await checkBodySize(request);
 * if (bodyResult.tooLarge) return bodyResult.response!;
 * const data = JSON.parse(bodyResult.body!);
 * ```
 */
export async function checkBodySize(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<{ tooLarge: false; body: string } | { tooLarge: true; response: Response }> {
  try {
    const reader = request.body?.getReader();
    if (!reader) {
      return { tooLarge: false, body: '' };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        // Cancel the stream and return 413
        reader.cancel();
        return {
          tooLarge: true,
          response: new Response(
            JSON.stringify({
              success: false,
              message: `Request body too large. Maximum size is ${Math.round(maxBytes / 1000)}KB.`,
            }),
            { status: 413, headers: { 'Content-Type': 'application/json' } },
          ),
        };
      }
    }

    // Reconstruct the body string
    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return { tooLarge: false, body: new TextDecoder().decode(combined) };
  } catch {
    return { tooLarge: false, body: '' };
  }
}
