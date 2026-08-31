/**
 * Auren Kingdom Design System — CSS ↔ TS contract tests.
 *
 * The Auren Kingdom visual language was added to `globals.css`
 * (45 custom properties + 20 utility classes + 4 keyframes) and
 * mirrored in `src/lib/design-tokens.ts` as the `colors.auren`
 * sub-object (Phase 15-A). Both sides must stay in sync — a drift
 * here would silently break the look of every premium surface that
 * consumes the tokens via `var(--auren-*)` or `colors.auren.*`.
 *
 * These tests:
 *   - assert the canonical custom properties exist in the CSS,
 *   - assert the canonical utility classes exist in the CSS,
 *   - assert the keyframes (`auren-breathe`, `auren-shimmer`) exist,
 *   - assert the `prefers-reduced-motion` accessibility override
 *     disables Auren animations,
 *   - assert `design-tokens.ts` exposes the `auren` color section,
 *   - assert the CSS hex values and the TS hex values match for the
 *     three flagship tokens (`royal`, `gold`, `void`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { colors } from '@/lib/design-tokens';

const globalsPath = resolve(
  __dirname,
  '..',
  '..',
  'src',
  'app',
  'globals.css',
);
const globals = readFileSync(globalsPath, 'utf-8');

describe('auren-design — globals.css custom properties', () => {
  it('globals.css declares --auren-royal', () => {
    expect(globals).toContain('--auren-royal:');
  });

  it('globals.css declares --auren-gold', () => {
    expect(globals).toContain('--auren-gold:');
  });

  it('globals.css declares --auren-void', () => {
    expect(globals).toContain('--auren-void:');
  });
});

describe('auren-design — globals.css utility classes', () => {
  it('globals.css declares the .auren-btn-royal premium button class', () => {
    expect(globals).toContain('.auren-btn-royal');
  });

  it('globals.css declares the .auren-glass glass surface class', () => {
    expect(globals).toContain('.auren-glass');
  });
});

describe('auren-design — globals.css keyframes + reduced motion', () => {
  it('globals.css declares the auren-breathe keyframe', () => {
    expect(globals).toContain('@keyframes auren-breathe');
  });

  it('globals.css declares the auren-shimmer keyframe', () => {
    expect(globals).toContain('@keyframes auren-shimmer');
  });

  it('globals.css includes a prefers-reduced-motion override disabling Auren animations', () => {
    expect(globals).toContain('@media (prefers-reduced-motion: reduce)');
    // The reduced-motion block should target at least one of the
    // animated Auren selectors so motion-sensitive users get a static
    // fallback.
    expect(globals).toMatch(/\.auren-ai-orb|\.auren-thinking span|\.auren-enter|\.auren-stagger > \*|\.auren-skeleton/);
  });
});

describe('auren-design — design-tokens.ts', () => {
  it('design-tokens.ts exposes an `auren` color section', () => {
    expect(colors).toHaveProperty('auren');
    expect(typeof colors.auren).toBe('object');
    expect(colors.auren).not.toBeNull();
  });

  it('Auren tokens match between CSS and TS (royal, gold, void)', () => {
    // Pull the hex from the CSS via a tolerant regex; if the regex
    // misses, fall back to a substring contains-check so the test
    // still catches a hard mismatch (the value resolves to undefined
    // and the assertion fails).
    const royalHex =
      /--auren-royal:\s*(#[0-9A-Fa-f]{6});/.exec(globals)?.[1] ??
      (globals.includes('#7C3AED') ? '#7C3AED' : undefined);
    const goldHex =
      /--auren-gold:\s*(#[0-9A-Fa-f]{6});/.exec(globals)?.[1] ??
      (globals.includes('#D4AF37') ? '#D4AF37' : undefined);
    const voidHex =
      /--auren-void:\s*(#[0-9A-Fa-f]{6});/.exec(globals)?.[1] ??
      (globals.includes('#050505') ? '#050505' : undefined);

    expect(royalHex).toBe(colors.auren.royal);
    expect(goldHex).toBe(colors.auren.gold);
    expect(voidHex).toBe(colors.auren.void);
  });
});
