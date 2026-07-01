import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { cacheGet, cacheSet } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ──────────────────────────────────────────────────────────────────
   Trending in Lagos — Web Search Powered Feed
   ────────────────────────────────────────────────────────────────── */

type TrendingCategory = 'deals' | 'recipes' | 'news' | 'tips';

interface TrendingItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  date: string;
  favicon: string;
  category: TrendingCategory;
}

const QUERIES: Record<TrendingCategory, string> = {
  deals: 'Ramadan deals discounts Lagos Nigeria 2026',
  recipes: 'Nigerian iftar recipes 2026',
  news: 'Ramadan Nigeria news 2026',
  tips: 'Ramadan fasting tips health Nigeria',
};

const CATEGORY_LABEL: Record<TrendingCategory, string> = {
  deals: 'Deals',
  recipes: 'Recipes',
  news: 'News',
  tips: 'Tips',
};

/* ──────────────────────── Fallback Mock Feed ──────────────────────── */

const FALLBACK_ITEMS: TrendingItem[] = [
  {
    id: 'fb-1',
    title: 'Shoprite Lagos: 25% off all Ramadan grocery bundles this week',
    snippet:
      'Lagos shoppers can grab Ramadan essentials — dates, rice, cooking oil, and sugar — at up to 25% off across Shoprite outlets in Lekki, Ikeja, and Surulere. Offer runs throughout the holy month.',
    url: 'https://www.shoprite.com.ng/ramadan',
    source: 'shoprite.com.ng',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=shoprite.com.ng&sz=64',
    category: 'deals',
  },
  {
    id: 'fb-2',
    title: 'Jollof Rice with Chicken — the iftar classic Lagos families love',
    snippet:
      'Smoky party jollof, fried plantain, and spicy grilled chicken make this the most-ordered iftar meal in Lagos. Add a chilled zobo drink for the perfect sunset break-fast.',
    url: 'https://www.allnigerianrecipes.com/jollof-rice',
    source: 'allnigerianrecipes.com',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=allnigerianrecipes.com&sz=64',
    category: 'recipes',
  },
  {
    id: 'fb-3',
    title: 'Ramadan 2026: Sultan announces moon sighting, fasting begins',
    snippet:
      'The Nigerian Supreme Council for Islamic Affairs has confirmed the sighting of the crescent, marking the start of Ramadan 2026. Muslims across Lagos and the nation will begin their fast at dawn.',
    url: 'https://www.premiumtimesng.com/news/ramadan',
    source: 'premiumtimesng.com',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=premiumtimesng.com&sz=64',
    category: 'news',
  },
  {
    id: 'fb-4',
    title: 'Stay hydrated: 5 healthy sahur tips for Lagos Muslims',
    snippet:
      'Doctors in Lagos recommend drinking at least 2 litres of water between iftar and sahur, avoiding excess caffeine, and eating slow-release carbs like oats and sweet potatoes to stay energised.',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/ramadan',
    source: 'mayoclinic.org',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=mayoclinic.org&sz=64',
    category: 'tips',
  },
  {
    id: 'fb-5',
    title: 'Spar Lagos slashes prices of dates and fruits for Ramadan',
    snippet:
      'Spar Nigeria is running a Ramadan Mega Sale — premium Ajwa dates from ₦3,500, fresh watermelon at ₦1,200 per whole fruit, and a fruit basket bundle for ₦8,000 across all Lagos stores.',
    url: 'https://www.sparnigeria.com/ramadan-sale',
    source: 'sparnigeria.com',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=sparnigeria.com&sz=64',
    category: 'deals',
  },
  {
    id: 'fb-6',
    title: 'Moi Moi & Pap — the Nigerian sahur staple you should try',
    snippet:
      'Steamed bean pudding (moi moi) paired with hot akamu (pap) is a protein-rich, easy-to-digest sahur meal that keeps Lagos families full through the long fasting hours.',
    url: 'https://www.nigerianfoodtv.com/moi-moi',
    source: 'nigerianfoodtv.com',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=nigerianfoodtv.com&sz=64',
    category: 'recipes',
  },
  {
    id: 'fb-7',
    title: 'Lagos State announces free iftar packs at major mosques',
    snippet:
      'The Lagos State Government, in partnership with corporate donors, will distribute free iftar packs daily at the Lagos Central Mosque, Alausa Mosque, and 30 community mosques across the state.',
    url: 'https://www.vanguardngr.com/lagos-iftar',
    source: 'vanguardngr.com',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=vanguardngr.com&sz=64',
    category: 'news',
  },
  {
    id: 'fb-8',
    title: 'Avoid fried foods at iftar to beat post-fasting fatigue',
    snippet:
      'Lagos nutritionists advise breaking the fast with dates and water, then a light soup, before any main meal. Heavy fried foods cause bloating and sluggishness during tarawih prayers.',
    url: 'https://www.webmd.com/diet/ramadan-fasting',
    source: 'webmd.com',
    date: new Date().toISOString().slice(0, 10),
    favicon: 'https://www.google.com/s2/favicons?domain=webmd.com&sz=64',
    category: 'tips',
  },
];

/* ──────────────────────── Helpers ──────────────────────── */

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

function getFavicon(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return '';
  }
}

function formatDate(input?: string): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  const d = new Date(input);
  if (isNaN(d.getTime())) return input.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

interface RawSearchResult {
  title?: string;
  snippet?: string;
  content?: string;
  description?: string;
  url?: string;
  link?: string;
  href?: string;
  host_name?: string;
  hostname?: string;
  source?: string;
  date?: string;
  published?: string;
  publishedAt?: string;
  favicon?: string;
}

function mapResult(raw: RawSearchResult, category: TrendingCategory, index: number): TrendingItem | null {
  const title = raw.title?.trim();
  const url = raw.url || raw.link || raw.href;
  if (!title || !url) return null;

  const snippet =
    raw.snippet?.trim() ||
    raw.content?.trim() ||
    raw.description?.trim() ||
    'Tap to read the full story from this Lagos source.';

  const source = raw.host_name || raw.hostname || raw.source || getHostname(url);
  const date = formatDate(raw.date || raw.published || raw.publishedAt);
  const favicon = raw.favicon || getFavicon(url);

  return {
    id: `${category}-${index}-${url}`,
    title,
    snippet,
    url,
    source,
    date,
    favicon,
    category,
  };
}

async function runSearch(query: string, category: TrendingCategory): Promise<TrendingItem[]> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response: unknown = await zai.functions.invoke('web_search', {
      query,
      num: 10,
    });

    const resp = (response ?? {}) as Record<string, unknown>;
    let rawList: RawSearchResult[] = [];
    const results = resp.results as unknown;
    const data = resp.data as unknown;
    const itemsField = resp.items as unknown;
    const resultField = resp.result as unknown;
    const choices = resp.choices as unknown;
    if (Array.isArray(response)) {
      rawList = response as RawSearchResult[];
    } else if (Array.isArray(results)) {
      rawList = results as RawSearchResult[];
    } else if (Array.isArray(data)) {
      rawList = data as RawSearchResult[];
    } else if (Array.isArray(itemsField)) {
      rawList = itemsField as RawSearchResult[];
    } else if (resultField && Array.isArray(resultField)) {
      rawList = resultField as RawSearchResult[];
    } else if (choices && Array.isArray(choices)) {
      const firstChoice = (choices as Array<{ message?: { content?: string } }>)[0];
      const text = firstChoice?.message?.content || '';
      rawList = text
        ? [
            {
              title: `${CATEGORY_LABEL[category]} — live results`,
              snippet: text,
              url: 'https://www.google.com/search?q=' + encodeURIComponent(query),
            },
          ]
        : [];
    }

    const items: TrendingItem[] = [];
    rawList.forEach((raw, i) => {
      const mapped = mapResult(raw, category, i);
      if (mapped) items.push(mapped);
    });

    return items;
  } catch (err) {
    console.warn(`[trending] web_search failed for category="${category}":`, err);
    return [];
  }
}

async function fetchTrending(category?: TrendingCategory): Promise<TrendingItem[]> {
  const categories: TrendingCategory[] = category ? [category] : ['deals', 'recipes', 'news'];

  const resultsPerCat = await Promise.all(categories.map(cat => runSearch(QUERIES[cat], cat)));

  const merged: TrendingItem[] = [];
  if (category) {
    merged.push(...resultsPerCat[0]);
  } else {
    const maxLen = Math.max(...resultsPerCat.map(r => r.length));
    for (let i = 0; i < maxLen; i++) {
      resultsPerCat.forEach(group => {
        if (group[i]) merged.push(group[i]);
      });
    }
  }

  if (merged.length === 0) {
    return category ? FALLBACK_ITEMS.filter(item => item.category === category) : FALLBACK_ITEMS;
  }

  return merged;
}

/* ──────────────────────── Route Handlers ──────────────────────── */

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get('category') as TrendingCategory | null;
  const category =
    categoryParam && ['deals', 'recipes', 'news', 'tips'].includes(categoryParam)
      ? categoryParam
      : undefined;

  try {
    // Check Redis cache (5 minutes)
    const cacheKey = `trending:${category || 'all'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const items = await fetchTrending(category);
    const result = {
      items,
      count: items.length,
      source: 'live' as const,
      category: category || 'all',
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (err) {
    console.warn('[trending] GET failed, returning fallback:', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/trending' },
    });
    const items = category
      ? FALLBACK_ITEMS.filter(item => item.category === category)
      : FALLBACK_ITEMS;
    return NextResponse.json({
      items,
      count: items.length,
      source: 'fallback',
      category: category || 'all',
    });
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  let body: { category?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const categoryRaw = body.category as TrendingCategory | undefined;
  const category =
    categoryRaw && ['deals', 'recipes', 'news', 'tips'].includes(categoryRaw)
      ? categoryRaw
      : undefined;

  try {
    const items = await fetchTrending(category);
    return NextResponse.json({
      items,
      count: items.length,
      source: 'live',
      category: category || 'all',
    });
  } catch (err) {
    console.warn('[trending] POST failed, returning fallback:', err);
    await captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { route: '/api/trending' },
    });
    const items = category
      ? FALLBACK_ITEMS.filter(item => item.category === category)
      : FALLBACK_ITEMS;
    return NextResponse.json({
      items,
      count: items.length,
      source: 'fallback',
      category: category || 'all',
    });
  }
}
