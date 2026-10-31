"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId } from "@/lib/ledger";
import { toActionError } from "@/lib/errors";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["expense", "income", "loan"]),
});
const updateCategorySchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
});
const deleteCategorySchema = z.object({
  category_id: z.string().uuid(),
});

type CategoryActionContext =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      workspace: { id: string };
    };

async function getCategoryActionContext(): Promise<CategoryActionContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to manage categories." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { ok: false, error: "Create a workspace before managing categories." };

  return { ok: true, supabase, workspace };
}

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
    redirect(`/categories?error=${encodeURIComponent(toActionError(error, "Failed to add the category.", { "23505": "That category already exists." }))}`);
  }

  // No redirect on success: we're already on /categories, and revalidatePath
  // refreshes it in place. Redirecting to the same path here blanks the page
  // during the transition on Next 15 (vercel/next.js#73317).
  revalidatePath("/categories");
}

export async function updateCategory(formData: FormData): Promise<{ error: string } | { success: true }> {
  const parsed = updateCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid category name." };

  const context = await getCategoryActionContext();
  if (!context.ok) return { error: context.error };

  const { data, error } = await context.supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.category_id)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();
  if (error) {
    return {
      error: toActionError(error, "Failed to update the category.", {
        "23505": "A category with that name already exists in this group.",
      }),
    };
  }
  if (!data) return { error: "That category could not be found in your workspace." };

  revalidateCategoryPaths();
  return { success: true };
}

export async function deleteCategory(formData: FormData): Promise<{ error: string } | { success: true }> {
  const parsed = deleteCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Select a valid category." };

  const context = await getCategoryActionContext();
  if (!context.ok) return { error: context.error };

  const { count, error: countError } = await context.supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", parsed.data.category_id)
    .eq("workspace_id", context.workspace.id);
  if (countError) return { error: toActionError(countError, "Couldn't check whether this category is in use.") };
  if (count === null) return { error: "Couldn't check whether this category is in use. Try again." };
  if (count > 0) {
    const transactionLabel = count === 1 ? "transaction" : "transactions";
    const actionLabel = count === 1 ? "it" : "them";
    return {
      error: `This category is used by ${count} ${transactionLabel}. Reassign or delete ${actionLabel} before removing the category.`,
    };
  }

  const { data, error } = await context.supabase
    .from("categories")
    .delete()
    .eq("id", parsed.data.category_id)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();
  if (error) {
    return {
      error: toActionError(error, "Failed to delete the category.", {
        "23503": "This category is used by one or more transactions. Reassign or delete them before removing the category.",
      }),
    };
  }
  if (!data) return { error: "That category could not be found in your workspace." };

  revalidateCategoryPaths();
  return { success: true };
}

function revalidateCategoryPaths() {
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/recurring");
}
