import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';

// Chef battle data (fallback mock)
interface Battle {
  id: string;
  dish: string;
  chefA: { name: string; restaurant: string; rating: number; image: string };
  chefB: { name: string; restaurant: string; rating: number; image: string };
  votesA: number;
  votesB: number;
  totalVotes: number;
  endsAt: string;
  isActive: boolean;
  winner: 'A' | 'B' | null;
}

const MOCK_BATTLES: Battle[] = [
  {
    id: 'battle-1',
    dish: 'Jollof Rice',
    chefA: { name: 'Chef Amina', restaurant: 'Savory Palace', rating: 4.8, image: '👩‍🍳' },
    chefB: { name: 'Chef Bello', restaurant: 'Spice Route', rating: 4.7, image: '👨‍🍳' },
    votesA: 234,
    votesB: 198,
    totalVotes: 432,
    endsAt: new Date(Date.now() + 3600000 * 6).toISOString(),
    isActive: true,
    winner: null,
  },
  {
    id: 'battle-2',
    dish: 'Suya Skewers',
    chefA: { name: 'Chef Danjuma', restaurant: 'Flame Grills', rating: 4.9, image: '👨‍🍳' },
    chefB: { name: 'Chef Fatima', restaurant: 'Night Bites', rating: 4.6, image: '👩‍🍳' },
    votesA: 156,
    votesB: 189,
    totalVotes: 345,
    endsAt: new Date(Date.now() + 3600000 * 12).toISOString(),
    isActive: true,
    winner: null,
  },
  {
    id: 'battle-3',
    dish: 'Moi Moi',
    chefA: { name: 'Chef Iyabo', restaurant: 'Heritage Kitchen', rating: 4.7, image: '👩‍🍳' },
    chefB: { name: 'Chef Emeka', restaurant: 'Eastern Delight', rating: 4.8, image: '👨‍🍳' },
    votesA: 312,
    votesB: 287,
    totalVotes: 599,
    endsAt: new Date(Date.now() - 3600000).toISOString(),
    isActive: false,
    winner: 'A',
  },
];

// Leaderboard data
const LEADERBOARD = [
  { rank: 1, chef: 'Chef Amina', wins: 8, streak: 4, rating: 4.9, restaurant: 'Savory Palace' },
  { rank: 2, chef: 'Chef Danjuma', wins: 7, streak: 2, rating: 4.8, restaurant: 'Flame Grills' },
  { rank: 3, chef: 'Chef Emeka', wins: 6, streak: 1, rating: 4.8, restaurant: 'Eastern Delight' },
  { rank: 4, chef: 'Chef Fatima', wins: 5, streak: 3, rating: 4.7, restaurant: 'Night Bites' },
  { rank: 5, chef: 'Chef Bello', wins: 4, streak: 0, rating: 4.7, restaurant: 'Spice Route' },
  { rank: 6, chef: 'Chef Iyabo', wins: 4, streak: 1, rating: 4.6, restaurant: 'Heritage Kitchen' },
];

// GET: Returns active battles and leaderboard
export async function GET() {
  // Try DB first
  try {
    const dbBattles = await db.chefBattle.findMany({
      include: { votes: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (dbBattles.length > 0) {
      const restaurants = ['Savory Palace', 'Spice Route', 'Flame Grills', 'Night Bites', 'Heritage Kitchen', 'Eastern Delight'];
      const battles: Battle[] = dbBattles.map(b => ({
        id: b.id,
        dish: b.title,
        chefA: { name: b.chefAName, restaurant: restaurants[0], rating: 4.8, image: b.chefAImage || '👩‍🍳' },
        chefB: { name: b.chefBName, restaurant: restaurants[1], rating: 4.7, image: b.chefBImage || '👨‍🍳' },
        votesA: b.chefAVotes,
        votesB: b.chefBVotes,
        totalVotes: b.chefAVotes + b.chefBVotes,
        endsAt: b.endTime?.toISOString() || new Date(Date.now() + 3600000 * 6).toISOString(),
        isActive: b.status === 'live',
        winner: b.status === 'completed' ? (b.chefAVotes > b.chefBVotes ? 'A' : 'B') : null,
      }));

      const activeBattles = battles.filter(b => b.isActive);
      const pastBattles = battles.filter(b => !b.isActive);

      return NextResponse.json({
        activeBattles,
        pastBattles,
        leaderboard: LEADERBOARD,
      });
    }
  } catch {
    // Fallback to mock
  }

  const activeBattles = MOCK_BATTLES.filter(b => b.isActive);
  const pastBattles = MOCK_BATTLES.filter(b => !b.isActive);

  return NextResponse.json({
    activeBattles,
    pastBattles,
    leaderboard: LEADERBOARD,
  });
}

// POST: Record a vote
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await request.json();
    const { battleId, vote, userId = 'default-user' } = body;

    if (!battleId || !vote || !['A', 'B'].includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid vote data. Provide battleId and vote (A or B)' },
        { status: 400 }
      );
    }

    // Try DB
    try {
      const battle = await db.chefBattle.findUnique({
        where: { id: battleId },
      });

      if (!battle) {
        return NextResponse.json(
          { error: 'Battle not found' },
          { status: 404 }
        );
      }

      if (battle.status !== 'live') {
        return NextResponse.json(
          { error: 'This battle has ended' },
          { status: 400 }
        );
      }

      // Check if user already voted
      const existingVote = await db.chefBattleVote.findUnique({
        where: { battleId_userId: { battleId, userId } },
      });

      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted in this battle' },
          { status: 400 }
        );
      }

      // Create vote
      await db.chefBattleVote.create({
        data: {
          battleId,
          userId,
          votedFor: vote,
        },
      });

      // Update battle vote counts
      const updateData = vote === 'A'
        ? { chefAVotes: { increment: 1 } }
        : { chefBVotes: { increment: 1 } };

      const updatedBattle = await db.chefBattle.update({
        where: { id: battleId },
        data: updateData,
      });

      const totalVotes = updatedBattle.chefAVotes + updatedBattle.chefBVotes;
      const pctA = Math.round((updatedBattle.chefAVotes / totalVotes) * 100);
      const pctB = 100 - pctA;

      const chefName = vote === 'A' ? battle.chefAName : battle.chefBName;

      return NextResponse.json({
        success: true,
        battle: {
          id: battle.id,
          dish: battle.title,
          votesA: updatedBattle.chefAVotes,
          votesB: updatedBattle.chefBVotes,
          totalVotes,
          pctA,
          pctB,
        },
        yourVote: vote,
        message: `You voted for ${chefName}!`,
      });
    } catch (dbError) {
      // If it's a "not found" or "already voted" type error, re-throw
      if (dbError instanceof Error && dbError.message.includes('already voted')) {
        throw dbError;
      }
      // Otherwise fall through to mock
    }

    // Mock fallback
    const battle = MOCK_BATTLES.find(b => b.id === battleId);
    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    if (!battle.isActive) {
      return NextResponse.json(
        { error: 'This battle has ended' },
        { status: 400 }
      );
    }

    // Update battle counts
    if (vote === 'A') {
      battle.votesA += 1;
    } else {
      battle.votesB += 1;
    }
    battle.totalVotes += 1;

    // Calculate percentages
    const pctA = Math.round((battle.votesA / battle.totalVotes) * 100);
    const pctB = 100 - pctA;

    return NextResponse.json({
      success: true,
      battle: {
        id: battle.id,
        dish: battle.dish,
        votesA: battle.votesA,
        votesB: battle.votesB,
        totalVotes: battle.totalVotes,
        pctA,
        pctB,
      },
      yourVote: vote,
      message: `You voted for ${vote === 'A' ? battle.chefA.name : battle.chefB.name}!`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
