"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import type { Workspace, Profile } from "@/lib/types";

export function AppShell({
  workspace,
  profile,
  children,
}: {
  workspace?: Workspace | null;
  profile?: Profile | null;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sand bg-mesh dark:bg-ink-950 lg:flex">
      <DashboardSidebar
        workspace={workspace}
        profile={profile}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-ink-900/60 lg:hidden">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Wallo
          </span>
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-ink-800 dark:text-slate-300 dark:hover:bg-ink-900"
          >
            <Menu size={18} />
          </button>
        </div>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
