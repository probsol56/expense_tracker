"use client";

import {
  CreditCard,
  Landmark,
  LayoutGrid,
  LogOut,
  Settings,
  Sparkles,
  FolderKanban,
  X,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Workspace, Profile } from "@/lib/types";

interface DashboardSidebarProps {
  workspace?: Workspace | null;
  profile?: Profile | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({
  workspace,
  profile,
  isOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const items = [
    { label: "Overview", icon: LayoutGrid, href: "/" },
    { label: "Transactions", icon: CreditCard, href: "/transactions" },
    { label: "Loans", icon: Landmark, href: "/loans" },
    { label: "Accounts", icon: Landmark, href: "/accounts" },
    { label: "Categories", icon: FolderKanban, href: "/categories" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  const workspaceName = workspace?.name || "Personal Workspace";
  const workspaceInitials = getInitials(workspaceName);
  const userName = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const userInitials = getInitials(userName);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-5">
      <div>
        {/* Brand & Close button */}
        <div className="mb-7 flex items-center justify-between px-2 pt-1">
          <Link href="/" className="group flex items-center gap-3" onClick={onClose}>
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-sm font-bold text-white shadow-md shadow-slate-950/10 transition-transform duration-200 group-hover:scale-105">
              <span className="tracking-tight">L</span>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                Wallo
              </span>
              <span className="text-[10px] font-medium tracking-wide text-teal-600 dark:text-teal-400">
                FINANCIAL HUB
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            >
              <LogOut size={15} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close navigation"
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Workspace Pill Card */}
        <div className="mb-6">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Active Workspace
          </div>
          <div className="group relative flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/70 p-2.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-ink-800/70 dark:hover:border-slate-600 dark:hover:bg-ink-800 dark:shadow-none">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-teal-50 to-emerald-100 font-bold text-teal-700 text-xs shadow-sm ring-1 ring-teal-500/20">
                {workspaceInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800 leading-tight">
                  {workspaceName}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-400">
                  {workspace?.base_currency || "BDT"} · Primary
                </p>
              </div>
            </div>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Menu
          </div>
          {items.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-ink-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive
                      ? "text-teal-400"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile Card */}
      <div className="space-y-3 pt-6">
        <Link
          href="/import"
          onClick={onClose}
          className="group flex items-center justify-between rounded-xl border border-teal-200/70 bg-gradient-to-r from-teal-50/70 to-emerald-50/50 p-3 text-xs font-semibold text-teal-800 transition-all hover:border-teal-300 hover:shadow-sm dark:border-teal-800/60 dark:from-teal-900/30 dark:to-emerald-900/20 dark:text-teal-300 dark:hover:border-teal-700 dark:shadow-none"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-teal-600 animate-pulse-subtle" />
            <span>Import Bank CSV</span>
          </div>
          <ArrowUpRight size={14} className="text-teal-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/80 p-2.5 shadow-sm dark:border-slate-700 dark:bg-ink-800/70 dark:shadow-none">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-coral-500 to-rose-400 text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-ink-900">
            {userInitials}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-ink-900" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {userName}
            </div>
            <div className="truncate text-[11px] text-slate-400">
              {profile?.email || "Pro Member"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Static Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/70 bg-slate-50/50 backdrop-blur-md dark:border-slate-800 dark:bg-ink-950/60 lg:flex lg:flex-col lg:min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-modal lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose?.();
          }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-overlay bg-slate-950/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 z-modal w-72 max-w-[85vw] bg-sand-100 dark:bg-ink-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 transition-transform animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}


