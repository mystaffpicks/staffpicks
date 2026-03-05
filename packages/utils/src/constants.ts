// Brand colors — kept in sync with Tailwind config
export const COLORS = {
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
} as const;

// Platform brand colors
export const PLATFORM_COLORS: Record<string, string> = {
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
} as const;

// Platform display names
export const PLATFORM_NAMES: Record<string, string> = {
  netflix: 'Netflix',
  youtube: 'YouTube',
  disney_plus: 'Disney+',
  hulu: 'Hulu',
  apple_tv: 'Apple TV+',
  hbo_max: 'Max',
  amazon_prime: 'Prime Video',
  peacock: 'Peacock',
  paramount_plus: 'Paramount+',
  tiktok: 'TikTok',
  spotify: 'Spotify',
  other: 'Other',
} as const;

// Mood tags with emoji
export const MOOD_TAGS: Record<string, { label: string; emoji: string }> = {
  cozy: { label: 'Cozy', emoji: '🛋️' },
  intense: { label: 'Intense', emoji: '😤' },
  background: { label: 'Background', emoji: '📺' },
  'binge-worthy': { label: 'Binge-worthy', emoji: '⚡' },
  'thought-provoking': { label: 'Thought-provoking', emoji: '🤔' },
  'laugh-out-loud': { label: 'LOL', emoji: '😂' },
  tearjerker: { label: 'Tearjerker', emoji: '😭' },
  'edge-of-seat': { label: 'Edge of seat', emoji: '😬' },
  'slow-burn': { label: 'Slow burn', emoji: '🕯️' },
  'comfort-rewatch': { label: 'Comfort rewatch', emoji: '🔄' },
} as const;

// API base URL — overridden per environment
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:3001';
