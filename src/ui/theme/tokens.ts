/** Design tokens (PLAN.md §10). Screens never use raw values; they read these through the theme. */

export const palette = {
  light: {
    canvas: '#F3F1EC',
    surface: '#FFFFFF',
    sunken: '#E7E4DD',
    ink: '#141414',
    inkSecondary: '#5D5952',
    inkTertiary: '#6F6B64',
    hairline: '#DAD6CD',
    positive: '#1B7540',
    negative: '#C2382B',
    caution: '#8F5B00',
    brand: '#FF5A1F',
    brandText: '#B83A12',
    scrim: 'rgba(20,20,20,0.45)',
    courtWood: '#E9D3AE',
    courtWoodDark: '#DCC196',
    courtLine: '#FFFFFF',
    courtPaint: '#D9B98A',
  },
  dark: {
    canvas: '#0F0F10',
    surface: '#19191B',
    sunken: '#242427',
    ink: '#F1EFEA',
    inkSecondary: '#A8A49C',
    inkTertiary: '#858179',
    hairline: '#2A2A2D',
    positive: '#4CC38A',
    negative: '#FF6B5E',
    caution: '#F2B544',
    brand: '#FF5A1F',
    brandText: '#FF5A1F',
    scrim: 'rgba(0,0,0,0.6)',
    courtWood: '#3A3128',
    courtWoodDark: '#332B23',
    courtLine: '#8C8378',
    courtPaint: '#463A2E',
  },
} as const;

export type ColourName = keyof (typeof palette)['light'];
export type Scheme = keyof typeof palette;

export const space = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  x3: 32,
  x4: 40,
  x5: 48,
  x6: 64,
} as const;

export const radii = { xs: 2, sm: 8, md: 14, full: 999 } as const;

export const TOUCH = 44;

export const fonts = {
  displayHeavy: 'Antonio_700Bold',
  displayBold: 'Antonio_600SemiBold',
  text: 'SchibstedGrotesk_400Regular',
  textMedium: 'SchibstedGrotesk_500Medium',
  textStrong: 'SchibstedGrotesk_600SemiBold',
} as const;

interface TypeToken {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing?: number;
  readonly textTransform?: 'uppercase';
  readonly tabular?: boolean;
  /** Largest Dynamic Type multiplier this style may reach. */
  readonly maxScale: number;
}

export const type = {
  scoreboard: {
    fontFamily: fonts.displayHeavy,
    fontSize: 56,
    lineHeight: 58,
    tabular: true,
    maxScale: 1.2,
  },
  displayL: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 38, maxScale: 1.4 },
  displayM: { fontFamily: fonts.displayHeavy, fontSize: 25, lineHeight: 28, maxScale: 1.6 },
  displayS: { fontFamily: fonts.displayBold, fontSize: 21, lineHeight: 24, maxScale: 1.8 },
  stat: {
    fontFamily: fonts.displayHeavy,
    fontSize: 24,
    lineHeight: 28,
    tabular: true,
    maxScale: 1.4,
  },
  label: {
    fontFamily: fonts.displayBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    maxScale: 1.6,
  },
  body: { fontFamily: fonts.text, fontSize: 17, lineHeight: 24, maxScale: 2.5 },
  bodyStrong: { fontFamily: fonts.textStrong, fontSize: 17, lineHeight: 24, maxScale: 2.5 },
  callout: { fontFamily: fonts.text, fontSize: 16, lineHeight: 22, maxScale: 2.5 },
  subhead: { fontFamily: fonts.textStrong, fontSize: 15, lineHeight: 20, maxScale: 2.5 },
  footnote: { fontFamily: fonts.text, fontSize: 13, lineHeight: 18, maxScale: 2 },
  caption: { fontFamily: fonts.textStrong, fontSize: 11, lineHeight: 13, maxScale: 1.4 },
} as const satisfies Record<string, TypeToken>;

export type TypeVariant = keyof typeof type;

export const motion = {
  instant: 90,
  fast: 150,
  base: 220,
  slow: 320,
  count: 600,
  reveal: 450,
  ease: {
    standard: [0.2, 0, 0, 1],
    enter: [0.05, 0.7, 0.1, 1],
    exit: [0.3, 0, 0.8, 0.15],
  },
  spring: {
    press: { damping: 30, stiffness: 400 },
    celebrate: { damping: 14, stiffness: 180 },
  },
} as const;
