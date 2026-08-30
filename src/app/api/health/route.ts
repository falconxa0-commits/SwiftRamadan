import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isRedisAvailable } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  let allHealthy = true;

  // Check database connectivity
  const dbStart = Date.now();
  try {
    const { db } = await import('@/lib/db');
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    checks.database = { status: 'error', error: message };
    allHealthy = false;
    logger.error('Health check: database error', {
      latency: Date.now() - dbStart,
      error: message,
    });
  }

  // Check Redis connectivity
  const redisStart = Date.now();
  try {
    const { redis } = await import('@/lib/redis');
    if (redis) {
      await redis.ping();
      checks.redis = { status: 'ok', latency: Date.now() - redisStart };
    } else {
      // Redis not configured — degraded but not failing, in-memory fallback is in use.
      checks.redis = {
        status: 'not_configured',
        error: 'Redis not configured (using in-memory fallback)',
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Redis unavailable';
    checks.redis = { status: 'error', error: message };
    allHealthy = false;
    logger.warn('Health check: redis degraded', {
      latency: Date.now() - redisStart,
      error: message,
    });
  }

  // Overall status: `ok` only if every required dependency is healthy.
  // Redis-not-configured does NOT fail the overall status (the app has an
  // in-memory fallback), but DB errors do.
  const status = allHealthy ? 'ok' : 'degraded';
  const statusCode = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.2.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks,
      // Configuration flags for ops visibility (no secrets — just booleans).
      flags: {
        redisConfigured: isRedisAvailable,
      },
    },
    { status: statusCode },
  );
}
