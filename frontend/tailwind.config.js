/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 60% Dominant Base (White & Crisp Surfaces)
        baseWhite: "#ffffff",
        baseSurface: "#f8fafc",
        cardWhite: "rgba(255, 255, 255, 0.95)",
        
        // 30% Secondary Structure (Emerald Green)
        greenPrimary: "#059669",
        greenDark: "#047857",
        greenLight: "#10b981",
        greenDim: "rgba(5, 150, 105, 0.08)",
        greenBorder: "rgba(5, 150, 105, 0.25)",
        
        // 10% Accent Highlights (Crimson Red)
        redAccent: "#ef4444",
        redDark: "#dc2626",
        redLight: "#f43f5e",
        redDim: "rgba(239, 68, 68, 0.1)",
        redBorder: "rgba(239, 68, 68, 0.3)",
      },
      fontFamily: {
        poppinsBold: ["Poppins", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        calibri: ["Calibri", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
