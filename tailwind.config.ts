import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ledger-book identity for the product surface. Values live in
        // globals.css as RGB channels so light/dark swap without `dark:` variants.
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
        },
        rule: "rgb(var(--rule) / <alpha-value>)",
        brass: {
          DEFAULT: "rgb(var(--brass) / <alpha-value>)",
          // Text-safe variant: plain brass is decorative-only on light paper (2.8:1).
          strong: "rgb(var(--brass-strong) / <alpha-value>)",
        },
        moss: "rgb(var(--moss) / <alpha-value>)",
        brick: "rgb(var(--brick) / <alpha-value>)",
        cover: {
          DEFAULT: "rgb(var(--cover) / <alpha-value>)",
          fg: "rgb(var(--cover-fg) / <alpha-value>)",
          muted: "rgb(var(--cover-muted) / <alpha-value>)",
        },
        // Ledger-book identity — fixed values used by the auth surface.
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
        display: ["var(--font-display)", "Georgia", "serif"],
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
        hover: "0 12px 36px -8px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.05)",
      },
      animation: {
        settle: "settle 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
      keyframes: {
        settle: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
    },
  },
  plugins: [animate],
} satisfies Config;

