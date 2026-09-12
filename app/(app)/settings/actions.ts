"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  workspace_name: z.string().trim().min(2, "Workspace name must be at least 2 characters").max(80),
  base_currency: z.enum(["BDT", "USD", "EUR", "GBP", "CAD"]),
});

export type ActionState = {
  success?: boolean;
  message?: string;
};

export async function updateSettings(
  prevState: ActionState | null | FormData,
  formData?: FormData
): Promise<ActionState> {
  const data = formData instanceof FormData ? formData : (prevState as FormData);
  const parsed = settingsSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, message: errorMsg || "Please check your settings." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: parsed.data.full_name,
  });
  if (profileError) return { success: false, message: profileError.message };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (workspace) {
    const { error } = await supabase
      .from("workspaces")
      .update({
        name: parsed.data.workspace_name,
        base_currency: parsed.data.base_currency,
      })
      .eq("id", workspace.id);
    if (error) return { success: false, message: error.message };
  } else {
    const { data: newWorkspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({
        name: parsed.data.workspace_name,
        base_currency: parsed.data.base_currency,
        owner_id: user.id,
        workspace_type: "personal",
      })
      .select("id")
      .single();

    if (wsError) return { success: false, message: wsError.message };

    if (newWorkspace) {
      await supabase.from("workspace_members").insert({
        workspace_id: newWorkspace.id,
        user_id: user.id,
        role: "owner",
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  return { success: true, message: "Settings updated successfully!" };
}
