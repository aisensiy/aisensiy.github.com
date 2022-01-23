module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./src/**/*.css"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      typography: ({ theme }) => ({
        blog: {
          css: {
            '--tw-prose-links': theme('colors.teal[600]'),
            '--tw-prose-code': theme('colors.rose[700]'),
            '--tw-prose-invert-links': theme('colors.teal[300]'),
            '--tw-prose-invert-code': theme('colors.rose[300]'),
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
