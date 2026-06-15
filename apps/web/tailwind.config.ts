import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0E0E17',
        surface: '#161622',
        border: 'rgba(255,255,255,0.08)',
        accent: '#6366F1',
        'accent-secondary': '#8B5CF6',
        pink: '#EC4899',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
