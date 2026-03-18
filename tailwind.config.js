/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ghost: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          500: '#7c5cfc',
          600: '#6a4ceb',
          700: '#5438c5',
          800: '#1a1a2e',
          900: '#0f0f1a',
          950: '#08080f',
        },
      },
    },
  },
  plugins: [],
}