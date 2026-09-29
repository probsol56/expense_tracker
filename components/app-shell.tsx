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
    <div className="min-h-screen bg-canvas text-fg lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-lg focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-fg"
      >
        Skip to content
      </a>

      <DashboardSidebar
        workspace={workspace}
        profile={profile}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between bg-cover px-4 py-2 lg:hidden">
          <span className="font-display text-base font-semibold tracking-[0.3em] text-brass">WALLO</span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="grid h-11 w-11 place-items-center rounded-lg text-cover-fg transition-colors duration-150 hover:bg-cover-fg/10 focus-visible:outline-brass"
          >
            <Menu size={20} />
          </button>
        </div>

        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
