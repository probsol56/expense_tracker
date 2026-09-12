import { createClient } from "@/lib/supabase/server";
import type { Workspace, Profile } from "@/lib/types";

export async function getCurrentWorkspaceAndProfile() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { user: null, workspace: null, profile: null, supabase: null };
  }
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, workspace: null, profile: null, supabase };

  const [{ data: profile }, { data: ownedWorkspace }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("workspaces").select("id, name, owner_id, workspace_type, base_currency").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  let workspace = ownedWorkspace as Workspace | null;
  if (!workspace) {
    const { data: membership } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (membership?.workspace_id) {
      const { data: memberWorkspace } = await supabase.from("workspaces").select("id, name, owner_id, workspace_type, base_currency").eq("id", membership.workspace_id).maybeSingle();
      workspace = memberWorkspace as Workspace | null;
    }
  }

  const profileData: Profile = {
    id: user.id,
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
    avatar_url: profile?.avatar_url ?? null,
    email: user.email,
  };

  return { user, workspace, profile: profileData, supabase };
}
