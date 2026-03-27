/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8ecdff',
          400: '#59b0ff',
          500: '#338dff',
          600: '#1b6cf5',
          700: '#1457e1',
          800: '#1746b6',
          900: '#193e8f',
          950: '#142757',
        },
        accent: {
          50:  '#f0fdf4',
          100: '#dbfde6',
          200: '#baf8ce',
          300: '#84f0a8',
          400: '#47e07a',
          500: '#1fc758',
          600: '#14a446',
          700: '#13813a',
          800: '#156632',
          900: '#13542b',
          950: '#042f16',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        machine:
          "radial-gradient(circle at 8% 12%, rgba(16,185,129,0.20) 0%, rgba(2,6,23,1) 42%, rgba(3,7,18,1) 100%)",
      },
      fontFamily: {
        sans: ["Rajdhani", "Segoe UI", "sans-serif"],
        display: ["Orbitron", "Rajdhani", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(51, 141, 255, 0.15)',
        'glow-accent': '0 0 20px rgba(31, 199, 88, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 16px 40px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
