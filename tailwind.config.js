/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      backgroundImage: {
        machine:
          "radial-gradient(circle at 8% 12%, rgba(16,185,129,0.20) 0%, rgba(2,6,23,1) 42%, rgba(3,7,18,1) 100%)",
      },
      fontFamily: {
        sans: ["Rajdhani", "Segoe UI", "sans-serif"],
        display: ["Orbitron", "Rajdhani", "sans-serif"],
      },
    },
  },
  plugins: [],
}

