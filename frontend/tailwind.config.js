/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#F1F5F9",
        "surface-container-low": "#f0f4f8",
        "surface-container-lowest": "#ffffff",
        primary: "#3B82F6",
        "on-background": "#1E293B",
        "on-surface": "#334155",
        outline: "#94A3B8",
        "outline-variant": "#E2E8F0",
        "primary-container": "#EFF6FF",
        "on-primary-container": "#1E40AF",
        secondary: "#6366F1",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
