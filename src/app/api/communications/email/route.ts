import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/communications/resend';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from } = await request.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, message: 'to, subject, html required' }, { status: 400 });
    }
    const result = await sendEmail({ to, subject, html, from });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Email failed' }, { status: 500 });
  }
}
