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

/* ─────────────────────────── Helper ──────────────────────────── */

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
