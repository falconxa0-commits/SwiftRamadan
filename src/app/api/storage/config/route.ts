import { NextResponse } from 'next/server';
import { isCloudinaryConfigured, getUploadPreset, getCloudName, isStreamConfigured } from '@/lib/storage';

export async function GET() {
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
}
