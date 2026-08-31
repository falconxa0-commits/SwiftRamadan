import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const globalsCss = readFileSync('./src/app/globals.css', 'utf-8');
const designTokens = readFileSync('./src/lib/design-tokens.ts', 'utf-8');

describe('Auren Kingdom Complete Certification', () => {
  it('globals.css has 90+ Auren CSS custom properties', () => {
    const aurenVars = (globalsCss.match(/--auren-/g) || []).length;
    expect(aurenVars).toBeGreaterThanOrEqual(90);
  });

  it('globals.css has 40+ Auren utility class references', () => {
    const aurenClasses = (globalsCss.match(/\.auren-/g) || []).length;
    expect(aurenClasses).toBeGreaterThanOrEqual(40);
  });

  it('design-tokens.ts has auren color section', () => {
    expect(designTokens).toContain('auren:');
    expect(designTokens).toContain('royal');
    expect(designTokens).toContain('gold');
  });

  it('Auren Kingdom has 4 keyframes', () => {
    expect(globalsCss).toContain('@keyframes auren-breathe');
    expect(globalsCss).toContain('@keyframes auren-think');
    expect(globalsCss).toContain('@keyframes auren-fade-up');
    expect(globalsCss).toContain('@keyframes auren-shimmer');
  });

  it('Auren Kingdom has reduced motion support', () => {
    expect(globalsCss).toContain('prefers-reduced-motion');
    expect(globalsCss).toContain('auren-ai-orb');
  });

  it('Auren Kingdom has premium button styles', () => {
    expect(globalsCss).toContain('.auren-btn-royal');
    expect(globalsCss).toContain('.auren-btn-gold');
  });
});
