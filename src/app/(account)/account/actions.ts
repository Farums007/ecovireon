"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = { error: string } | { success: true } | null;

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Name is required." };

  const country = String(formData.get("country") ?? "").trim();

  const update: { full_name: string; country: string; avatar_path?: string } = {
    full_name: fullName,
    country,
  };

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const avatarPath = `${user.id}/${Date.now()}-${avatar.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(avatarPath, avatar, { contentType: avatar.type });

    if (uploadError) {
      return { error: `Photo upload failed: ${uploadError.message}` };
    }
    update.avatar_path = avatarPath;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}
