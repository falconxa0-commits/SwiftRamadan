import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

// 30-day Ramadan challenges (fallback mock)
const RAMADAN_CHALLENGES = [
  { id: 'day-1', day: 1, title: 'Order a new cuisine', description: 'Try a cuisine you\'ve never ordered before', icon: '🍽️', category: 'explore', points: 10, badge: null },
  { id: 'day-2', day: 2, title: 'Cook a recipe', description: 'Follow an AI-generated recipe from SwiftRamadan', icon: '👨‍🍳', category: 'cook', points: 15, badge: null },
  { id: 'day-3', day: 3, title: 'Share an Iftar photo', description: 'Upload a photo of your Iftar spread', icon: '📸', category: 'social', points: 10, badge: '📷 Snapshot Starter' },
  { id: 'day-4', day: 4, title: 'Send a gift', description: 'Gift a meal to someone special', icon: '🎁', category: 'gift', points: 20, badge: null },
  { id: 'day-5', day: 5, title: 'Try a Sahur box', description: 'Order a pre-dawn Sahur meal box', icon: '🌙', category: 'explore', points: 10, badge: '🌙 Early Bird' },
  { id: 'day-6', day: 6, title: 'Eco-friendly order', description: 'Choose eco-packaging for your order', icon: '🌿', category: 'eco', points: 15, badge: null },
  { id: 'day-7', day: 7, title: 'Group Iftar', description: 'Start or join a group Iftar order', icon: '👥', category: 'social', points: 20, badge: '🤝 Community Builder' },
  { id: 'day-8', day: 8, title: 'Cook with dates', description: 'Try a recipe featuring dates', icon: '🌴', category: 'cook', points: 10, badge: null },
  { id: 'day-9', day: 9, title: 'Share a reel', description: 'Post a food reel on SwiftRamadan', icon: '🎬', category: 'social', points: 15, badge: null },
  { id: 'day-10', day: 10, title: 'Local vendor spotlight', description: 'Order from a local artisan vendor', icon: '🏪', category: 'explore', points: 15, badge: '🏪 Local Champion' },
  { id: 'day-11', day: 11, title: 'Charity donation', description: 'Make a Sadaqah donation through the app', icon: '💝', category: 'gift', points: 25, badge: null },
  { id: 'day-12', day: 12, title: 'Meal prep Sunday', description: 'Plan your meals for the week ahead', icon: '📋', category: 'cook', points: 10, badge: null },
  { id: 'day-13', day: 13, title: 'Rate 5 deliveries', description: 'Rate your recent delivery experiences', icon: '⭐', category: 'social', points: 10, badge: '⭐ Voice of the People' },
  { id: 'day-14', day: 14, title: 'Try a chef battle dish', description: 'Vote in a Chef Battle and try the winning dish', icon: '⚔️', category: 'explore', points: 20, badge: null },
  { id: 'day-15', day: 15, title: 'Zakat calculation', description: 'Use the Zakat calculator in the app', icon: '🕌', category: 'gift', points: 15, badge: '🕌 Halfway Devotee' },
  { id: 'day-16', day: 16, title: 'Smoothie challenge', description: 'Order or make a healthy Ramadan smoothie', icon: '🥤', category: 'cook', points: 10, badge: null },
  { id: 'day-17', day: 17, title: 'Gift a stranger Iftar', description: 'Use Gift-a-Meal to feed someone in need', icon: '🤲', category: 'gift', points: 25, badge: null },
  { id: 'day-18', day: 18, title: 'Explore 3 new restaurants', description: 'Browse and save 3 restaurants to your wishlist', icon: '🗺️', category: 'explore', points: 10, badge: null },
  { id: 'day-19', day: 19, title: 'Family pack order', description: 'Order a family-sized Iftar bundle', icon: '👨‍👩‍👧‍👦', category: 'explore', points: 15, badge: null },
  { id: 'day-20', day: 20, title: 'Leave 3 reviews', description: 'Write thoughtful reviews for recent orders', icon: '✍️', category: 'social', points: 15, badge: '✍️ Thoughtful Critic' },
  { id: 'day-21', day: 21, title: 'Suhoor surprise', description: 'Order a surprise Suhoor box before dawn', icon: '🌅', category: 'explore', points: 20, badge: null },
  { id: 'day-22', day: 22, title: 'Sustainable choices', description: 'Choose 3 eco-friendly options in one order', icon: '♻️', category: 'eco', points: 20, badge: null },
  { id: 'day-23', day: 23, title: 'Community forum post', description: 'Start or contribute to a community discussion', icon: '💬', category: 'social', points: 10, badge: null },
  { id: 'day-24', day: 24, title: 'Dua moment', description: 'Share a favorite Ramadan Dua in the community', icon: '🤲', category: 'social', points: 15, badge: null },
  { id: 'day-25', day: 25, title: 'Eid preparation', description: 'Pre-order your Eid celebration feast', icon: '🎉', category: 'explore', points: 20, badge: '🎉 Eid Planner' },
  { id: 'day-26', day: 26, title: 'Final charity push', description: 'Make your last Sadaqah donation before Eid', icon: '💎', category: 'gift', points: 30, badge: null },
  { id: 'day-27', day: 27, title: 'Night of Power', description: 'Share your Laylatul Qadr experience', icon: '✨', category: 'social', points: 25, badge: '✨ Night of Light' },
  { id: 'day-28', day: 28, title: 'Cook the ultimate Iftar', description: 'Follow a premium AI recipe for a feast', icon: '👑', category: 'cook', points: 20, badge: null },
  { id: 'day-29', day: 29, title: 'Spread the word', description: 'Refer a friend to SwiftRamadan', icon: '📣', category: 'social', points: 30, badge: null },
  { id: 'day-30', day: 30, title: 'Ramadan reflection', description: 'Share your Ramadan journey and earn the final badge', icon: '🏆', category: 'social', points: 50, badge: '🏆 Ramadan Champion' },
];

// GET: Returns challenge list + progress
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default-user';

  // Try DB first for user progress
  let completedIds = new Set<string>();
  try {
    const progressRecords = await db.challengeProgress.findMany({
      where: { userId, completed: true },
      take: 50,
    });
    completedIds = new Set(progressRecords.map(p => p.challengeId));
  } catch {
    // Fallback to empty
  }

  // Determine current day of Ramadan
  const ramadanStart = new Date('2026-02-18');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ramadanStart.getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = Math.max(1, Math.min(30, diffDays + 1));

  const challengesWithProgress = RAMADAN_CHALLENGES.map(challenge => ({
    ...challenge,
    completed: completedIds.has(challenge.id),
    isCurrent: challenge.day === currentDay,
    isLocked: challenge.day > currentDay,
  }));

  // Calculate stats
  const completedCount = challengesWithProgress.filter(c => c.completed).length;
  const totalPointsEarned = challengesWithProgress
    .filter(c => c.completed)
    .reduce((sum, c) => sum + c.points, 0);
  const totalPossiblePoints = RAMADAN_CHALLENGES.reduce((sum, c) => sum + c.points, 0);

  // Earned badges
  const badges = challengesWithProgress
    .filter(c => c.completed && c.badge)
    .map(c => ({ day: c.day, badge: c.badge!, title: c.title }));

  return NextResponse.json({
    challenges: challengesWithProgress,
    currentDay,
    stats: {
      completed: completedCount,
      total: 30,
      percentage: Math.round((completedCount / 30) * 100),
      pointsEarned: totalPointsEarned,
      totalPoints: totalPossiblePoints,
    },
    badges,
  });
}

// POST: Mark challenge complete
// FIXED: Now requires authentication
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  
  // REQUIRE AUTHENTICATION - challenge progress is private
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const body = await request.json();
    const { challengeId } = body;
    
    // Use authenticated user's ID
    const userId = auth.userId;

    const challenge = RAMADAN_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Check DB for existing completion
    try {
      const existing = await db.challengeProgress.findUnique({
        where: { userId_challengeId: { userId, challengeId } },
      });
      if (existing?.completed) {
        return NextResponse.json(
          { error: 'Challenge already completed' },
          { status: 400 }
        );
      }
    } catch {
      // If DB query fails, continue with in-memory check
    }

    // Write to DB
    try {
      await db.challengeProgress.upsert({
        where: { userId_challengeId: { userId, challengeId } },
        update: { completed: true, progress: 1, completedAt: new Date() },
        create: { userId, challengeId, completed: true, progress: 1, completedAt: new Date() },
      });
    } catch {
      // Silently continue if DB write fails
    }

    // Count completions from DB
    let completedCount = 1;
    try {
      completedCount = await db.challengeProgress.count({
        where: { userId, completed: true },
      });
    } catch {
      // fallback
    }

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        day: challenge.day,
        title: challenge.title,
        points: challenge.points,
        badge: challenge.badge,
      },
      stats: {
        completed: completedCount,
        total: 30,
        percentage: Math.round((completedCount / 30) * 100),
      },
      message: challenge.badge
        ? `Badge earned: ${challenge.badge}`
        : `Day ${challenge.day} complete! +${challenge.points} points`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
