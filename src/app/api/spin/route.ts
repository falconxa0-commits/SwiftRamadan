import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';

// Prize definitions with probabilities
const PRIZES = [
  { id: 1, type: 'discount', value: 500, label: '₦500 Off', probability: 0.20 },
  { id: 2, type: 'swiftPoints', value: 50, label: '50 SwiftPoints', probability: 0.20 },
  { id: 3, type: 'freeDelivery', value: 1, label: 'Free Delivery', probability: 0.10 },
  { id: 4, type: 'discount', value: 1000, label: '₦1,000 Off', probability: 0.10 },
  { id: 5, type: 'swiftPoints', value: 100, label: '100 SwiftPoints', probability: 0.10 },
  { id: 6, type: 'multiplier', value: 2, label: '2x Points Tomorrow', probability: 0.10 },
  { id: 7, type: 'discount', value: 2500, label: '₦2,500 Off', probability: 0.05, rare: true },
  { id: 8, type: 'jackpot', value: 500, label: '500pts + ₦500 Off', probability: 0.05, jackpot: true },
];

// In-memory rate limiting (per IP, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); // 1 minute window
    return true;
  }

  if (entry.count >= 5) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

// Probability engine — server-side only, cannot be manipulated by client
function spinWheel(): (typeof PRIZES)[number] {
  const random = Math.random();
  let cumulative = 0;

  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) {
      return prize;
    }
  }

  // Fallback to first prize (should rarely happen due to floating point)
  return PRIZES[0];
}

// GET: Returns spin status — reads from database
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait a moment.' },
      { status: 429 },
    );
  }

  // Auth is optional for GET - allow viewing spin status without login
  // but prefer authenticated user data
  const auth = await requireAuth(request).catch(() => null);

  let lastSpinDate = '';
  let spinStreakNum = 0;

  if (auth && !(auth instanceof NextResponse)) {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { lastSpinDate: true, spinStreak: true },
    });
    if (user) {
      lastSpinDate = user.lastSpinDate;
      spinStreakNum = parseInt(user.spinStreak || '0', 10);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const canSpin = lastSpinDate !== today;

  // Calculate if streak bonus applies (3+ consecutive days)
  const hasStreakBonus = spinStreakNum >= 3;

  return NextResponse.json({
    canSpin,
    lastSpinDate,
    streak: spinStreakNum,
    hasStreakBonus,
    prizes: PRIZES.map(p => ({
      id: p.id,
      type: p.type,
      value: p.value,
      label: p.label,
      rare: p.rare || false,
      jackpot: p.jackpot || false,
    })),
  });
}

// POST: Perform a spin — validates against database, not client body
// FIXED: Now requires authentication and uses transaction to prevent race conditions
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait a moment.' },
      { status: 429 },
    );
  }

  // REQUIRE AUTHENTICATION - prevent unauthorized spins
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = auth.userId;

    // Use transaction to prevent TOCTOU race condition on daily spin limit
    const result = await db.$transaction(async (tx) => {
      // Fetch user's current spin state within transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, lastSpinDate: true, spinStreak: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const lastSpinDate = user.lastSpinDate;
      const currentStreak = parseInt(user.spinStreak || '0', 10);

      // Validate: can only spin once per day (server-side check from DB)
      if (lastSpinDate === today) {
        throw new Error('ALREADY_SPUN');
      }

      // Calculate streak based on DB lastSpinDate
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak: number;
      if (lastSpinDate === yesterdayStr) {
        // Consecutive day
        newStreak = currentStreak + 1;
      } else if (lastSpinDate === '') {
        // First spin ever
        newStreak = 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      // Spin the wheel (server-side probability)
      const prize = spinWheel();

      // Apply streak bonus: if 3+ days in a row, double points prizes
      let finalPrize = { ...prize };
      if (newStreak >= 3 && (prize.type === 'swiftPoints' || prize.type === 'jackpot')) {
        finalPrize = {
          ...prize,
          value: prize.value * 2,
          label: prize.label + ' (2x Streak!)',
        };
      }

      // Update database atomically - prevents concurrent spins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          lastSpinDate: today,
          spinStreak: String(newStreak),
        },
      });

      // Award swiftPoints if the prize is for points
      if (finalPrize.type === 'swiftPoints') {
        await tx.user.update({
          where: { id: userId },
          data: { swiftPoints: { increment: finalPrize.value } },
        });
      } else if (finalPrize.type === 'jackpot') {
        // Jackpot awards both points and discount
        await tx.user.update({
          where: { id: userId },
          data: { swiftPoints: { increment: finalPrize.value } },
        });
      }

      return { finalPrize, newStreak, updatedUser };
    });

    return NextResponse.json({
      prize: {
        id: result.finalPrize.id,
        type: result.finalPrize.type,
        value: result.finalPrize.value,
        label: result.finalPrize.label,
        rare: result.finalPrize.rare || false,
        jackpot: result.finalPrize.jackpot || false,
      },
      canSpin: false,
      streak: result.newStreak,
      spinDate: today,
      lastSpinDate: today,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (err instanceof Error && err.message === 'ALREADY_SPUN') {
      return NextResponse.json(
        { error: 'Already spun today. Come back tomorrow!', canSpin: false },
        { status: 400 },
      );
    }
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/spin' },
    });
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  }
}
