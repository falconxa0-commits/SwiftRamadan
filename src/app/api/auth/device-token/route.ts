import { NextRequest, NextResponse } from 'next/server';
import { registerDeviceToken } from '@/lib/supabase';

export const runtime = 'nodejs';

// POST /api/auth/device-token — Register device for push notifications
export async function POST(request: NextRequest) {
  try {
    const { userId, token, platform } = await request.json();

    if (!userId || !token || !platform) {
      return NextResponse.json(
        { success: false, message: 'userId, token, and platform are required' },
        { status: 400 },
      );
    }

    const result = await registerDeviceToken(userId, token, platform);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Device token API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to register device' },
      { status: 500 },
    );
  }
}
