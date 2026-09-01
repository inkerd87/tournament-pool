/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090d",
        foreground: "#e4e4e7",
        surface: "#0a0d12",
        "surface-raised": "#12161f",
        accent: "#22d3ee",
        "accent-dim": "#06b6d4",
        "accent-secondary": "#8b5cf6",
      },
    },
  },
  plugins: [],
}
