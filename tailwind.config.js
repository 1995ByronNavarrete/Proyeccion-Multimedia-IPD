/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ipd: {
          dark: '#0a0a0f',
          midnight: '#12121a',
          surface: '#1a1a2e',
          accent: '#6c5ce7',
          cyan: '#00d4ff',
          purple: '#a855f7',
          muted: '#6b7280'
        }
      }
    }
  },
  plugins: []
}
