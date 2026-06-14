import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/shared/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B6B',
          secondary: '#FF8E53',
          light: '#FFF0EE',
          glow: 'rgba(255,107,107,0.25)',
        },
        semantic: {
          success: '#34C759',
          warning: '#FF9F0A',
          danger: '#FF3B30',
          info: '#007AFF',
        },
        ink: {
          900: '#1C1C1E',
          700: '#3A3A3C',
          500: '#6E6E73',
          300: '#AEAEB2',
          100: '#E8E8ED',
        },
        canvas: {
          DEFAULT: '#FAFAFA',
          card: '#FFFFFF',
          sunken: '#F4F4F6',
        },
        cat: '#FF6B6B',
        dog: '#4FACFE',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.5' }],
        lg: ['17px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
        '4xl': ['38px', { lineHeight: '1.15' }],
        '5xl': ['48px', { lineHeight: '1.1' }],
      },
      spacing: {
        '4.5': '18px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        elevated: '0 4px 20px rgba(0,0,0,0.08)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
        'brand-glow': '0 4px 20px rgba(255,107,107,0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'draw-in': {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'draw-in': 'draw-in 1.5s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
