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
        background: "#090d16",
        card: "rgba(15, 23, 42, 0.75)",
        border: "rgba(255, 255, 255, 0.1)",
        cyanAccent: "#06b6d4",
        emeraldAccent: "#10b981",
        roseAccent: "#f43f5e",
        amberAccent: "#f59e0b",
      },
    },
  },
  plugins: [],
};
