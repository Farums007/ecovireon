"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentProfile, type CurrentProfile } from "@/lib/queries/profile";
import { getProject, type Project, type ProjectRole } from "@/lib/queries/projects";

const VALID_ROLES: ProjectRole[] = ["admin", "field_staff", "verifier"];

type RequireAdminResult =
  | { ok: false; error: string }
  | { ok: true; profile: CurrentProfile; project: Project };

async function requireProjectOrgAdmin(projectId: string): Promise<RequireAdminResult> {
  const [profile, project] = await Promise.all([getCurrentProfile(), getProject(projectId)]);
  if (!profile || !project) return { ok: false, error: "Project not found." };
  if (profile.role !== "admin" || profile.organizationId !== project.organizationId) {
    return { ok: false, error: "Only this project's organization admin can manage its team." };
  }
  return { ok: true, profile, project };
}

export type MemberFormState = { error: string } | null;

export async function inviteProjectMember(
  projectId: string,
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const check = await requireProjectOrgAdmin(projectId);
  if (!check.ok) return { error: check.error };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!email) return { error: "Email is required." };
  if (!VALID_ROLES.includes(role as ProjectRole)) return { error: "Invalid role." };

  const supabase = await createClient();

  const { data: existingId, error: lookupError } = await supabase.rpc(
    "find_user_id_by_email",
    { p_email: email }
  );
  if (lookupError) return { error: lookupError.message };

  let userId = existingId as string | null;

  if (!userId) {
    const admin = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { account_type: "individual", full_name: "" },
        redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
      }
    );
    if (inviteError) return { error: inviteError.message };
    userId = invited.user?.id ?? null;
    if (!userId) return { error: "Invite failed — no account was created." };
  }

  const { error: upsertError } = await supabase.from("project_members").upsert(
    { project_id: projectId, user_id: userId, role, title: title || null },
    { onConflict: "project_id,user_id" }
  );
  if (upsertError) return { error: upsertError.message };

  revalidatePath(`/projects/${projectId}`);
  return null;
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
  _prevState: MemberFormState,
  _formData: FormData
): Promise<MemberFormState> {
  const check = await requireProjectOrgAdmin(projectId);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return null;
}
