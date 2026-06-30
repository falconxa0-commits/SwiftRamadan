import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsApp } from '@/lib/communications/twilio';

export async function POST(request: NextRequest) {
  try {
    const { to, body, templateSid, templateParams } = await request.json();
    if (!to) {
      return NextResponse.json({ success: false, message: 'to is required' }, { status: 400 });
    }
    const result = await sendWhatsApp({ to, body, templateSid, templateParams });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'WhatsApp failed' }, { status: 500 });
  }
}
