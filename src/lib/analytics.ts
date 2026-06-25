// Lightweight analytics — logs to console and localStorage for dev
// In production, replace track() with your analytics provider (Google Analytics, Mixpanel, etc.)

export type AnalyticsEvent =
  | 'page_view'
  | 'tab_switch'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'checkout_complete'
  | 'order_placed'
  | 'search'
  | 'video_view'
  | 'video_like'
  | 'video_comment'
  | 'video_share'
  | 'video_save'
  | 'follow_user'
  | 'review_submit'
  | 'coupon_apply'
  | 'modal_open'
  | 'modal_close'
  | 'login'
  | 'signup'
  | 'logout'
  | 'role_switch'
  | 'delivery_accept'
  | 'delivery_complete'
  | 'voice_search'
  | 'visual_search'
  | 'ai_chat_message';

interface AnalyticsPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean | undefined>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

const SESSION_ID = (() => {
  if (typeof window === 'undefined') return 'server';
  const key = 'analytics-session-id';
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
})();

const EVENT_QUEUE_KEY = 'analytics-event-queue';
const MAX_QUEUE_SIZE = 100;

function getQueue(): AnalyticsPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EVENT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: AnalyticsPayload[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // localStorage might be full or disabled
  }
}

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | undefined>
) {
  const payload: AnalyticsPayload = {
    event,
    properties,
    timestamp: Date.now(),
    sessionId: SESSION_ID,
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties || '');
  }

  // Queue for later sending
  if (typeof window !== 'undefined') {
    try {
      const queue = getQueue();
      queue.push(payload);
      saveQueue(queue);
    } catch {
      // ignore — analytics is best-effort
    }
  }

  // In production, send to your analytics provider here
  // Example: if NEXT_PUBLIC_ANALYTICS_ID is set, send to GA
}

// Flush events to server (called periodically or on page unload)
export async function flushAnalytics() {
  if (typeof window === 'undefined') return;
  const queue = getQueue();
  if (queue.length === 0) return;

  try {
    // Best-effort POST to /api/analytics; clear queue regardless of outcome
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: queue }),
      keepalive: true,
    }).catch(() => {});
    saveQueue([]);
  } catch {
    // ignore — keep queue for next flush
  }
}

// Get analytics summary (for debug/admin)
export function getAnalyticsSummary() {
  const queue = getQueue();
  const byEvent: Record<string, number> = {};
  for (const e of queue) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  }
  return {
    totalEvents: queue.length,
    byEvent,
    sessionId: SESSION_ID,
  };
}
