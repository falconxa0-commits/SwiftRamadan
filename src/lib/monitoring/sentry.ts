// Sentry — Error monitoring & crash reporting
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// This module talks to Sentry's HTTP envelope API directly (no `@sentry/nextjs`
// SDK dependency), so it works in any runtime (Node, Edge, browser) without an
// extra package install.
//
// Configuration (env vars):
//   SENTRY_DSN       — required. Full DSN, e.g. https://<key>@o<org>.ingest.sentry.io/<project>
//   SENTRY_ORG       — optional. Numeric org id (parsed from DSN host if unset)
//   SENTRY_PROJECT   — optional. Numeric project id (parsed from DSN path if unset)
//
// If SENTRY_DSN is unset, captureException / captureMessage become no-ops
// (dev mode — error monitoring silently disabled).

const SENTRY_URL = process.env.SENTRY_DSN || '';
const SENTRY_ORG = process.env.SENTRY_ORG || '';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || '';
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';

// If no DSN configured, captureException becomes a no-op (dev mode)
if (!SENTRY_URL) {
  console.warn('[Sentry] SENTRY_DSN not set — error monitoring disabled');
}

/**
 * Build the Sentry envelope ingest URL from the DSN, SENTRY_ORG, and
 * SENTRY_PROJECT env vars. Falls back to parsing org/project from the DSN
 * itself when the explicit env vars are unset.
 *
 *   DSN format:          https://<public_key>@o<org_id>.ingest.sentry.io/<project_id>
 *   Envelope URL format: https://o<org_id>.ingest.sentry.io/api/<project_id>/envelope/
 *
 * Returns null if the URL cannot be derived (misconfigured DSN or missing
 * org/project), in which case the caller no-ops rather than sending to a
 * guessed endpoint.
 */
function getIngestUrl(): string | null {
  if (!SENTRY_URL) return null;
  try {
    const parsed = new URL(SENTRY_URL);
    const orgFromHost = parsed.hostname.match(/^o(\d+)\./)?.[1];
    const projectFromPath = parsed.pathname.replace(/^\//, '');
    const orgId = SENTRY_ORG || orgFromHost;
    const projectId = SENTRY_PROJECT || projectFromPath;
    if (!orgId || !projectId) return null;
    return `https://o${orgId}.ingest.sentry.io/api/${projectId}/envelope/`;
  } catch {
    return null;
  }
}

/** Extract the public key (sentry_key) from the DSN for the X-Sentry-Auth header. */
function getPublicKey(): string {
  try {
    return SENTRY_URL.split('//')[1]?.split('@')[0] || '';
  } catch {
    return '';
  }
}

export interface SentryEvent {
  message: string;
  level: 'info' | 'warning' | 'error' | 'fatal';
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id: string; email: string; role: string };
}

export async function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id: string; email: string; role: string };
  },
): Promise<{ eventId: string | null }> {
  // If no DSN configured, captureException becomes a no-op (dev mode)
  if (!SENTRY_URL) {
    return { eventId: null };
  }

  const ingestUrl = getIngestUrl();
  if (!ingestUrl) {
    console.error(
      '[Sentry] Could not derive ingest URL from DSN — check SENTRY_DSN / SENTRY_ORG / SENTRY_PROJECT',
    );
    return { eventId: null };
  }

  try {
    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${getPublicKey()}, sentry_client=swift-custom/1.0`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ''),
        timestamp: Date.now() / 1000,
        platform: 'javascript',
        level: 'error',
        environment: SENTRY_ENVIRONMENT,
        message: error.message,
        exception: {
          values: [
            {
              type: error.name || 'Error',
              value: error.message,
              stacktrace: {
                frames: (error.stack || '')
                  .split('\n')
                  .map((line) => ({ filename: line.trim() })),
              },
            },
          ],
        },
        tags: context?.tags || {},
        extra: context?.extra || {},
        user: context?.user,
      }),
    });

    return { eventId: response.ok ? 'sent' : null };
  } catch (sendError) {
    console.error('[Sentry] Failed to send error:', sendError);
    return { eventId: null };
  }
}

export async function captureMessage(
  message: string,
  level: SentryEvent['level'] = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
): Promise<{ eventId: string | null }> {
  if (!SENTRY_URL) {
    return { eventId: null };
  }

  const ingestUrl = getIngestUrl();
  if (!ingestUrl) {
    console.error(
      '[Sentry] Could not derive ingest URL from DSN — check SENTRY_DSN / SENTRY_ORG / SENTRY_PROJECT',
    );
    return { eventId: null };
  }

  try {
    const eventId = crypto.randomUUID().replace(/-/g, '');
    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${getPublicKey()}, sentry_client=swift-custom/1.0`,
      },
      body: JSON.stringify({
        event_id: eventId,
        timestamp: Date.now() / 1000,
        platform: 'javascript',
        level,
        environment: SENTRY_ENVIRONMENT,
        message,
        tags: context?.tags || {},
        extra: context?.extra || {},
      }),
    });

    return { eventId: response.ok ? eventId : null };
  } catch (sendError) {
    console.error('[Sentry] Failed to send message:', sendError);
    return { eventId: null };
  }
}

export function setUserContext(user: {
  id: string;
  email: string;
  role: string;
}) {
  // Store for future error captures
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('sentry-user', JSON.stringify(user));
    } catch {
      // sessionStorage might be unavailable
    }
  }
}
