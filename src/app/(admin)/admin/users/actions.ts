"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/queries/profile";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type UserActionState = { error: string } | null;

// Supabase's ban API wants a duration, not a boolean — there's no
// "forever", so this is the accepted way to express a permanent ban.
const PERMANENT_BAN = "876000h";

async function requirePlatformAdmin(targetUserId: string): Promise<{ error: string } | null> {
  const profile = await getCurrentProfile();
  if (!profile?.isPlatformAdmin) return { error: "Not authorized." };
  if (profile.id === targetUserId) return { error: "You can't do this to your own account." };
  return null;
}

export async function setUserBanned(
  userId: string,
  banned: boolean,
  _prevState: UserActionState,
  _formData: FormData
): Promise<UserActionState> {
  const authError = await requirePlatformAdmin(userId);
  if (authError) return authError;

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: banned ? PERMANENT_BAN : "none",
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return null;
}

export async function deleteUser(
  userId: string,
  _prevState: UserActionState,
  _formData: FormData
): Promise<UserActionState> {
  const authError = await requirePlatformAdmin(userId);
  if (authError) return authError;

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    // Supabase's admin API returns an opaque, unhelpful body here (not a
    // readable message) when this fails — in practice that's always the
    // account still having trees/donations/observations attached, since
    // those foreign keys don't cascade. There's no other realistic
    // failure mode this deep into the action (auth + existence already
    // checked), so always show the actionable version.
    return {
      error:
        "This account can't be deleted while it still has trees, donations, observations, or other records attached. Ban it instead to revoke access without losing that data.",
    };
  }

  revalidatePath("/admin/users");
  return null;
}
