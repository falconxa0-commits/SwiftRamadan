import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Sentry audit S6 regression tests.
 *
 * Audit finding S6: `src/lib/monitoring/sentry.ts` contained a hardcoded
 * Sentry ingest URL (`https://o4506961265258496.ingest.sentry.io/api/4506961270239232/envelope/`).
 * That URL leaked the project's Sentry org/project IDs into source, and
 * meant any test or dev environment with SENTRY_DSN unset would still
 * *attempt* to POST to that production endpoint.
 *
 * The fix:
 *   - The ingest URL is now derived from `SENTRY_DSN` (+ optional
 *     `SENTRY_ORG` / `SENTRY_PROJECT`) env vars.
 *   - captureException / captureMessage no-op when `SENTRY_DSN` is unset.
 *
 * These tests assert the source file no longer contains the hardcoded
 * host/path, the env-var contract is in place, and that `captureException`
 * does not call `fetch` when DSN is unset.
 */

const SENTRY_PATH = path.resolve(__dirname, '../../src/lib/monitoring/sentry.ts');

describe('Sentry audit S6 — no hardcoded URL', () => {
  it('does not contain the leaked Sentry org id (o4506961265258496) anywhere in source', () => {
    const src = fs.readFileSync(SENTRY_PATH, 'utf8');
    expect(src).not.toContain('o4506961265258496');
  });

  it('does not contain the leaked Sentry project id (4506961270239232) anywhere in source', () => {
    const src = fs.readFileSync(SENTRY_PATH, 'utf8');
    expect(src).not.toContain('4506961270239232');
  });

  it('does not contain a hardcoded ingest.sentry.io URL literal', () => {
    const src = fs.readFileSync(SENTRY_PATH, 'utf8');
    // Allow the helper to *construct* the URL from env vars at runtime, but
    // forbid a static `https://o....ingest.sentry.io/api/.../envelope/` literal.
    expect(src).not.toMatch(/https:\/\/o\d+\.ingest\.sentry\.io\/api\/\d+\/envelope\/?/);
  });

  it('reads SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT from env vars', () => {
    const src = fs.readFileSync(SENTRY_PATH, 'utf8');
    expect(src).toMatch(/process\.env\.SENTRY_DSN/);
    expect(src).toMatch(/process\.env\.SENTRY_ORG/);
    expect(src).toMatch(/process\.env\.SENTRY_PROJECT/);
  });

  it('logs a warning at module load when SENTRY_DSN is unset', () => {
    const src = fs.readFileSync(SENTRY_PATH, 'utf8');
    expect(src).toContain("SENTRY_DSN not set");
    expect(src).toContain("console.warn");
  });
});

describe('Sentry audit S6 — no-op behavior when DSN unset', () => {
  const originalDsn = process.env.SENTRY_DSN;
  const originalOrg = process.env.SENTRY_ORG;
  const originalProject = process.env.SENTRY_PROJECT;

  beforeEach(() => {
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_ORG;
    delete process.env.SENTRY_PROJECT;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalDsn !== undefined) process.env.SENTRY_DSN = originalDsn;
    else delete process.env.SENTRY_DSN;
    if (originalOrg !== undefined) process.env.SENTRY_ORG = originalOrg;
    else delete process.env.SENTRY_ORG;
    if (originalProject !== undefined) process.env.SENTRY_PROJECT = originalProject;
    else delete process.env.SENTRY_PROJECT;
    vi.restoreAllMocks();
  });

  it('captureException returns { eventId: null } and does not fetch when DSN unset', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { captureException } = await import('@/lib/monitoring/sentry');
    const result = await captureException(new Error('test'), { tags: { route: '/x' } });

    expect(result).toEqual({ eventId: null });
    expect(fetchSpy).not.toHaveBeenCalled();
    // Module-load warning fired at least once.
    expect(warnSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    warnSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('captureMessage returns { eventId: null } and does not fetch when DSN unset', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { captureMessage } = await import('@/lib/monitoring/sentry');
    const result = await captureMessage('hello', 'info', { tags: { route: '/x' } });

    expect(result).toEqual({ eventId: null });
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
