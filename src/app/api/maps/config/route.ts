import { NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// Returns the public Maps API key for frontend map rendering
export async function GET(request: Request) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    return NextResponse.json({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      configured: !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
      defaultCenter: { lat: 6.5244, lng: 3.3792 }, // Lagos
      defaultZoom: 13,
      region: 'ng',
    });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/maps/config' },
    });
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 },
    );
  }
}
