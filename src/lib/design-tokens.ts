/**
 * SwiftRamadan Design Tokens — "Aurora Luxe"
 * The single source of truth for all design values.
 * Every component should consume these tokens, not hardcoded values.
 */

// ═════════════════════════════════════════════════════════════════
// COLOR SYSTEM
// ═════════════════════════════════════════════════════════════════

export const colors = {
  // Brand — Customer (emerald)
  customer: {
    primary: '#10E07A',
    primaryHover: '#0EA05A',
    primaryActive: '#0C904F',
    light: 'rgba(16, 224, 122, 0.14)',
    mid: 'rgba(16, 224, 122, 0.30)',
    glow: 'rgba(16, 224, 122, 0.25)',
  },
  // Brand — Vendor (gold)
  vendor: {
    primary: '#F5C451',
    primaryHover: '#E8B447',
    primaryActive: '#D4A43E',
    light: 'rgba(245, 196, 81, 0.14)',
    mid: 'rgba(245, 196, 81, 0.30)',
    glow: 'rgba(245, 196, 81, 0.25)',
  },
  // Brand — Rider (sky blue)
  rider: {
    primary: '#38BDF8',
    primaryHover: '#0EA5E9',
    primaryActive: '#0284C7',
    light: 'rgba(56, 189, 248, 0.14)',
    mid: 'rgba(56, 189, 248, 0.30)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  // AI — Safa (purple)
  ai: {
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryActive: '#6D28D9',
    light: 'rgba(139, 92, 246, 0.14)',
    mid: 'rgba(139, 92, 246, 0.30)',
    glow: 'rgba(139, 92, 246, 0.25)',
  },
  // Surfaces — Dark theme
  surface: {
    void: '#05070B',       // deepest background
    base: '#06070B',       // app background
    raised: '#0F1118',     // cards
    elevated: '#161924',   // modals
    hover: '#1B1F2A',      // hover states
    border: 'rgba(255, 255, 255, 0.07)',
    borderHover: 'rgba(255, 255, 255, 0.12)',
  },
  // Text — WCAG AA compliant
  text: {
    primary: '#FFFFFF',      // headings, important
    secondary: 'rgba(255, 255, 255, 0.65)',  // body text (4.5:1 on #06070B)
    tertiary: 'rgba(255, 255, 255, 0.45)',   // metadata (3:1 — large text only)
    disabled: 'rgba(255, 255, 255, 0.25)',  // disabled states
  },
  // Semantic
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  // Auren Kingdom — Phase 15 premium visual language
  auren: {
    void: '#050505',
    night: '#0A0A0F',
    shadow: '#11111A',
    surface: '#15151F',
    elevated: '#1A1A26',
    hover: '#1F1F2E',
    royal: '#7C3AED',
    imperial: '#9333EA',
    mystic: '#C084FC',
    gold: '#D4AF37',
    indigo: '#6366F1',
    aiGlow: '#818CF8',
    amber: '#F59E0B',
    emerald: '#10B981',
    sky: '#38BDF8',
  } as const,
} as const;

// ═════════════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE
// ═════════════════════════════════════════════════════════════════

export const typography = {
  fontFamily: {
    sans: 'var(--font-plus-jakarta), system-ui, sans-serif',
    mono: 'var(--font-geist-mono), monospace',
    arabic: '"Amiri", "Scheherazade New", serif',
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '15px',
    lg: '17px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.04em',
    widest: '0.08em',
  },
} as const;

// ═════════════════════════════════════════════════════════════════
// SPACING SCALE (4px base)
// ═════════════════════════════════════════════════════════════════

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

// ═════════════════════════════════════════════════════════════════
// RADIUS SCALE
// ═════════════════════════════════════════════════════════════════

export const radius = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const;

// ═════════════════════════════════════════════════════════════════
// ELEVATION / SHADOWS
// ═════════════════════════════════════════════════════════════════

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.35)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.4)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.5)',
  glow: {
    customer: '0 0 20px rgba(16, 224, 122, 0.3)',
    vendor: '0 0 20px rgba(245, 196, 81, 0.3)',
    rider: '0 0 20px rgba(56, 189, 248, 0.3)',
    ai: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
} as const;

// ═════════════════════════════════════════════════════════════════
// MOTION TOKENS
// ═════════════════════════════════════════════════════════════════

export const motion = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    deliberate: 0.6,
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.08,
  },
} as const;

// ═════════════════════════════════════════════════════════════════
// GLASS / BLUR
// ═════════════════════════════════════════════════════════════════

export const glass = {
  tint: 'rgba(255, 255, 255, 0.03)',
  tintHover: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  blur: '12px',
  blurStrong: '24px',
} as const;

// ═════════════════════════════════════════════════════════════════
// Z-INDEX SCALE
// ═════════════════════════════════════════════════════════════════

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  nav: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;

// ═════════════════════════════════════════════════════════════════
// RESPONSIVE BREAKPOINTS
// ═════════════════════════════════════════════════════════════════

export const breakpoints = {
  xs: '320px',
  sm: '375px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
  '3xl': '1920px',
} as const;

// ═════════════════════════════════════════════════════════════════
// ROLE CONFIG (uses tokens)
// ═════════════════════════════════════════════════════════════════

export const roleConfig = {
  customer: {
    primary: colors.customer.primary,
    primaryHover: colors.customer.primaryHover,
    light: colors.customer.light,
    mid: colors.customer.mid,
    glow: colors.customer.glow,
    shadow: shadows.glow.customer,
  },
  vendor: {
    primary: colors.vendor.primary,
    primaryHover: colors.vendor.primaryHover,
    light: colors.vendor.light,
    mid: colors.vendor.mid,
    glow: colors.vendor.glow,
    shadow: shadows.glow.vendor,
  },
  rider: {
    primary: colors.rider.primary,
    primaryHover: colors.rider.primaryHover,
    light: colors.rider.light,
    mid: colors.rider.mid,
    glow: colors.rider.glow,
    shadow: shadows.glow.rider,
  },
} as const;

// Helper: get role config
export function getRoleConfig(role: 'customer' | 'vendor' | 'rider') {
  return roleConfig[role] || roleConfig.customer;
}
