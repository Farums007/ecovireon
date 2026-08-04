"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import type { OrgType } from "@/lib/queries/organizations";

export type SettingsActionState = { error: string } | { success: true } | null;

const VALID_ORG_TYPES: OrgType[] = [
  "nonprofit",
  "government",
  "company",
  "academic",
  "community",
  "other",
];

export async function updateOrganizationProfileAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId || profile.role !== "admin") {
    return { error: "Only organization admins can update these settings." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Organization name can't be empty." };

  const description = String(formData.get("description") ?? "").trim();
  const orgType = String(formData.get("orgType") ?? "");
  const website = String(formData.get("website") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  const supabase = await createClient();

  const update: Record<string, string | null> = {
    name,
    description: description || null,
    org_type: VALID_ORG_TYPES.includes(orgType as OrgType) ? orgType : null,
    website: website || null,
    email: email || null,
    location: location || null,
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const logoPath = `${profile.organizationId}/${Date.now()}-${logo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("org-logos")
      .upload(logoPath, logo, { contentType: logo.type });

    if (uploadError) return { error: `Logo upload failed: ${uploadError.message}` };
    update.logo_path = logoPath;
  }

  const { error } = await supabase
    .from("organizations")
    .update(update)
    .eq("id", profile.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function requestOrgDeletionAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId || profile.role !== "admin") {
    return { error: "Only organization admins can request this." };
  }

  const reason = String(formData.get("reason") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.from("deletion_requests").insert({
    type: "organization",
    organization_id: profile.organizationId,
    requested_by: profile.id,
    reason: reason || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
