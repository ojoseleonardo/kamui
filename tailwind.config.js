/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kamui: {
          black: '#0a0a0a',
          darker: '#111111',
          dark: '#1a1a1a',
          gray: '#2a2a2a',
          'gray-light': '#3a3a3a',
          red: '#c41e3a',
          'red-dark': '#8b0000',
          'red-glow': '#ff2d55',
          'red-light': '#ff4d6d',
          white: '#f5f5f5',
          'white-muted': '#a0a0a0',
        },
        sharingan: {
          tomoe: '#c41e3a',
          iris: '#1a0000',
          glow: '#ff0033',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        japanese: ['Noto Sans JP', 'sans-serif'],
      },
      backgroundImage: {
        'kamui-gradient': 'radial-gradient(ellipse at center, #1a0000 0%, #0a0a0a 70%)',
        'kamui-vortex': 'conic-gradient(from 0deg, transparent 0deg, #c41e3a 10deg, transparent 20deg)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(42,42,42,0.8) 0%, rgba(26,26,26,0.9) 100%)',
      },
      boxShadow: {
        'kamui': '0 0 30px rgba(196, 30, 58, 0.3)',
        'kamui-intense': '0 0 50px rgba(196, 30, 58, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse': 'spin-reverse 6s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'vortex': 'vortex 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(196, 30, 58, 0.3)',
            opacity: 1 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(196, 30, 58, 0.6)',
            opacity: 0.8 
          },
        },
        'vortex': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(0.95)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'slide-in': {
          from: { transform: 'translateX(-20px)', opacity: 0 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
