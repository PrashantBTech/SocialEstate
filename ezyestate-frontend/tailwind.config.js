/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf3f2',
          100: '#fae3e1',
          200: '#f5c1bd',
          300: '#ee9891',
          400: '#e56157',
          500: '#E63E32', // Vibrant Logo Red
          600: '#c72f24',
          700: '#a6241b',
          800: '#862019',
          900: '#701e17',
          950: '#3e0c09',
        },
        cream: '#fdf8f3', // Warm off-white background used across pages
        navy: {
          50: '#FAFAFA', // Premium Crisp White
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#1C1C1C', // Exact Logo Background Dark Charcoal
          950: '#0A0A0A', // Sleek Black
        },
        accent: {
          50: '#fdf3f2',
          100: '#fae3e1',
          200: '#f5c1bd',
          300: '#ee9891',
          400: '#e56157',
          500: '#E63E32',
          600: '#c72f24',
          700: '#a6241b',
        },
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        display: ['Outfit', '"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['Outfit', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out both',
        'slide-up':   'slideUp 0.5s ease-out both',
        'slide-down': 'slideDown 0.3s ease-out both',
        'pulse-soft': 'pulseSoft 2s infinite',
        'float':      'floatUp 3s ease-in-out infinite',
        'count-up':   'countUp 1s ease-out',
        'shimmer':    'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        floatUp:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        countUp:   { from: { opacity: 0, transform: 'scale(0.8)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 40px rgba(0,0,0,0.08)',
        'cta':        '0 4px 20px rgba(230,62,50,0.35)',
        'search':     '0 8px 50px rgba(0,0,0,0.15)',
        'nav':        '0 2px 20px rgba(0,0,0,0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
