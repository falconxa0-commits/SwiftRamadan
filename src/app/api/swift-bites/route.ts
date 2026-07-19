import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * SwiftBites API — TikTok-style vertical video feed
 *
 * GET  /api/swift-bites                → list videos (optional ?category=Iftar)
 * GET  /api/swift-bites?id=xxx         → single video
 * GET  /api/swift-bites?commentsFor=ID → comments for a video
 * POST /api/swift-bites                → create a video (admin/creator)
 * POST /api/swift-bites?like=ID        → like a video (increments likes)
 * POST /api/swift-bites?share=ID       → share a video (increments shares)
 * POST /api/swift-bites?save=ID        → save a video (increments saves)
 * POST /api/swift-bites?view=ID        → register a view (increments views)
 * POST /api/swift-bites?comment=ID     → add a comment
 */

// GET — list videos or single video or comments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const commentsFor = searchParams.get('commentsFor');
    const category = searchParams.get('category');

    // Comments for a specific video
    if (commentsFor) {
      const comments = await db.swiftBiteComment.findMany({
        where: { videoId: commentsFor },
        orderBy: { createdAt: 'desc' },
      });
      const hydrated = comments.map((c) => ({
        ...c,
        time: relativeTime(c.createdAt),
      }));
      return NextResponse.json({ comments: hydrated });
    }

    // Single video
    if (id) {
      const video = await db.swiftBiteVideo.findUnique({ where: { id } });
      if (!video) {
        return NextResponse.json({ success: false, message: 'Video not found' }, { status: 404 });
      }
      return NextResponse.json({ video: hydrateVideo(video) });
    }

    // List (optionally filtered by category)
    const videos = await db.swiftBiteVideo.findMany({
      where: category && category !== 'For You' ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      videos: videos.map(hydrateVideo),
      count: videos.length,
    });
  } catch (error) {
    console.error('SwiftBites GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch videos' }, { status: 500 });
  }
}

// POST — like / share / save / view / comment / create
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const likeId = searchParams.get('like');
    const shareId = searchParams.get('share');
    const saveId = searchParams.get('save');
    const viewId = searchParams.get('view');
    const commentId = searchParams.get('comment');

    const body = await request.json().catch(() => ({}));

    // Like a video
    if (likeId) {
      const v = await db.swiftBiteVideo.update({
        where: { id: likeId },
        data: { likes: { increment: 1 } },
      });
      return NextResponse.json({ success: true, likes: v.likes });
    }

    // Share a video
    if (shareId) {
      const v = await db.swiftBiteVideo.update({
        where: { id: shareId },
        data: { shares: { increment: 1 } },
      });
      return NextResponse.json({ success: true, shares: v.shares });
    }

    // Save a video
    if (saveId) {
      const v = await db.swiftBiteVideo.update({
        where: { id: saveId },
        data: { saves: { increment: 1 } },
      });
      return NextResponse.json({ success: true, saves: v.saves });
    }

    // Register a view
    if (viewId) {
      const v = await db.swiftBiteVideo.update({
        where: { id: viewId },
        data: { views: { increment: 1 } },
      });
      return NextResponse.json({ success: true, views: v.views });
    }

    // Add a comment
    if (commentId) {
      const { authorName = 'Guest', authorHandle = '@guest', authorAvatar = '', authorInitial = 'G', content } = body;
      if (!content || typeof content !== 'string') {
        return NextResponse.json({ success: false, message: 'content is required' }, { status: 400 });
      }
      const comment = await db.swiftBiteComment.create({
        data: {
          videoId: commentId,
          authorName,
          authorHandle,
          authorAvatar,
          authorInitial,
          content: content.slice(0, 500),
        },
      });
      // increment the video's comment counter
      await db.swiftBiteVideo.update({
        where: { id: commentId },
        data: { comments: { increment: 1 } },
      });
      return NextResponse.json({
        success: true,
        comment: { ...comment, time: relativeTime(comment.createdAt) },
      }, { status: 201 });
    }

    // Create a new video
    const {
      title, caption = '', hashtags = [], category = 'For You',
      creatorName, creatorHandle, creatorAvatar = '', verified = false,
      posterImage, musicTitle = '', durationSec = 15,
      orderCtaText = null, orderProductId = null,
    } = body;

    if (!title || !creatorName || !creatorHandle || !posterImage) {
      return NextResponse.json(
        { success: false, message: 'title, creatorName, creatorHandle, posterImage are required' },
        { status: 400 }
      );
    }

    const video = await db.swiftBiteVideo.create({
      data: {
        title,
        caption,
        hashtags: JSON.stringify(hashtags),
        category,
        creatorName,
        creatorHandle,
        creatorAvatar,
        verified,
        posterImage,
        musicTitle,
        durationSec,
        orderCtaText,
        orderProductId,
      },
    });

    return NextResponse.json({ success: true, video: hydrateVideo(video) }, { status: 201 });
  } catch (error) {
    console.error('SwiftBites POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process request' }, { status: 500 });
  }
}

/* ──────────────────────── helpers ──────────────────────── */

 
function hydrateVideo(v: any) {
  let hashtags: string[] = [];
  try {
    hashtags = JSON.parse(v.hashtags);
  } catch {
    hashtags = [];
  }
  return {
    id: v.id,
    title: v.title,
    caption: v.caption,
    hashtags,
    category: v.category,
    creatorName: v.creatorName,
    creatorHandle: v.creatorHandle,
    creatorAvatar: v.creatorAvatar,
    verified: v.verified,
    posterImage: v.posterImage,
    musicTitle: v.musicTitle,
    durationSec: v.durationSec,
    likes: v.likes,
    comments: v.comments,
    shares: v.shares,
    saves: v.saves,
    views: v.views,
    orderCtaText: v.orderCtaText,
    orderProductId: v.orderProductId,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  };
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
