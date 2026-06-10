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
          navy: '#06133f',
          orange: '#ef5824',
          'orange-light': '#f4784a',
        }
      }
    },
  },
  plugins: [],
}
