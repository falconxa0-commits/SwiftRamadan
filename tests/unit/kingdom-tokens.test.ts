/**
 * Auren Kingdom V2 — Design Tokens contract tests (Phase 20-B).
 *
 * `src/kingdom-ui/lib/tokens.ts` is the canonical source of truth for
 * the V2 visual language. These tests guard the exact hex/rgba/px
 * values and motion easings — a silent drift here would change the
 * look of every premium surface that consumes `kingdom.*` tokens.
 */
import { describe, it, expect } from 'vitest';
import { kingdom } from '@/kingdom-ui/lib/tokens';

describe('kingdom tokens — Obsidian World', () => {
  it('kingdom.void equals "#050505"', () => {
    expect(kingdom.void).toBe('#050505');
  });
});

describe('kingdom tokens — Royal Intelligence', () => {
  it('kingdom.royal equals "#7C3AED"', () => {
    expect(kingdom.royal).toBe('#7C3AED');
  });
});

describe('kingdom tokens — Kingdom Trust', () => {
  it('kingdom.gold equals "#D4AF37"', () => {
    expect(kingdom.gold).toBe('#D4AF37');
  });
});

describe('kingdom tokens — AI Intelligence', () => {
  it('kingdom.ai equals "#6366F1"', () => {
    expect(kingdom.ai).toBe('#6366F1');
  });
});

describe('kingdom tokens — Ramadan Amber', () => {
  it('kingdom.amber equals "#F59E0B"', () => {
    expect(kingdom.amber).toBe('#F59E0B');
  });
});

describe('kingdom tokens — Faith Emerald', () => {
  it('kingdom.emerald equals "#10B981"', () => {
    expect(kingdom.emerald).toBe('#10B981');
  });
});

describe('kingdom tokens — Delivery Sky', () => {
  it('kingdom.sky equals "#38BDF8"', () => {
    expect(kingdom.sky).toBe('#38BDF8');
  });
});

describe('kingdom tokens — Glass', () => {
  it('kingdom.glassTint equals "rgba(255, 255, 255, 0.03)"', () => {
    expect(kingdom.glassTint).toBe('rgba(255, 255, 255, 0.03)');
  });
});

describe('kingdom tokens — Radius', () => {
  it('kingdom.radiusXl equals "24px"', () => {
    expect(kingdom.radiusXl).toBe('24px');
  });
});

describe('kingdom tokens — Motion duration', () => {
  it('kingdom.durationCinematic equals 0.8', () => {
    expect(kingdom.durationCinematic).toBe(0.8);
  });
});

describe('kingdom tokens — Motion easing', () => {
  it('kingdom.easeSmooth is an array of 4 numbers', () => {
    expect(Array.isArray(kingdom.easeSmooth)).toBe(true);
    expect(kingdom.easeSmooth).toHaveLength(4);
    for (const v of kingdom.easeSmooth) {
      expect(typeof v).toBe('number');
    }
  });
});

describe('kingdom tokens — Typography', () => {
  it('kingdom.fontSizeXl equals "20px"', () => {
    expect(kingdom.fontSizeXl).toBe('20px');
  });
});
