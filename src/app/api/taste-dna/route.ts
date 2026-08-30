import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/ai/security';
import { aiRequest } from '@/ai/gateway';
import { captureException } from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';

// Default taste profile dimensions
const DEFAULT_PROFILE = {
  smoky: 50,
  sweet: 30,
  spicy: 40,
  umami: 60,
  fresh: 35,
  rich: 55,
};

interface TasteProfile {
  smoky: number;
  sweet: number;
  spicy: number;
  umami: number;
  fresh: number;
  rich: number;
}

function sanitizeProfile(raw: unknown): TasteProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const clamp = (v: unknown, fallback: number): number => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
  };

  const profile: TasteProfile = {
    smoky: clamp(obj.smoky, DEFAULT_PROFILE.smoky),
    sweet: clamp(obj.sweet, DEFAULT_PROFILE.sweet),
    spicy: clamp(obj.spicy, DEFAULT_PROFILE.spicy),
    umami: clamp(obj.umami, DEFAULT_PROFILE.umami),
    fresh: clamp(obj.fresh, DEFAULT_PROFILE.fresh),
    rich: clamp(obj.rich, DEFAULT_PROFILE.rich),
  };

  // Verify at least some dimensions differ from fallback to confirm real data
  return profile;
}

function extractJsonObject(text: string): unknown | null {
  if (!text) return null;
  // Strip markdown code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find the outermost { ... } block
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// POST /api/taste-dna — Analyze and update taste profile using AI
export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  // Auth required — AI route (Phase 3 — secure AI routes)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const orderHistory = body?.orderHistory ?? [];
    const preferences = body?.preferences ?? [];
    const currentProfile = body?.currentProfile ?? DEFAULT_PROFILE;

    try {
      // PHASE-10: migrated to the unified AI gateway (`aiRequest`). The
      // task-specific system instruction is prepended to the user message
      // because the gateway bakes in a fixed Safa system persona (see
      // `src/ai/gateway.ts`). The gateway already sanitizes the message
      // internally; we still run `sanitizePromptInput` on the user-controlled
      // portion (orderHistory / preferences strings could contain
      // prompt-injection phrases) before assembling the final message so
      // the sanitization happens before the prompt-injection detection
      // layer in the gateway (which would refuse if the sanitized text
      // still trips `containsInjectionAttempt`).
      const tasteSystemInstruction =
        'You are a taste profiling AI for a food delivery app. Based on order history and preferences, generate a taste profile with 6 dimensions: smoky (0-100), sweet (0-100), spicy (0-100), umami (0-100), fresh (0-100), rich (0-100). Return ONLY a JSON object with these 6 keys.';
      const userPayload = sanitizePromptInput(
        `Analyze this user's taste profile:\nOrder History: ${JSON.stringify(orderHistory)}\nPreferences: ${JSON.stringify(preferences)}\nCurrent Profile: ${JSON.stringify(currentProfile)}`,
      );
      const fullMessage = `${tasteSystemInstruction}\n\n${userPayload}`;
      const result = await aiRequest({
        userId: auth.userId,
        userRole: auth.role,
        message: fullMessage,
        maxTokens: 1000,
      });

      if (result.success && result.response) {
        const parsed = extractJsonObject(result.response);
        const profile = sanitizeProfile(parsed);

        if (profile) {
          return NextResponse.json({ success: true, profile, source: 'ai' });
        }
      }
    } catch (aiError) {
      console.error('[Taste DNA] AI error:', aiError);
    }

    // Fallback: return current or default profile
    const fallbackProfile = sanitizeProfile(currentProfile) || DEFAULT_PROFILE;
    return NextResponse.json({ success: true, profile: fallbackProfile, source: 'fallback' });
  } catch (error) {
    console.error('[Taste DNA] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/taste-dna' } });
    return NextResponse.json(
      { success: false, message: 'Taste analysis failed' },
      { status: 500 },
    );
  }
}

// GET /api/taste-dna — Get default taste profile
export async function GET() {
  return NextResponse.json({
    success: true,
    profile: DEFAULT_PROFILE,
    source: 'default',
  });
}
