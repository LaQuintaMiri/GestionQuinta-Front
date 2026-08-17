/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quinta: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#cbdccb',
          300: '#a3c2a3',
          400: '#75a175',
          500: '#548354', // Green brand color
          600: '#406740',
          700: '#345234',
          800: '#2b422b',
          900: '#243724',
          950: '#111e11',
        },
        tierra: {
          50: '#faf6f0',
          100: '#f3eade',
          200: '#e6d3bd',
          300: '#d5b796',
          400: '#c2976f',
          500: '#b48055', // Warm wood brown
          600: '#a66d47',
          700: '#8a553a',
          800: '#704533',
          900: '#5c392c',
          950: '#321c15',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
