"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = { error: string } | { success: true } | null;

export async function updateProfileDetailsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Name is required." };

  const phone = String(formData.get("phone") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  const update: {
    full_name: string;
    phone: string | null;
    country: string;
    region: string | null;
    avatar_path?: string;
  } = {
    full_name: fullName,
    phone: phone || null,
    country,
    region: region || null,
  };

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const avatarPath = `${user.id}/${Date.now()}-${avatar.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(avatarPath, avatar, { contentType: avatar.type });

    if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };
    update.avatar_path = avatarPath;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account/settings");
  revalidatePath("/account");
  return { success: true };
}

export async function requestEmailChangeAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const newEmail = String(formData.get("email") ?? "").trim();
  if (!newEmail) return { error: "Enter a new email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/account/settings`,
    }
  );
  if (error) return { error: error.message };

  return { success: true };
}

export async function changePasswordAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (!currentPassword || !newPassword) return { error: "Both fields are required." };
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: true };
}

export async function switchOrganizationAction(organizationId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("switch_active_organization", {
    p_organization_id: organizationId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/account/settings");
  redirect("/dashboard");
}

export async function acceptInviteAction(
  inviteId: string,
  _prevState: SettingsActionState,
  _formData: FormData
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_org_invite", { p_invite_id: inviteId });
  if (error) return { error: error.message };

  revalidatePath("/account/settings");
  return { success: true };
}

export async function declineInviteAction(
  inviteId: string,
  _prevState: SettingsActionState,
  _formData: FormData
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_org_invite", { p_invite_id: inviteId });
  if (error) return { error: error.message };

  revalidatePath("/account/settings");
  return { success: true };
}

export async function requestIndividualDeletionAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const reason = String(formData.get("reason") ?? "").trim();
  const { error } = await supabase.from("deletion_requests").insert({
    type: "individual",
    user_id: user.id,
    requested_by: user.id,
    reason: reason || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/account/settings");
  return { success: true };
}
