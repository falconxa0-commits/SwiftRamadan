import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message as string;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const reply = findBestResponse(message);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
