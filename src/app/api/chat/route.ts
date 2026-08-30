import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';
import { aiRequest } from '@/ai/gateway';
import { checkBodySize } from '@/lib/validation';

/* ──────────────────── Types ──────────────────── */

interface ChatContext {
  userName?: string;
  cartItems?: { name: string; qty: number; price: number }[];
  recentOrders?: { id: string; item: string; status: string }[];
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  swiftPoints?: number;
  dietaryPrefs?: string[];
}

/* ──────────────────── Keyword Fallback ──────────────────── */

const ramadanResponses: Record<string, string> = {
  iftar: "Our Iftar meals are freshly prepared and delivered before Maghrib! Try our Jollof Rice & Chicken combo for ₦4,500 or the Family Iftar Bundle for ₦17,500. Would you like to order? 🌙",
  sahur: "Sahur boxes are available for pre-order! Our Date & Nut Smoothie and Overnight Oats are popular choices. Order before 3 AM for early morning delivery. 🌟",
  dates: "We have premium Ajwa and Medjool dates starting from ₦3,500. Our Premium Dates Box is on flash sale at 38% off! Hurry, sale ends soon! 📦",
  delivery: "We offer free delivery on orders above ₦5,000! Your rider will be assigned once your order is confirmed. Iftar-timed delivery ensures your meal arrives before Maghrib. 🚴",
  order: "You can track your order in real-time on the Orders tab. Your current order SWR-2847 is in transit with Ibrahim M. and should arrive in 15 minutes! 📍",
  reward: "You're a Gold Member with 4,250 SwiftPoints! You need 3,250 more points to reach Platinum. Earn 2x points during Ramadan on all group buys! ⭐",
  promo: "Current promotions: 30% off all Dates & Fruit Boxes, Flash Sale on Premium Dates Box at ₦7,500, and Group Buy savings on Groceries! 🎉",
  ramadan: "Ramadan Mubarak! 🌙 We have special Iftar & Sahur boxes, group buy deals for families, and timed delivery before Maghrib. How can I help you today?",
  help: "I can help you with: ordering food, tracking deliveries, checking promotions, SwiftRewards points, group buys, and more! Just ask! 😊",
  hello: "Wa alaikum salam! Welcome to SwiftRamadan! 🌙 I'm Safa, your AI assistant. I can help with orders, deals, delivery tracking, and more. What would you like to know?",
  hi: "Hey there! 👋 Welcome to SwiftRamadan! How can I assist you today? I can help with orders, deals, and more!",
  price: "Our prices start from ₦1,800 for drinks up to ₦25,000 for premium bundles. The Ramadan Box is currently on sale at ₦17,500 (30% off)! 💰",
  group: "Group Buys let you save up to 40% when you order with others! Your current Groceries group buy is 80% filled. Tap the Offers tab to see all active group buys. 👥",
  payment: "We accept card payments, bank transfers, USSD, and cash on delivery. SwiftPay is our fastest option - save your card for one-tap checkout! 💳",
  cancel: "To cancel an order, go to the Orders tab and tap on the active order. You can cancel within 5 minutes of placing the order for a full refund. Cancellations after preparation begins may incur a fee. 🔄",
  recipe: "Looking for recipe ideas? 🍳 I can suggest Ramadan favorites like Pepper Soup, Moin Moin, or Suya wraps. Want me to generate a custom recipe with what you have? 🌿",
  prayer: "Prayer times vary by location, but in Lagos today: Fajr ~5:15 AM, Dhuhr ~12:45 PM, Asr ~3:55 PM, Maghrib ~6:40 PM, Isha ~8:00 PM. Check the Prayer Times modal for precise times! 🕌",
};

function findBestResponse(input: string): string {
  const lowerInput = input.toLowerCase();

  for (const [keyword, response] of Object.entries(ramadanResponses)) {
    if (lowerInput.includes(keyword)) {
      return response;
    }
  }

  return "I'm here to help! You can ask me about Iftar meals, Sahur boxes, delivery times, promotions, SwiftRewards, group buys, or anything else about SwiftRamadan. 🌙";
}

/* ──────────────────── POST Handler ──────────────────── */

export async function POST(request: NextRequest) {
  // Rate limit: 20 AI requests per minute per IP
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  // Auth required — AI route (Phase 3 — secure AI routes)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const bodyResult = await checkBodySize(request);
  if (bodyResult.tooLarge) return bodyResult.response;

  try {
    const body = JSON.parse(bodyResult.body);
    const message = sanitizePromptInput(body.message as string);
    const context = body.context as ChatContext | undefined;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // PHASE-6-2: this route now goes through the unified AI gateway
    // (`@/ai/gateway`). The gateway owns the Safa system prompt, Redis-backed
    // multi-turn conversation memory (keyed by `auth.userId`), input
    // sanitization (defence in depth — we already sanitized above), token
    // budget enforcement, model call, and output validation.
    //
    // The client-supplied `messages` array (legacy multi-turn) is no longer
    // read here: the gateway reconstructs history from Redis, so multi-turn
    // works without the client echoing back the prior transcript. The
    // `context` payload is mapped onto the gateway's supported context
    // fields (`userName`, `loyaltyTier`, `dietaryPrefs`, `cartItems`).
    const gatewayContext: Record<string, unknown> = {};
    if (context) {
      if (context.userName) gatewayContext.userName = context.userName;
      if (context.loyaltyTier) gatewayContext.loyaltyTier = context.loyaltyTier;
      if (context.dietaryPrefs && context.dietaryPrefs.length > 0) {
        gatewayContext.dietaryPrefs = context.dietaryPrefs;
      }
      if (context.cartItems && context.cartItems.length > 0) {
        gatewayContext.cartItems = context.cartItems;
      }
    }

    const result = await aiRequest({
      userId: auth.userId,
      userRole: auth.role,
      message,
      context: Object.keys(gatewayContext).length > 0 ? gatewayContext : undefined,
      maxTokens: 500,
    });

    if (!result.success || !result.response) {
      // Gateway refused (budget / injection / model error). Fall back to the
      // keyword matcher so the UI keeps working.
      console.warn('[Chat API] Gateway failed, using keyword fallback:', result.error);
      const reply = findBestResponse(message);
      return NextResponse.json({ reply });
    }

    return NextResponse.json({ reply: result.response });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
