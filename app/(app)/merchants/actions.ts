"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const merchantSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function createMerchant(formData: FormData) {
  const parsed = merchantSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirect("/merchants?error=Please+enter+a+valid+merchant+name");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: ownedWorkspace } = await supabase.from("workspaces").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  let workspaceId = ownedWorkspace?.id;

  if (!workspaceId) {
    const { data: membership } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!membership?.workspace_id) {
      redirect("/onboarding");
    }
    const { data: memberWorkspace } = await supabase.from("workspaces").select("id").eq("id", membership.workspace_id).maybeSingle();
    if (!memberWorkspace) {
      redirect("/onboarding");
    }
    workspaceId = memberWorkspace.id;
  }

  const { error } = await supabase.from("merchants").insert({
    workspace_id: workspaceId,
    name: parsed.data.name,
  });

  if (error) {
    redirect(`/merchants?error=${encodeURIComponent(error.message)}`);
  }

  // No redirect on success: we're already on /merchants, and revalidatePath
  // refreshes it in place. Redirecting to the same path here blanks the page
  // during the transition on Next 15 (vercel/next.js#73317).
  revalidatePath("/merchants");
}
