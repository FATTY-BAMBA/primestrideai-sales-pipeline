/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        bg: { DEFAULT: '#0a0a0f', 2: '#111118', 3: '#18181f' },
        border: { DEFAULT: 'rgba(255,255,255,0.07)', 2: 'rgba(255,255,255,0.13)' },
        accent: { DEFAULT: '#6c63ff', green: '#4ade80', orange: '#fb923c', blue: '#38bdf8' },
      }
    },
  },
  plugins: [],
}
