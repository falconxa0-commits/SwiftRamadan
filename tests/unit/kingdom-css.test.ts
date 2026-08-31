/**
 * Auren Kingdom V2 — Premium CSS contract tests (Phase 20-B).
 *
 * `src/kingdom-ui/lib/kingdom.css` ships the V2 custom properties
 * (`--kv-*`), glass/card/button surfaces, gradient text, AI orb,
 * keyframes and the `prefers-reduced-motion` accessibility override.
 *
 * These tests guard the contract — if any flagship selector,
 * keyframe or accessibility override is removed, every V2 surface
 * that consumes it would silently regress to bare CSS.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cssPath = resolve(
  __dirname,
  '..',
  '..',
  'src',
  'kingdom-ui',
  'lib',
  'kingdom.css',
);
const css = readFileSync(cssPath, 'utf-8');

describe('Kingdom V2 CSS — custom properties', () => {
  it('contains --kv-void: #050505', () => {
    expect(css).toContain('--kv-void: #050505');
  });

  it('contains --kv-royal: #7C3AED', () => {
    expect(css).toContain('--kv-royal: #7C3AED');
  });

  it('contains --kv-gold: #D4AF37', () => {
    expect(css).toContain('--kv-gold: #D4AF37');
  });

  it('contains --kv-ai: #6366F1', () => {
    expect(css).toContain('--kv-ai: #6366F1');
  });
});

describe('Kingdom V2 CSS — surfaces & components', () => {
  it('contains .kv-root class', () => {
    expect(css).toContain('.kv-root');
  });

  it('contains .kv-glass class', () => {
    expect(css).toContain('.kv-glass');
  });

  it('contains .kv-card class', () => {
    expect(css).toContain('.kv-card');
  });

  it('contains .kv-card::before pseudo', () => {
    expect(css).toContain('.kv-card::before');
  });

  it('contains .kv-btn-royal class', () => {
    expect(css).toContain('.kv-btn-royal');
  });

  it('contains .kv-btn-gold class', () => {
    expect(css).toContain('.kv-btn-gold');
  });

  it('contains .kv-gradient-text class', () => {
    expect(css).toContain('.kv-gradient-text');
  });

  it('contains .kv-ai-orb class', () => {
    expect(css).toContain('.kv-ai-orb');
  });
});

describe('Kingdom V2 CSS — keyframes & accessibility', () => {
  it('contains @keyframes kv-breathe', () => {
    expect(css).toContain('@keyframes kv-breathe');
  });

  it('contains @keyframes kv-shimmer', () => {
    expect(css).toContain('@keyframes kv-shimmer');
  });

  it('contains prefers-reduced-motion override', () => {
    expect(css).toContain('prefers-reduced-motion');
  });
});
