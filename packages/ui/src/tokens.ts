// Design tokens for the hop identity. Values mirror docs/brand/design-tokens.json (primitive -> semantic -> component).
// Components must use these names, never raw hex.

export const palette = {
  white: '#FFFFFF',
  lilac50: '#F8F6FB',
  ink900: '#1A1033',
  ink700: '#3A2F5C',
  ink600: '#5A5070',
  pink500: '#FF3D7F',
  blue500: '#3D5BFF',
  blue700: '#2438C9',
  mint500: '#12C99B',
  mint700: '#00704F',
  apricot500: '#FF7A2F',
  apricot700: '#A84300',
  red700: '#B3261E',
  inkAlpha07: 'rgba(26, 16, 51, 0.07)',
  inkAlpha08: 'rgba(26, 16, 51, 0.08)',
  inkAlpha12: 'rgba(26, 16, 51, 0.12)',
} as const;

export const colors = {
  background: palette.white,
  backgroundPage: palette.lilac50,
  foreground: palette.ink900,
  mutedForeground: palette.ink600,
  hairline: palette.inkAlpha07,
  primary: palette.pink500,
  /** Label on the pink primary. Always ink: white on this pink is only 3.4:1. */
  primaryForeground: palette.ink900,
  secondary: palette.inkAlpha07,
  secondaryPressed: palette.inkAlpha12,
  secondaryForeground: palette.ink900,
  inverse: palette.ink900,
  inverseForeground: palette.white,
  focusRing: palette.ink900,
  navActive: palette.inkAlpha08,
  info: palette.blue700,
  success: palette.mint700,
  successDot: palette.mint500,
  warning: palette.apricot700,
  warningDot: palette.apricot500,
  danger: palette.red700,
} as const;

export type ColorName = keyof typeof colors;

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as const;

export const radii = { input: 18, group: 24, sheet: 28, full: 999 } as const;

export const fonts = {
  display800: 'Nunito_800ExtraBold',
  display700: 'Nunito_700Bold',
  ui400: 'Figtree_400Regular',
  ui500: 'Figtree_500Medium',
  ui600: 'Figtree_600SemiBold',
  ui700: 'Figtree_700Bold',
} as const;

export const shadows = {
  ring: '0 0 0 1px rgba(26, 16, 51, 0.05)',
  lift: '0 1px 2px rgba(26, 16, 51, 0.04), 0 6px 16px -10px rgba(26, 16, 51, 0.14)',
  float: '0 2px 4px rgba(26, 16, 51, 0.06), 0 20px 40px -16px rgba(26, 16, 51, 0.28)',
  primaryGlow: '0 6px 12px -8px rgba(255, 61, 127, 0.5)',
} as const;

export const durations = { press: 120, state: 200, sheet: 300, pulse: 2000 } as const;

/** Minimum touch target (points). */
export const minTarget = 44;
