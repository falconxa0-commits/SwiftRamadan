import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/supabase';

export const runtime = 'nodejs';

// POST /api/notifications/push — Send push notification
export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { success: false, message: 'userId, title, and body are required' },
        { status: 400 },
      );
    }

    const result = await sendPushNotification({ userId, title, body, data });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Push notification API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send notification' },
      { status: 500 },
    );
  }
}
