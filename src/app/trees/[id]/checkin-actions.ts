"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CheckinFormState = { error: string } | null;

export async function addTreeCheckin(
  treeId: string,
  _prevState: CheckinFormState,
  formData: FormData
): Promise<CheckinFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const heightNote = String(formData.get("heightNote") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const photo = formData.get("photo");

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    photoPath = `checkins/${treeId}/${Date.now()}-${photo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("tree-photos")
      .upload(photoPath, photo, { contentType: photo.type });
    if (uploadError) {
      return { error: `Photo upload failed: ${uploadError.message}` };
    }
  }

  const { error } = await supabase.from("tree_checkins").insert({
    tree_id: treeId,
    submitted_by: user.id,
    photo_path: photoPath,
    height_note: heightNote || null,
    notes: notes || null,
  });

  if (error) {
    return {
      error: error.message.includes("row-level security")
        ? "Only the person who planted this tree can check in on it."
        : error.message,
    };
  }

  revalidatePath(`/trees/${treeId}`);
  return null;
}
