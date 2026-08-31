/**
 * Auren Kingdom CSS Class presence tests (Phase 18).
 *
 * Phase 18 introduced a complete premium visual layer via custom
 * `.auren-*` utility classes in `src/app/globals.css`. These tests
 * guard the contract — if any flagship class is accidentally
 * removed from the stylesheet, every premium surface that consumes
 * it (HomeTab, BottomNav, ExploreTab, CartTab, OrdersTab,
 * VendorDashboard, RiderDashboard, ProfileTab, AdminDashboard)
 * would silently fall back to bare Tailwind classes and the
 * Auren Kingdom look would regress.
 *
 * Each test asserts that a specific `.auren-*` selector (or its
 * state/pseudo-element variant) is present in `globals.css`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const css = readFileSync('./src/app/globals.css', 'utf-8');

describe('Auren Kingdom CSS Classes (Phase 18)', () => {
  it('has .auren-cinematic class', () => {
    expect(css).toContain('.auren-cinematic');
  });
  it('has .auren-premium-card class', () => {
    expect(css).toContain('.auren-premium-card');
  });
  it('has .auren-premium-card::before pseudo', () => {
    expect(css).toContain('.auren-premium-card::before');
  });
  it('has .auren-accent-line class', () => {
    expect(css).toContain('.auren-accent-line');
  });
  it('has .auren-section class', () => {
    expect(css).toContain('.auren-section');
  });
  it('has .auren-tab-bar class', () => {
    expect(css).toContain('.auren-tab-bar');
  });
  it('has .auren-tab-item class', () => {
    expect(css).toContain('.auren-tab-item');
  });
  it('has .auren-tab-item.active state', () => {
    expect(css).toContain('.auren-tab-item.active');
  });
  it('has .auren-input class', () => {
    expect(css).toContain('.auren-input');
  });
  it('has .auren-input focus state', () => {
    expect(css).toContain('.auren-input:focus');
  });
  it('has .auren-gradient-text class', () => {
    expect(css).toContain('.auren-gradient-text');
  });
  it('has .auren-gradient-gold class', () => {
    expect(css).toContain('.auren-gradient-gold');
  });
  it('has .auren-hero-glow class', () => {
    expect(css).toContain('.auren-hero-glow');
  });
  it('has .auren-badge-royal class', () => {
    expect(css).toContain('.auren-badge-royal');
  });
  it('has .auren-badge-gold class', () => {
    expect(css).toContain('.auren-badge-gold');
  });
  it('has .auren-divider class', () => {
    expect(css).toContain('.auren-divider');
  });
  it('has .auren-fab class', () => {
    expect(css).toContain('.auren-fab');
  });
  it('has .auren-list-item class', () => {
    expect(css).toContain('.auren-list-item');
  });
  it('has .auren-metric class', () => {
    expect(css).toContain('.auren-metric');
  });
  it('has .auren-progress class', () => {
    expect(css).toContain('.auren-progress');
  });
  it('has .auren-progress-fill class', () => {
    expect(css).toContain('.auren-progress-fill');
  });
  it('has .auren-backdrop class', () => {
    expect(css).toContain('.auren-backdrop');
  });
  it('has .auren-toast class', () => {
    expect(css).toContain('.auren-toast');
  });
  it('has .auren-empty class', () => {
    expect(css).toContain('.auren-empty');
  });
  it('has reduced motion override for Phase 18 classes', () => {
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('.auren-cinematic');
  });
});
