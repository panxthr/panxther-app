/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['"Poppins"', 'sans-serif'],
      },
      colors: {
        field: 'rgb(24 24 27 / 0.5)', // zinc-900/50
        window: 'rgb(249 250 251 / 0.5)', // gray-50/50 (or adjust as needed)
        fieldBorder: 'rgb(82 82 91)',     // zinc-600
      },
    },
  },
  plugins: [],
}
