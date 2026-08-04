"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";

export type DeletionRequestActionState = { error: string } | null;

export async function resolveDeletionRequestAction(
  requestId: string,
  status: "completed" | "cancelled",
  _prevState: DeletionRequestActionState,
  _formData: FormData
): Promise<DeletionRequestActionState> {
  const profile = await getCurrentProfile();
  if (!profile?.isPlatformAdmin) return { error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deletion_requests")
    .update({ status, resolved_by: profile.id, resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/admin/deletion-requests");
  return null;
}
