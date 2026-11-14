// Design tokens for the hop identity. Values mirror docs/brand/design-tokens.json (primitive -> semantic -> component).
// Components must use these names, never raw hex.

import { isDark, registerThemeApplier } from './theme';

const fixedPalette = {
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
} as const;

// soft tints of the text colour: dark ink on light, light lilac on dark (hairlines, pressed states, pills)
const alphaFor = (dark: boolean) => ({
  inkAlpha07: dark ? 'rgba(248, 246, 251, 0.1)' : 'rgba(26, 16, 51, 0.07)',
  inkAlpha08: dark ? 'rgba(248, 246, 251, 0.12)' : 'rgba(26, 16, 51, 0.08)',
  inkAlpha12: dark ? 'rgba(248, 246, 251, 0.18)' : 'rgba(26, 16, 51, 0.12)',
});

/** The colour names. The tints change with the theme; the object itself never changes identity, so every importer sees the live values. */
export const palette: typeof fixedPalette & ReturnType<typeof alphaFor> = { ...fixedPalette, ...alphaFor(isDark) };

const buildColors = (dark: boolean) => {
  const p = palette;
  const light = {
    background: p.white,
    /** raised layers (sheets, the active segment): the same as the page in light, a step lighter in dark */
    surface: p.white,
    backgroundPage: p.lilac50,
    foreground: p.ink900,
    mutedForeground: p.ink600,
    hairline: p.inkAlpha07,
    primary: p.pink500,
    /** Label on the pink primary. Always ink: white on this pink is only 3.4:1. */
    primaryForeground: p.ink900,
    secondary: p.inkAlpha07,
    secondaryPressed: p.inkAlpha12,
    secondaryForeground: p.ink900,
    inverse: p.ink900,
    inverseForeground: p.white,
    focusRing: p.ink900,
    navActive: p.inkAlpha08,
    info: p.blue700,
    success: p.mint700,
    successDot: p.mint500,
    warning: p.apricot700,
    warningDot: p.apricot500,
    danger: p.red700,
  };
  if (!dark) return light;
  // Dark theme (identity.md): bg #14091F, surface #20123A, text #F8F6FB. Status colours move to their lighter tones to keep 4.5:1.
  return {
    ...light,
    background: '#14091F',
    surface: '#20123A',
    backgroundPage: '#14091F',
    foreground: p.lilac50,
    mutedForeground: '#B9B0CE',
    inverse: p.lilac50,
    inverseForeground: p.ink900,
    focusRing: p.lilac50,
    secondaryForeground: p.lilac50,
    info: '#8FA3FF',
    success: '#7EE6C8',
    warning: '#FFB88A',
    danger: '#FF8A80',
  };
};

type ColorSet = { [K in keyof ReturnType<typeof buildColors>]: string };
/** Semantic colours for the current theme. Updated in place on a theme change; styles read it each time they are used. */
export const colors: ColorSet = buildColors(isDark);

registerThemeApplier(() => {
  Object.assign(palette, alphaFor(isDark));
  Object.assign(colors, buildColors(isDark));
});

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
