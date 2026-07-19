import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { db } from '@/lib/db';

/* ──────────────────────────────────────────────────────────────────
   /api/stories — Iftar Stories
   GET  returns active stories (within 24h window)
   POST creates a new story (image + sticker)
   ────────────────────────────────────────────────────────────────── */

interface StoryItem {
  id: string;
  imageUrl: string;
  sticker: string;
  caption?: string;
  createdAt: string;
}

interface Story {
  id: string;
  authorName: string;
  authorInitial: string;
  avatar?: string;
  items: StoryItem[];
  viewed: boolean;
  createdAt: string;
}

/* Fallback mock stories */
const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    authorName: 'Amina K.',
    authorInitial: 'A',
    items: [
      {
        id: 'si1',
        imageUrl: '/images/meals/meal-jollof.png',
        sticker: 'Just broke fast 🌙',
        caption: 'Jollof and chicken for iftar!',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'si2',
        imageUrl: '/images/meals/meal-suya.png',
        sticker: 'Dates & water first 🫒',
        caption: 'Started with dates as always',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
    viewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 's2',
    authorName: 'Ibrahim S.',
    authorInitial: 'I',
    items: [
      {
        id: 'si3',
        imageUrl: '/images/meals/meal-shawarma.png',
        sticker: 'Sahur prep ☪️',
        caption: 'Prepping sahur early',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ],
    viewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 's3',
    authorName: 'Fatima M.',
    authorInitial: 'F',
    items: [
      {
        id: 'si4',
        imageUrl: '/images/meals/meal-peppersoup.png',
        sticker: 'Alhamdulillah 🤲',
        caption: 'Pepper soup hits different after fasting',
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ],
    viewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;

function filterActive(stories: Story[]): Story[] {
  const now = Date.now();
  return stories.filter((s) => now - new Date(s.createdAt).getTime() < TWENTY_FOUR_H);
}

export async function GET() {
  try {
    const dbStories = await db.story.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (dbStories.length > 0) {
      // Group stories by author (since DB stores each story as a single item)
      const authorMap = new Map<string, Story>();
      for (const s of dbStories) {
        const existing = authorMap.get(s.authorName);
        const item: StoryItem = {
          id: s.id,
          imageUrl: s.mediaUrl || '/images/meals/meal-jollof.png',
          sticker: s.sticker,
          caption: s.caption,
          createdAt: s.createdAt.toISOString(),
        };

        if (existing) {
          existing.items.push(item);
        } else {
          authorMap.set(s.authorName, {
            id: s.id,
            authorName: s.authorName,
            authorInitial: s.authorName[0].toUpperCase(),
            avatar: s.authorAvatar || undefined,
            items: [item],
            viewed: false,
            createdAt: s.createdAt.toISOString(),
          });
        }
      }

      const stories = Array.from(authorMap.values());
      return NextResponse.json({ stories });
    }
  } catch {
    // Fallback to mock
  }

  const active = filterActive(MOCK_STORIES);
  return NextResponse.json({ stories: active });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.write);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await req.json();
    const { imageUrl, sticker, caption, authorName } = body as {
      imageUrl?: string;
      sticker?: string;
      caption?: string;
      authorName?: string;
    };

    if (!imageUrl || !sticker) {
      return NextResponse.json(
        { error: 'Image and sticker are required' },
        { status: 400 }
      );
    }

    const name = authorName || 'Anonymous';

    // Write to DB
    let createdStory;
    try {
      createdStory = await db.story.create({
        data: {
          authorName: name,
          type: 'image',
          mediaUrl: imageUrl,
          caption: caption || '',
          sticker,
          expiresAt: new Date(Date.now() + TWENTY_FOUR_H),
        },
      });
    } catch {
      // fallback
    }

    const newStory: Story = {
      id: createdStory?.id || `s-${Date.now()}`,
      authorName: name,
      authorInitial: name[0].toUpperCase(),
      items: [
        {
          id: createdStory?.id || `si-${Date.now()}`,
          imageUrl,
          sticker,
          caption: caption || '',
          createdAt: new Date().toISOString(),
        },
      ],
      viewed: true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ story: newStory }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
