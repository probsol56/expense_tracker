"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toActionError } from "@/lib/errors";

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters.").max(80),
  workspace_type: z.enum(["personal", "household", "business"]),
  base_currency: z.string().length(3),
});

export async function createWorkspace(formData: FormData) {
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/onboarding?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the workspace details and try again.")}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();
  if (error || !workspace) {
    redirect(`/onboarding?error=${encodeURIComponent(error ? toActionError(error, "Unable to create workspace.") : "Unable to create workspace.")}`);
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });
  if (memberError) {
    redirect(`/onboarding?error=${encodeURIComponent(toActionError(memberError, "Workspace was created, but setup didn't finish. Try again."))}`);
  }

  redirect("/");
}
