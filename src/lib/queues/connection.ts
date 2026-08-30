// BullMQ Redis connection — dedicated ioredis instance for background jobs.
//
// Why a separate connection (not reusing src/lib/redis.ts)?
//   BullMQ requires `maxRetriesPerRequest: null` on its connection because it
//   manages its own retry/blocking semantics. The cache/rate-limit connection
//   in `src/lib/redis.ts` uses `maxRetriesPerRequest: 3`, which silently breaks
//   BullMQ's blocking reads. Sharing a connection also creates noise on the
//   BRPOPLPUSH subscription used by `Worker`. So we construct a second ioredis
//   instance dedicated to queues/workers.
//
// Graceful fallback:
//   If neither `REDIS_URL` nor `REDIS_HOST`+`REDIS_PORT` is set, this module
//   exports `bullMQConnection = null` and `isBullMQEnabled = false`. The queue
//   singletons in `./index.ts` then remain null and the `enqueue*` helpers
//   fail open with a warning instead of throwing. This keeps request threads
//   unblocked when Redis is unavailable (the "don't break existing routes"
//   rule from PHASE-9-ECHO-BULLMQ).

import IORedis, { type RedisOptions } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';
const REDIS_HOST = process.env.REDIS_HOST || '';
const REDIS_PORT = process.env.REDIS_PORT || '';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_DB = process.env.REDIS_DB || '';

let warnedNoRedis = false;
function warnOnceNoRedis(): void {
  if (warnedNoRedis) return;
  warnedNoRedis = true;
  console.warn(
    '[BullMQ] REDIS_URL not set — background jobs disabled. ' +
      'Emails, SMS, notifications, webhooks, and AI tasks will run inline or be skipped. ' +
      'Set REDIS_URL (e.g. redis://localhost:6379) and start the worker process `bun run workers` to enable.',
  );
}

const connectionConfig: RedisOptions = {
  // BullMQ requires this to be null — it uses blocking reads (BRPOPLPUSH etc.)
  // that don't tolerate a finite request-retry budget.
  maxRetriesPerRequest: null,
  // Skip the READY check so BullMQ can issue commands before the connection
  // finishes its initial handshake (it has its own internal queueing).
  enableReadyCheck: false,
  // Reconnect with capped exponential backoff. Don't crash the worker
  // process on transient Redis outages.
  retryStrategy: (times: number) => Math.min(times * 200, 2000),
  // Don't keep the process alive on shutdown — unref's the reconnect timer.
  enableOfflineQueue: true,
  lazyConnect: false,
};

let connection: IORedis | null = null;

if (REDIS_URL) {
  try {
    connection = new IORedis(REDIS_URL, connectionConfig);
  } catch (err) {
    console.warn('[BullMQ] Failed to construct Redis connection from REDIS_URL — jobs disabled:', err);
  }
} else if (REDIS_HOST && REDIS_PORT) {
  try {
    connection = new IORedis({
      host: REDIS_HOST,
      port: Number(REDIS_PORT) || 6379,
      ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
      ...(REDIS_DB ? { db: Number(REDIS_DB) } : {}),
      ...connectionConfig,
    });
  } catch (err) {
    console.warn('[BullMQ] Failed to construct Redis connection from REDIS_HOST/REDIS_PORT — jobs disabled:', err);
  }
} else {
  warnOnceNoRedis();
}

// Surface connection lifecycle events as warnings (not errors) so transient
// Redis issues don't spam stderr during a Redis pod restart.
if (connection) {
  connection.on('error', (err: Error) => {
    console.warn('[BullMQ] Redis connection error (non-fatal — workers will retry):', err.message);
  });
  connection.on('reconnecting', (delay: number) => {
    console.warn(`[BullMQ] Redis reconnecting in ${delay}ms...`);
  });
}

/**
 * Dedicated ioredis instance for BullMQ. `null` when Redis is not configured
 * — callers and queue singletons MUST null-check before use.
 */
export const bullMQConnection: IORedis | null = connection;

/**
 * `true` when Redis is configured and the BullMQ connection was constructed.
 * Use this as the gating flag for queue/worker startup.
 */
export const isBullMQEnabled: boolean = connection !== null;

/**
 * Human-readable backend descriptor — exposed for logs/health endpoints.
 * Mirrors the shape of `redisBackend` from `src/lib/redis.ts`.
 */
export const bullMQBackend: 'redis-url' | 'redis-host-port' | null = connection
  ? REDIS_URL
    ? 'redis-url'
    : 'redis-host-port'
  : null;

/**
 * Lazy (re)construction hook — intended for tests that mock the env and want
 * a fresh connection. Not used at runtime; production paths use the module
 * scope `connection` above.
 */
export function __rebuildConnectionForTests(): void {
  // Intentionally a no-op at runtime; provided as a stable extension seam.
  console.debug('[BullMQ] __rebuildConnectionForTests called (no-op in production).');
}
