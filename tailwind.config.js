/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'kw-dark': '#0A0A0A',
        'kw-card': '#1A1A2E',
        'kw-green': '#22C55E',
        'kw-green-dark': '#0B3D2E',
        'kw-orange': '#C47A2C',
        'kw-green-light': '#86EFAC',
        'kw-gray': '#3A3A4E',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
