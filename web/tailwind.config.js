/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0B0F19',
          card: '#131B2E',
          surface: '#1E293B',
          hover: '#2A3854'
        },
        brand: {
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          pink: '#EC4899',
          gold: '#F59E0B',
          teal: '#10B981',
          rose: '#F43F5E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Yu Gothic UI', 'sans-serif'],
        jp: ['Yu Gothic UI', 'Hiragino Sans', 'Meiryo', 'sans-serif']
      }
    },
  },
  plugins: [],
}
