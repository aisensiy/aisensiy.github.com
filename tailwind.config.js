module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './src/**/*.css'],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      backgroundColor: ["active"]
    },
  },
  plugins: [],
}
