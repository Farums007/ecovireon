"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getProject } from "@/lib/queries/projects";

export type ObservationFormState = { error: string } | null;

function parseMetrics(raw: string): Record<string, string> {
  const metrics: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (key?.trim() && value) metrics[key.trim()] = value;
  }
  return metrics;
}

export async function createObservation(
  projectId: string,
  _prevState: ObservationFormState,
  formData: FormData
): Promise<ObservationFormState> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const project = await getProject(projectId);
  if (!project) return { error: "Project not found." };

  const lat = formData.get("lat");
  const lng = formData.get("lng");

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const photoPaths: string[] = [];
  for (const photo of photos) {
    // Keyed by the project's own org, not the submitter's — a project
    // member from another org (or an individual account) has no org of
    // their own, but still needs a path the storage RLS policy accepts.
    const path = `${project.organizationId}/${projectId}/${Date.now()}-${photo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("field-photos")
      .upload(path, photo, { contentType: photo.type });

    if (uploadError) {
      return { error: `Photo upload failed: ${uploadError.message}` };
    }
    photoPaths.push(path);
  }

  const { error } = await supabase.rpc("create_field_observation", {
    p_project_id: projectId,
    p_observed_at: formData.get("observedAt") || new Date().toISOString(),
    p_lat: lat ? Number(lat) : null,
    p_lng: lng ? Number(lng) : null,
    p_metrics: parseMetrics(String(formData.get("metrics") ?? "")),
    p_notes: String(formData.get("notes") ?? ""),
    p_photo_urls: photoPaths,
  });

  if (error) {
    return { error: error.message };
  }

  // Individuals (and org members from a different org) can't reach the
  // org dashboard's /projects/[id] — they land on the account-scoped copy.
  const returnPath =
    profile.accountType === "individual"
      ? `/account/projects/${projectId}`
      : `/projects/${projectId}`;

  revalidatePath(returnPath);
  redirect(returnPath);
}
