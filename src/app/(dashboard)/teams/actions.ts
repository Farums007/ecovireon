"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentProfile } from "@/lib/queries/profile";
import type { ProjectRole } from "@/lib/queries/projects";

export type TeamActionState = { error: string } | null;

const VALID_ROLES: ProjectRole[] = ["admin", "field_staff", "verifier"];

async function requireOrgAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId || profile.role !== "admin") {
    return { ok: false, error: "Only organization admins can manage the team." } as const;
  }
  return { ok: true, profile } as const;
}

export async function inviteOrgMemberAction(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const check = await requireOrgAdmin();
  if (!check.ok) return { error: check.error };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  if (!email) return { error: "Email is required." };
  if (!VALID_ROLES.includes(role as ProjectRole)) return { error: "Invalid role." };

  const supabase = await createClient();

  const { data: existingId, error: lookupError } = await supabase.rpc(
    "find_user_id_by_email",
    { p_email: email }
  );
  if (lookupError) return { error: lookupError.message };
  if (existingId) {
    return {
      error: "This email already has an Ecovireon account, so it can't be invited to a new organization.",
    };
  }

  // org_invites (0001) is only a marker the signup trigger checks — it
  // doesn't send anything by itself. Insert it first, then actually
  // send the invite email; the trigger resolves this row the moment the
  // account is created (omitting account_type in the metadata below
  // makes it fall into the "organization" branch, which checks this
  // table — see handle_new_user in 0007).
  const { error: inviteRowError } = await supabase.from("org_invites").insert({
    organization_id: check.profile.organizationId,
    email,
    role,
    invited_by: check.profile.id,
  });
  if (inviteRowError) return { error: inviteRowError.message };

  const admin = createServiceRoleClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error: sendError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
  });
  if (sendError) return { error: sendError.message };

  revalidatePath("/teams");
  return null;
}

export async function cancelInviteAction(
  inviteId: string,
  _prevState: TeamActionState,
  _formData: FormData
): Promise<TeamActionState> {
  const check = await requireOrgAdmin();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("org_invites").delete().eq("id", inviteId);
  if (error) return { error: error.message };

  revalidatePath("/teams");
  return null;
}

export async function updateMemberAction(
  memberId: string,
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const check = await requireOrgAdmin();
  if (!check.ok) return { error: check.error };

  const role = String(formData.get("role") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!VALID_ROLES.includes(role as ProjectRole)) return { error: "Invalid role." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, title: title || null })
    .eq("id", memberId)
    .eq("organization_id", check.profile.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return null;
}
