import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";

/**
 * Shared shell for every authenticated route: renders the sidebar once so
 * navigating between pages never drops it, instead of each page redirecting
 * back to "/" to see it again.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, profile, supabase } = await getCurrentWorkspaceAndProfile();
  if (supabase && !user) redirect("/login");

  return (
    <AppShell workspace={workspace} profile={profile}>
      {children}
    </AppShell>
  );
}
