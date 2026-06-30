import { NextRequest, NextResponse } from 'next/server';
import { sendTermiiSMS } from '@/lib/communications/termii';

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();
    if (!to || !message) {
      return NextResponse.json({ success: false, message: 'to and message required' }, { status: 400 });
    }
    const result = await sendTermiiSMS({ to, message });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'SMS failed' }, { status: 500 });
  }
}
