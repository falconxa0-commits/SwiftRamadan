import { NextRequest, NextResponse } from 'next/server';
import { searchNearbyPlaces } from '@/lib/maps';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '6.5244');
  const lng = parseFloat(searchParams.get('lng') || '3.3792');
  const radius = parseInt(searchParams.get('radius') || '3000');
  const type = searchParams.get('type') || 'restaurant';
  const keyword = searchParams.get('keyword') || undefined;

  try {
    const places = await searchNearbyPlaces({ lat, lng, radius, type, keyword });
    return NextResponse.json({ success: true, places });
  } catch (error) {
    console.error('[Maps API] Nearby search error:', error);
    return NextResponse.json(
      { success: false, message: 'Nearby search failed' },
      { status: 500 },
    );
  }
}
