"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recurringTransactionSchema, holidaySchema } from "@/lib/validations";
import { assertAccountInWorkspace, getUserWorkspaceId, resolveCategoryId, resolveMerchantId } from "@/lib/ledger";

function normalizeFormData(formData: FormData) {
  const rawData = Object.fromEntries(formData);
  // React's server-action form encoding can prefix field names when the
  // action is nested. Keep the normal names used by the validation layer.
  for (const [key, value] of Object.entries(rawData)) {
    const unprefixedKey = key.match(/^_\d+_(.+)$/)?.[1];
    if (unprefixedKey && rawData[unprefixedKey] === undefined) {
      rawData[unprefixedKey] = value;
    }
  }
  const weekdays = formData.getAll("weekdays").map(Number).filter((day) => Number.isInteger(day));
  // Unchecked checkboxes are simply absent from FormData, so presence of the
  // "true" value is the only reliable signal — there's no separate off-state to read.
  const skipHolidays = formData.get("skip_holidays") === "true";
  return { ...rawData, weekdays: weekdays.length ? weekdays : undefined, skip_holidays: skipHolidays };
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function createRecurringTransaction(formData: FormData) {
  const parsed = recurringTransactionSchema.safeParse(normalizeFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the schedule details and try again." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add a recurring transaction." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before adding recurring transactions." };

  const { type, merchant, category, description, weekdays, day_of_month, skip_holidays, ...rest } = parsed.data;

  if (!(await assertAccountInWorkspace(supabase, workspace.id, rest.account_id))) {
    return { error: "Select a valid account." };
  }

  try {
    const [categoryId, merchantId] = await Promise.all([
      resolveCategoryId(supabase, workspace.id, type, category),
      resolveMerchantId(supabase, workspace.id, merchant),
    ]);

    const { error } = await supabase.from("recurring_transactions").insert({
      ...rest,
      workspace_id: workspace.id,
      user_id: user.id,
      type,
      category_id: categoryId,
      merchant_id: merchantId,
      description: description?.trim() || null,
      weekdays: rest.frequency === "weekly" ? weekdays : null,
      day_of_month: rest.frequency === "monthly" ? day_of_month : null,
      skip_holidays,
      end_date: rest.end_date || null,
    });

    if (error) return { error: error.message };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to save the recurring transaction.") };
  }

  revalidatePath("/recurring");
  return { success: true };
}

export async function updateRecurringTransaction(recurringId: string, formData: FormData) {
  const parsed = recurringTransactionSchema.safeParse(normalizeFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the schedule details and try again." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a recurring transaction." };

  const { data: existing } = await supabase
    .from("recurring_transactions")
    .select("id, user_id, workspace_id")
    .eq("id", recurringId)
    .maybeSingle();
  if (!existing) return { error: "Recurring transaction not found." };
  if (existing.user_id !== user.id) return { error: "You don't have permission to update this recurring transaction." };

  const { type, merchant, category, description, weekdays, day_of_month, skip_holidays, ...rest } = parsed.data;

  if (!(await assertAccountInWorkspace(supabase, existing.workspace_id, rest.account_id))) {
    return { error: "Select a valid account." };
  }

  try {
    const [categoryId, merchantId] = await Promise.all([
      resolveCategoryId(supabase, existing.workspace_id, type, category),
      resolveMerchantId(supabase, existing.workspace_id, merchant),
    ]);

    const { error } = await supabase
      .from("recurring_transactions")
      .update({
        ...rest,
        type,
        category_id: categoryId,
        merchant_id: merchantId,
        description: description?.trim() || null,
        weekdays: rest.frequency === "weekly" ? weekdays : null,
        day_of_month: rest.frequency === "monthly" ? day_of_month : null,
        skip_holidays,
        end_date: rest.end_date || null,
      })
      .eq("id", recurringId);

    if (error) return { error: error.message };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update the recurring transaction.") };
  }

  revalidatePath("/recurring");
  return { success: true };
}

export async function setRecurringTransactionActive(recurringId: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a recurring transaction." };

  const { data: existing } = await supabase
    .from("recurring_transactions")
    .select("id, user_id")
    .eq("id", recurringId)
    .maybeSingle();
  if (!existing) return { error: "Recurring transaction not found." };
  if (existing.user_id !== user.id) return { error: "You don't have permission to update this recurring transaction." };

  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", recurringId);
  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteRecurringTransaction(recurringId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete a recurring transaction." };

  const { data: existing } = await supabase
    .from("recurring_transactions")
    .select("id, user_id")
    .eq("id", recurringId)
    .maybeSingle();
  if (!existing) return { error: "Recurring transaction not found." };
  if (existing.user_id !== user.id) return { error: "You don't have permission to delete this recurring transaction." };

  const { error } = await supabase.from("recurring_transactions").delete().eq("id", recurringId);
  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { success: true };
}

export async function createHoliday(formData: FormData) {
  const parsed = holidaySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a date and name for the holiday." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add a holiday." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before adding holidays." };

  const { error } = await supabase.from("holidays").insert({
    workspace_id: workspace.id,
    date: parsed.data.date,
    name: parsed.data.name,
  });
  if (error) {
    return { error: error.code === "23505" ? "A holiday is already set for that date." : error.message };
  }

  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteHoliday(holidayId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete a holiday." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before managing holidays." };

  const { error } = await supabase
    .from("holidays")
    .delete()
    .eq("id", holidayId)
    .eq("workspace_id", workspace.id);
  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { success: true };
}
