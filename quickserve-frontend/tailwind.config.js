/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2A24",
        cream: "#FBF8F1",
        saffron: "#E08A2C",
        clay: "#B4532A",
        leaf: "#3C6E52",
        mist: "#EDE7D9"
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"]
      }
    },
  },
  plugins: [],
}
