import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Check database connectivity
  const dbStart = Date.now();
  try {
    const { db } = await import('@/lib/db');
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Check Redis connectivity
  const redisStart = Date.now();
  try {
    const { redis } = await import('@/lib/redis');
    if (redis) {
      await redis.ping();
      checks.redis = { status: 'ok', latency: Date.now() - redisStart };
    } else {
      checks.redis = { status: 'degraded', error: 'Redis not configured (using in-memory fallback)' };
    }
  } catch {
    checks.redis = { status: 'degraded', error: 'Redis unavailable' };
  }

  // Overall status
  const hasError = Object.values(checks).some(c => c.status === 'error');
  const status = hasError ? 'unhealthy' : 'ok';
  const statusCode = hasError ? 503 : 200;

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.2.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks,
  }, { status: statusCode });
}
