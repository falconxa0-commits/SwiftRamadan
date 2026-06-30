import { NextRequest, NextResponse } from 'next/server';
import { getPrayerTimesByCoords, getPrayerTimesByCity } from '@/lib/islamic/aladhan';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const city = searchParams.get('city') || 'Lagos';
    const country = searchParams.get('country') || 'Nigeria';
    const method = parseInt(searchParams.get('method') || '3');

    let result;
    if (lat && lng) {
      result = await getPrayerTimesByCoords({ lat: parseFloat(lat), lng: parseFloat(lng), method });
    } else {
      result = await getPrayerTimesByCity({ city, country, method });
    }

    if (result) {
      return NextResponse.json({ success: true, prayerTimes: result });
    }
    return NextResponse.json({ success: false, message: 'Could not fetch prayer times' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Prayer times API error' }, { status: 500 });
  }
}
