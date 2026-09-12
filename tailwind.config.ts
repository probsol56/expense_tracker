import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f172a",
          50: "#f8fafc",
          100: "#f1f5f9",
          800: "#1e293b",
          900: "#0f172a",
          950: "#090d16",
        },
        mint: {
          DEFAULT: "#e6f7f2",
          50: "#f2fbf8",
          100: "#e6f7f2",
          200: "#c4eee1",
          300: "#92decb",
        },
        teal: {
          DEFAULT: "#0d9488",
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
        },
        coral: {
          DEFAULT: "#f43f5e",
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#f43f5e",
          600: "#e11d48",
        },
        sand: {
          DEFAULT: "#fbfbfa",
          50: "#ffffff",
          100: "#fbfbfa",
          200: "#f4f3ef",
          300: "#e9e7e1",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      zIndex: {
        base: "0",
        card: "1",
        sticky: "100",
        dropdown: "200",
        overlay: "300",
        modal: "400",
        popover: "500",
        toast: "600",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(15, 23, 42, 0.04), 0 10px 30px -4px rgba(15, 23, 42, 0.03)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 8px 24px -6px rgba(15, 23, 42, 0.06)",
        hover: "0 12px 36px -8px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.05)",
        glow: "0 0 20px -2px rgba(13, 148, 136, 0.25)",
        "glow-coral": "0 0 20px -2px rgba(244, 63, 94, 0.25)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        wave: "wave 2s infinite ease-in-out",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%, 60%": { transform: "rotate(14deg)" },
          "40%, 80%": { transform: "rotate(-10deg)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [animate],
} satisfies Config;

