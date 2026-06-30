import { NextRequest, NextResponse } from 'next/server';
import { getDistanceMatrix } from '@/lib/maps';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origins = searchParams.get('origins');
  const destinations = searchParams.get('destinations');

  if (!origins || !destinations) {
    return NextResponse.json(
      { success: false, message: 'origins and destinations required' },
      { status: 400 },
    );
  }

  try {
    const result = await getDistanceMatrix(origins, destinations);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Maps API] Distance error:', error);
    return NextResponse.json(
      { success: false, message: 'Distance calculation failed' },
      { status: 500 },
    );
  }
}
