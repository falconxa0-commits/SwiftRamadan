import { NextRequest, NextResponse } from 'next/server';
import { captureException } from '@/lib/monitoring/sentry';

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

// Server-side spin state store keyed by user email
// This prevents clients from tampering with lastSpinDate or spinStreak
const spinStateStore = new Map<string, { lastSpinDate: string; spinStreak: number }>();

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

// GET: Returns spin status — reads from server-side store
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait a moment.' },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';

  // Look up spin state from server-side store
  const spinState = email ? (spinStateStore.get(email) || { lastSpinDate: '', spinStreak: 0 }) : { lastSpinDate: '', spinStreak: 0 };

  const today = new Date().toISOString().split('T')[0];
  const canSpin = spinState.lastSpinDate !== today;

  // Calculate if streak bonus applies (3+ consecutive days)
  const hasStreakBonus = spinState.spinStreak >= 3;

  return NextResponse.json({
    canSpin,
    lastSpinDate: spinState.lastSpinDate,
    streak: spinState.spinStreak,
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

// POST: Perform a spin — validates against server-side store, not client body
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait a moment.' },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Look up spin state from server-side store
    const spinState = spinStateStore.get(email) || { lastSpinDate: '', spinStreak: 0 };

    // Validate: can only spin once per day (server-side check, not client-supplied)
    if (spinState.lastSpinDate === today) {
      return NextResponse.json(
        { error: 'Already spun today. Come back tomorrow!', canSpin: false },
        { status: 400 },
      );
    }

    // Calculate streak based on server-side lastSpinDate
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak: number;
    if (spinState.lastSpinDate === yesterdayStr) {
      // Consecutive day
      newStreak = spinState.spinStreak + 1;
    } else if (spinState.lastSpinDate === '') {
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

    // Update server-side store after successful spin
    spinStateStore.set(email, { lastSpinDate: today, spinStreak: newStreak });

    return NextResponse.json({
      prize: {
        id: finalPrize.id,
        type: finalPrize.type,
        value: finalPrize.value,
        label: finalPrize.label,
        rare: finalPrize.rare || false,
        jackpot: finalPrize.jackpot || false,
      },
      canSpin: false,
      streak: newStreak,
      spinDate: today,
      lastSpinDate: today,
    });
  } catch (err) {
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/spin' },
    });
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  }
}
