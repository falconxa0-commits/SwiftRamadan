/**
 * Simple metrics collection — request latency, DB latency, AI latency, queue latency.
 * Uses in-memory counters (production: replace with Prometheus client).
 */

interface Metric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

const metrics: Metric[] = [];
const MAX_METRICS = 10000;

export function recordMetric(name: string, value: number, labels: Record<string, string> = {}): void {
  metrics.push({ name, value, labels, timestamp: Date.now() });
  if (metrics.length > MAX_METRICS) {
    metrics.shift(); // Keep bounded
  }
}

export function recordLatency(name: string, startTime: number, labels: Record<string, string> = {}): void {
  const duration = Date.now() - startTime;
  recordMetric(`${name}_latency_ms`, duration, labels);
}

export function getMetrics(): Metric[] {
  return [...metrics];
}

export function getMetricsSummary(): Record<string, { count: number; avg: number; max: number }> {
  const summary: Record<string, { count: number; total: number; max: number }> = {};
  for (const m of metrics) {
    if (!summary[m.name]) summary[m.name] = { count: 0, total: 0, max: 0 };
    summary[m.name].count++;
    summary[m.name].total += m.value;
    summary[m.name].max = Math.max(summary[m.name].max, m.value);
  }
  const result: Record<string, { count: number; avg: number; max: number }> = {};
  for (const [name, s] of Object.entries(summary)) {
    result[name] = { count: s.count, avg: s.total / s.count, max: s.max };
  }
  return result;
}

// Convenience: wrap an async function with timing
export async function timed<T>(
  name: string,
  fn: () => Promise<T>,
  labels: Record<string, string> = {}
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    recordLatency(name, start, labels);
  }
}
