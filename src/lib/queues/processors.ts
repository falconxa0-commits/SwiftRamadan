// Worker stubs — job processors for the five queues.
//
// Each processor delegates to the existing communications modules (Resend,
// Termii, the unified `smartNotify` router, `fetch` for webhooks, and a stub
// for AI tasks). The processors are pure functions of `Job<T>` — the
// `Worker` instance (and its Redis subscription) is constructed by
// `startWorker`/`startAllWorkers` below.
//
// These are stubs: they cover the happy path and the obvious failure
// surfaces (catch + log + rethrow so BullMQ marks the job failed). The
// Phase 9 Echo scope is infrastructure — the actual job payloads will be
// fleshed out by subsequent phases that migrate route handlers from inline
// calls to `enqueue*`.

import { Worker, type Job, type Processor } from 'bullmq';
import { bullMQConnection, isBullMQEnabled } from './connection';
import { QUEUE_NAMES, type EmailJob, type SMSJob, type NotificationJob, type WebhookJob, type AIJob } from './index';
import { sendEmail } from '@/lib/communications/resend';
import { sendTermiiSMS } from '@/lib/communications/termii';
import { smartNotify } from '@/lib/communications';

// ─── Per-queue processors ───────────────────────────────────────────────────

const emailProcessor: Processor<EmailJob> = async (job: Job<EmailJob>) => {
  console.log(`[BullMQ:email] sending to ${Array.isArray(job.data.to) ? job.data.to.join(',') : job.data.to}`);
  const result = await sendEmail({
    to: job.data.to,
    subject: job.data.subject,
    html: job.data.html,
    ...(job.data.from ? { from: job.data.from } : {}),
  });
  if (!result.success) {
    // Throwing causes BullMQ to mark the job failed and apply its retry
    // policy. The error string preserves the provider's message for the
    // BullMQ dashboard.
    throw new Error(`Resend failure: ${result.error || 'unknown'}`);
  }
  return { messageId: result.messageId ?? null };
};

const smsProcessor: Processor<SMSJob> = async (job: Job<SMSJob>) => {
  console.log(`[BullMQ:sms] sending to ${job.data.to}`);
  const result = await sendTermiiSMS({
    to: job.data.to,
    message: job.data.message,
    ...(job.data.type ? { type: job.data.type } : {}),
  });
  if (!result.success) {
    throw new Error(`Termii failure: ${result.error || 'unknown'}`);
  }
  return { messageId: result.messageId ?? null };
};

const notificationProcessor: Processor<NotificationJob> = async (job: Job<NotificationJob>) => {
  console.log(`[BullMQ:notification] routing for user ${job.data.userId}`);
  // `smartNotify` already handles WhatsApp → SMS → Email fallback per
  // `src/lib/communications/index.ts`. We just forward the fields.
  const result = await smartNotify({
    email: job.data.email || '',
    ...(job.data.phone ? { phone: job.data.phone } : {}),
    ...(job.data.whatsappMessage ? { whatsappMessage: job.data.whatsappMessage } : {}),
    ...(job.data.smsMessage ? { smsMessage: job.data.smsMessage } : {}),
    ...(job.data.emailSubject ? { emailSubject: job.data.emailSubject } : {}),
    ...(job.data.emailHtml ? { emailHtml: job.data.emailHtml } : {}),
    ...(job.data.emailText ? { emailText: job.data.emailText } : {}),
    messageType: job.data.messageType ?? 'transactional',
  });
  if (result.channels.length === 0) {
    throw new Error(`Notification delivery failed on all channels: ${result.errors.join('; ')}`);
  }
  return { channels: result.channels };
};

const webhookProcessor: Processor<WebhookJob> = async (job: Job<WebhookJob>) => {
  console.log(`[BullMQ:webhook] delivering ${job.data.event} to ${job.data.url}`);
  const controller = new AbortController();
  // 30s timeout — webhooks shouldn't tie up a worker indefinitely.
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const resp = await fetch(job.data.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(job.data.secret ? { 'X-Webhook-Secret': job.data.secret } : {}),
      },
      body: JSON.stringify({ event: job.data.event, payload: job.data.payload }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      throw new Error(`Webhook ${job.data.url} responded ${resp.status}`);
    }
    return { status: resp.status };
  } finally {
    clearTimeout(timeout);
  }
};

const aiProcessor: Processor<AIJob> = async (job: Job<AIJob>) => {
  // Stub — the AI dispatch is intentionally a no-op for Phase 9 Echo. The
  // real implementation will route `job.data.task` to the appropriate skill
  // (LLM / VLM / ASR / TTS / image-gen / web-search) via `src/lib/ai/sdk.ts`.
  console.log(`[BullMQ:ai] processing task "${job.data.task}" (stub)`);
  return { task: job.data.task, status: 'stub' };
};

// ─── Worker lifecycle ──────────────────────────────────────────────────────

export interface WorkerHandle {
  name: string;
  close: () => Promise<void>;
}

/**
 * Start a single BullMQ `Worker` for one queue. Returns a handle whose
 * `close()` should be awaited on shutdown. Returns `null` (with a warning)
 * when Redis isn't configured — so `startAllWorkers` can be called from the
 * worker process unconditionally and degrade gracefully.
 */
export function startWorker<T>(
  queueName: string,
  processor: Processor<T>,
  concurrency = 1,
): WorkerHandle | null {
  if (!isBullMQEnabled || !bullMQConnection) {
    console.warn(`[BullMQ] Cannot start worker "${queueName}" — Redis not configured.`);
    return null;
  }
  const worker = new Worker<T>(queueName, processor, {
    connection: bullMQConnection,
    concurrency,
  });
  worker.on('failed', (job: Job<unknown> | undefined, err: Error) => {
    console.error(`[BullMQ:${queueName}] job ${job?.id ?? '?'} failed (attempt ${job?.attemptsMade ?? 0}):`, err.message);
  });
  worker.on('error', (err: Error) => {
    // BullMQ emits `error` for unrecoverable worker errors (e.g. lost
    // Redis connection for too long). Log loudly but don't crash — the
    // worker will attempt to reconnect.
    console.error(`[BullMQ:${queueName}] worker error:`, err);
  });
  console.log(`[BullMQ] worker "${queueName}" started (concurrency=${concurrency})`);
  return {
    name: queueName,
    close: () => worker.close(),
  };
}

/**
 * Start all five workers. Returns an array of handles (empty if Redis is
 * disabled). Caller (the worker entry point `start-workers.ts`) is
 * responsible for wiring shutdown handlers.
 */
export function startAllWorkers(): WorkerHandle[] {
  const handles: (WorkerHandle | null)[] = [
    startWorker(QUEUE_NAMES.email, emailProcessor, 5),
    startWorker(QUEUE_NAMES.sms, smsProcessor, 5),
    startWorker(QUEUE_NAMES.notification, notificationProcessor, 3),
    startWorker(QUEUE_NAMES.webhook, webhookProcessor, 3),
    startWorker(QUEUE_NAMES.ai, aiProcessor, 2),
  ];
  const started = handles.filter((h): h is WorkerHandle => h !== null);
  if (started.length === 0) {
    console.warn('[BullMQ] No workers started — Redis not configured.');
  } else {
    console.log(`[BullMQ] ${started.length} worker(s) started: ${started.map((h) => h.name).join(', ')}`);
  }
  return started;
}

// Exported for unit tests that want to invoke the processor directly (no
// Redis required) — useful for verifying the contract between enqueue
// payload and provider call without standing up the worker process.
export const processors = {
  email: emailProcessor,
  sms: smsProcessor,
  notification: notificationProcessor,
  webhook: webhookProcessor,
  ai: aiProcessor,
};
