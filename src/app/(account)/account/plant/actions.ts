"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PlantTreeFormState = { error: string } | null;

export async function plantTree(
  _prevState: PlantTreeFormState,
  formData: FormData
): Promise<PlantTreeFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lat = formData.get("lat");
  const lng = formData.get("lng");
  if (!lat || !lng) {
    return {
      error: "Location is required. Allow location access and try again.",
    };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "A photo of the tree is required." };
  }

  const photoPath = `${user.id}/${Date.now()}-${photo.name}`;
  const { error: uploadError } = await supabase.storage
    .from("tree-photos")
    .upload(photoPath, photo, { contentType: photo.type });

  if (uploadError) {
    return { error: `Photo upload failed: ${uploadError.message}` };
  }

  const { data: treeId, error } = await supabase.rpc("create_tree", {
    p_species: String(formData.get("species") ?? ""),
    p_height_note: String(formData.get("heightNote") ?? "") || null,
    p_location_label: String(formData.get("locationLabel") ?? "") || null,
    p_soil_type: String(formData.get("soilType") ?? "") || null,
    p_notes: String(formData.get("notes") ?? "") || null,
    p_photo_path: photoPath,
    p_lat: Number(lat),
    p_lng: Number(lng),
    p_gps_accuracy_m: formData.get("accuracy") ? Number(formData.get("accuracy")) : null,
    p_observed_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/trees/${treeId}?justPlanted=1`);
}
