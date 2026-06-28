import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/* ──────────────────── Types ──────────────────── */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

/* ──────────────────── System Prompt Builder ──────────────────── */

function buildSystemPrompt(context?: ChatContext): string {
  const basePrompt = `You are Safa, an expert AI assistant for SwiftRamadan — a Ramadan food delivery super-app in Lagos, Nigeria. You specialize in Ramadan food & lifestyle guidance, Nigerian cuisine, and Islamic practices during Ramadan.

Core personality: Warm, knowledgeable, concise. Use occasional emojis. Reference Naira (₦) for prices. Keep responses under 120 words unless the user specifically asks for detail.

You can help with:
- Food recommendations for Iftar & Sahur (Nigerian and international cuisine)
- Meal planning and recipe suggestions
- Order tracking, delivery info, and promotions
- Islamic guidance during Ramadan (prayer times, Sunnah foods, etiquette)
- SwiftRewards, group buys, and payment options
- Dietary advice (halal, vegetarian, protein-rich for fasting)

Guidelines:
- Be culturally sensitive and respectful of Islamic traditions
- Suggest Sunnah foods (dates, water, honey) when relevant
- If near Maghrib time, proactively suggest Iftar meal options
- If near Fajr time, proactively suggest Sahur meal options
- Always give practical, actionable advice
- If you don't know something, be honest and redirect to what you can help with`;

  if (!context) return basePrompt;

  const contextParts: string[] = [basePrompt, '', '--- USER CONTEXT ---'];

  if (context.userName) {
    contextParts.push(`User's name: ${context.userName}`);
  }

  if (context.loyaltyTier) {
    contextParts.push(`Loyalty tier: ${context.loyaltyTier.charAt(0).toUpperCase() + context.loyaltyTier.slice(1)} member`);
  }

  if (context.swiftPoints !== undefined) {
    contextParts.push(`SwiftPoints balance: ${context.swiftPoints.toLocaleString()}`);
  }

  if (context.dietaryPrefs && context.dietaryPrefs.length > 0) {
    contextParts.push(`Dietary preferences: ${context.dietaryPrefs.join(', ')}`);
  }

  if (context.cartItems && context.cartItems.length > 0) {
    const cartSummary = context.cartItems.map(i => `${i.name} x${i.qty} (₦${i.price.toLocaleString()})`).join(', ');
    const cartTotal = context.cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    contextParts.push(`Current cart items: ${cartSummary}`);
    contextParts.push(`Cart total: ₦${cartTotal.toLocaleString()}`);
    contextParts.push('The user has items in their cart — you can reference these when making recommendations.');
  }

  if (context.recentOrders && context.recentOrders.length > 0) {
    const orderSummary = context.recentOrders.slice(0, 3).map(o => `${o.item} (${o.status})`).join(', ');
    contextParts.push(`Recent orders: ${orderSummary}`);
  }

  if (context.cartItems && context.cartItems.length > 0 || context.recentOrders && context.recentOrders.length > 0) {
    contextParts.push('Use this context to personalize your responses. Reference their cart or orders when relevant.');
  }

  return contextParts.join('\n');
}

/* ──────────────────── POST Handler ──────────────────── */

export async function POST(request: NextRequest) {
  // Rate limit: 20 AI requests per minute per IP
  const rateLimited = checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const message = body.message as string;
    const messages = body.messages as ChatMessage[] | undefined;
    const context = body.context as ChatContext | undefined;

    // Support both single message (backward compat) and multi-turn
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation history for the LLM
    const systemPrompt = buildSystemPrompt(context);
    const conversationMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided (multi-turn)
    if (messages && Array.isArray(messages) && messages.length > 0) {
      // Keep last 10 messages to stay within token limits
      const recentMessages = messages.slice(-10);
      for (const msg of recentMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          conversationMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current message
    conversationMessages.push({ role: 'user', content: message });

    // Try LLM SDK first
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const response = await zai.chat.completions.create({
        messages: conversationMessages,
      });
      const reply = response.choices[0].message.content;
      return NextResponse.json({ reply });
    } catch (llmError) {
      // Log LLM failure for monitoring
      console.warn('[Chat API] LLM failed, falling back to keyword matcher:', llmError);
      // Fallback to keyword matcher
      const reply = findBestResponse(message);
      return NextResponse.json({ reply });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
