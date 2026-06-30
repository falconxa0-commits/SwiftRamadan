import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, reverseGeocode } from '@/lib/maps';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    if (address) {
      const result = await geocodeAddress(address);
      return NextResponse.json({ success: true, result });
    } else if (lat && lng) {
      const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
      return NextResponse.json({ success: true, result });
    }
    return NextResponse.json(
      { success: false, message: 'Provide address or lat/lng' },
      { status: 400 },
    );
  } catch (error) {
    console.error('[Maps API] Geocode error:', error);
    return NextResponse.json(
      { success: false, message: 'Geocoding failed' },
      { status: 500 },
    );
  }
}
