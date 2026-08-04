"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";

export type SettingsActionState = { error: string } | { success: true } | null;

export async function updateOrganizationNameAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId || profile.role !== "admin") {
    return { error: "Only organization admins can update these settings." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Organization name can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", profile.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
