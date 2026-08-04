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

  // org_invites (0001) is only a marker — it doesn't send anything by
  // itself. For a brand-new email, insert it then send the real invite
  // email (the signup trigger resolves this row the moment the account is
  // created — see handle_new_user in 0029). For an email that already has
  // an account, inviteUserByEmail would fail outright (that API is only
  // for creating new users), so just insert the row: the existing user
  // will see it as a pending invite next time they open their account
  // settings, and can accept it via accept_org_invite.
  const { error: inviteRowError } = await supabase.from("org_invites").insert({
    organization_id: check.profile.organizationId,
    email,
    role,
    invited_by: check.profile.id,
  });
  if (inviteRowError) return { error: inviteRowError.message };

  if (!existingId) {
    const admin = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const { error: sendError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
    });
    if (sendError) return { error: sendError.message };
  }

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
  const { error } = await supabase.rpc("update_org_member", {
    p_user_id: memberId,
    p_role: role,
    p_title: title || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return null;
}

export async function removeOrgMemberAction(
  memberId: string,
  _prevState: TeamActionState,
  _formData: FormData
): Promise<TeamActionState> {
  const check = await requireOrgAdmin();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_org_member", { p_user_id: memberId });
  if (error) return { error: error.message };

  revalidatePath("/teams");
  return null;
}
