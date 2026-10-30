// QuireStreak — Design Tokens
// All values sourced from uistyleguide.md. Do not use ad-hoc values elsewhere.

export const palette = {
  light: {
    paper: '#FAF7F2', surface: '#FFFFFF', sunken: '#F1ECE4',
    ink: '#1A1714', muted: '#6B635A', hairline: '#E4DDD2',
    accent: '#D9531E', accentText: '#B8430F', accentSoft: '#FBE6DA',
    error: '#B3261E',
  },
  dark: {
    paper: '#14110F', surface: '#1D1916', sunken: '#0F0D0B',
    ink: '#F4EFE8', muted: '#A39A8E', hairline: '#2E2823',
    accent: '#F2792F', accentText: '#F58A47', accentSoft: '#3A2418',
    error: '#F2B8B5',
  },
} as const;

export const heat = {
  light: ['#ECE5DA', '#F6D2BC', '#EEA97F', '#E27B45', '#C2501A'],
  dark:  ['#26201B', '#4A2B1B', '#7A4020', '#B85A24', '#F2792F'],
} as const;

export const space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48, gutter: 20,
} as const;

export const radius = { cover: 6, card: 12, sheet: 24, pill: 999 } as const;

export const size = {
  tapTarget: 44, button: 52, buttonSecondary: 44, chip: 32, tabBar: 56,
  maxContentWidth: 560, heatCell: 14, heatGap: 4, heatRadius: 3,
} as const;

export const type = {
  display:  { fontFamily: 'Newsreader_600SemiBold', fontSize: 34, lineHeight: 40 },
  title:    { fontFamily: 'Newsreader_600SemiBold', fontSize: 24, lineHeight: 30 },
  numerals: { fontFamily: 'Newsreader_500Medium',   fontSize: 56, lineHeight: 60 },
  headline: { fontFamily: 'Inter_600SemiBold',      fontSize: 17, lineHeight: 24 },
  body:     { fontFamily: 'Inter_400Regular',       fontSize: 16, lineHeight: 24 },
  caption:  { fontFamily: 'Inter_400Regular',       fontSize: 13, lineHeight: 18 },
  eyebrow:  { fontFamily: 'Inter_600SemiBold',      fontSize: 12, lineHeight: 16, letterSpacing: 0.72, textTransform: 'uppercase' as const },
} as const;

export const reader = {
  fontFamily: 'Newsreader_400Regular',
  fontSize: { min: 14, max: 28, step: 2, default: 18 },
  lineSpacing: { compact: 1.4, regular: 1.6, relaxed: 1.8 },
  themes: {
    paper: { background: '#FAF7F2', text: '#1A1714' },
    sepia: { background: '#F1E6D2', text: '#3B2F22' },
    night: { background: '#14110F', text: '#E8E1D6' },
  },
} as const;

export const motion = { tap: 120, sheet: 280, arc: 600, check: 240 } as const;

export const coverShadow = {
  shadowColor: '#1A1714', shadowOpacity: 0.12, shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
} as const; // light mode only

export type ColorScheme = 'light' | 'dark';
export type Colors = {
  readonly [K in keyof typeof palette.light]: string;
};

export function getColors(scheme: ColorScheme): Colors {
  return palette[scheme];
}
