import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

function buildAchievements(opts: {
  totalSessions: number;
  completedSessions: number;
  totalCookTimeMins: number;
  liveAIUses: number;
  distinctDays: number;
  distinctRecipes: number;
  anyQuick: boolean;
}): Achievement[] {
  const {
    totalSessions,
    completedSessions,
    totalCookTimeMins,
    liveAIUses,
    distinctDays,
    distinctRecipes,
    anyQuick,
  } = opts;
  return [
    {
      id: 'first-dish',
      title: 'First Dish',
      desc: 'Cook your first meal',
      unlocked: totalSessions >= 1,
      icon: '🍳',
    },
    {
      id: 'dedicated',
      title: 'Dedicated Cook',
      desc: 'Complete 5 cooking sessions',
      unlocked: completedSessions >= 5,
      icon: '⭐',
    },
    {
      id: 'marathon',
      title: 'Marathon Chef',
      desc: 'Cook for 120+ minutes total',
      unlocked: totalCookTimeMins >= 120,
      icon: '🏃',
    },
    {
      id: 'live-ai',
      title: 'Live AI Pioneer',
      desc: 'Use Live AI coaching once',
      unlocked: liveAIUses >= 1,
      icon: '🤖',
    },
    {
      id: 'week-warrior',
      title: 'Week Warrior',
      desc: 'Cook on 5+ distinct days',
      unlocked: distinctDays >= 5,
      icon: '⚔️',
    },
    {
      id: 'master-chef',
      title: 'Master Chef',
      desc: 'Complete 20 cooking sessions',
      unlocked: completedSessions >= 20,
      icon: '👨‍🍳',
    },
    {
      id: 'quick-fire',
      title: 'Quick Fire',
      desc: 'Finish a session in under 10 minutes',
      unlocked: anyQuick,
      icon: '🔥',
    },
    {
      id: 'explorer',
      title: 'Explorer',
      desc: 'Try 5+ different recipes',
      unlocked: distinctRecipes >= 5,
      icon: '🧭',
    },
  ];
}

function emptyAnalytics() {
  return {
    totalSessions: 0,
    completedSessions: 0,
    totalCookTimeMins: 0,
    avgSessionMins: 0,
    liveAIUses: 0,
    lastCooked: null as string | null,
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
    weeklyData: [
      { day: 'Mon', count: 0, mins: 0 },
      { day: 'Tue', count: 0, mins: 0 },
      { day: 'Wed', count: 0, mins: 0 },
      { day: 'Thu', count: 0, mins: 0 },
      { day: 'Fri', count: 0, mins: 0 },
      { day: 'Sat', count: 0, mins: 0 },
      { day: 'Sun', count: 0, mins: 0 },
    ],
    achievements: buildAchievements({
      totalSessions: 0,
      completedSessions: 0,
      totalCookTimeMins: 0,
      liveAIUses: 0,
      distinctDays: 0,
      distinctRecipes: 0,
      anyQuick: false,
    }),
  };
}

// POST /api/cooking-sessions  body: { email, recipeName, difficulty, durationSec, completed, usedLiveAI }
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const email = body?.email || 'guest';

    const session = await db.cookingSession.create({
      data: {
        ownerEmail: email,
        recipeName: String(body?.recipeName || 'Untitled Recipe'),
        difficulty: String(body?.difficulty || 'medium'),
        durationSec: Number(body?.durationSec ?? 0) || 0,
        completed: Boolean(body?.completed ?? false),
        usedLiveAI: Boolean(body?.usedLiveAI ?? false),
      },
    });

    return NextResponse.json({ ok: true, session }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to log session';
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/cooking-sessions' },
    });
    return NextResponse.json(
      { ok: true, session: null, error: msg },
      { status: 200 },
    );
  }
}

// GET /api/cooking-sessions?email=foo@bar.com
// Returns full analytics + gamified achievements. Always 200.
export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const email = request.nextUrl.searchParams.get('email') || 'guest';
  try {
    const sessions = await db.cookingSession.findMany({
      where: { ownerEmail: email },
      orderBy: { createdAt: 'desc' },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.completed).length;
    const totalCookTimeSec = sessions.reduce(
      (sum, s) => sum + (s.durationSec || 0),
      0,
    );
    const totalCookTimeMins = Math.round(totalCookTimeSec / 60);
    const avgSessionMins =
      totalSessions > 0 ? Math.round(totalCookTimeMins / totalSessions) : 0;
    const liveAIUses = sessions.filter((s) => s.usedLiveAI).length;
    const lastCooked =
      sessions.length > 0 ? sessions[0].createdAt.toISOString() : null;

    const difficultyBreakdown = {
      easy: sessions.filter((s) => s.difficulty === 'easy').length,
      medium: sessions.filter((s) => s.difficulty === 'medium').length,
      hard: sessions.filter((s) => s.difficulty === 'hard').length,
    };

    // Last 7 days (including today)
    const now = new Date();
    const dayBuckets = new Map<string, { count: number; mins: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dayBuckets.set(key, { count: 0, mins: 0 });
    }

    const distinctDays = new Set<string>();
    for (const s of sessions) {
      const d = s.createdAt;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      distinctDays.add(key);
      const bucket = dayBuckets.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.mins += Math.round((s.durationSec || 0) / 60);
      }
    }

    const weeklyData: { day: string; count: number; mins: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const bucket = dayBuckets.get(key) || { count: 0, mins: 0 };
      weeklyData.push({
        day: DAY_NAMES[d.getDay()],
        count: bucket.count,
        mins: bucket.mins,
      });
    }

    const distinctRecipes = new Set(sessions.map((s) => s.recipeName)).size;
    const anyQuick = sessions.some(
      (s) => (s.durationSec || 0) > 0 && (s.durationSec || 0) < 600,
    );

    const achievements = buildAchievements({
      totalSessions,
      completedSessions,
      totalCookTimeMins,
      liveAIUses,
      distinctDays: distinctDays.size,
      distinctRecipes,
      anyQuick,
    });

    return NextResponse.json(
      {
        totalSessions,
        completedSessions,
        totalCookTimeMins,
        avgSessionMins,
        liveAIUses,
        lastCooked,
        difficultyBreakdown,
        weeklyData,
        achievements,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/cooking-sessions' },
    });
    return NextResponse.json(emptyAnalytics(), { status: 200 });
  }
}
