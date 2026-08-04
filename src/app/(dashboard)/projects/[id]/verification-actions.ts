"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, type CurrentProfile } from "@/lib/queries/profile";
import { getProject, listProjectMembers, effectiveProjectRole } from "@/lib/queries/projects";
import type { VerificationStatus } from "@/lib/queries/observations";

export type VerificationActionState = { error: string } | null;

type AccessCheck = { ok: true; profile: CurrentProfile } | { ok: false; error: string };

async function requireVerifierAccess(projectId: string): Promise<AccessCheck> {
  const [profile, project, members] = await Promise.all([
    getCurrentProfile(),
    getProject(projectId),
    listProjectMembers(projectId),
  ]);
  if (!profile || !project) return { ok: false, error: "Project not found." };

  const isOwnerOrgAdmin = profile.role === "admin" && profile.organizationId === project.organizationId;
  const myRole = effectiveProjectRole(project, profile, members);
  if (!isOwnerOrgAdmin && myRole !== "admin") {
    return { ok: false, error: "Only project admins can verify observations." };
  }
  return { ok: true, profile };
}

export async function setVerificationStatusAction(
  observationId: string,
  projectId: string,
  status: Extract<VerificationStatus, "verified" | "needs_review" | "rejected">,
  _prevState: VerificationActionState,
  formData: FormData
): Promise<VerificationActionState> {
  const check = await requireVerifierAccess(projectId);
  if (!check.ok) return { error: check.error };

  const comment = String(formData.get("comment") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("field_observations")
    .update({
      verification_status: status,
      reviewed_by: check.profile.id,
      reviewed_at: new Date().toISOString(),
      review_comment: comment || null,
    })
    .eq("id", observationId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/verification");
  revalidatePath("/restoration-assets");
  revalidatePath("/dashboard");
  return null;
}
