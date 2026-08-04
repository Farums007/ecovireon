"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getProject, type PublicSections } from "@/lib/queries/projects";

export type ShareActionState = { error: string } | null;

export async function updateShareSettingsAction(
  projectId: string,
  _prevState: ShareActionState,
  formData: FormData
): Promise<ShareActionState> {
  const [profile, project] = await Promise.all([getCurrentProfile(), getProject(projectId)]);
  if (!profile || !project) return { error: "Project not found." };
  if (profile.role !== "admin" || profile.organizationId !== project.organizationId) {
    return { error: "Only this project's organization admin can manage sharing." };
  }

  const isPublic = formData.get("isPublic") === "on";
  const sections: PublicSections = {
    overview: formData.get("section_overview") === "on",
    map: formData.get("section_map") === "on",
    photos: formData.get("section_photos") === "on",
    monitoring: formData.get("section_monitoring") === "on",
    impact: formData.get("section_impact") === "on",
    partners: formData.get("section_partners") === "on",
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ is_public: isPublic, public_sections: sections })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/share`);
  revalidatePath(`/explore/projects/${projectId}`);
  return null;
}
