"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
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

export async function approveOrganizationDeletionAction(
  requestId: string,
  _prevState: DeletionRequestActionState,
  _formData: FormData
): Promise<DeletionRequestActionState> {
  const profile = await getCurrentProfile();
  if (!profile?.isPlatformAdmin) return { error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_organization_deletion_request", {
    p_request_id: requestId,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/deletion-requests");
  revalidatePath("/admin");
  return null;
}

export async function approveIndividualDeletionAction(
  requestId: string,
  targetName: string,
  _prevState: DeletionRequestActionState,
  _formData: FormData
): Promise<DeletionRequestActionState> {
  const profile = await getCurrentProfile();
  if (!profile?.isPlatformAdmin) return { error: "Not authorized." };

  const supabase = await createClient();
  const { data: userId, error } = await supabase.rpc("prepare_individual_deletion", {
    p_request_id: requestId,
  });
  if (error) return { error: error.message };

  const admin = createServiceRoleClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId as string);
  if (deleteError) {
    // The data was already anonymized above — only the login deletion
    // failed. The request stays "pending" so this can just be retried.
    return {
      error: `Data was anonymized, but deleting the login failed: ${deleteError.message}. Try again, or remove the account manually from /admin/users.`,
    };
  }

  const { error: statusError } = await supabase
    .from("deletion_requests")
    .update({
      status: "completed",
      resolved_by: profile.id,
      resolved_at: new Date().toISOString(),
      target_name: targetName,
    })
    .eq("id", requestId);
  if (statusError) return { error: statusError.message };

  revalidatePath("/admin/deletion-requests");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return null;
}
