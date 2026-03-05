/**
 * Design tokens — single source of truth for the StaffPicks brand palette.
 * Used across web (Tailwind), mobile (StyleSheet), and any future platforms.
 */

export const colors = {
  background: '#1A1612',
  surface: '#221E19',
  surfaceElevated: '#2A2420',
  border: '#3A3028',

  amber: '#E8A44A',
  amberLight: '#F0BC72',
  amberDark: '#C8843A',

  cream: '#F5EDD6',
  muted: '#8A7A6A',
  mutedDark: '#5A4A3A',

  // Semantic
  text: {
    primary: '#F5EDD6',
    secondary: '#8A7A6A',
    disabled: '#5A4A3A',
    accent: '#E8A44A',
  },

  // Platform brand colors
  platforms: {
    netflix: '#E50914',
    youtube: '#FF0000',
    disney_plus: '#113CCF',
    hulu: '#1CE783',
    apple_tv: '#F5F5F7',
    hbo_max: '#A855F7',
    amazon_prime: '#00A8E1',
    peacock: '#F7CA18',
    paramount_plus: '#0064FF',
    tiktok: '#EE1D52',
    spotify: '#1DB954',
    other: '#8A7A6A',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const typography = {
  display: {
    fontFamily: 'Bebas Neue',
    letterSpacing: 4,
  },
  serif: {
    fontFamily: 'Libre Baskerville',
  },
  sans: {
    fontFamily: 'Karla',
  },
  mono: {
    fontFamily: 'IBM Plex Mono',
    letterSpacing: 1,
  },
} as const;
