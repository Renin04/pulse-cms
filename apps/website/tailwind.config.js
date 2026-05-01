/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          red: 'var(--pulse-red)',
          'red-dark': 'var(--pulse-red-dark)',
          'red-light': 'var(--pulse-red-light)',
          jasmine: 'var(--pulse-jasmine)',
          'jasmine-light': 'var(--pulse-jasmine-light)',
          black: 'var(--pulse-black)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        red: 'var(--shadow-red)',
      },
      zIndex: {
        fixed: 'var(--z-fixed)',
      },
    },
  },
  plugins: [],
};
