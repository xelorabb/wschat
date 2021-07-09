const colors = require('tailwindcss/colors')

module.exports = {
  purge: { content: ['./public/**/*.html', './src/**/*.vue'] },
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        gray: colors.trueGray,
        primary: {
          lighter: '#9f46c4',
          light: '#8827b0',
          DEFAULT: '#620588',
          dark: '#3e0f50',
          darker: '#270933',
        },
      }
    },
  },
  variants: {
    extend: {
      backgroundColor: ['odd', 'even']
    },
  },
  plugins: [],
}
