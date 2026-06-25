import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics — receive analytics events (for production use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { success: false, message: 'events array required' },
        { status: 400 }
      );
    }

    // Cap to prevent abuse
    if (events.length > 500) {
      return NextResponse.json(
        { success: false, message: 'too many events in a single batch (max 500)' },
        { status: 413 }
      );
    }

    // In production, store in DB or send to analytics provider
    // For now, just log a summary
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] Received ${events.length} events`);
    }

    return NextResponse.json({ success: true, received: events.length });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
