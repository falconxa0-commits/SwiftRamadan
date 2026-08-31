/**
 * Auren Kingdom V2 — Design Tokens
 * The complete visual language for the next-generation frontend.
 * Built from zero. No legacy references.
 */

export const kingdom = {
  // ── Obsidian World ──
  void: '#050505',
  night: '#0A0A0F',
  shadow: '#0F0F17',
  surface: '#14141F',
  elevated: '#1A1A28',
  hover: '#1F1F2E',

  // ── Royal Intelligence ──
  royal: '#7C3AED',
  royalHover: '#6D28D9',
  royalLight: 'rgba(124, 58, 237, 0.12)',
  royalGlow: 'rgba(124, 58, 237, 0.25)',
  royalBorder: 'rgba(124, 58, 237, 0.30)',
  violet: '#9333EA',
  mystic: '#C084FC',

  // ── Kingdom Trust ──
  gold: '#D4AF37',
  goldLight: 'rgba(212, 175, 55, 0.08)',
  goldGlow: 'rgba(212, 175, 55, 0.20)',
  goldBorder: 'rgba(212, 175, 55, 0.25)',

  // ── AI Intelligence ──
  ai: '#6366F1',
  aiGlow: '#818CF8',
  aiLight: 'rgba(99, 102, 241, 0.12)',

  // ── Ramadan Amber ──
  amber: '#F59E0B',
  amberLight: 'rgba(245, 158, 11, 0.08)',
  amberGlow: 'rgba(245, 158, 11, 0.20)',

  // ── Faith Emerald ──
  emerald: '#10B981',
  emeraldGlow: 'rgba(16, 185, 129, 0.20)',

  // ── Delivery Sky ──
  sky: '#38BDF8',
  skyGlow: 'rgba(56, 189, 248, 0.20)',

  // ── Semantic ──
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // ── Text (WCAG AA on #050505) ──
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.70)',
  textTertiary: 'rgba(255, 255, 255, 0.50)',
  textMuted: 'rgba(255, 255, 255, 0.30)',

  // ── Glass ──
  glassTint: 'rgba(255, 255, 255, 0.03)',
  glassHover: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHover: 'rgba(255, 255, 255, 0.12)',
  glassBlur: '16px',

  // ── Radius ──
  radiusSm: '8px',
  radiusMd: '12px',
  radiusLg: '16px',
  radiusXl: '24px',
  radius2xl: '32px',

  // ── Shadows ──
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.4)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.5)',
  shadowLg: '0 12px 40px rgba(0, 0, 0, 0.6)',
  shadowRoyal: '0 0 24px rgba(124, 58, 237, 0.3)',
  shadowGold: '0 0 24px rgba(212, 175, 55, 0.2)',

  // ── Motion ──
  durationInstant: 0.1,
  durationFast: 0.15,
  durationNormal: 0.25,
  durationSlow: 0.4,
  durationCinematic: 0.8,
  easeSmooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
  easeSpring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  easeCinematic: [0.16, 1, 0.3, 1] as [number, number, number, number],

  // ── Spacing (4px base) ──
  space1: '4px',
  space2: '8px',
  space3: '12px',
  space4: '16px',
  space5: '20px',
  space6: '24px',
  space8: '32px',
  space10: '40px',
  space12: '48px',
  space16: '64px',

  // ── Typography ──
  fontSizeXs: '11px',
  fontSizeSm: '13px',
  fontSizeBase: '15px',
  fontSizeLg: '17px',
  fontSizeXl: '20px',
  fontSize2xl: '24px',
  fontSize3xl: '30px',
  fontSize4xl: '36px',
  fontSize5xl: '48px',
  fontSize6xl: '60px',

  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  fontWeightExtrabold: 800,

  lineHeightTight: 1.15,
  lineHeightSnug: 1.3,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.65,
} as const;

export type KingdomToken = typeof kingdom;
