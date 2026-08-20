import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';

const MEAL_OPTIONS = [
  { id: 'light', name: 'Light Iftar', price: 2000, description: 'Dates, water, fruit & small snack', icon: '🫒' },
  { id: 'standard', name: 'Standard Iftar', price: 3500, description: 'Rice, chicken, salad & drink', icon: '🍛' },
  { id: 'hearty', name: 'Hearty Iftar', price: 5000, description: 'Full meal with appetizer, main & dessert', icon: '🍖' },
  { id: 'family', name: 'Family Iftar', price: 7500, description: 'Meal for 2-3 people with variety', icon: '👨‍👩‍👧' },
  { id: 'feast', name: 'Grand Feast', price: 10000, description: 'Premium feast for a blessed Ramadan night', icon: '✨' },
];

// In-memory gift chain data (fallback)
interface GiftRecord {
  id: string;
  mealId: string;
  message: string;
  city: string;
  amount: number;
  timestamp: string;
}

const giftChains = new Map<string, { count: number; meals: number; totalAmount: number; recentGifts: GiftRecord[] }>();

// Initialize some cities
const CITIES = ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'];
CITIES.forEach(city => {
  const baseCount = Math.floor(Math.random() * 500) + 200;
  giftChains.set(city, {
    count: baseCount,
    meals: baseCount + Math.floor(Math.random() * 100),
    totalAmount: baseCount * 3500,
    recentGifts: [],
  });
});

// GET: Returns chain stats and meal options
export async function GET() {
  // Try DB for gift meal stats
  let dbGifts: { id: string; senderName: string; mealName: string; mealPrice: number; status: string; createdAt: Date }[] = [];
  try {
    dbGifts = await db.giftMeal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    // fallback
  }

  const chainStats = Array.from(giftChains.entries()).map(([city, data]) => ({
    city,
    count: data.count,
    meals: data.meals,
    totalAmount: data.totalAmount,
  }));

  // Sort by count
  chainStats.sort((a, b) => b.count - a.count);

  // Add DB data to chain stats
  if (dbGifts.length > 0) {
    chainStats[0] = {
      ...chainStats[0],
      count: chainStats[0].count + dbGifts.length,
      meals: chainStats[0].meals + dbGifts.length,
      totalAmount: chainStats[0].totalAmount + dbGifts.reduce((s, g) => s + g.mealPrice, 0),
    };
  }

  // Total across all cities
  const totalGifts = chainStats.reduce((sum, c) => sum + c.count, 0);
  const totalMeals = chainStats.reduce((sum, c) => sum + c.meals, 0);

  return NextResponse.json({
    meals: MEAL_OPTIONS,
    chains: chainStats,
    total: {
      gifts: totalGifts,
      meals: totalMeals,
      cities: CITIES.length,
    },
  });
}

// POST: Send a gift
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await request.json();
    const { mealId, message, city = 'Lagos', senderId = 'default-user', senderName = 'Anonymous', recipientName = 'A fellow Muslim' } = body;

    const meal = MEAL_OPTIONS.find(m => m.id === mealId);
    if (!meal) {
      return NextResponse.json(
        { error: 'Invalid meal option' },
        { status: 400 }
      );
    }

    if (!city || !CITIES.includes(city)) {
      return NextResponse.json(
        { error: 'Invalid city' },
        { status: 400 }
      );
    }

    // Write to DB
    try {
      await db.giftMeal.create({
        data: {
          senderId,
          senderName,
          recipientName,
          message: message || 'A fellow Muslim gifted you Iftar 🌙',
          mealName: meal.name,
          mealPrice: meal.price,
          mealImage: meal.icon,
          status: 'pending',
        },
      });
    } catch {
      // Silently continue
    }

    // Update in-memory chain
    const chain = giftChains.get(city) || { count: 0, meals: 0, totalAmount: 0, recentGifts: [] };
    chain.count += 1;
    chain.meals += 1;
    chain.totalAmount += meal.price;
    chain.recentGifts = [{
      id: `gift-${Date.now()}`,
      mealId,
      message: message || 'A fellow Muslim gifted you Iftar 🌙',
      city,
      amount: meal.price,
      timestamp: new Date().toISOString(),
    }, ...chain.recentGifts].slice(0, 10);
    giftChains.set(city, chain);

    return NextResponse.json({
      success: true,
      gift: {
        id: `gift-${Date.now()}`,
        meal: meal.name,
        amount: meal.price,
        city,
        message: message || 'A fellow Muslim gifted you Iftar 🌙',
      },
      chain: {
        city,
        count: chain.count,
        meals: chain.meals,
      },
      total: {
        gifts: Array.from(giftChains.values()).reduce((sum, c) => sum + c.count, 0),
        meals: Array.from(giftChains.values()).reduce((sum, c) => sum + c.meals, 0),
      },
      recipientMessage: 'A fellow Muslim gifted you Iftar 🌙',
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
