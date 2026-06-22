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
        'dark-bg': 'var(--bg-page, #0f0a1a)',
        'dark-card': 'var(--card-bg, #1a0f2e)',
        'dark-border': 'var(--border-color, #2d1b4e)',
        'neon-blue': '#00ffff'
      },
      opacity: {
        '3': '0.03'
      },
      fontFamily: {
        'sans': ['Inter', 'Roboto', 'Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
  darkMode: ['selector', '[data-theme="dark"]'],
}
