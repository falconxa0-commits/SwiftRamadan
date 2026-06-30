import { NextRequest, NextResponse } from 'next/server';
import { getDirections } from '@/lib/maps';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  if (!origin || !destination) {
    return NextResponse.json(
      { success: false, message: 'origin and destination required' },
      { status: 400 },
    );
  }

  try {
    const result = await getDirections(origin, destination);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Maps API] Directions error:', error);
    return NextResponse.json(
      { success: false, message: 'Directions failed' },
      { status: 500 },
    );
  }
}
