// Sentry — Error monitoring & crash reporting
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

const SENTRY_DSN = process.env.SENTRY_DSN || '';
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';

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
  if (!SENTRY_DSN) {
    console.error('[Sentry] Not configured — logging error locally:', error.message);
    return { eventId: null };
  }

  try {
    const response = await fetch(
      'https://o4506961265258496.ingest.sentry.io/api/4506961270239232/envelope/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${SENTRY_DSN.split('//')[1]?.split('@')[0]}, sentry_client=swift-custom/1.0`,
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
      },
    );

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
  if (!SENTRY_DSN) {
    return { eventId: null };
  }

  try {
    const eventId = crypto.randomUUID().replace(/-/g, '');
    const response = await fetch(
      'https://o4506961265258496.ingest.sentry.io/api/4506961270239232/envelope/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${SENTRY_DSN.split('//')[1]?.split('@')[0]}, sentry_client=swift-custom/1.0`,
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
      },
    );

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
