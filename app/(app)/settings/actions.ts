"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toActionError } from "@/lib/errors";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { deleteAccountSchema } from "@/lib/validations";

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
  if (profileError) return { success: false, message: toActionError(profileError, "Failed to update your profile.") };

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
    if (error) return { success: false, message: toActionError(error, "Failed to update your workspace.") };
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

    if (wsError) return { success: false, message: toActionError(wsError, "Failed to create your workspace.") };

    if (newWorkspace) {
      const { error: memberError } = await supabase.from("workspace_members").insert({
        workspace_id: newWorkspace.id,
        user_id: user.id,
        role: "owner",
      });
      if (memberError) return { success: false, message: toActionError(memberError, "Failed to finish setting up your workspace.") };
    }
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  return { success: true, message: "Settings updated successfully!" };
}

export type DeleteAccountState = { error: string } | null;

export async function deleteAccount(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const parsed = deleteAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confirm to delete your account." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.login);

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: toActionError(error, "Couldn't delete your account. Nothing was removed.") };

  // The auth user is gone, so the server-side revoke may 404; local scope
  // still clears the session cookies, which is all that matters here.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) console.error("sign-out after account deletion failed", signOutError.code ?? signOutError.status);

  redirect(AUTH_ROUTES.login);
}
