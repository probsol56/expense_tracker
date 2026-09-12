"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
const workspaceSchema = z.object({ name: z.string().trim().min(2).max(80), workspace_type: z.enum(["personal", "household", "business"]), base_currency: z.string().length(3) });
export async function createWorkspace(formData: FormData) { const parsed = workspaceSchema.parse(Object.fromEntries(formData)); const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login" as any); const { data, error } = await supabase.from("workspaces").insert({ ...parsed, owner_id: user.id }).select("id").single(); if (error || !data) throw new Error(error?.message || "Unable to create workspace"); await supabase.from("workspace_members").insert({ workspace_id: data.id, user_id: user.id, role: "owner" }); redirect("/"); }
