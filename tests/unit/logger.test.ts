import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Logger unit tests — lock in the structured-logging contract:
 *  - JSON output in production (one object per line, ready for log aggregation)
 *  - Pretty output in dev (coloured, human-readable)
 *  - Spread `meta` is merged into the entry
 *  - captureException re-exported from sentry module
 *
 * These tests stub `process.stdout.write` and `process.env.NODE_ENV` so they
 * run deterministically regardless of the host environment.
 */

function captureStdout(): {
  write: ReturnType<typeof vi.spyOn>;
  lines: string[];
} {
  const lines: string[] = [];
  const write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  });
  return { write, lines };
}

async function importFreshLogger() {
  // Cache-bust so NODE_ENV at import time is honoured on every call.
  vi.resetModules();
  return (await import('@/lib/logger')).logger;
}

describe('logger', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let lines: string[];

  beforeEach(() => {
    ({ write: writeSpy, lines } = captureStdout());
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('emits JSON in production with level, message, timestamp + spread meta', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = await importFreshLogger();

    logger.info('order created', { orderId: 'abc123', total: 4500 });

    expect(lines.length).toBe(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('order created');
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(parsed.orderId).toBe('abc123');
    expect(parsed.total).toBe(4500);
  });

  it('emits pretty coloured output in dev with no meta', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const logger = await importFreshLogger();

    logger.info('hello world');

    // No meta → only one write call (the header line).
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('[INFO]');
    expect(lines[0]).toContain('hello world');
    // ANSI colour code for cyan (info level).
    expect(lines[0]).toContain('\x1b[36m');
  });

  it('emits pretty output in dev with meta as indented JSON', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const logger = await importFreshLogger();

    logger.warn('cache miss', { key: 'user:42' });

    // Two writes: header line + indented meta JSON.
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('[WARN]');
    expect(lines[0]).toContain('cache miss');
    expect(lines[0]).toContain('\x1b[33m'); // yellow for warn
    const metaLine = lines[1].trim();
    expect(metaLine).toContain('"key": "user:42"');
  });

  it('uses red ANSI colour for error level', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const logger = await importFreshLogger();

    logger.error('boom', { code: 500 });

    expect(lines[0]).toContain('\x1b[31m'); // red
    expect(lines[0]).toContain('[ERROR]');
    expect(lines[0]).toContain('boom');
  });

  it('handles all four log levels without throwing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = await importFreshLogger();

    expect(() => {
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');
    }).not.toThrow();

    expect(lines.length).toBe(4);
    expect(JSON.parse(lines[0]).level).toBe('debug');
    expect(JSON.parse(lines[1]).level).toBe('info');
    expect(JSON.parse(lines[2]).level).toBe('warn');
    expect(JSON.parse(lines[3]).level).toBe('error');
  });

  it('re-exports captureException from @/lib/monitoring/sentry', async () => {
    const mod = await import('@/lib/logger');
    expect(typeof mod.captureException).toBe('function');
  });
});
