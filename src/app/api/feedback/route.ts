import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/feedback?userEmail=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('userEmail') || 'guest';
    const items = await db.betaFeedback.findMany({
      where: { owner },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Feedback API GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch feedback', items: [] }, { status: 500 });
  }
}

// POST /api/feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const owner = typeof body?.userEmail === 'string' && body.userEmail.trim() ? body.userEmail.trim() : 'guest';
    const type = ['feedback', 'bug', 'feature'].includes(body?.type) ? body.type : 'feedback';
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const rating = Number.isFinite(Number(body?.rating)) ? Math.max(0, Math.min(5, Math.round(Number(body.rating)))) : 0;
    const page = typeof body?.page === 'string' ? body.page : '';

    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'Subject and message are required' }, { status: 400 });
    }

    const item = await db.betaFeedback.create({
      data: { owner, type, subject, message, rating, page },
    });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Feedback API POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
  }
}
