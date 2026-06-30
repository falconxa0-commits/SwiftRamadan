import { NextRequest, NextResponse } from 'next/server';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (type === 'exception') {
      const error = new Error(data.message || 'Unknown error');
      error.name = data.name || 'Error';
      error.stack = data.stack;
      const result = await captureException(error, data.context);
      return NextResponse.json(result);
    }

    if (type === 'message') {
      const result = await captureMessage(data.message, data.level, data.context);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, message: 'Invalid type' },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
