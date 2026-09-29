"use client";

import {
  CreditCard,
  FileUp,
  FolderKanban,
  Landmark,
  LayoutGrid,
  LogOut,
  PieChart,
  Repeat,
  Settings,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
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

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Overview", icon: LayoutGrid, href:"/" },
  { label: "Transactions", icon: CreditCard, href:"/transactions" },
  { label: "Accounts", icon: Wallet, href:"/accounts" },
  { label: "Loans", icon: Landmark, href:"/loans" },
  { label: "Recurring", icon: Repeat, href:"/recurring" },
  { label: "Reports", icon: PieChart, href:"/reports" },
];

const MANAGE_NAV: NavItem[] = [
  { label: "Categories", icon: FolderKanban, href:"/categories" },
  { label: "Import statement", icon: FileUp, href:"/import" },
  { label: "Settings", icon: Settings, href:"/settings" },
];

function isActiveRoute(pathname: string, href: string) {
  return href ==="/" ? pathname ==="/" : pathname === href || pathname.startsWith(`${href}/`);
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

  const workspaceName = workspace?.name || "Personal workspace";
  const userName = profile?.full_name || profile?.email?.split("@")[0] || "You";

  const renderNavItem = ({ label, icon: Icon, href }: NavItem) => {
    const isActive = isActiveRoute(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-brass ${
          isActive
            ? "bg-cover-fg/10 text-cover-fg"
            : "text-cover-muted hover:bg-cover-fg/5 hover:text-cover-fg"
        }`}
      >
        {/* Bookmark ribbon marks the open page */}
        {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brass" />}
        <Icon size={17} className={isActive ? "text-brass" : undefined} />
        {label}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="flex items-start justify-between px-3">
        <Link href="/" onClick={onClose} className="rounded-sm focus-visible:outline-brass">
          <span className="font-display text-lg font-semibold tracking-[0.3em] text-brass">WALLO</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-3 -mt-3 grid h-11 w-11 place-items-center rounded-lg text-cover-muted transition-colors duration-150 hover:text-cover-fg focus-visible:outline-brass lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Workspace reads like the title plate on a ledger's cover */}
      <div className="mt-6 border-y border-brass/30 px-3 py-4">
        <p className="font-display text-lg font-medium leading-tight text-cover-fg">{workspaceName}</p>
        <p className="mt-1 text-xs uppercase tracking-widest text-cover-muted">
          {workspace?.workspace_type ?? "personal"} · {workspace?.base_currency || "BDT"}
        </p>
      </div>

      <nav aria-label="Main" className="mt-6 flex-1">
        <div className="space-y-1">{PRIMARY_NAV.map(renderNavItem)}</div>
        <p className="mb-2 mt-8 px-3 text-xs font-semibold uppercase tracking-widest text-cover-muted">Manage</p>
        <div className="space-y-1">{MANAGE_NAV.map(renderNavItem)}</div>
      </nav>

      <ThemeToggle
        showLabel
        className="mt-6 flex w-full justify-start gap-3 border-0 bg-transparent px-3 text-sm font-medium text-cover-muted hover:bg-cover-fg/5 hover:text-cover-fg focus-visible:outline-brass"
      />

      <div className="mt-6 flex items-center gap-3 border-t border-cover-fg/10 px-3 pt-4">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brass/60 font-display text-sm font-semibold text-brass"
        >
          {getInitials(userName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-cover-fg">{userName}</p>
          {profile?.email && <p className="truncate text-xs text-cover-muted">{profile.email}</p>}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-cover-muted transition-colors duration-150 hover:bg-cover-fg/5 hover:text-cover-fg focus-visible:outline-brass"
        >
          <LogOut size={17} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 bg-cover lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        {sidebarContent}
      </aside>

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
          <div
            className="fixed inset-0 z-overlay bg-cover/60 animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-modal w-72 max-w-[85vw] overflow-y-auto bg-cover shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
