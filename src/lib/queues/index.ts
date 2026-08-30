// Queue definitions for background jobs.
//
// Five named queues — email, sms, notification, webhook, ai — each backed by a
// `bullmq.Queue` singleton. Producers (route handlers, services) should call
// the `enqueue*` helpers rather than touching the `Queue` directly. The
// helpers gracefully degrade when Redis is unavailable: they log a warning
// and return without throwing, so request threads stay unblocked.
//
// Usage:
//   import { enqueueEmail } from '@/lib/queues';
//   await enqueueEmail({ to: 'x@y.com', subject: 'Hi', html: '<p>Hi</p>' });
//
// Worker process (separate from the Next.js web process):
//   bun run workers   # → src/lib/queues/start-workers.ts

import { Queue, type JobsOptions } from 'bullmq';
import { bullMQConnection, isBullMQEnabled } from './connection';

// ─── Queue names ────────────────────────────────────────────────────────────
// Centralised so `processors.ts` and `start-workers.ts` reference the same
// strings. BullMQ's `Queue` and `Worker` are matched by name — a typo here
// would silently create a second queue and never get processed.
export const QUEUE_NAMES = {
  email: 'swift-email',
  sms: 'swift-sms',
  notification: 'swift-notification',
  webhook: 'swift-webhook',
  ai: 'swift-ai',
} as const;

export type QueueName = keyof typeof QUEUE_NAMES;

// ─── Job payload types ──────────────────────────────────────────────────────
// Plain-object payloads — BullMQ stores them as JSON in Redis. Keeping the
// shape explicit here gives type safety at the `enqueue*` call sites in
// route handlers, and at the `Worker` handler in `processors.ts`.

export interface EmailJob {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface SMSJob {
  to: string;
  message: string;
  type?: 'plain' | 'unicode';
}

export interface NotificationJob {
  userId: string;
  email?: string;
  phone?: string;
  title: string;
  message: string;
  whatsappMessage?: string;
  smsMessage?: string;
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
  messageType?: 'transactional' | 'promotional';
}

export interface WebhookJob {
  url: string;
  event: string;
  payload: Record<string, unknown>;
  secret?: string;
}

export interface AIJob {
  task: string;
  input: Record<string, unknown>;
}

// ─── Queue singletons ───────────────────────────────────────────────────────
// Created lazily so a missing Redis connection doesn't break `import
// '@/lib/queues'` in the web app. If BullMQ is disabled (no REDIS_URL), these
// remain null and the `enqueue*` helpers fail open with a warning.

let emailQueue: Queue<EmailJob> | null = null;
let smsQueue: Queue<SMSJob> | null = null;
let notificationQueue: Queue<NotificationJob> | null = null;
let webhookQueue: Queue<WebhookJob> | null = null;
let aiQueue: Queue<AIJob> | null = null;

if (isBullMQEnabled && bullMQConnection) {
  const sharedOpts = { connection: bullMQConnection };
  emailQueue = new Queue<EmailJob>(QUEUE_NAMES.email, sharedOpts);
  smsQueue = new Queue<SMSJob>(QUEUE_NAMES.sms, sharedOpts);
  notificationQueue = new Queue<NotificationJob>(QUEUE_NAMES.notification, sharedOpts);
  webhookQueue = new Queue<WebhookJob>(QUEUE_NAMES.webhook, sharedOpts);
  aiQueue = new Queue<AIJob>(QUEUE_NAMES.ai, sharedOpts);
}

export {
  emailQueue,
  smsQueue,
  notificationQueue,
  webhookQueue,
  aiQueue,
};

// ─── Enqueue helpers (graceful fallback) ────────────────────────────────────
// These are the functions that route handlers should call. They never throw
// on Redis unavailability — they log a warning and return. This is the
// "don't block" rule from PHASE-9-ECHO-BULLMQ.
//
// Each helper accepts an optional `JobsOptions` (attempts, backoff, delay,
// removeOnComplete, etc.) so callers can express retry policy per job.
// Defaults are intentionally minimal (BullMQ's defaults: 3 attempts,
// immediate backoff) — the existing communications modules already have
// their own internal retry (`src/lib/communications/retry.ts`), so we don't
// double-retry aggressively here.

let warnedSkippedEnqueue = false;
function warnSkippedEnqueueOnce(queueLabel: string): void {
  // Emit a detailed warning the first time, then quiet — a running web
  // process without Redis configured would otherwise log a warning per
  // email/SMS send, which is noisy.
  if (warnedSkippedEnqueue) return;
  warnedSkippedEnqueue = true;
  console.warn(
    `[BullMQ] ${queueLabel} queue unavailable — jobs will be skipped. ` +
      'Set REDIS_URL to enable background processing.',
  );
}

async function safeEnqueue<T>(
  queue: Queue<T> | null,
  queueLabel: string,
  jobName: string,
  data: T,
  opts?: JobsOptions,
): Promise<string | null> {
  if (!queue) {
    warnSkippedEnqueueOnce(queueLabel);
    return null;
  }
  try {
    // BullMQ's `Queue.add(name, data, opts)` types `name` as
    // `ExtractNameType<T, string>` and `data` as `ExtractDataType<T, T>` —
    // both conditional types that TypeScript can't resolve for an
    // unconstrained generic `T`. The runtime contract is `string` for `name`
    // and `T` for `data` (resolved by BullMQ internally), so we cast both to
    // `never` (assignable to every type) to bypass the unresolved
    // conditionals without resorting to `Queue<any>`.
    const job = await queue.add(jobName as never, data as never, opts);
    return job.id ?? null;
  } catch (err) {
    console.warn(`[BullMQ] ${queueLabel} enqueue failed — skipping:`, err);
    return null;
  }
}

export async function enqueueEmail(job: EmailJob, opts?: JobsOptions): Promise<string | null> {
  return safeEnqueue(emailQueue, 'email', 'send', job, opts);
}

export async function enqueueSMS(job: SMSJob, opts?: JobsOptions): Promise<string | null> {
  return safeEnqueue(smsQueue, 'sms', 'send', job, opts);
}

export async function enqueueNotification(job: NotificationJob, opts?: JobsOptions): Promise<string | null> {
  return safeEnqueue(notificationQueue, 'notification', 'send', job, opts);
}

export async function enqueueWebhook(job: WebhookJob, opts?: JobsOptions): Promise<string | null> {
  return safeEnqueue(webhookQueue, 'webhook', 'deliver', job, opts);
}

export async function enqueueAI(job: AIJob, opts?: JobsOptions): Promise<string | null> {
  return safeEnqueue(aiQueue, 'ai', 'run', job, opts);
}

// ─── Queue status (for /api/health) ─────────────────────────────────────────
// Returns a snapshot of queue sizes and the BullMQ backend status. Called
// from the health endpoint so ops can see at a glance whether the worker
// process is keeping up. If BullMQ is disabled, returns null counts so the
// health endpoint can show "disabled" rather than 0 (which would imply
// empty queues).

export interface QueueStatus {
  enabled: boolean;
  backend: 'redis-url' | 'redis-host-port' | null;
  counts: Partial<Record<QueueName, { waiting: number; active: number; delayed: number; failed: number }>>;
}

export async function getQueueStatus(): Promise<QueueStatus> {
  const status: QueueStatus = {
    enabled: isBullMQEnabled,
    backend: null,
    counts: {},
  };
  if (!isBullMQEnabled) return status;

  // Lazy import to avoid pulling `bullMQBackend` symbol into the module
  // scope above (kept here for clarity — it's only used in health).
  const { bullMQBackend } = await import('./connection');
  status.backend = bullMQBackend;

  // `Queue` (no generics) defaults to `Queue<any, any, string, ...>`. Since
  // `any` is bidirectionally assignable to every type, the per-queue
  // singletons (e.g. `Queue<EmailJob>`) are assignable to `Queue` without a
  // cast. Using the default `Queue` here avoids invariance complaints that
  // `Queue<EmailJob>` vs `Queue<unknown>` would produce.
  const queues: Array<[QueueName, Queue | null]> = [
    ['email', emailQueue],
    ['sms', smsQueue],
    ['notification', notificationQueue],
    ['webhook', webhookQueue],
    ['ai', aiQueue],
  ];

  for (const [name, q] of queues) {
    if (!q) continue;
    try {
      const [waiting, active, delayed, failed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getDelayedCount(),
        q.getFailedCount(),
      ]);
      status.counts[name] = { waiting, active, delayed, failed };
    } catch (err) {
      console.warn(`[BullMQ] getQueueStatus failed for ${name}:`, err);
    }
  }

  return status;
}
