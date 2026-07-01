import { NextResponse } from 'next/server';
import { isCloudinaryConfigured, getUploadPreset, getCloudName, isStreamConfigured } from '@/lib/storage';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

export async function GET(request: Request) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.upload);
  if (rateLimited) return rateLimited;

  try {
    return NextResponse.json({
      image: {
        configured: isCloudinaryConfigured(),
        cloudName: getCloudName(),
        uploadPreset: getUploadPreset(),
      },
      video: {
        configured: isStreamConfigured(),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/storage/config' },
    });
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 },
    );
  }
}
