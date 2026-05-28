/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        border: 'rgba(244, 239, 229, 0.12)',
        surface: {
          950: '#070706',
          900: '#0d0c0b',
          800: '#151311',
          700: '#211f1a',
        },
        accent: {
          mint: '#7f9a82',
          cyan: '#b6b0a4',
          blue: '#9d9587',
          pink: '#c9b98f',
          amber: '#b79b62',
        },
        ivory: '#f4efe5',
        muted: '#9c9588',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        editorial: '0 18px 70px rgba(0, 0, 0, 0.24)',
        panel: '0 24px 80px rgba(0, 0, 0, 0.34)',
      },
      backgroundImage: {
        'radial-grid':
          'linear-gradient(180deg, #070706 0%, #0d0c0b 46%, #070706 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.48, transform: 'scale(1)' },
          '50%': { opacity: 0.88, transform: 'scale(1.04)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.3s linear infinite',
        pulseGlow: 'pulseGlow 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
