"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// §17: persist an explicit user override on top of the OS preference.
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable — OS preference still applies on next visit */
    }
  };

  if (isDark === null) {
    return <span className="h-10 w-10" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-ink-800/80 dark:text-slate-400 dark:hover:bg-ink-800 dark:hover:text-slate-100"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}