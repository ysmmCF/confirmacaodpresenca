/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        starry: {
          dark: "#0b0f19",
          card: "#131b2e",
          accent: "#3b82f6",
          gold: "#f59e0b",
          goldHover: "#d97706",
          border: "#1e293b",
          subtle: "#94a3b8"
        }
      }
    },
  },
  plugins: [],
}
