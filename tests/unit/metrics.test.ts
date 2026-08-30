import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Metrics utility unit tests — lock in the Phase 9 observability contract.
 *
 * Scope:
 *  - `recordMetric` — in-memory storage with name/value/labels/timestamp,
 *    and FIFO eviction when the bounded buffer (MAX_METRICS = 10000) fills.
 *  - `recordLatency` — convenience that computes duration from a start time
 *    and stores it under `${name}_latency_ms`.
 *  - `timed` — async wrapper that returns the wrapped function's result and
 *    records a latency metric in the `finally` block (so errors are timed too).
 *  - `getMetricsSummary` — aggregates per-name count / avg / max.
 *  - `getMetrics` — returns a defensive copy so callers can't mutate state.
 *
 * Test isolation strategy: the `metrics` array is module-scoped (a singleton).
 * Each test calls `vi.resetModules()` then dynamically `import()`s the module
 * so the in-memory store starts empty — same pattern used by the logger test.
 */
async function importFreshMetrics() {
  vi.resetModules();
  return await import('@/lib/metrics');
}

describe('metrics', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('recordMetric', () => {
    it('stores a metric with name, value, labels, and timestamp', async () => {
      const { recordMetric, getMetrics } = await importFreshMetrics();
      recordMetric('order.created', 1, { vendor: 'acme' });

      const metrics = getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('order.created');
      expect(metrics[0].value).toBe(1);
      expect(metrics[0].labels).toEqual({ vendor: 'acme' });
      expect(typeof metrics[0].timestamp).toBe('number');
      expect(metrics[0].timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('defaults labels to an empty object when not provided', async () => {
      const { recordMetric, getMetrics } = await importFreshMetrics();
      recordMetric('test.metric', 42);

      expect(getMetrics()[0].labels).toEqual({});
    });

    it('keeps the store bounded to 10000 entries (FIFO eviction)', async () => {
      const { recordMetric, getMetrics } = await importFreshMetrics();

      // Push 5 over the cap so the first 5 are evicted.
      for (let i = 0; i < 10005; i++) {
        recordMetric('bound.test', i);
      }

      const metrics = getMetrics();
      expect(metrics.length).toBe(10000);
      // The first 5 (values 0..4) should have been evicted — oldest
      // surviving entry is value 5; newest is value 10004.
      expect(metrics[0].value).toBe(5);
      expect(metrics[metrics.length - 1].value).toBe(10004);
    });
  });

  describe('recordLatency', () => {
    it('records duration as `${name}_latency_ms` computed from startTime', async () => {
      const { recordLatency, getMetrics } = await importFreshMetrics();
      const start = Date.now() - 100; // 100ms ago

      recordLatency('db.query', start, { table: 'users' });

      const metrics = getMetrics();
      expect(metrics[0].name).toBe('db.query_latency_ms');
      expect(metrics[0].value).toBeGreaterThanOrEqual(100);
      expect(metrics[0].labels).toEqual({ table: 'users' });
    });

    it('defaults labels to an empty object', async () => {
      const { recordLatency, getMetrics } = await importFreshMetrics();
      const start = Date.now();

      recordLatency('noop', start);

      expect(getMetrics()[0].labels).toEqual({});
    });

    it('records a near-zero duration when startTime is now', async () => {
      const { recordLatency, getMetrics } = await importFreshMetrics();

      recordLatency('instant', Date.now());

      const value = getMetrics()[0].value;
      expect(value).toBeGreaterThanOrEqual(0);
      // Generous upper bound to avoid flakes on slow CI runners.
      expect(value).toBeLessThan(1000);
    });
  });

  describe('timed', () => {
    it('wraps an async function with timing and returns its result', async () => {
      const { timed, getMetrics } = await importFreshMetrics();

      const result = await timed(
        'fetch.user',
        async () => ({ id: 42, name: 'Alice' }),
        { source: 'db' },
      );

      expect(result).toEqual({ id: 42, name: 'Alice' });

      const metrics = getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('fetch.user_latency_ms');
      expect(metrics[0].labels).toEqual({ source: 'db' });
      expect(metrics[0].value).toBeGreaterThanOrEqual(0);
    });

    it('defaults labels to an empty object when not provided', async () => {
      const { timed, getMetrics } = await importFreshMetrics();

      await timed('plain', async () => 'ok');

      expect(getMetrics()[0].labels).toEqual({});
    });

    it('records the latency metric even when the wrapped function throws', async () => {
      const { timed, getMetrics } = await importFreshMetrics();

      await expect(
        timed('fail.op', async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      // The `finally` block still records the latency despite the throw.
      const metrics = getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('fail.op_latency_ms');
    });
  });

  describe('getMetricsSummary', () => {
    it('returns count, avg, max per metric name', async () => {
      const { recordMetric, getMetricsSummary } = await importFreshMetrics();

      recordMetric('api.call', 100);
      recordMetric('api.call', 200);
      recordMetric('api.call', 300);
      recordMetric('other.call', 50);

      const summary = getMetricsSummary();

      expect(summary['api.call']).toEqual({ count: 3, avg: 200, max: 300 });
      expect(summary['other.call']).toEqual({ count: 1, avg: 50, max: 50 });
    });

    it('returns an empty object when no metrics have been recorded', async () => {
      const { getMetricsSummary } = await importFreshMetrics();
      expect(getMetricsSummary()).toEqual({});
    });

    it('handles a single metric — avg === max === value', async () => {
      const { recordMetric, getMetricsSummary } = await importFreshMetrics();
      recordMetric('solo', 42);

      expect(getMetricsSummary()['solo']).toEqual({ count: 1, avg: 42, max: 42 });
    });

    it('aggregates latency metrics with the same name across calls', async () => {
      const { recordLatency, getMetricsSummary } = await importFreshMetrics();

      // Three latency recordings with increasing durations.
      recordLatency('job', Date.now() - 10);
      recordLatency('job', Date.now() - 20);
      recordLatency('job', Date.now() - 30);

      const summary = getMetricsSummary();
      expect(summary['job_latency_ms'].count).toBe(3);
      expect(summary['job_latency_ms'].max).toBeGreaterThanOrEqual(30);
      expect(summary['job_latency_ms'].avg).toBeLessThanOrEqual(summary['job_latency_ms'].max);
    });
  });

  describe('getMetrics', () => {
    it('returns a defensive copy so callers cannot mutate internal state', async () => {
      const { recordMetric, getMetrics } = await importFreshMetrics();
      recordMetric('a', 1);
      recordMetric('b', 2);

      const snap1 = getMetrics();
      const snap2 = getMetrics();

      // Different references, same contents.
      expect(snap1).not.toBe(snap2);
      expect(snap1).toEqual(snap2);

      // Mutating the snapshot must not affect the internal store.
      snap1.push({ name: 'injected', value: 999, labels: {}, timestamp: 0 });
      expect(getMetrics().length).toBe(2);
    });
  });
});
