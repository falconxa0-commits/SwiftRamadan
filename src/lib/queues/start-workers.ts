// Worker process entry point — `bun run workers` (see package.json).
//
// This script runs OUTSIDE Next.js (it's a standalone Bun/Node script). It
// imports the queue processors, starts one BullMQ `Worker` per queue, and
// waits for SIGINT/SIGTERM to shut them down cleanly.
//
// Why a separate process? BullMQ `Worker` opens long-lived Redis
// subscriptions (BRPOPLPUSH) that don't play well with Next.js's hot-reload
// and serverless model. Running workers in their own process keeps the web
// app's request thread lean and lets workers scale independently.
//
// Usage:
//   bun run workers                      # uses REDIS_URL from env
//   REDIS_URL=redis://localhost:6379 bun run workers
//
// When Redis is not configured (`REDIS_URL` unset), the script logs a
// warning and exits 0 — this keeps `bun run workers` safe to invoke from
// dev environments without a Redis container.

import { isBullMQEnabled, bullMQBackend } from './connection';
import { startAllWorkers, type WorkerHandle } from './processors';

async function main(): Promise<void> {
  console.log('[BullMQ] worker process starting...');
  console.log(`[BullMQ] backend: ${bullMQBackend ?? 'disabled'}`);

  if (!isBullMQEnabled) {
    console.warn(
      '[BullMQ] REDIS_URL not set — nothing to do. ' +
        'Set REDIS_URL (e.g. redis://localhost:6379) and re-run `bun run workers`.',
    );
    process.exit(0);
  }

  const handles: WorkerHandle[] = startAllWorkers();
  if (handles.length === 0) {
    console.error('[BullMQ] No workers started — exiting.');
    process.exit(1);
  }

  // ─── Graceful shutdown ──────────────────────────────────────────────────
  // On SIGINT/SIGTERM we tell every worker to stop accepting new jobs and
  // finish in-flight ones. BullMQ's `worker.close()` resolves once active
  // jobs complete (or timeout). We give it a 10s ceiling to avoid hanging
  // on a stuck job.
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[BullMQ] ${signal} received — shutting down ${handles.length} worker(s)...`);

    const forceExit = setTimeout(() => {
      console.error('[BullMQ] graceful shutdown timed out — forcing exit.');
      process.exit(1);
    }, 10_000);

    try {
      const results = await Promise.allSettled(handles.map((h) => h.close()));
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`[BullMQ] ${failed.length} worker(s) failed to close cleanly.`);
      }
      console.log('[BullMQ] shutdown complete.');
    } finally {
      clearTimeout(forceExit);
      process.exit(0);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGQUIT', () => void shutdown('SIGQUIT'));

  // Keep the process alive — `Worker` instances don't pin the event loop on
  // their own once they've gone idle, but the Redis subscription keeps the
  // socket open. This log line is the marker operators grep for to confirm
  // the worker process is healthy.
  console.log('[BullMQ] workers ready — waiting for jobs.');
}

// Top-level await is fine in Bun scripts. Wrap in main() + catch so we
// get a clean exit code on construction errors (e.g. bad REDIS_URL).
main().catch((err: unknown) => {
  console.error('[BullMQ] worker process failed to start:', err);
  process.exit(1);
});
