import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateInput, videoCreateSchema } from '@/lib/validation';

// GET /api/videos — fetch reels feed (optionally by category)
export async function GET(req: NextRequest) {
  // Rate limit: 100 requests per minute per IP
  const rateLimited = checkRateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const category = req.nextUrl.searchParams.get('category');
    const viewer = req.nextUrl.searchParams.get('viewer') || 'guest';

    const videos = await db.video.findMany({
      where: category && category !== 'all' ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const serialized = videos.map((v) => {
      let likedBy: string[] = [];
      try {
        likedBy = JSON.parse(v.likedBy || '[]');
      } catch {
        likedBy = [];
      }
      return {
        ...v,
        liked: likedBy.includes(viewer),
      };
    });

    return NextResponse.json({ videos: serialized });
  } catch (err) {
    console.error('[videos/GET] error', err);
    return NextResponse.json({ error: 'Failed to load videos' }, { status: 500 });
  }
}

// POST /api/videos — upload a new reel
export async function POST(req: NextRequest) {
  // Rate limit: 30 write operations per minute per IP
  const rateLimited = checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json();

    // Validate payload
    const v = validateInput(videoCreateSchema, body);
    if (!v.success) return v.response;
    const { title, description, videoUrl, thumbnailUrl, authorName, authorHandle, authorAvatar, category } = v.data;

    if (!title || !videoUrl || !authorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const video = await db.video.create({
      data: {
        title: String(title).slice(0, 120),
        description: String(description || '').slice(0, 500),
        videoUrl: String(videoUrl),
        thumbnailUrl: String(thumbnailUrl || ''),
        authorName: String(authorName),
        authorHandle: String(authorHandle || ''),
        authorAvatar: String(authorAvatar || ''),
        category: String(category || 'cooking'),
      },
    });

    return NextResponse.json({ video: { ...video, liked: false } }, { status: 201 });
  } catch (err) {
    console.error('[videos/POST] error', err);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
