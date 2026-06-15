import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds & surfaces
        background: '#0E0E17',
        surface: '#161622',
        border: 'rgba(255,255,255,0.08)',
        // Text
        primary: '#FFFFFF',
        secondary: 'rgba(255,255,255,0.6)',
        muted: 'rgba(255,255,255,0.3)',
        // Accents
        accent: '#6366F1',
        'accent-secondary': '#8B5CF6',
        pink: '#EC4899',
        // Status
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        // Task categories
        category: {
          work: '#6366F1',
          health: '#EC4899',
          personal: '#14B8A6',
          learning: '#F97316',
          other: '#8B5CF6',
        },
        // Task priorities
        priority: {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
