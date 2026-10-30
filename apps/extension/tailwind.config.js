/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#090d16',
          900: '#0d111c',
          850: '#121826',
          800: '#1a2234',
          700: '#28344e',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
    },
  },
  plugins: [],
}

