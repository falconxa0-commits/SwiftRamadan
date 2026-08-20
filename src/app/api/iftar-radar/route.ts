import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/* ───────── In-memory store for iftar spots ───────── */

interface IftarSpot {
  id: string;
  name: string;
  type: 'mosque' | 'community' | 'stall';
  description: string;
  meals: string;
  mealsLeft: number;
  distance: string;
  isActive: boolean;
  startTime: string;
  isFree: boolean;
  pinned: boolean;
  createdAt: string;
}

const iftarSpots: IftarSpot[] = [
  {
    id: 'spot-1',
    name: 'Al-Huda Mosque Iftar',
    type: 'mosque',
    description: 'Community Iftar for all — dates, zobo, jollof rice & chicken',
    meals: '200 packs',
    mealsLeft: 47,
    distance: '0.3 km',
    isActive: true,
    startTime: '6:32 PM',
    isFree: true,
    pinned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'spot-2',
    name: 'Lekki Food Stall Hub',
    type: 'stall',
    description: 'Pop-up Iftar stalls with moin-moin, akara & pap',
    meals: '80 packs',
    mealsLeft: 22,
    distance: '0.7 km',
    isActive: true,
    startTime: '6:15 PM',
    isFree: false,
    pinned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'spot-3',
    name: 'VI Community Iftar',
    type: 'community',
    description: 'Open community Iftar — bring your family, everyone welcome!',
    meals: '150 packs',
    mealsLeft: 89,
    distance: '1.2 km',
    isActive: true,
    startTime: '6:30 PM',
    isFree: true,
    pinned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'spot-4',
    name: 'Ikeja Central Mosque',
    type: 'mosque',
    description: 'Daily iftar distribution — sponsored by community donors',
    meals: '500 packs',
    mealsLeft: 310,
    distance: '3.1 km',
    isActive: true,
    startTime: '6:35 PM',
    isFree: true,
    pinned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'spot-5',
    name: 'Surulere Suya Night',
    type: 'stall',
    description: 'Ramadan suya & kunu special — pay what you can',
    meals: '60 packs',
    mealsLeft: 15,
    distance: '2.4 km',
    isActive: false,
    startTime: '7:00 PM',
    isFree: false,
    pinned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'spot-6',
    name: 'Yaba Student Iftar',
    type: 'community',
    description: 'Free iftar for students — organized by Yaba Muslim Youth',
    meals: '120 packs',
    mealsLeft: 68,
    distance: '1.8 km',
    isActive: true,
    startTime: '6:25 PM',
    isFree: true,
    pinned: false,
    createdAt: new Date().toISOString(),
  },
];

/* ───────── GET: Return nearby iftar spots ───────── */

export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type'); // mosque | community | stall
  const activeOnly = searchParams.get('active') === 'true';

  let results = [...iftarSpots];

  if (type && ['mosque', 'community', 'stall'].includes(type)) {
    results = results.filter((s) => s.type === type);
  }

  if (activeOnly) {
    results = results.filter((s) => s.isActive);
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    spots: results,
  });
}

/* ───────── POST: Create a new iftar spot pin ───────── */

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await request.json();
    const { name, type, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Spot name is required' },
        { status: 400 }
      );
    }

    const validTypes = ['mosque', 'community', 'stall'];
    const spotType = validTypes.includes(type) ? type : 'community';

    const newSpot: IftarSpot = {
      id: `spot-pinned-${Date.now()}`,
      name: name.trim(),
      type: spotType,
      description: description?.trim() || 'Free Iftar here! Come join us.',
      meals: 'Open',
      mealsLeft: 999,
      distance: '0.1 km',
      isActive: true,
      startTime: '6:30 PM',
      isFree: true,
      pinned: true,
      createdAt: new Date().toISOString(),
    };

    iftarSpots.unshift(newSpot);

    return NextResponse.json({
      success: true,
      message: `Iftar spot "${newSpot.name}" pinned successfully!`,
      spot: newSpot,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
