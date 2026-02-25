/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#ffd000ff",
        secondary: "#ffffff",
        whiteless: "#6e6c6c84",
        tertiary: "#111002ff",
        gray: "#cdcdcd",
        red: "#ad1616",
        transp: "#ffffff2f"
      },
    },
  },
  plugins: [],
};
