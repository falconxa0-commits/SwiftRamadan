/**
 * Design Tokens — "Aurora Luxe" source-of-truth tests.
 *
 * Verifies the brand color hexes, the Auren Kingdom premium palette,
 * the typography/spacing/radius scales, and the getRoleConfig helper.
 *
 * These tokens are imported by every Swift component primitive and
 * must stay stable — a silent hex change here would cascade to 122+
 * components. Locking them with assertions catches accidental edits.
 */
import { describe, it, expect } from 'vitest';
import {
  colors,
  typography,
  spacing,
  radius,
  getRoleConfig,
  roleConfig,
} from '@/lib/design-tokens';

describe('design-tokens — brand colors', () => {
  it('colors.customer.primary equals #10E07A (emerald)', () => {
    expect(colors.customer.primary).toBe('#10E07A');
  });

  it('colors.vendor.primary equals #F5C451 (gold)', () => {
    expect(colors.vendor.primary).toBe('#F5C451');
  });

  it('colors.rider.primary equals #38BDF8 (sky blue)', () => {
    expect(colors.rider.primary).toBe('#38BDF8');
  });

  it('colors.ai.primary equals #8B5CF6 (purple)', () => {
    expect(colors.ai.primary).toBe('#8B5CF6');
  });
});

describe('design-tokens — Auren Kingdom premium palette', () => {
  it('colors.auren.royal equals #7C3AED', () => {
    expect(colors.auren.royal).toBe('#7C3AED');
  });

  it('colors.auren.gold equals #D4AF37', () => {
    expect(colors.auren.gold).toBe('#D4AF37');
  });

  it('colors.auren.void equals #050505 (deepest background)', () => {
    expect(colors.auren.void).toBe('#050505');
  });

  it('colors.auren.imperial equals #9333EA (royal hover)', () => {
    expect(colors.auren.imperial).toBe('#9333EA');
  });

  it('colors.auren.mystic equals #C084FC (light royal)', () => {
    expect(colors.auren.mystic).toBe('#C084FC');
  });
});

describe('design-tokens — typography / spacing / radius scales', () => {
  it('typography.fontSize.base equals "15px"', () => {
    expect(typography.fontSize.base).toBe('15px');
  });

  it('typography.fontWeight.bold equals 700', () => {
    expect(typography.fontWeight.bold).toBe(700);
  });

  it('spacing[4] equals "16px" (4px base scale)', () => {
    expect(spacing[4]).toBe('16px');
  });

  it('spacing[8] equals "32px" (4px base scale)', () => {
    expect(spacing[8]).toBe('32px');
  });

  it('radius.lg equals "14px"', () => {
    expect(radius.lg).toBe('14px');
  });

  it('radius["2xl"] equals "28px" (card corners)', () => {
    expect(radius['2xl']).toBe('28px');
  });
});

describe('design-tokens — getRoleConfig helper', () => {
  it('getRoleConfig("customer") returns the customer config block', () => {
    const cfg = getRoleConfig('customer');
    expect(cfg).toBe(roleConfig.customer);
    expect(cfg.primary).toBe(colors.customer.primary);
    expect(cfg.primaryHover).toBe(colors.customer.primaryHover);
    expect(cfg.glow).toBe(colors.customer.glow);
  });

  it('getRoleConfig("vendor") returns the vendor config block', () => {
    const cfg = getRoleConfig('vendor');
    expect(cfg).toBe(roleConfig.vendor);
    expect(cfg.primary).toBe(colors.vendor.primary);
  });

  it('getRoleConfig("rider") returns the rider config block', () => {
    const cfg = getRoleConfig('rider');
    expect(cfg).toBe(roleConfig.rider);
    expect(cfg.primary).toBe(colors.rider.primary);
  });
});
