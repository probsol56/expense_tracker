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
        // Ledger-book identity — used on the auth surface only.
        ledger: {
          page: "#EEF1EF",
          "page-dark": "#0B0F0C",
          cover: "#16211B",
          "cover-dark": "#1B2620",
          "cover-text": "#EDE3C8",
          "cover-text-dark": "#E7DAB0",
          paper: "#FBF8F1",
          "paper-dark": "#221D16",
          ink: "#1B2A22",
          "ink-dark": "#F1ECDD",
          muted: "#6B7566",
          "muted-dark": "#A69C86",
          rule: "#E4DCC8",
          "rule-dark": "#3A3226",
          brass: "#B4903F",
          "brass-deep": "#93762F",
          "brass-dark": "#C9A455",
          "brass-dark-deep": "#DDB966",
          brick: "#A23E2B",
          "brick-dark": "#E28A76",
          "brick-bg": "#F7E9E4",
          "brick-bg-dark": "rgba(162, 62, 43, 0.16)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        ledger: ["var(--font-ledger-display)", "Georgia", "serif"],
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

