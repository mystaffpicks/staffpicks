import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // StaffPicks brand palette
        background: '#1A1612',
        surface: '#221E19',
        'surface-elevated': '#2A2420',
        border: '#3A3028',
        amber: {
          DEFAULT: '#E8A44A',
          light: '#F0BC72',
          dark: '#C8843A',
        },
        cream: '#F5EDD6',
        muted: '#8A7A6A',
        // Platform accent colors
        netflix: '#E50914',
        youtube: '#FF0000',
        'disney-plus': '#113CCF',
        hulu: '#1CE783',
        'apple-tv': '#F5F5F7',
        'hbo-max': '#A855F7',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        serif: ['var(--font-libre)', 'Georgia', 'serif'],
        sans: ['var(--font-karla)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex)', 'Courier New', 'monospace'],
      },
      backgroundImage: {
        'film-grain': "url('/textures/grain.png')",
        'shelf-gradient': 'linear-gradient(180deg, rgba(26,22,18,0) 0%, rgba(26,22,18,0.8) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
