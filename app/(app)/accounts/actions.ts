"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId } from "@/lib/ledger";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "cash", "investment"] as const;

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add an account." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before adding accounts." };

  const name = String(formData.get("name") ?? "").trim();
  const accountTypeRaw = String(formData.get("account_type") ?? "checking").trim();
  const institution = String(formData.get("institution") ?? "").trim();
  const startingBalance = Number(formData.get("starting_balance") ?? 0);

  if (!name) return { error: "Account name is required." };
  const accountType = ACCOUNT_TYPES.includes(accountTypeRaw as (typeof ACCOUNT_TYPES)[number])
    ? accountTypeRaw
    : "checking";
  if (!Number.isFinite(startingBalance)) return { error: "Starting balance must be a number." };

  const { error } = await supabase.from("accounts").insert({
    workspace_id: workspace.id,
    name,
    account_type: accountType,
    institution: institution || null,
    balance: startingBalance,
    starting_balance: startingBalance,
    last_synced_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true };
}
