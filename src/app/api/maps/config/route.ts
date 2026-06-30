import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Returns the public Maps API key for frontend map rendering
export async function GET() {
  return NextResponse.json({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    configured: !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
    defaultCenter: { lat: 6.5244, lng: 3.3792 }, // Lagos
    defaultZoom: 13,
    region: 'ng',
  });
}
