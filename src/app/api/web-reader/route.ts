import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';
import { requireAuth } from '@/lib/session';
import * as usersService from '@/services/users/users.service';

export const runtime = 'nodejs';

/**
 * SSRF Protection: Block requests to private/internal network addresses.
 * Only allows http/https protocols and public IP addresses.
 */
function isSafeUrl(url: URL): { safe: boolean; reason?: string } {
  // Only allow http and https protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { safe: false, reason: 'Only HTTP and HTTPS URLs are allowed' };
  }

  // Block localhost and local addresses
  const hostname = url.hostname.toLowerCase();
  
  // Block hostname variants of localhost
  if (hostname === 'localhost' || hostname === 'localhost.localdomain' || 
      hostname.endsWith('.localhost')) {
    return { safe: false, reason: 'Localhost URLs are not allowed' };
  }

  // Block special-use hostnames
  const blockedHostnames = [
    'local', 'ip6-localhost', 'ip6-loopback',
    'broadcasthost', 'link-local',
  ];
  if (blockedHostnames.includes(hostname)) {
    return { safe: false, reason: 'Reserved hostname is not allowed' };
  }

  // Block private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  // Also block link-local (169.254.0.0/16) and loopback (127.0.0.0/8)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    const [first, second] = parts;
    
    // 10.0.0.0/8
    if (first === 10) {
      return { safe: false, reason: 'Private IP addresses are not allowed' };
    }
    // 172.16.0.0/12
    if (first === 172 && second >= 16 && second <= 31) {
      return { safe: false, reason: 'Private IP addresses are not allowed' };
    }
    // 192.168.0.0/16
    if (first === 192 && second === 168) {
      return { safe: false, reason: 'Private IP addresses are not allowed' };
    }
    // 127.0.0.0/8 (loopback)
    if (first === 127) {
      return { safe: false, reason: 'Loopback addresses are not allowed' };
    }
    // 169.254.0.0/16 (link-local)
    if (first === 169 && second === 254) {
      return { safe: false, reason: 'Link-local addresses are not allowed' };
    }
    // 0.0.0.0/8
    if (first === 0) {
      return { safe: false, reason: 'Reserved IP addresses are not allowed' };
    }
  }

  // Block IPv6 loopback (::1), link-local (fe80::/10), unique-local (fc00::/7)
  if (hostname.startsWith('::') || hostname.startsWith('fe') || 
      hostname.startsWith('fc') || hostname.startsWith('fd')) {
    return { safe: false, reason: 'Reserved IPv6 addresses are not allowed' };
  }

  // Block metadata endpoints (AWS, GCP, Azure cloud metadata)
  const blockedEndpoints = [
    'metadata.google.internal',
    'metadata.azure.com',
    '169.254.169.254',
  ];
  if (blockedEndpoints.some(ep => hostname === ep || hostname.endsWith('.' + ep))) {
    return { safe: false, reason: 'Cloud metadata endpoints are not allowed' };
  }

  return { safe: true };
}

// POST /api/web-reader — Extract content from a web page URL using Z-AI Web Reader
export async function POST(request: NextRequest) {
  // Auth required - prevent anonymous abuse
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // MIGRATED (Phase 11): defense-in-depth user existence check via
  // `usersService.getUserById`. Mirrors `/api/cart/route.ts` — returns a
  // clean 404 if the user was deleted between JWT issuance and this request.
  const userExists = await usersService.getUserById(auth.userId);
  if (!userExists) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 },
    );
  }

  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 },
      );
    }

    // Basic URL validation + SSRF protection
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid URL format' },
        { status: 400 },
      );
    }

    // SSRF check - validate the URL is safe to fetch
    const safetyCheck = isSafeUrl(parsedUrl);
    if (!safetyCheck.safe) {
      console.warn(`[Web Reader] Blocked potentially dangerous URL: ${url} - ${safetyCheck.reason}`);
      return NextResponse.json(
        { success: false, message: 'This URL cannot be accessed for security reasons' },
        { status: 403 },
      );
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      // @ts-expect-error — `FunctionMap` only declares `web_search` and
      // `page_reader`, but the route invokes `web_reader` directly. Changing
      // the function name would alter runtime behaviour, so suppress.
      const response = await zai.functions.invoke('web_reader', { url });

      if (response) {
        return NextResponse.json({ success: true, content: response, source: 'ai' });
      }
    } catch (aiError) {
      console.error('[Web Reader] Z-AI error:', aiError);
    }

    return NextResponse.json(
      { success: false, message: 'Web reader not available' },
      { status: 500 },
    );
  } catch (error) {
    console.error('[Web Reader] Error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { tags: { route: '/api/web-reader' } });
    return NextResponse.json(
      { success: false, message: 'Web reader failed' },
      { status: 500 },
    );
  }
}
