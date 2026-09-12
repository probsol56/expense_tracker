"use client";

import { useEffect, useState } from "react";
import { Bell, Calendar, Clock, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile, Workspace } from "@/lib/types";

// IANA zone ids look like "Asia/Dhaka" or "America/Argentina/Buenos_Aires" —
// the last segment is the closest thing to a human-readable place name.
function locationFromTimeZone(timeZone: string) {
  const city = timeZone.split("/").pop() || timeZone;
  return city.replace(/_/g, " ");
}

export function DashboardHeader({
  profile,
  workspace,
  onAdd,
}: {
  profile?: Profile | null;
  workspace?: Workspace | null;
  onAdd: () => void;
}) {
  const firstName =
    profile?.full_name?.trim().split(" ")[0] ||
    profile?.email?.split("@")[0] ||
    "there";

  // Server render time/timezone won't match the visitor's, so the clock
  // starts null and only picks up a value on the client after mount —
  // avoids a hydration mismatch. Ticks every second once mounted.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const getGreeting = () => {
    const hour = (now ?? new Date()).getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formattedDate = now?.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedTime = now?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const location = now ? locationFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) : undefined;

  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-ink-800/80 dark:text-slate-300 dark:shadow-none">
            <Calendar size={12} className="text-teal-600" />
            {formattedDate ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-ink-800/80 dark:text-slate-300 dark:shadow-none">
            <Clock size={12} className="text-teal-600" />
            {formattedTime ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-ink-800/80 dark:text-slate-300 dark:shadow-none">
            <MapPin size={12} className="text-teal-600" />
            {location ?? "—"}
          </span>
          {workspace?.name && (
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/60 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              {workspace.name}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {getGreeting()}, {firstName}{" "}
          <span className="inline-block origin-bottom-right animate-wave">👋</span>
        </h1>
      </div>

      <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
        <ThemeToggle />
        <button
          className="relative hidden sm:grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-ink-800/80 dark:text-slate-400 dark:hover:bg-ink-800 dark:hover:text-slate-100 dark:shadow-none"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-ink-900" />
        </button>
        <Button
          onClick={onAdd}
          className="flex-1 sm:flex-none justify-center bg-slate-900 text-white shadow-card hover:bg-slate-800 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus size={16} className="mr-1.5 inline shrink-0" />
          <span>Add transaction</span>
        </Button>
      </div>
    </header>
  );
}


