/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'purple-light': '#a78bfa',
        'purple-main': '#8b5cf6',
        'purple-dark': '#6d28d9',
        'purple-darker': '#5b21b6',
        'dark-bg': '#0f0a1a',
        'dark-card': '#1a0f2e',
        'dark-border': '#2d1b4e'
      },
      fontFamily: {
        'sans': ['Inter', 'Roboto', 'Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
