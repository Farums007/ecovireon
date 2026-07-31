"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ModerationState = { error: string } | null;

export async function approveTreeAction(
  _prevState: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_tree", {
    p_tree_id: String(formData.get("treeId")),
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/trees");
  revalidatePath("/admin");
  return null;
}

export async function unflagTreeAction(
  _prevState: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("unflag_tree", {
    p_tree_id: String(formData.get("treeId")),
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/trees");
  revalidatePath("/admin");
  return null;
}

export async function rejectTreeAction(
  _prevState: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_tree", {
    p_tree_id: String(formData.get("treeId")),
    p_reason: String(formData.get("reason") ?? ""),
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/trees");
  revalidatePath("/admin");
  return null;
}
