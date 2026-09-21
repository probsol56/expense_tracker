"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["expense", "income", "loan"]),
});

export async function createCategory(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    redirect("/categories?error=Please+enter+a+valid+category+name");
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

  const { error } = await supabase.from("categories").insert({
    workspace_id: workspaceId,
    name: parsed.data.name,
    type: parsed.data.type,
    color:
      parsed.data.type === "income"
        ? "#10b981"
        : parsed.data.type === "loan"
          ? "#f59e0b"
          : "#ef6f6c",
  });

  if (error) {
    redirect(`/categories?error=${encodeURIComponent(error.message)}`);
  }

  // No redirect on success: we're already on /categories, and revalidatePath
  // refreshes it in place. Redirecting to the same path here blanks the page
  // during the transition on Next 15 (vercel/next.js#73317).
  revalidatePath("/categories");
}
