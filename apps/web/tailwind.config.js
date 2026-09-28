/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        buy: { DEFAULT: "#16a34a", bg: "#dcfce7", fg: "#166534" },
        hold: { DEFAULT: "#d97706", bg: "#fef3c7", fg: "#92400e" },
        sell: { DEFAULT: "#dc2626", bg: "#fee2e2", fg: "#991b1b" },
        watch: { DEFAULT: "#2563eb", bg: "#dbeafe", fg: "#1e40af" },
      },
      borderRadius: { sm: "8px", md: "12px", lg: "16px", xl: "20px" },
    },
  },
  plugins: [],
};
