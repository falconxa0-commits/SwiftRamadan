import { NextResponse } from 'next/server';
import { getMetricsSummary } from '@/lib/metrics';
import { isRedisAvailable } from '@/lib/redis';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/metrics — Prometheus-style metrics endpoint
export async function GET() {
  const summary = getMetricsSummary();
  const redisOk = isRedisAvailable;

  let dbOk = true;
  try {
    await db.user.count();
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    metrics: summary,
    dependencies: {
      redis: redisOk ? 'up' : 'down',
      database: dbOk ? 'up' : 'down',
    },
  });
}
