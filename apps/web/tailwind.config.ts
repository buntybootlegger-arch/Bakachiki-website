import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0e0e10",
          900: "#17171a",
          800: "#222226",
        },
        charcoal: "#2a2a2e",
        cream: "#f5f1e6",
        paper: "#f5f1e6",
        lime: { DEFAULT: "#c6ff3d", dark: "#a3e600" },
        orange: { DEFAULT: "#ff6a2b", dark: "#e2521a" },
        pink: { DEFAULT: "#ff3e9a", dark: "#e01c7d" },
        purple: { DEFAULT: "#7b5cff", dark: "#5c3ce6" },
        blue: { DEFAULT: "#2e6bff", dark: "#1a4fd6" },
        yellow: { DEFAULT: "#ffd23f", dark: "#e6b400" },
        accent: {
          DEFAULT: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
        },
      },
      fontFamily: {
        display: ["'Unbounded'", "sans-serif"],
        sans: ["'Space Grotesk'", "sans-serif"],
        marker: ["'Permanent Marker'", "cursive"],
      },
      maxWidth: {
        "8xl": "90rem",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 20s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
