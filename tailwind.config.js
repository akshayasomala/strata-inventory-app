/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0a0b0d',
          900: '#0e1013',
          850: '#13161b',
          800: '#181b21',
          700: '#1f232b',
          600: '#2a2f38',
          500: '#3a4050',
          400: '#4d5566',
          300: '#6b7388',
          200: '#8b93a8',
          100: '#aab2c4',
        },
        amber: {
          DEFAULT: '#f59e0b',
          dark: '#b45309',
          light: '#fbbf24',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          dark: '#0e7490',
          light: '#22d3ee',
          glow: 'rgba(6, 182, 212, 0.15)',
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
          light: '#f87171',
          glow: 'rgba(239, 68, 68, 0.15)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px 0 rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(245, 158, 11, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
